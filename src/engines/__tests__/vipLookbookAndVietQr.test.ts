import { describe, expect, it } from 'vitest';
import { PRODUCT_BY_ID } from '../../data/catalog';
import { LOOKBOOKS } from '../../data/lookbooks';
import { calculateCartTotals, upsertCartItem } from '../cartEngine';
import { paymentFormSchema } from '../checkoutSchema';
import {
  buildMbBankVietQrUrl,
  computeVietQrAmountVnd,
  formatVndPlain,
  MBBANK_VIETQR_CONFIG,
  sanitizeVietQrMemo,
} from '../vietQr';
import {
  buildBespokeSpecSheet,
  createInitialVipLookbookSeed,
  createVipLookbookEntry,
  generateCertificateId,
  serializeBespokeSpecSheetJson,
  upsertVipLookbook,
} from '../vipLookbook';

describe('VIP private client lookbook, bespoke certificate & MBBank VietQR checkout', () => {
  it('mints deterministic MV-CERT-XXXX bespoke certificate references', () => {
    const a = generateCertificateId('mv-eye-01|raw-titanium|photochromic-uv|64');
    const b = generateCertificateId('mv-eye-01|raw-titanium|photochromic-uv|64');
    const c = generateCertificateId('mv-eye-02|warm-gold|clear-ar|68');

    expect(a).toMatch(/^MV-CERT-[A-Z0-9]{4}$/);
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  it('creates VIP Lookbook entries with exact optical + prescription + engraving valuation', () => {
    const entry = createVipLookbookEntry({
      clientLabel: 'Gala Evening Spec <script>',
      productId: 'mv-eye-01',
      basePriceUsd: 480,
      frameFinishId: 'warm-gold',
      lensMode: 'photochromic-uv',
      uvIndex: 9,
      sizing: {
        faceShape: 'oval',
        pdMm: 65,
        noseBridge: 'medium',
        templeLengthMm: 145,
        prescriptionTier: 'single-vision-167', // +140
        engravingTier: 'gold-18k-inlay', // +95
        engravingText: 'TVT VIP',
      },
    });

    // Base $480 + Photochromic $110 + SV 1.67 $140 + 18K Inlay $95 = $825
    expect(entry.bespokeAddonUsd).toBe(345);
    expect(entry.totalPriceUsd).toBe(825);
    expect(entry.clientLabel).not.toContain('<');
    expect(entry.vltPercent).toBeLessThan(28);
    expect(entry.fitScore).toBeGreaterThanOrEqual(85);
  });

  it('deduplicates VIP Lookbook saves by certificateId while preserving newest ordering', () => {
    const seed = createInitialVipLookbookSeed();
    expect(seed).toHaveLength(1);

    const dup = { ...seed[0], clientLabel: 'Updated Title' };
    const afterDup = upsertVipLookbook(seed, dup);
    expect(afterDup).toHaveLength(1);
    expect(afterDup[0].clientLabel).toBe('Updated Title');

    const second = createVipLookbookEntry({
      productId: 'mv-eye-02',
      basePriceUsd: 420,
      frameFinishId: 'matte-noir',
      lensMode: 'midnight-gradient',
      uvIndex: 4,
      sizing: {
        faceShape: 'diamond',
        pdMm: 66,
        noseBridge: 'high',
        templeLengthMm: 145,
        prescriptionTier: 'plano',
        engravingTier: 'none',
        engravingText: '',
      },
    });
    const merged = upsertVipLookbook(afterDup, second);
    expect(merged).toHaveLength(2);
    expect(merged[0].productId).toBe('mv-eye-02');
  });

  it('builds and serializes a complete Bespoke Atelier Spec Sheet JSON with MBBank settlement details', () => {
    const seed = createInitialVipLookbookSeed()[0];
    const spec = buildBespokeSpecSheet(seed);
    expect(spec.certificateId).toMatch(/^MV-CERT-/);
    expect(spec.vipSettlementChannel.bankBin).toBe('970422');
    expect(spec.vipSettlementChannel.accountNo).toBe('0325456574');
    expect(spec.vipSettlementChannel.accountHolder).toBe('TRUONG VAN TINH');

    const json = serializeBespokeSpecSheetJson(seed);
    const parsed = JSON.parse(json) as typeof spec;
    expect(parsed.millimeterBlueprint.pdMm).toBe(64);
    expect(parsed.opticalPhysics.lensMode).toBe('polarized-amber');
  });

  it('generates exact MBBank (970422) VietQR compact2 image URL for account 0325456574 / TRUONG VAN TINH', () => {
    expect(MBBANK_VIETQR_CONFIG.bankBin).toBe('970422');
    expect(MBBANK_VIETQR_CONFIG.accountNo).toBe('0325456574');
    expect(MBBANK_VIETQR_CONFIG.accountName).toBe('TRUONG VAN TINH');

    const url = buildMbBankVietQrUrl({
      amountVnd: 3658000,
      transferRef: 'MV-2026-AB12 VIP30',
    });

    expect(url).toContain(
      'https://img.vietqr.io/image/970422-0325456574-compact2.png?'
    );
    expect(url).toContain('amount=3658000');
    expect(url).toContain('addInfo=MV-2026-AB12+VIP30');
    expect(url).toContain('accountName=TRUONG+VAN+TINH');
  });

  it('computes rounded VND full settlement and 30% VIP deposit amounts cleanly', () => {
    const fullVnd = computeVietQrAmountVnd(480, 'full');
    const depositVnd = computeVietQrAmountVnd(480, 'deposit-30');

    expect(fullVnd).toBe(12192000); // 480 * 25400 = 12,192,000
    expect(depositVnd).toBe(3658000); // 480 * 0.3 * 25400 = 3,657,600 -> 3,658,000
    expect(formatVndPlain(depositVnd)).toBe('3,658,000 ₫');
    expect(computeVietQrAmountVnd(0, 'full')).toBe(0);
  });

  it('sanitizes bank transfer memos safely', () => {
    expect(sanitizeVietQrMemo('mv-2026-x9!@# vip')).toBe('MV-2026-X9 VIP');
    expect(sanitizeVietQrMemo('   ')).toBe('MAISON VERA VIP');
  });

  it('validates MBBank VietQR settlement method in Zod paymentFormSchema', () => {
    expect(
      paymentFormSchema.safeParse({
        method: 'vietqr-mbbank',
        vietQrMode: 'deposit-30',
      }).success
    ).toBe(true);
    expect(
      paymentFormSchema.safeParse({
        method: 'vietqr-mbbank',
        vietQrMode: 'full',
      }).success
    ).toBe(true);
  });

  it('adds custom prescription, optical lens, and engraving addons into cart totals cleanly', () => {
    // Base VÉRA-01 $480 + Bespoke Addon $270 = $750 unit price
    const items = upsertCartItem([], {
      productId: 'mv-eye-01',
      size: 'OS',
      colorwayId: 'eye01-titan',
      unitPriceAddonUsd: 270,
      bespokeSummary: 'CAD 51□20 — 145mm · Single Vision 1.67 · Laser',
    });

    const totals = calculateCartTotals(items, PRODUCT_BY_ID, LOOKBOOKS, 'VERA15', false);
    expect(totals.merchandiseSubtotalUsd).toBe(750);
    expect(totals.promoDiscountUsd).toBe(112.5); // 15% of 750
    expect(totals.shippingUsd).toBe(0);
    expect(totals.grandTotalUsd).toBe(637.5);
  });

  it('keeps distinct bespoke commissions separate in bag by bespokeSummary & addon', () => {
    let items = upsertCartItem([], {
      productId: 'mv-eye-01',
      size: 'OS',
      colorwayId: 'eye01-titan',
      unitPriceAddonUsd: 85,
      bespokeSummary: 'Plano Polarized',
    });
    items = upsertCartItem(items, {
      productId: 'mv-eye-01',
      size: 'OS',
      colorwayId: 'eye01-titan',
      unitPriceAddonUsd: 345,
      bespokeSummary: 'Single Vision 1.67 + 18K Inlay',
    });
    expect(items).toHaveLength(2);
    const totals = calculateCartTotals(items, PRODUCT_BY_ID, LOOKBOOKS, null, false);
    expect(totals.merchandiseSubtotalUsd).toBe(480 + 85 + 480 + 345);
  });
});

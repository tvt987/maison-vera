import type {
  BespokeSizingInput,
  FoilFinishId,
  HeroEyewearConfig,
  OpticalLensModeId,
  VipLookbookEntry,
} from '../types/commerce';
import { computeBespokeFit, ENGRAVING_TIERS, PRESCRIPTION_TIERS } from './bespokeSizing';
import { computeOpticalLensTelemetry, getOpticalLensMode } from './opticalPhysics';
import { MBBANK_VIETQR_CONFIG } from './vietQr';

const CERT_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Deterministic Bespoke Certificate Reference: MV-CERT-XXXX
 */
export function generateCertificateId(seed: string): string {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  let value = hash >>> 0;
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += CERT_ALPHABET[value % CERT_ALPHABET.length];
    value = Math.floor(value / CERT_ALPHABET.length) + (i + 5) * 19;
  }
  return `MV-CERT-${code}`;
}

export function sanitizeClientLabel(raw: string): string {
  return raw
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 48);
}

export interface CreateVipLookbookPayload {
  clientLabel?: string;
  productId: string;
  basePriceUsd: number;
  frameFinishId: HeroEyewearConfig['frameFinishId'];
  lensMode: OpticalLensModeId;
  uvIndex: number;
  sizing: BespokeSizingInput;
  monogram?: {
    text: string;
    foil: FoilFinishId;
  };
  createdAtIso?: string;
}

export function createVipLookbookEntry(payload: CreateVipLookbookPayload): VipLookbookEntry {
  const optics = computeOpticalLensTelemetry(payload.lensMode, payload.uvIndex);
  const fit = computeBespokeFit(payload.sizing, payload.lensMode);
  const seed = [
    payload.productId,
    payload.frameFinishId,
    payload.lensMode,
    optics.uvIndex,
    payload.sizing.faceShape,
    fit.blueprint.pdMm,
    payload.sizing.noseBridge,
    payload.sizing.templeLengthMm,
    payload.sizing.prescriptionTier,
    payload.sizing.engravingTier,
    fit.sanitizedEngraving,
    payload.monogram?.text ?? '',
  ].join('|');

  const certificateId = generateCertificateId(seed);
  const cleanLabel =
    sanitizeClientLabel(payload.clientLabel ?? '') ||
    `Sabae Study · ${fit.blueprint.blueprintCode}`;

  const bespokeAddonUsd = fit.pricing.totalAddonUsd;
  const totalPriceUsd = Math.round((payload.basePriceUsd + bespokeAddonUsd) * 100) / 100;

  return {
    id: `${certificateId}-${payload.frameFinishId}-${payload.lensMode}`,
    certificateId,
    createdAtIso: payload.createdAtIso ?? new Date().toISOString(),
    clientLabel: cleanLabel,
    productId: payload.productId,
    frameFinishId: payload.frameFinishId,
    lensMode: payload.lensMode,
    uvIndex: optics.uvIndex,
    vltPercent: optics.vltPercent,
    glareReductionPercent: optics.glareReductionPercent,
    sizing: {
      ...payload.sizing,
      pdMm: fit.blueprint.pdMm,
      engravingText: fit.sanitizedEngraving,
    },
    fitScore: fit.overallFitScore,
    frameBlueprintCode: fit.blueprint.blueprintCode,
    monogram: payload.monogram,
    basePriceUsd: payload.basePriceUsd,
    bespokeAddonUsd,
    totalPriceUsd,
  };
}

export function upsertVipLookbook(
  entries: VipLookbookEntry[],
  next: VipLookbookEntry,
  maxItems = 12
): VipLookbookEntry[] {
  const filtered = entries.filter((item) => item.certificateId !== next.certificateId);
  return [next, ...filtered].slice(0, maxItems);
}

export interface BespokeSpecSheetExport {
  atelier: 'MAISON VÉRA PARIS · SABAE TITANIUM LAB';
  edition: 'v4.0 HAUTE COUTURE SUPER VIP PRO';
  certificateId: string;
  issuedAtIso: string;
  clientDossierLabel: string;
  silhouetteProductId: string;
  frameFinishId: string;
  opticalPhysics: {
    lensMode: OpticalLensModeId;
    lensTitleEn: string;
    uvIndexSimulated: number;
    vltPercent: number;
    glareReductionPercent: number;
    blueLightFilterPercent: number;
    uvCutNm: number;
    filterCategory: string;
  };
  millimeterBlueprint: {
    faceShape: string;
    pdMm: number;
    lensWidthMm: number;
    bridgeWidthMm: number;
    templeLengthMm: number;
    frameWidthMm: number;
    noseBridge: string;
    nosePadDropMm: number;
    fitScorePercent: number;
    blueprintStamp: string;
  };
  bespokeServices: {
    prescriptionTier: string;
    engravingTier: string;
    engravingText: string;
    monogram: string | null;
  };
  valuationUsd: {
    baseChassisUsd: number;
    opticalLensAddonUsd: number;
    prescriptionAddonUsd: number;
    engravingAddonUsd: number;
    totalBespokeUsd: number;
  };
  vipSettlementChannel: {
    bank: string;
    bankBin: string;
    accountNo: string;
    accountHolder: string;
  };
}

export function buildBespokeSpecSheet(entry: VipLookbookEntry): BespokeSpecSheetExport {
  const optics = computeOpticalLensTelemetry(entry.lensMode, entry.uvIndex);
  const lensSpec = getOpticalLensMode(entry.lensMode);
  const fit = computeBespokeFit(entry.sizing, entry.lensMode);
  const rxSpec = PRESCRIPTION_TIERS.find((r) => r.id === entry.sizing.prescriptionTier);
  const engSpec = ENGRAVING_TIERS.find((e) => e.id === entry.sizing.engravingTier);

  return {
    atelier: 'MAISON VÉRA PARIS · SABAE TITANIUM LAB',
    edition: 'v4.0 HAUTE COUTURE SUPER VIP PRO',
    certificateId: entry.certificateId,
    issuedAtIso: entry.createdAtIso,
    clientDossierLabel: sanitizeClientLabel(entry.clientLabel),
    silhouetteProductId: entry.productId,
    frameFinishId: entry.frameFinishId,
    opticalPhysics: {
      lensMode: entry.lensMode,
      lensTitleEn: lensSpec.label.en,
      uvIndexSimulated: optics.uvIndex,
      vltPercent: optics.vltPercent,
      glareReductionPercent: optics.glareReductionPercent,
      blueLightFilterPercent: optics.blueLightFilterPercent,
      uvCutNm: optics.uvCutNm,
      filterCategory: optics.filterCategory,
    },
    millimeterBlueprint: {
      faceShape: entry.sizing.faceShape,
      pdMm: fit.blueprint.pdMm,
      lensWidthMm: fit.blueprint.lensWidthMm,
      bridgeWidthMm: fit.blueprint.bridgeWidthMm,
      templeLengthMm: fit.blueprint.templeLengthMm,
      frameWidthMm: fit.blueprint.frameWidthMm,
      noseBridge: entry.sizing.noseBridge,
      nosePadDropMm: fit.blueprint.nosePadDropMm,
      fitScorePercent: fit.overallFitScore,
      blueprintStamp: fit.blueprint.blueprintCode,
    },
    bespokeServices: {
      prescriptionTier: rxSpec?.label.en ?? 'Plano (Non-Rx)',
      engravingTier: engSpec?.label.en ?? 'No Temple Engraving',
      engravingText: fit.sanitizedEngraving || 'NONE',
      monogram: entry.monogram ? `${entry.monogram.text} (${entry.monogram.foil})` : null,
    },
    valuationUsd: {
      baseChassisUsd: entry.basePriceUsd,
      opticalLensAddonUsd: fit.pricing.opticalLensUsd,
      prescriptionAddonUsd: fit.pricing.prescriptionUsd,
      engravingAddonUsd: fit.pricing.engravingUsd,
      totalBespokeUsd: entry.totalPriceUsd,
    },
    vipSettlementChannel: {
      bank: MBBANK_VIETQR_CONFIG.bankShortName,
      bankBin: MBBANK_VIETQR_CONFIG.bankBin,
      accountNo: MBBANK_VIETQR_CONFIG.accountNo,
      accountHolder: MBBANK_VIETQR_CONFIG.accountName,
    },
  };
}

export function serializeBespokeSpecSheetJson(entry: VipLookbookEntry): string {
  return JSON.stringify(buildBespokeSpecSheet(entry), null, 2);
}

export function createInitialVipLookbookSeed(): VipLookbookEntry[] {
  return [
    createVipLookbookEntry({
      clientLabel: 'Salon Privé · VÉRA-01 Polarized',
      productId: 'mv-eye-01',
      basePriceUsd: 480,
      frameFinishId: 'raw-titanium',
      lensMode: 'polarized-amber',
      uvIndex: 6,
      sizing: {
        faceShape: 'oval',
        pdMm: 64,
        noseBridge: 'medium',
        templeLengthMm: 145,
        prescriptionTier: 'plano',
        engravingTier: 'micro-laser',
        engravingText: 'MAISON 01',
      },
      monogram: {
        text: 'TVT',
        foil: 'gold-24k',
      },
      createdAtIso: '2026-11-27T08:00:00.000Z',
    }),
  ];
}

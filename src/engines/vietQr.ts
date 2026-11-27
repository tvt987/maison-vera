import type { VietQrSettlementMode } from '../types/commerce';
import { USD_TO_VND_RATE } from './currency';

export const MBBANK_VIETQR_CONFIG = {
  bankBin: '970422',
  bankShortName: 'MBBank',
  bankFullName: 'Military Commercial Joint Stock Bank (MB)',
  accountNo: '0325456574',
  accountName: 'TRUONG VAN TINH',
  template: 'compact2',
  depositRatio: 0.3,
} as const;

/**
 * Converts USD grand total to clean 1,000-VND rounded settlement amount
 * for either 100% full payment or 30% VIP Bespoke Atelier deposit.
 */
export function computeVietQrAmountVnd(
  grandTotalUsd: number,
  mode: VietQrSettlementMode = 'full'
): number {
  const safeUsd = Math.max(0, Number.isFinite(grandTotalUsd) ? grandTotalUsd : 0);
  const ratio = mode === 'deposit-30' ? MBBANK_VIETQR_CONFIG.depositRatio : 1;
  const rawVnd = safeUsd * ratio * USD_TO_VND_RATE;
  if (rawVnd <= 0) return 0;
  return Math.max(10000, Math.round(rawVnd / 1000) * 1000);
}

/**
 * Sanitizes bank transfer reference memo to safe uppercase alphanumeric + spaces/hyphens.
 */
export function sanitizeVietQrMemo(raw: string): string {
  const cleaned = raw
    .toUpperCase()
    .replace(/[^A-Z0-9 -]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 48);
  return cleaned || 'MAISON VERA VIP';
}

/**
 * Builds official VietQR dynamic transfer image URL for MBBank (970422) / 0325456574 / TRUONG VAN TINH.
 */
export function buildMbBankVietQrUrl(params: {
  amountVnd: number;
  transferRef: string;
}): string {
  const amount = Math.max(0, Math.round(params.amountVnd));
  const memo = sanitizeVietQrMemo(params.transferRef);
  const query = new URLSearchParams({
    amount: String(amount),
    addInfo: memo,
    accountName: MBBANK_VIETQR_CONFIG.accountName,
  });
  return `https://img.vietqr.io/image/${MBBANK_VIETQR_CONFIG.bankBin}-${MBBANK_VIETQR_CONFIG.accountNo}-${MBBANK_VIETQR_CONFIG.template}.png?${query.toString()}`;
}

export function formatVndPlain(amountVnd: number): string {
  return `${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(amountVnd)))} ₫`;
}

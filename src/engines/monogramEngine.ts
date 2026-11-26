import type { FoilFinishId, Locale, LocalizedText, MonogramConfig } from '../types/commerce';

export interface FoilFinishSpec {
  id: FoilFinishId;
  label: LocalizedText;
  swatchHex: string;
  textColor: string;
  plateBg: string;
  textShadow: string;
}

export const FOIL_FINISHES: FoilFinishSpec[] = [
  {
    id: 'gold-24k',
    label: { en: '24K Gold Foil', vi: 'Ép Kim Vàng 24K' },
    swatchHex: '#D4B473',
    textColor: '#E8CC8C',
    plateBg: 'linear-gradient(135deg, #1E1C1A 0%, #2D2925 50%, #151412 100%)',
    textShadow: '0 1px 0 rgba(0,0,0,0.65), 0 0 12px rgba(212,180,115,0.38)',
  },
  {
    id: 'blind-deboss',
    label: { en: 'Blind Deboss', vi: 'Dập Chìm Không Màu' },
    swatchHex: '#8C8174',
    textColor: '#3A342E',
    plateBg: 'linear-gradient(135deg, #C7B8A1 0%, #B7A68E 55%, #A6957D 100%)',
    textShadow: '0 1px 1px rgba(255,255,255,0.45), 0 -1px 1px rgba(17,17,17,0.45)',
  },
  {
    id: 'silver-leaf',
    label: { en: 'Silver Leaf', vi: 'Lá Bạc Nguyên Chất' },
    swatchHex: '#D0D3D8',
    textColor: '#E5E7EB',
    plateBg: 'linear-gradient(135deg, #191B20 0%, #272A32 50%, #111317 100%)',
    textShadow: '0 1px 0 rgba(0,0,0,0.7), 0 0 10px rgba(218,224,235,0.34)',
  },
  {
    id: 'terracotta-ink',
    label: { en: 'Terracotta Ink', vi: 'Mực Đất Nung Sienna' },
    swatchHex: '#B84A27',
    textColor: '#B84A27',
    plateBg: 'linear-gradient(135deg, #F4EFE6 0%, #EAE2D4 50%, #DFD5C5 100%)',
    textShadow: '0 1px 0 rgba(255,255,255,0.5)',
  },
];

export const FOIL_BY_ID: Record<FoilFinishId, FoilFinishSpec> = Object.fromEntries(
  FOIL_FINISHES.map((f) => [f.id, f])
) as Record<FoilFinishId, FoilFinishSpec>;

/**
 * Strips non-alphabetic characters, uppercases, and caps at 4 initials.
 */
export function sanitizeMonogramLetters(raw: string): string {
  return raw
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
    .slice(0, 4);
}

/**
 * Formats initials with architectural middots: "TVT" -> "T·V·T"
 */
export function formatMonogramDisplay(raw: string): string {
  const letters = sanitizeMonogramLetters(raw);
  if (!letters) return '';
  return letters.split('').join('·');
}

/**
 * Serializes active monogram config into a deterministic cart key fragment.
 */
export function serializeMonogram(
  monogram?: { text: string; foil: FoilFinishId } | null
): string {
  if (!monogram) return '';
  const clean = sanitizeMonogramLetters(monogram.text);
  if (!clean) return '';
  return `MONO:${clean}@${monogram.foil}`;
}

/**
 * Builds active monogram payload from UI MonogramConfig (returns undefined if disabled or blank).
 */
export function resolveActiveMonogram(
  config: MonogramConfig
): { text: string; foil: FoilFinishId } | undefined {
  if (!config.enabled) return undefined;
  const clean = sanitizeMonogramLetters(config.text);
  if (!clean) return undefined;
  return { text: clean, foil: config.foil };
}

/**
 * Bilingual human-readable monogram stamp for Bag, Checkout, and Printable Invoice.
 */
export function formatMonogramLine(
  monogram: { text: string; foil: FoilFinishId },
  locale: Locale
): string {
  const display = formatMonogramDisplay(monogram.text);
  const foilLabel = FOIL_BY_ID[monogram.foil]?.label[locale] ?? monogram.foil;
  return locale === 'en'
    ? `Monogram "${display}" · ${foilLabel}`
    : `Khắc Chữ "${display}" · ${foilLabel}`;
}

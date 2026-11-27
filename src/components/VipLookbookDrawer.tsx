import React, { useState } from 'react';
import {
  Award,
  BookmarkPlus,
  Download,
  FileText,
  Printer,
  RotateCw,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { HERO_FRAME_FINISHES, PRODUCT_BY_ID } from '../data/catalog';
import { t } from '../data/i18n';
import { atelierAudio } from '../engines/atelierAudio';
import {
  computeBespokeFit,
  ENGRAVING_TIERS,
  FACE_SHAPES,
  PRESCRIPTION_TIERS,
} from '../engines/bespokeSizing';
import { formatMoney } from '../engines/currency';
import { computeOpticalLensTelemetry, getOpticalLensMode } from '../engines/opticalPhysics';
import {
  computeVietQrAmountVnd,
  formatVndPlain,
  MBBANK_VIETQR_CONFIG,
} from '../engines/vietQr';
import {
  buildBespokeSpecSheet,
  serializeBespokeSpecSheetJson,
} from '../engines/vipLookbook';
import type { VipLookbookEntry } from '../types/commerce';

const CertificateBarcode: React.FC<{ certId: string }> = ({ certId }) => {
  const bars: { x: number; w: number }[] = [];
  let cursor = 4;
  for (let i = 0; i < 32; i++) {
    const code = certId.charCodeAt(i % certId.length) + i * 19;
    const w = (code % 3) + 1.3;
    const gap = (code % 2) + 1.8;
    bars.push({ x: cursor, w });
    cursor += w + gap;
  }
  return (
    <svg viewBox="0 0 165 34" className="h-8 w-40" aria-label={`Certificate barcode ${certId}`}>
      {bars.map((b, idx) => (
        <rect key={idx} x={b.x} y={2} width={b.w} height={28} fill="currentColor" />
      ))}
    </svg>
  );
};

export const VipLookbookDrawer: React.FC = () => {
  const {
    locale,
    currency,
    vipLookbook,
    vipLookbookOpen,
    setVipLookbookOpen,
    saveCurrentBespokeToLookbook,
    removeVipLookbookEntry,
    loadVipLookbookEntry,
    addToBag,
    pushToast,
  } = useStore();

  const [dossierLabel, setDossierLabel] = useState('');
  const [certEntry, setCertEntry] = useState<VipLookbookEntry | null>(null);

  if (!vipLookbookOpen) return null;

  const copy = t(locale);

  const handleExportJson = (entry: VipLookbookEntry) => {
    atelierAudio.playDetent();
    const jsonText = serializeBespokeSpecSheetJson(entry);
    const blob = new Blob([jsonText], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `maison-vera-${entry.certificateId.toLowerCase()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);

    pushToast({
      title:
        locale === 'en'
          ? `Exported Bespoke Spec Sheet — ${entry.certificateId}`
          : `Đã xuất hồ sơ JSON — ${entry.certificateId}`,
      detail: `maison-vera-${entry.certificateId.toLowerCase()}.json`,
      tone: 'olive',
    });
  };

  const handleAddEntryToBag = (entry: VipLookbookEntry) => {
    const prod = PRODUCT_BY_ID[entry.productId] ?? PRODUCT_BY_ID['mv-eye-01'];
    const finish =
      HERO_FRAME_FINISHES.find((f) => f.id === entry.frameFinishId) ??
      HERO_FRAME_FINISHES[0];
    const lensSpec = getOpticalLensMode(entry.lensMode);
    const cwId =
      prod.colorways.find((c) => c.id === finish.colorwayId)?.id ??
      prod.colorways[0].id;

    addToBag({
      productId: prod.id,
      size: 'OS',
      colorwayId: cwId,
      customMeta: `${finish.label[locale]} / ${lensSpec.shortLabel[locale]}`,
      unitPriceAddonUsd: entry.bespokeAddonUsd > 0 ? entry.bespokeAddonUsd : undefined,
      bespokeSummary: `CERT ${entry.certificateId} · CAD ${entry.frameBlueprintCode} · PD ${entry.sizing.pdMm}mm · Fit ${entry.fitScore}%`,
      monogram: entry.monogram,
      openDrawer: true,
    });
    setVipLookbookOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-[92] flex justify-end bg-black/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={copy.vipDrawerTitle}
      onClick={() => {
        setCertEntry(null);
        setVipLookbookOpen(false);
      }}
    >
      <div
        data-testid="vip-lookbook-drawer"
        onClick={(e) => e.stopPropagation()}
        className="animate-drawer-right flex h-full w-full max-w-[540px] flex-col border-l border-[var(--hairline-strong)] bg-[var(--surface)] shadow-[var(--shadow-drawer)]"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--hairline)] px-6 py-5">
          <div>
            <p className="inline-flex items-center gap-1.5 font-mono-tech text-[10px] uppercase tracking-[0.22em] text-[var(--accent)]">
              <Award size={12} strokeWidth={1.6} />
              {copy.vipDrawerKicker}
            </p>
            <h2 className="mt-0.5 font-serif-editorial text-2xl text-[var(--ink)]">
              {copy.vipDrawerTitle} ({vipLookbook.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setCertEntry(null);
              setVipLookbookOpen(false);
            }}
            aria-label="Close VIP Lookbook"
            className="flex h-8 w-8 items-center justify-center border border-[var(--hairline)] text-[var(--ink)] hover:border-[var(--ink)]"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* Save Active Configuration Quick Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveCurrentBespokeToLookbook({
              clientLabel: dossierLabel,
              openDrawer: true,
            });
            setDossierLabel('');
          }}
          className="flex gap-2 border-b border-[var(--hairline)] bg-[var(--bg)] px-6 py-3.5"
        >
          <input
            type="text"
            maxLength={48}
            data-testid="vip-dossier-label-input"
            value={dossierLabel}
            onChange={(e) => setDossierLabel(e.target.value)}
            placeholder={
              locale === 'en'
                ? 'Name current studio study (e.g. Paris Nocturne)...'
                : 'Đặt tên hồ sơ hiện tại (vd: Dạ Tiệc Paris)...'
            }
            className="h-9 flex-1 border border-[var(--hairline-strong)] bg-[var(--surface)] px-3 text-xs text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--ink)] focus:outline-none"
          />
          <button
            type="submit"
            data-testid="vip-save-active-btn"
            className="inline-flex shrink-0 items-center gap-1.5 border border-[var(--ink)] bg-[var(--ink)] px-3.5 font-mono-tech text-[10px] uppercase tracking-[0.14em] text-[var(--surface)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent)]"
          >
            <BookmarkPlus size={12} strokeWidth={1.5} />
            {locale === 'en' ? 'Archive' : 'Lưu Hồ Sơ'}
          </button>
        </form>

        {/* Saved Bespoke Studies */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {vipLookbook.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="max-w-sm text-xs leading-relaxed text-[var(--ink-muted)]">
                {copy.vipDrawerEmpty}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {vipLookbook.map((entry) => {
                const prod = PRODUCT_BY_ID[entry.productId] ?? PRODUCT_BY_ID['mv-eye-01'];
                const finish =
                  HERO_FRAME_FINISHES.find((f) => f.id === entry.frameFinishId) ??
                  HERO_FRAME_FINISHES[0];
                const lensSpec = getOpticalLensMode(entry.lensMode);
                const optics = computeOpticalLensTelemetry(entry.lensMode, entry.uvIndex);
                const rxSpec = PRESCRIPTION_TIERS.find(
                  (r) => r.id === entry.sizing.prescriptionTier
                );
                const engSpec = ENGRAVING_TIERS.find(
                  (e) => e.id === entry.sizing.engravingTier
                );
                const faceMeta = FACE_SHAPES.find((f) => f.id === entry.sizing.faceShape);

                return (
                  <article
                    key={entry.id}
                    data-testid={`vip-entry-${entry.certificateId}`}
                    className="border border-[var(--hairline-strong)] bg-[var(--bg)] p-4"
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-[var(--hairline)] pb-2.5">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 font-mono-tech text-[9.5px] uppercase tracking-[0.16em]">
                          <span className="bg-[var(--ink)] px-1.5 py-0.5 text-[var(--surface)]">
                            {entry.certificateId}
                          </span>
                          <span className="border border-[var(--olive)]/45 bg-[var(--olive)]/10 px-1.5 py-0.5 text-[var(--olive)]">
                            FIT {entry.fitScore}%
                          </span>
                        </div>
                        <h3 className="mt-1.5 truncate font-serif-editorial text-xl text-[var(--ink)]">
                          {entry.clientLabel}
                        </h3>
                        <p className="font-mono-tech text-[10px] text-[var(--ink-muted)]">
                          {prod.name[locale]}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="block font-mono-tech text-xs font-medium text-[var(--ink)]">
                          {formatMoney(entry.totalPriceUsd, currency)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeVipLookbookEntry(entry.id)}
                          aria-label="Delete bespoke study"
                          className="mt-1 inline-flex h-6 w-6 items-center justify-center text-[var(--ink-muted)] hover:text-[var(--accent)]"
                        >
                          <Trash2 size={13} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>

                    {/* Optical & Millimeter Spec Grid */}
                    <div className="mt-3 grid grid-cols-2 gap-2 font-mono-tech text-[10px]">
                      <div className="border border-[var(--hairline)] bg-[var(--surface)] px-2.5 py-2">
                        <span className="block text-[8.5px] uppercase text-[var(--ink-muted)]">
                          {locale === 'en' ? 'Metallurgy & Optics' : 'Gọng & Quang Học'}
                        </span>
                        <div className="mt-1 flex items-center gap-1.5 text-[var(--ink)]">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full border border-black/20"
                            style={{ backgroundColor: finish.metalHex }}
                          />
                          <span className="truncate">{finish.label[locale]}</span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[var(--ink-muted)]">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full border border-black/20"
                            style={{ backgroundColor: optics.hexColor }}
                          />
                          <span className="truncate">
                            {lensSpec.shortLabel[locale]} ({entry.vltPercent}% VLT)
                          </span>
                        </div>
                      </div>

                      <div className="border border-[var(--hairline)] bg-[var(--surface)] px-2.5 py-2">
                        <span className="block text-[8.5px] uppercase text-[var(--ink-muted)]">
                          {locale === 'en' ? 'Sabae Millimeter CAD' : 'Thông Số CAD Sabae'}
                        </span>
                        <span className="mt-1 block text-[var(--ink)]">
                          {entry.frameBlueprintCode}
                        </span>
                        <span className="mt-0.5 block text-[var(--ink-muted)]">
                          PD {entry.sizing.pdMm}mm · {faceMeta?.label[locale]}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5 font-mono-tech text-[9px] uppercase text-[var(--ink-muted)]">
                      <span className="border border-[var(--hairline)] px-1.5 py-0.5">
                        {rxSpec?.label[locale]}
                      </span>
                      {entry.sizing.engravingTier !== 'none' && (
                        <span className="border border-[var(--accent)]/40 px-1.5 py-0.5 text-[var(--accent)]">
                          {engSpec?.label[locale]}: {entry.sizing.engravingText || 'SABAE'}
                        </span>
                      )}
                      {entry.monogram && (
                        <span className="border border-[var(--accent)]/40 px-1.5 py-0.5 text-[var(--accent)]">
                          MONO: {entry.monogram.text}
                        </span>
                      )}
                    </div>

                    {/* Dossier Actions */}
                    <div className="mt-3.5 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                      <button
                        type="button"
                        onClick={() => loadVipLookbookEntry(entry)}
                        className="inline-flex items-center justify-center gap-1 border border-[var(--hairline-strong)] bg-[var(--surface)] px-2 py-1.5 font-mono-tech text-[9.5px] uppercase tracking-[0.08em] text-[var(--ink)] hover:border-[var(--ink)]"
                      >
                        <RotateCw size={11} strokeWidth={1.5} />
                        {copy.vipLoadStudio}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddEntryToBag(entry)}
                        className="inline-flex items-center justify-center gap-1 border border-[var(--ink)] bg-[var(--ink)] px-2 py-1.5 font-mono-tech text-[9.5px] uppercase tracking-[0.08em] text-[var(--surface)] hover:border-[var(--accent)] hover:bg-[var(--accent)]"
                      >
                        <ShoppingBag size={11} strokeWidth={1.5} />
                        {copy.vipAddToBag}
                      </button>
                      <button
                        type="button"
                        data-testid={`vip-export-json-${entry.certificateId}`}
                        onClick={() => handleExportJson(entry)}
                        className="inline-flex items-center justify-center gap-1 border border-[var(--hairline-strong)] bg-[var(--surface)] px-2 py-1.5 font-mono-tech text-[9.5px] uppercase tracking-[0.08em] text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                      >
                        <Download size={11} strokeWidth={1.5} />
                        {copy.vipExportJson}
                      </button>
                      <button
                        type="button"
                        data-testid={`vip-view-cert-${entry.certificateId}`}
                        onClick={() => {
                          atelierAudio.playShutter();
                          setCertEntry(entry);
                        }}
                        className="inline-flex items-center justify-center gap-1 border border-[var(--accent)] bg-[var(--surface)] px-2 py-1.5 font-mono-tech text-[9.5px] uppercase tracking-[0.08em] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)]"
                      >
                        <FileText size={11} strokeWidth={1.5} />
                        {copy.vipViewCert}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Printable Bespoke Certificate of Calibration Modal */}
      {certEntry && (() => {
        const spec = buildBespokeSpecSheet(certEntry);
        const fit = computeBespokeFit(certEntry.sizing, certEntry.lensMode);
        const depositVnd = computeVietQrAmountVnd(certEntry.totalPriceUsd, 'deposit-30');
        return (
          <div
            data-testid="bespoke-certificate-modal"
            onClick={(e) => {
              e.stopPropagation();
              setCertEntry(null);
            }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          >
            <div
              id="printable-invoice"
              onClick={(e) => e.stopPropagation()}
              className="animate-modal-in max-h-[90vh] w-full max-w-[680px] overflow-y-auto border border-[var(--hairline-strong)] bg-[var(--surface)] p-6 shadow-2xl sm:p-8"
            >
              <div className="flex items-start justify-between border-b border-[var(--hairline-strong)] pb-4">
                <div>
                  <p className="font-mono-tech text-[10px] uppercase tracking-[0.26em] text-[var(--accent)]">
                    {spec.atelier}
                  </p>
                  <h3 className="mt-1 font-serif-editorial text-3xl text-[var(--ink)]">
                    {copy.vipCertTitle}
                  </h3>
                  <p className="mt-1 font-mono-tech text-[10px] tracking-[0.16em] text-[var(--ink-muted)]">
                    {spec.edition} · REF {spec.certificateId}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCertEntry(null)}
                  aria-label="Close certificate"
                  className="no-print flex h-8 w-8 items-center justify-center border border-[var(--hairline)] text-[var(--ink)] hover:border-[var(--ink)]"
                >
                  <X size={16} strokeWidth={1.5} />
                </button>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="border border-[var(--hairline)] bg-[var(--bg)] p-4">
                  <p className="font-mono-tech text-[9.5px] uppercase tracking-[0.2em] text-[var(--accent)]">
                    01 · MILLIMETER CAD BLUEPRINT
                  </p>
                  <dl className="mt-2.5 space-y-1.5 font-mono-tech text-[11px]">
                    <div className="flex justify-between">
                      <dt className="text-[var(--ink-muted)]">Blueprint Code</dt>
                      <dd className="text-[var(--ink)]">{spec.millimeterBlueprint.blueprintStamp}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[var(--ink-muted)]">Pupillary Distance</dt>
                      <dd className="text-[var(--ink)]">{spec.millimeterBlueprint.pdMm} mm</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[var(--ink-muted)]">Frame Width</dt>
                      <dd className="text-[var(--ink)]">{spec.millimeterBlueprint.frameWidthMm} mm</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[var(--ink-muted)]">Nose Bridge / Drop</dt>
                      <dd className="uppercase text-[var(--ink)]">
                        {spec.millimeterBlueprint.noseBridge} ({spec.millimeterBlueprint.nosePadDropMm}mm)
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[var(--ink-muted)]">Bespoke Fit Score</dt>
                      <dd className="font-medium text-[var(--olive)]">
                        {fit.overallFitScore}% · {fit.fitGrade[locale]}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="border border-[var(--hairline)] bg-[var(--bg)] p-4">
                  <p className="font-mono-tech text-[9.5px] uppercase tracking-[0.2em] text-[var(--accent)]">
                    02 · OPTICAL TRANSMITTANCE LAB
                  </p>
                  <dl className="mt-2.5 space-y-1.5 font-mono-tech text-[11px]">
                    <div className="flex justify-between">
                      <dt className="text-[var(--ink-muted)]">Lens System</dt>
                      <dd className="text-[var(--ink)]">{spec.opticalPhysics.lensTitleEn}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[var(--ink-muted)]">VLT / Category</dt>
                      <dd className="text-[var(--ink)]">
                        {spec.opticalPhysics.vltPercent}% · {spec.opticalPhysics.filterCategory}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[var(--ink-muted)]">Glare Reduction</dt>
                      <dd className="text-[var(--ink)]">-{spec.opticalPhysics.glareReductionPercent}%</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[var(--ink-muted)]">Prescription</dt>
                      <dd className="text-[var(--ink)]">{spec.bespokeServices.prescriptionTier}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[var(--ink-muted)]">Engraving</dt>
                      <dd className="text-[var(--accent)]">{spec.bespokeServices.engravingText}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="mt-4 flex flex-col justify-between gap-4 border border-[var(--hairline)] bg-[var(--bg)] p-4 sm:flex-row sm:items-center">
                <div className="space-y-1 font-mono-tech text-[10.5px]">
                  <p className="uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                    VIP SETTLEMENT · {MBBANK_VIETQR_CONFIG.bankShortName} ({MBBANK_VIETQR_CONFIG.bankBin})
                  </p>
                  <p className="text-[var(--ink)]">
                    ACC {MBBANK_VIETQR_CONFIG.accountNo} · {MBBANK_VIETQR_CONFIG.accountName}
                  </p>
                  <p className="text-[var(--accent)]">
                    TOTAL {formatMoney(certEntry.totalPriceUsd, currency)} · 30% VIP DEPOSIT {formatVndPlain(depositVnd)}
                  </p>
                </div>
                <div className="text-[var(--ink)]">
                  <CertificateBarcode certId={certEntry.certificateId} />
                </div>
              </div>

              <div className="no-print mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--hairline)] pt-4">
                <button
                  type="button"
                  onClick={() => handleExportJson(certEntry)}
                  className="inline-flex items-center gap-2 border border-[var(--hairline-strong)] px-4 py-2 text-xs uppercase tracking-[0.14em] text-[var(--ink)] hover:border-[var(--ink)]"
                >
                  <Download size={13} strokeWidth={1.5} />
                  {copy.vipExportJson}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 border border-[var(--ink)] bg-[var(--ink)] px-5 py-2 text-xs uppercase tracking-[0.16em] text-[var(--surface)] hover:border-[var(--accent)] hover:bg-[var(--accent)]"
                >
                  <Printer size={13} strokeWidth={1.5} />
                  {copy.vipCertPrint}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

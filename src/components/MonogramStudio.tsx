import React from 'react';
import { Stamp } from 'lucide-react';
import { t } from '../data/i18n';
import { atelierAudio } from '../engines/atelierAudio';
import {
  FOIL_BY_ID,
  FOIL_FINISHES,
  formatMonogramDisplay,
  sanitizeMonogramLetters,
} from '../engines/monogramEngine';
import type { Locale, MonogramConfig } from '../types/commerce';

interface MonogramStudioProps {
  config: MonogramConfig;
  onChange: (next: MonogramConfig) => void;
  locale: Locale;
  testIdPrefix?: string;
}

export const MonogramStudio: React.FC<MonogramStudioProps> = ({
  config,
  onChange,
  locale,
  testIdPrefix = 'monogram',
}) => {
  const copy = t(locale);
  const activeFoil = FOIL_BY_ID[config.foil];
  const display = formatMonogramDisplay(config.text) || 'M·V';

  return (
    <div className="border border-[var(--hairline)] bg-[var(--surface)] p-3.5">
      <label className="flex cursor-pointer items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-[11px] font-medium text-[var(--ink)]">
          <Stamp size={13} strokeWidth={1.5} className="text-[var(--accent)]" />
          {copy.monogramToggle}
        </span>
        <input
          type="checkbox"
          data-testid={`${testIdPrefix}-toggle`}
          checked={config.enabled}
          onChange={(e) => {
            atelierAudio.playDetent();
            onChange({ ...config, enabled: e.target.checked });
          }}
          className="h-3.5 w-3.5 accent-[var(--accent)]"
        />
      </label>

      {config.enabled && (
        <div className="mt-3 space-y-3 border-t border-[var(--hairline)] pt-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-center">
            {/* Initials input + foil pills */}
            <div className="space-y-2 sm:col-span-7">
              <input
                type="text"
                maxLength={6}
                data-testid={`${testIdPrefix}-input`}
                value={config.text}
                onChange={(e) =>
                  onChange({
                    ...config,
                    text: sanitizeMonogramLetters(e.target.value),
                  })
                }
                placeholder={copy.monogramPlaceholder}
                className="h-9 w-full border border-[var(--hairline-strong)] bg-[var(--bg)] px-3 font-mono-tech text-xs uppercase tracking-[0.22em] text-[var(--ink)] placeholder:normal-case placeholder:tracking-normal placeholder:text-[var(--ink-muted)] focus:border-[var(--ink)] focus:outline-none"
              />
              <div className="flex flex-wrap gap-1.5">
                {FOIL_FINISHES.map((foil) => {
                  const selected = config.foil === foil.id;
                  return (
                    <button
                      key={foil.id}
                      type="button"
                      data-testid={`${testIdPrefix}-foil-${foil.id}`}
                      onClick={() => {
                        atelierAudio.playDetent();
                        onChange({ ...config, foil: foil.id });
                      }}
                      className={`inline-flex items-center gap-1.5 border px-2 py-1 text-[10px] transition-colors ${
                        selected
                          ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]'
                          : 'border-[var(--hairline)] bg-[var(--bg)] text-[var(--ink-muted)] hover:text-[var(--ink)]'
                      }`}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full border border-black/25"
                        style={{ backgroundColor: foil.swatchHex }}
                      />
                      <span>{foil.label[locale]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Tactile Foil-Stamped Leather / Titanium Plate Preview */}
            <div className="sm:col-span-5">
              <div
                data-testid={`${testIdPrefix}-live-preview`}
                className="relative flex h-[86px] flex-col items-center justify-center overflow-hidden border border-black/20 px-3 text-center shadow-inner"
                style={{ background: activeFoil.plateBg }}
              >
                {/* Stitched / engraved perimeter hairline */}
                <div className="pointer-events-none absolute inset-1.5 border border-dashed border-white/15" />
                <span
                  className="font-mono-tech text-[7px] uppercase tracking-[0.26em] opacity-65"
                  style={{ color: activeFoil.textColor }}
                >
                  MAISON VÉRA
                </span>
                <span
                  className="mt-1 font-serif-editorial text-2xl tracking-[0.24em]"
                  style={{
                    color: activeFoil.textColor,
                    textShadow: activeFoil.textShadow,
                  }}
                >
                  {display}
                </span>
                <span
                  className="mt-0.5 font-mono-tech text-[7px] uppercase tracking-[0.2em] opacity-60"
                  style={{ color: activeFoil.textColor }}
                >
                  {activeFoil.label[locale]}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { ArrowRight, Check, KeyRound } from 'lucide-react';
import { z } from 'zod';
import { useStore } from '../context/StoreContext';
import { t } from '../data/i18n';
import { atelierAudio } from '../engines/atelierAudio';

const vaultEmailSchema = z.string().trim().email();

export const PrivateVaultBanner: React.FC = () => {
  const { locale, applyPromoCode, setBagOpen, pushToast } = useStore();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);

  const copy = t(locale);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = vaultEmailSchema.safeParse(email);
    if (!parsed.success) {
      setError(copy.vaultEmailError);
      return;
    }
    setError(null);
    atelierAudio.playConfirm();
    setUnlocked(true);
  };

  const handleActivatePrivateCode = () => {
    const res = applyPromoCode('PRIVATE10');
    if (res.status === 'APPLIED' || res.status === 'DUPLICATE_CODE') {
      pushToast({
        title:
          locale === 'en'
            ? 'PRIVATE10 (-10%) activated on your Shopping Bag'
            : 'Đã kích hoạt PRIVATE10 (-10%) vào Giỏ Hàng',
        detail: 'PRIVATE VAULT MEMBER KEY',
        tone: 'olive',
      });
      setBagOpen(true);
    } else {
      pushToast({
        title:
          locale === 'en'
            ? 'Code PRIVATE10 ready — add any specimen to your bag to redeem -10%'
            : 'Mã PRIVATE10 sẵn sàng — hãy thêm sản phẩm vào giỏ để nhận ưu đãi -10%',
        detail: 'PRIVATE10',
        tone: 'accent',
      });
    }
  };

  return (
    <section
      id="private-vault"
      className="reveal-section border-b border-[var(--hairline)] bg-[var(--surface)] py-14 sm:py-20"
    >
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8">
        <div className="grid grid-cols-1 items-center gap-8 border border-[var(--hairline-strong)] bg-[var(--bg)] p-7 sm:p-10 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <p className="inline-flex items-center gap-2 font-mono-tech text-[10px] uppercase tracking-[0.24em] text-[var(--accent)]">
              <KeyRound size={12} strokeWidth={1.6} />
              {copy.vaultKicker}
            </p>
            <h2 className="mt-3 font-serif-editorial text-4xl font-normal text-[var(--ink)] sm:text-5xl">
              {copy.vaultTitle}
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-[var(--ink-muted)]">
              {copy.vaultSub}
            </p>
          </div>

          <div className="lg:col-span-6">
            {!unlocked ? (
              <form onSubmit={handleSubmit} className="space-y-3" noValidate>
                <div className="flex flex-col gap-2.5 sm:flex-row">
                  <input
                    type="email"
                    data-testid="vault-email-input"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder={copy.vaultPlaceholder}
                    className="h-12 flex-1 border border-[var(--hairline-strong)] bg-[var(--surface)] px-4 text-xs text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--ink)] focus:outline-none"
                  />
                  <button
                    type="submit"
                    data-testid="vault-submit-btn"
                    className="inline-flex h-12 items-center justify-center gap-2 border border-[var(--ink)] bg-[var(--ink)] px-6 text-xs font-medium uppercase tracking-[0.18em] text-[var(--surface)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)]"
                  >
                    <span>{copy.vaultSubmit}</span>
                    <ArrowRight size={14} strokeWidth={1.5} />
                  </button>
                </div>
                {error && (
                  <p className="text-xs text-[#B83227]" role="alert">
                    {error}
                  </p>
                )}
              </form>
            ) : (
              <div
                data-testid="vault-unlocked-card"
                className="border border-[var(--olive)]/45 bg-[var(--surface)] p-5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 font-mono-tech text-[10px] uppercase tracking-[0.2em] text-[var(--olive)]">
                    <Check size={13} strokeWidth={2.2} />
                    {copy.vaultUnlockedLabel}
                  </span>
                  <span
                    data-testid="vault-code-pill"
                    className="border border-[var(--ink)] bg-[var(--ink)] px-3 py-1 font-mono-tech text-xs tracking-[0.18em] text-[var(--surface)]"
                  >
                    PRIVATE10
                  </span>
                </div>
                <p className="mt-2.5 text-xs text-[var(--ink-muted)]">
                  {copy.vaultUnlockedHint}
                </p>
                <button
                  type="button"
                  data-testid="vault-apply-btn"
                  onClick={handleActivatePrivateCode}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 border border-[var(--accent)] bg-[var(--accent)] px-4 py-2.5 font-mono-tech text-[10.5px] uppercase tracking-[0.18em] text-[var(--accent-contrast)] hover:opacity-92"
                >
                  {copy.vaultApplyNow}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

import { useState } from "react";
import { ChevronLeftIcon, MailIcon } from "./icons";

/**
 * Confirmation step shared by Sign In and Sign Up once a magic-link email
 * has been sent (Phase 6) — replaces the old 6-digit code-entry screen.
 * There's nothing to submit here: the session is picked up automatically
 * when the browser returns via the emailed link (see SessionContext's auth
 * bootstrap), so this just confirms the email went out and offers a resend.
 */
interface CheckEmailStepProps {
  email: string;
  onBack: () => void;
  onResend: () => Promise<void>;
}

export function CheckEmailStep({
  email,
  onBack,
  onResend,
}: CheckEmailStepProps) {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResend = async () => {
    if (resending) return;
    setResending(true);
    setError(null);
    setResent(false);
    try {
      await onResend();
      setResent(true);
    } catch (err) {
      console.error(err);
      setError("Couldn't resend the link — try again in a moment.");
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        className="flex h-8 w-8 flex-none items-center justify-center self-start rounded-full border border-line bg-card text-ink"
      >
        <ChevronLeftIcon size={15} />
      </button>

      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <MailIcon className="text-accent" />
        <div className="flex w-full flex-col gap-1.5">
          <div className="font-display text-[26px] text-ink">
            CHECK YOUR EMAIL
          </div>
          <div className="font-sans text-[12.5px] leading-[1.5] text-ink-dim">
            We sent a sign-in link to{" "}
            <span className="font-bold text-ink">{email}</span> — tap it to
            finish signing in.
          </div>
        </div>
      </div>

      {error && (
        <div className="text-center font-sans text-[11.5px] font-semibold text-danger">
          {error}
        </div>
      )}
      {resent && !error && (
        <div className="text-center font-sans text-[11.5px] font-semibold text-accent">
          Link resent.
        </div>
      )}

      <button
        type="button"
        onClick={handleResend}
        disabled={resending}
        className="text-center font-sans text-[11.5px] font-semibold text-ink-dim underline disabled:opacity-45"
      >
        {resending ? "Resending…" : "Resend link"}
      </button>
    </>
  );
}

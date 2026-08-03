import { useState } from "react";
import { ChevronLeftIcon } from "./icons";

/**
 * Verification-code step shared by Sign In and Sign Up. Not one of the
 * original 8 designed screens — a spec extension required by real
 * email/phone OTP auth (Phase 3) — but built from the same tokens/components
 * as everything else so it reads as native to the app.
 */
interface OtpStepProps {
  contact: string;
  onBack: () => void;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
}

export function OtpStep({ contact, onBack, onVerify, onResend }: OtpStepProps) {
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  const handleVerify = async () => {
    if (code.trim().length < 4 || verifying) return;
    setVerifying(true);
    setError(null);
    try {
      await onVerify(code.trim());
    } catch (err) {
      console.error(err);
      setError("That code didn't work — check it and try again.");
    } finally {
      setVerifying(false);
    }
  };

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
      setError("Couldn't resend the code — try again in a moment.");
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

      <div className="flex flex-col gap-1.5">
        <div className="font-display text-[26px] text-ink">ENTER CODE</div>
        <div className="font-sans text-[12.5px] leading-[1.5] text-ink-dim">
          We sent a 6-digit code to {contact}. Enter it below to continue.
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[10.5px] font-semibold tracking-[0.06em] text-ink-dim">
          VERIFICATION CODE
        </span>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
          inputMode="numeric"
          autoFocus
          placeholder="123456"
          maxLength={6}
          className="rounded-input border border-line bg-card p-[13px] text-center font-mono text-lg font-semibold tracking-[0.3em] text-ink outline-none"
        />
      </label>

      {error && (
        <div className="font-sans text-[11.5px] font-semibold text-danger">
          {error}
        </div>
      )}
      {resent && !error && (
        <div className="font-sans text-[11.5px] font-semibold text-accent">
          New code sent.
        </div>
      )}

      <button
        type="button"
        onClick={handleVerify}
        disabled={code.trim().length < 4 || verifying}
        className="rounded-[12px] border-none bg-signal p-[15px] font-sans text-sm font-bold text-signal-on disabled:cursor-not-allowed disabled:opacity-45"
      >
        {verifying ? "VERIFYING…" : "VERIFY & CONTINUE"}
      </button>

      <button
        type="button"
        onClick={handleResend}
        disabled={resending}
        className="text-center font-sans text-[11.5px] font-semibold text-ink-dim underline disabled:opacity-45"
      >
        {resending ? "Resending…" : "Resend code"}
      </button>
    </>
  );
}

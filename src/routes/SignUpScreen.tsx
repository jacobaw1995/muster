import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckEmailStep } from "../components/CheckEmailStep";
import { CloseButton, ModalShell } from "../components/ModalShell";
import { Wordmark } from "../components/Wordmark";
import {
  clearPendingProfileName,
  stashPendingProfileName,
} from "../lib/pendingProfileName";
import { useSession } from "../state/SessionContext";
import { useToast } from "../state/ToastContext";

export default function SignUpScreen() {
  const { requestMagicLink } = useSession();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"details" | "sent">("details");
  const [requesting, setRequesting] = useState(false);

  const disabled = !name.trim() || !email.trim();

  const handleSubmit = async () => {
    if (disabled || requesting) return;
    setRequesting(true);
    try {
      // Stashed before the request goes out — the magic link may be
      // clicked from a different tab or device, so the name has to survive
      // outside this component's state (see SessionContext, which applies
      // it once the browser returns permanently signed in).
      stashPendingProfileName(name.trim());
      await requestMagicLink(email.trim());
      setStep("sent");
    } catch (err) {
      console.error(err);
      clearPendingProfileName();
      showToast("Couldn't send the link — check the address and try again.");
    } finally {
      setRequesting(false);
    }
  };

  const handleResend = () => requestMagicLink(email.trim());

  if (step === "sent") {
    return (
      <ModalShell>
        <CheckEmailStep
          email={email.trim()}
          onBack={() => setStep("details")}
          onResend={handleResend}
        />
      </ModalShell>
    );
  }

  return (
    <ModalShell>
      <CloseButton className="self-start" />

      <Wordmark height={24} />

      <div className="flex flex-col gap-1.5">
        <div className="font-display text-[26px] text-ink">CREATE ACCOUNT</div>
        <div className="font-sans text-[12.5px] leading-[1.5] text-ink-dim">
          Guest browsing already works — create an account when you want
          calendar sync and saved RSVPs.
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[10.5px] font-semibold tracking-[0.06em] text-ink-dim">
          NAME
        </span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Alex Rivera"
          className="rounded-input border border-line bg-card p-[13px] font-sans text-[13px] font-semibold text-ink outline-none"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[10.5px] font-semibold tracking-[0.06em] text-ink-dim">
          EMAIL
        </span>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="you@example.com"
          className="rounded-input border border-line bg-card p-[13px] font-sans text-[13px] font-semibold text-ink outline-none"
        />
      </label>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={disabled || requesting}
        className="rounded-[12px] border-none bg-signal p-[15px] font-sans text-sm font-bold text-signal-on disabled:cursor-not-allowed disabled:opacity-45"
      >
        {requesting ? "SENDING LINK…" : "CREATE ACCOUNT"}
      </button>

      <div className="flex justify-center gap-1.5 font-sans text-xs font-semibold">
        <span className="text-ink-dim">Already have an account?</span>
        <Link to="/sign-in" className="text-accent no-underline">
          Sign in
        </Link>
      </div>
    </ModalShell>
  );
}

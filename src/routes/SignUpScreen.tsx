import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckEmailStep } from "../components/CheckEmailStep";
import { CloseButton, ModalShell } from "../components/ModalShell";
import { Wordmark } from "../components/Wordmark";
import { AppleIcon, GoogleIcon } from "../components/icons";
import { APPLE_SIGNIN_ENABLED } from "../lib/featureFlags";
import {
  clearPendingProfileName,
  stashPendingProfileName,
} from "../lib/pendingProfileName";
import { useSession } from "../state/SessionContext";
import { useToast } from "../state/ToastContext";

const oauthButtonClass =
  "flex items-center justify-center gap-2.5 rounded-input border border-line bg-card p-[13px] font-sans text-[13px] font-bold text-ink disabled:cursor-not-allowed disabled:opacity-60";

export default function SignUpScreen() {
  const { requestMagicLink, linkOAuth } = useSession();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"details" | "sent">("details");
  const [requesting, setRequesting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(
    null,
  );

  const disabled = !name.trim() || !email.trim();

  const handleOAuth = async (provider: "google" | "apple") => {
    setOauthLoading(provider);
    try {
      await linkOAuth(provider);
      // Success redirects the browser away — nothing else runs here.
    } catch (err) {
      console.error(err);
      showToast(
        `${provider === "google" ? "Google" : "Apple"} sign-in isn't set up yet — try email.`,
      );
    } finally {
      setOauthLoading(null);
    }
  };

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

      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={() => handleOAuth("google")}
          disabled={oauthLoading !== null}
          className={oauthButtonClass}
        >
          <GoogleIcon />
          {oauthLoading === "google" ? "Connecting…" : "Continue with Google"}
        </button>
        {APPLE_SIGNIN_ENABLED && (
          <button
            type="button"
            onClick={() => handleOAuth("apple")}
            disabled={oauthLoading !== null}
            className={oauthButtonClass}
          >
            <AppleIcon />
            {oauthLoading === "apple" ? "Connecting…" : "Continue with Apple"}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        <div className="h-px flex-1 bg-line" />
        <span className="font-mono text-[10px] font-semibold text-ink-dim">
          OR
        </span>
        <div className="h-px flex-1 bg-line" />
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

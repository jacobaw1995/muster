import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CheckEmailStep } from "../components/CheckEmailStep";
import { CloseButton, ModalShell } from "../components/ModalShell";
import { PasswordField } from "../components/PasswordField";
import { Wordmark } from "../components/Wordmark";
import { AlertIcon, AppleIcon, GoogleIcon, XIcon } from "../components/icons";
import {
  APPLE_SIGNIN_ENABLED,
  GOOGLE_SIGNIN_ENABLED,
} from "../lib/featureFlags";
import {
  isInvalidCredentialsError,
  isStaleSessionError,
} from "../lib/api/auth";
import { useSession } from "../state/SessionContext";
import { useToast } from "../state/ToastContext";

const oauthButtonClass =
  "flex items-center justify-center gap-2.5 rounded-input border border-line bg-card p-[13px] font-sans text-[13px] font-bold text-ink disabled:cursor-not-allowed disabled:opacity-60";

// Google's retired (see featureFlags.ts) and Apple's still pending setup —
// when neither is enabled there's nothing to show above the email/password
// form, so the section (buttons + "OR" divider) is skipped entirely rather
// than rendering an empty divider.
const SHOW_OAUTH_SECTION = GOOGLE_SIGNIN_ENABLED || APPLE_SIGNIN_ENABLED;

type Step = "credentials" | "magicSent" | "resetSent";

export default function SignInScreen() {
  const {
    userId,
    requestMagicLink,
    signInWithPassword,
    requestPasswordReset,
    linkOAuth,
    signOut,
    authNotice,
    dismissAuthNotice,
  } = useSession();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Set by SignUpScreen when it redirects here after an email-already-
  // registered collision, so the person doesn't have to retype it.
  const prefillEmail =
    (location.state as { prefillEmail?: string } | null)?.prefillEmail ?? "";

  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [signing, setSigning] = useState(false);
  const [magicRequesting, setMagicRequesting] = useState(false);
  const [resetRequesting, setResetRequesting] = useState(false);
  const [credentialsError, setCredentialsError] = useState<string | null>(
    null,
  );
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(
    null,
  );

  // Dormant since the Auth overhaul (see SHOW_OAUTH_SECTION above) — kept
  // working, not deleted, so flipping either feature flag back on just
  // works.
  const handleOAuth = async (provider: "google" | "apple") => {
    if (!userId) {
      showToast("Still starting up — try again in a moment.");
      return;
    }
    setOauthLoading(provider);
    try {
      await linkOAuth(provider);
      // Success redirects the browser away — nothing else runs here.
    } catch (err) {
      console.error(`OAuth (${provider}) sign-in failed:`, err);
      const label = provider === "google" ? "Google" : "Apple";
      if (isStaleSessionError(err)) {
        try {
          await signOut();
          showToast("Your session needed a refresh — try again now.");
        } catch (recoverErr) {
          console.error("Stale-session recovery failed:", recoverErr);
          showToast(`Couldn't start ${label} sign-in — try reloading the page.`);
        }
      } else {
        const message =
          err instanceof Error && err.message ? err.message : "Unknown error";
        showToast(`Couldn't start ${label} sign-in: ${message}`);
      }
    } finally {
      setOauthLoading(null);
    }
  };

  const handleSignIn = async () => {
    const trimmed = email.trim();
    if (!trimmed || !password || signing) return;
    setSigning(true);
    setCredentialsError(null);
    try {
      await signInWithPassword(trimmed, password);
      // Same-tab sign-in, no redirect — the bootstrap's own "Signed in"
      // toast only fires for the redirect-driven paths (magic link,
      // OAuth), so this path shows it directly.
      showToast("Signed in");
      navigate("/");
    } catch (err) {
      console.error(err);
      if (isInvalidCredentialsError(err)) {
        // Deliberately doesn't say which of email/password was wrong —
        // that would let someone probe for which emails have accounts.
        setCredentialsError("Email or password is incorrect");
      } else {
        const message =
          err instanceof Error && err.message
            ? err.message
            : "Couldn't sign in — try again";
        showToast(message);
      }
    } finally {
      setSigning(false);
    }
  };

  const handleMagicLink = async () => {
    const trimmed = email.trim();
    if (!trimmed || magicRequesting) return;
    setMagicRequesting(true);
    try {
      await requestMagicLink(trimmed);
      setStep("magicSent");
    } catch (err) {
      console.error(err);
      showToast("Couldn't send the link — check the address and try again.");
    } finally {
      setMagicRequesting(false);
    }
  };

  const handleForgotPassword = async () => {
    const trimmed = email.trim();
    if (!trimmed || resetRequesting) return;
    setResetRequesting(true);
    try {
      await requestPasswordReset(trimmed);
      setStep("resetSent");
    } catch (err) {
      console.error(err);
      showToast(
        "Couldn't send the reset email — check the address and try again.",
      );
    } finally {
      setResetRequesting(false);
    }
  };

  const handleResendMagicLink = () => requestMagicLink(email.trim());
  const handleResendReset = () => requestPasswordReset(email.trim());

  if (step === "magicSent") {
    return (
      <ModalShell>
        <CheckEmailStep
          email={email.trim()}
          onBack={() => setStep("credentials")}
          onResend={handleResendMagicLink}
        />
      </ModalShell>
    );
  }

  if (step === "resetSent") {
    return (
      <ModalShell>
        <CheckEmailStep
          email={email.trim()}
          onBack={() => setStep("credentials")}
          onResend={handleResendReset}
          description={
            <>
              We sent a password reset link to{" "}
              <span className="font-bold text-ink">{email.trim()}</span> —
              tap it to set a new password.
            </>
          }
        />
      </ModalShell>
    );
  }

  return (
    <ModalShell>
      <CloseButton className="self-start" />

      <Wordmark height={24} />

      {authNotice && (
        <div className="flex items-start gap-2.5 rounded-card border border-warn/40 bg-warn/15 p-3 text-warn">
          <AlertIcon size={17} className="mt-0.5 flex-none" />
          <span className="flex-1 font-sans text-[12px] font-semibold leading-snug">
            {authNotice}
          </span>
          <button
            type="button"
            onClick={dismissAuthNotice}
            aria-label="Dismiss"
            className="flex-none border-none bg-transparent p-0 text-warn"
          >
            <XIcon size={14} />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <div className="font-display text-[26px] text-ink">SIGN IN</div>
        <div className="font-sans text-[12.5px] leading-[1.5] text-ink-dim">
          Sync your RSVPs, itinerary, and calendar across devices. You can keep
          browsing without an account.
        </div>
      </div>

      {SHOW_OAUTH_SECTION && (
        <>
          <div className="flex flex-col gap-2.5">
            {GOOGLE_SIGNIN_ENABLED && (
              <button
                type="button"
                onClick={() => handleOAuth("google")}
                disabled={oauthLoading !== null}
                className={oauthButtonClass}
              >
                <GoogleIcon />
                {oauthLoading === "google"
                  ? "Connecting…"
                  : "Continue with Google"}
              </button>
            )}
            {APPLE_SIGNIN_ENABLED && (
              <button
                type="button"
                onClick={() => handleOAuth("apple")}
                disabled={oauthLoading !== null}
                className={oauthButtonClass}
              >
                <AppleIcon />
                {oauthLoading === "apple"
                  ? "Connecting…"
                  : "Continue with Apple"}
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
        </>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[10.5px] font-semibold tracking-[0.06em] text-ink-dim">
          EMAIL
        </span>
        <input
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setCredentialsError(null);
          }}
          type="email"
          placeholder="you@example.com"
          className="rounded-input border border-line bg-card p-[13px] font-sans text-[13px] font-semibold text-ink outline-none"
        />
      </label>

      <PasswordField
        label="PASSWORD"
        value={password}
        onChange={(value) => {
          setPassword(value);
          setCredentialsError(null);
        }}
        placeholder="Your password"
        autoComplete="current-password"
      />

      <button
        type="button"
        onClick={handleForgotPassword}
        disabled={!email.trim() || resetRequesting}
        className="self-end font-sans text-[11.5px] font-semibold text-accent disabled:opacity-45"
      >
        {resetRequesting ? "Sending…" : "Forgot password?"}
      </button>

      {credentialsError && (
        <div className="text-center font-sans text-[11.5px] font-semibold text-danger">
          {credentialsError}
        </div>
      )}

      <button
        type="button"
        onClick={handleSignIn}
        disabled={!email.trim() || !password || signing}
        className="rounded-[12px] border-none bg-signal p-[15px] font-sans text-sm font-bold text-signal-on disabled:cursor-not-allowed disabled:opacity-45"
      >
        {signing ? "SIGNING IN…" : "SIGN IN"}
      </button>

      <div className="flex items-center gap-2.5">
        <div className="h-px flex-1 bg-line" />
        <span className="font-mono text-[10px] font-semibold text-ink-dim">
          OR
        </span>
        <div className="h-px flex-1 bg-line" />
      </div>

      <button
        type="button"
        onClick={handleMagicLink}
        disabled={!email.trim() || magicRequesting}
        className={oauthButtonClass}
      >
        {magicRequesting ? "Sending…" : "Email me a link instead"}
      </button>

      <div className="flex justify-center gap-1.5 font-sans text-xs font-semibold">
        <span className="text-ink-dim">New here?</span>
        <Link to="/sign-up" className="text-accent no-underline">
          Create an account
        </Link>
      </div>

      <Link
        to="/"
        className="text-center font-sans text-[11.5px] font-semibold text-ink-dim underline"
      >
        Continue browsing as guest
      </Link>
    </ModalShell>
  );
}

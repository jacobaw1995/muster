import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CloseButton, ModalShell } from "../components/ModalShell";
import { PasswordField } from "../components/PasswordField";
import { Wordmark } from "../components/Wordmark";
import { AppleIcon, GoogleIcon } from "../components/icons";
import {
  APPLE_SIGNIN_ENABLED,
  GOOGLE_SIGNIN_ENABLED,
} from "../lib/featureFlags";
import {
  isEmailAlreadyRegisteredError,
  isStaleSessionError,
} from "../lib/api/auth";
import {
  clearPendingProfileName,
  stashPendingProfileName,
} from "../lib/pendingProfileName";
import { useSession } from "../state/SessionContext";
import { useToast } from "../state/ToastContext";

const oauthButtonClass =
  "flex items-center justify-center gap-2.5 rounded-input border border-line bg-card p-[13px] font-sans text-[13px] font-bold text-ink disabled:cursor-not-allowed disabled:opacity-60";

const MIN_PASSWORD_LENGTH = 8;
// Google's retired (see featureFlags.ts) and Apple's still pending setup —
// when neither is enabled there's nothing to show above the email/password
// form, so the section (buttons + "OR" divider) is skipped entirely rather
// than rendering an empty divider.
const SHOW_OAUTH_SECTION = GOOGLE_SIGNIN_ENABLED || APPLE_SIGNIN_ENABLED;

export default function SignUpScreen() {
  const { userId, signUpWithPassword, linkOAuth, signOut, showAuthNotice } =
    useSession();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(
    null,
  );

  const passwordTooShort =
    password.length > 0 && password.length < MIN_PASSWORD_LENGTH;
  const disabled =
    !name.trim() || !email.trim() || password.length < MIN_PASSWORD_LENGTH;

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

  const handleSubmit = async () => {
    if (disabled || submitting) return;
    setSubmitting(true);
    try {
      // Stashed before the call — SessionContext's pending-name effect
      // applies it (and shows "Account created") once the session goes
      // permanent, which with "Confirm email" off happens immediately
      // here, same mechanism the magic-link flow already used.
      stashPendingProfileName(name.trim());
      await signUpWithPassword(email.trim(), password);
      navigate("/");
    } catch (err) {
      console.error(err);
      clearPendingProfileName();
      if (isEmailAlreadyRegisteredError(err)) {
        showAuthNotice(
          "That email already has an account — sign in instead.",
        );
        navigate("/sign-in", { state: { prefillEmail: email.trim() } });
        return;
      }
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Couldn't create your account — try again.";
      showToast(message);
    } finally {
      setSubmitting(false);
    }
  };

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

      <PasswordField
        label="PASSWORD"
        value={password}
        onChange={setPassword}
        placeholder="At least 8 characters"
        autoComplete="new-password"
        hint={`At least ${MIN_PASSWORD_LENGTH} characters`}
        invalid={passwordTooShort}
      />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={disabled || submitting}
        className="rounded-[12px] border-none bg-signal p-[15px] font-sans text-sm font-bold text-signal-on disabled:cursor-not-allowed disabled:opacity-45"
      >
        {submitting ? "CREATING ACCOUNT…" : "CREATE ACCOUNT"}
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

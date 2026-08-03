import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CloseButton, ModalShell } from "../components/ModalShell";
import { OtpStep } from "../components/OtpStep";
import { useSession } from "../state/SessionContext";
import { useToast } from "../state/ToastContext";

export default function SignUpScreen() {
  const navigate = useNavigate();
  const { requestOtp, verifyOtp } = useSession();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [step, setStep] = useState<"details" | "otp">("details");
  const [requesting, setRequesting] = useState(false);

  const disabled = !name.trim() || !contact.trim();

  const handleSubmit = async () => {
    if (disabled || requesting) return;
    setRequesting(true);
    try {
      await requestOtp(contact.trim());
      setStep("otp");
    } catch (err) {
      console.error(err);
      showToast("Couldn't send a code — check the address and try again.");
    } finally {
      setRequesting(false);
    }
  };

  const handleVerify = async (code: string) => {
    await verifyOtp(contact.trim(), code, name.trim());
    navigate("/");
    showToast("Account created");
  };

  const handleResend = () => requestOtp(contact.trim());

  if (step === "otp") {
    return (
      <ModalShell>
        <OtpStep
          contact={contact.trim()}
          onBack={() => setStep("details")}
          onVerify={handleVerify}
          onResend={handleResend}
        />
      </ModalShell>
    );
  }

  return (
    <ModalShell>
      <CloseButton className="self-start" />

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
          EMAIL OR PHONE
        </span>
        <input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
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
        {requesting ? "SENDING CODE…" : "CREATE ACCOUNT"}
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

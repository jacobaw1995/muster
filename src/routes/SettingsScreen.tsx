import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { CloseButton, ModalShell } from "../components/ModalShell";
import { PhotoSlot } from "../components/PhotoSlot";
import { Switch } from "../components/Switch";
import { CalendarIcon } from "../components/icons";
import { uploadAvatar } from "../lib/api/storage";
import { useSession } from "../state/SessionContext";
import { useTheme } from "../theme/ThemeContext";
import { useToast } from "../state/ToastContext";

const sectionLabelClass =
  "font-mono text-[10.5px] font-semibold tracking-[0.06em] text-ink-dim";

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const {
    auth,
    userId,
    loading,
    eventReminders,
    newEventsNearby,
    setEventReminders,
    setNewEventsNearby,
    updateProfile,
    signOut,
  } = useSession();
  const { showToast } = useToast();
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Tracks whether this mount ever saw a signed-in user, so a LOG OUT click
  // (which flips auth.signedIn false while this component is still briefly
  // mounted, racing its own `navigate("/")` below) doesn't get intercepted
  // by this guard and redirected to Sign In instead. Only a *direct* arrival
  // while already signed out — this never becomes true — should redirect.
  // (Adjusting state during render, not an effect, per React's own pattern
  // for derived state: https://react.dev/learn/you-might-not-need-an-effect)
  const [wasSignedIn, setWasSignedIn] = useState(auth.signedIn);
  if (auth.signedIn && !wasSignedIn) {
    setWasSignedIn(true);
  }

  // `auth.signedIn` briefly reads false on a fresh load/reload (SessionContext's
  // Supabase session bootstrap is async) — wait for it to resolve before
  // deciding whether to bounce, or a genuinely-permanent user reloading
  // straight into Settings gets redirected to Sign In by mistake.
  if (loading) {
    return null;
  }

  if (!auth.signedIn && !wasSignedIn) {
    // Settings has nothing to show a guest — bounce to Sign In instead of an empty profile.
    return <Navigate to="/sign-in" replace />;
  }

  const handleLogOut = async () => {
    await signOut();
    navigate("/");
    showToast("Signed out");
  };

  const handleSelectAvatar = async (file: File) => {
    if (!userId) return;
    setAvatarUploading(true);
    try {
      const url = await uploadAvatar(file, userId);
      await updateProfile({ avatarUrl: url });
    } catch (err) {
      console.error(err);
      showToast("Couldn't upload photo — try again");
    } finally {
      setAvatarUploading(false);
    }
  };

  // TODO(Phase 3 follow-up): wire real Google Calendar OAuth (separate consent scope from sign-in) — this just confirms via toast.
  const handleConnectGCal = () => {
    showToast("Google Calendar connected");
  };

  return (
    <ModalShell>
      <div className="flex flex-none items-center justify-between">
        <CloseButton />
        <h1 className="font-display text-[22px] text-ink">SETTINGS</h1>
        <span className="h-8 w-8 flex-none" aria-hidden />
      </div>

      <div className="flex items-center gap-3.5 rounded-card border border-line bg-card p-3.5">
        <PhotoSlot
          photoUrl={auth.avatarUrl}
          label="Add photo"
          className="h-[52px] w-[52px] flex-none rounded-full"
          onSelectFile={handleSelectAvatar}
          uploading={avatarUploading}
        />
        <div className="min-w-0">
          <div className="truncate font-sans text-[15px] font-bold text-ink">
            {auth.name}
          </div>
          <div className="truncate font-mono text-[11.5px] font-medium text-ink-dim">
            {auth.contact}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className={sectionLabelClass}>NOTIFICATIONS</div>
        <div
          onClick={() => setEventReminders(!eventReminders)}
          className="flex cursor-pointer items-center justify-between rounded-card border border-line bg-card p-[13px]"
        >
          <span className="font-sans text-[13px] font-bold text-ink">
            Event reminders
          </span>
          <Switch
            checked={eventReminders}
            onCheckedChange={() => setEventReminders(!eventReminders)}
            ariaLabel="Event reminders"
          />
        </div>
        <div
          onClick={() => setNewEventsNearby(!newEventsNearby)}
          className="flex cursor-pointer items-center justify-between rounded-card border border-line bg-card p-[13px]"
        >
          <span className="font-sans text-[13px] font-bold text-ink">
            New events near me
          </span>
          <Switch
            checked={newEventsNearby}
            onCheckedChange={() => setNewEventsNearby(!newEventsNearby)}
            ariaLabel="New events near me"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className={sectionLabelClass}>APPEARANCE</div>
        <div className="flex rounded-button border border-line bg-card p-1">
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`flex-1 rounded-[9px] border-none p-2.5 font-sans text-xs font-bold ${
              theme === "dark" ? "bg-accent text-accent-on" : "text-ink-dim"
            }`}
          >
            DARK
          </button>
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`flex-1 rounded-[9px] border-none p-2.5 font-sans text-xs font-bold ${
              theme === "light" ? "bg-accent text-accent-on" : "text-ink-dim"
            }`}
          >
            LIGHT
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className={sectionLabelClass}>ACCOUNT</div>
        <button
          type="button"
          onClick={handleConnectGCal}
          className="flex items-center justify-center gap-2 rounded-input border border-line bg-card p-[13px] font-sans text-[12.5px] font-bold text-ink"
        >
          <CalendarIcon className="text-ink" />
          Connect Google Calendar
        </button>
        <button
          type="button"
          onClick={handleLogOut}
          className="rounded-input border border-line bg-transparent p-[13px] font-sans text-[12.5px] font-bold text-ink-dim"
        >
          LOG OUT
        </button>
      </div>
    </ModalShell>
  );
}

import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { CloseButton, ModalShell } from "../components/ModalShell";
import { PhotoSlot } from "../components/PhotoSlot";
import { Switch } from "../components/Switch";
import { CalendarIcon } from "../components/icons";
import { eventDateRange } from "../lib/calendar";
import { fmtDateLabel } from "../lib/format";
import { uploadAvatar } from "../lib/api/storage";
import { useSession } from "../state/SessionContext";
import { useTheme } from "../theme/ThemeContext";
import { useToast } from "../state/ToastContext";

const sectionLabelClass =
  "font-mono text-[10.5px] font-semibold tracking-[0.06em] text-ink-dim";

// TODO(GCal): flip once real Google Calendar OAuth (a separate consent scope
// from sign-in) is wired up — the button below just toasts today.
const GCAL_ENABLED = false;

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const {
    auth,
    userId,
    loading,
    events,
    eventReminders,
    newEventsNearby,
    setEventReminders,
    setNewEventsNearby,
    updateProfile,
    deleteEvent,
    signOut,
  } = useSession();
  const { showToast } = useToast();
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [nameDraft, setNameDraft] = useState(auth.name ?? "");
  const [savingName, setSavingName] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deletingEvent, setDeletingEvent] = useState(false);

  // Keeps the draft in sync if the real name changes from elsewhere (e.g.
  // Sign Up's stashed name landing right after this mounts), unless the
  // field is actively being edited/saved. Adjusting state during render,
  // not an effect — same pattern as `wasSignedIn` below.
  const [lastSyncedName, setLastSyncedName] = useState(auth.name ?? "");
  if ((auth.name ?? "") !== lastSyncedName && !savingName) {
    setLastSyncedName(auth.name ?? "");
    setNameDraft(auth.name ?? "");
  }

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

  const yourEvents = events
    .filter((ev) => ev.createdBy === userId)
    .slice()
    .sort(
      (a, b) =>
        eventDateRange(a).start.getTime() - eventDateRange(b).start.getTime(),
    );

  const handleDeleteEvent = async () => {
    if (!deleteTargetId || deletingEvent) return;
    setDeletingEvent(true);
    try {
      await deleteEvent(deleteTargetId);
      showToast("Event deleted");
      setDeleteTargetId(null);
    } catch (err) {
      console.error(err);
      showToast("Couldn't delete this event — try again");
    } finally {
      setDeletingEvent(false);
    }
  };

  const handleConnectGCal = () => {
    showToast("Google Calendar connected");
  };

  const handleSaveName = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === (auth.name ?? "") || savingName) return;
    setSavingName(true);
    try {
      await updateProfile({ name: trimmed });
      showToast("Name updated");
    } catch (err) {
      console.error(err);
      showToast("Couldn't update your name — try again");
    } finally {
      setSavingName(false);
    }
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
            {auth.name ?? "Member"}
          </div>
          <div className="truncate font-mono text-[11.5px] font-medium text-ink-dim">
            {auth.contact}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className={sectionLabelClass}>DISPLAY NAME</div>
        <div className="flex gap-2">
          <input
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            placeholder="Alex Rivera"
            className="flex-1 rounded-input border border-line bg-card p-[13px] font-sans text-[13px] font-semibold text-ink outline-none"
          />
          <button
            type="button"
            onClick={handleSaveName}
            disabled={
              !nameDraft.trim() ||
              nameDraft.trim() === (auth.name ?? "") ||
              savingName
            }
            className="flex-none rounded-input border-none bg-accent px-4 font-sans text-[12.5px] font-bold text-accent-on disabled:cursor-not-allowed disabled:opacity-45"
          >
            {savingName ? "SAVING…" : "SAVE"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className={sectionLabelClass}>YOUR EVENTS</div>
        {yourEvents.length === 0 ? (
          <div className="rounded-card border border-line bg-card p-[13px] font-sans text-[12.5px] font-medium text-ink-dim">
            You haven't posted any events yet.
          </div>
        ) : (
          yourEvents.map((ev) => (
            <div
              key={ev.id}
              className="flex items-center gap-2 rounded-card border border-line bg-card p-[13px]"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-sans text-[13px] font-bold text-ink">
                  {ev.title}
                </div>
                <div className="font-mono text-[10.5px] font-semibold text-ink-dim">
                  {fmtDateLabel(ev.date)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/events/${ev.id}/edit`)}
                className="flex-none rounded-[8px] border border-line bg-card-alt px-2.5 py-1.5 font-sans text-[10.5px] font-bold text-ink"
              >
                EDIT
              </button>
              <button
                type="button"
                onClick={() => setDeleteTargetId(ev.id)}
                className="flex-none rounded-[8px] border border-danger bg-transparent px-2.5 py-1.5 font-sans text-[10.5px] font-bold text-danger"
              >
                DELETE
              </button>
            </div>
          ))
        )}
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
        {GCAL_ENABLED && (
          <button
            type="button"
            onClick={handleConnectGCal}
            className="flex items-center justify-center gap-2 rounded-input border border-line bg-card p-[13px] font-sans text-[12.5px] font-bold text-ink"
          >
            <CalendarIcon className="text-ink" />
            Connect Google Calendar
          </button>
        )}
        <button
          type="button"
          onClick={handleLogOut}
          className="rounded-input border border-line bg-transparent p-[13px] font-sans text-[12.5px] font-bold text-ink-dim"
        >
          LOG OUT
        </button>
      </div>

      <ConfirmDialog
        open={deleteTargetId != null}
        title="Delete this event?"
        message="This can't be undone. Its RSVPs, itinerary entries, and impact logs go with it."
        confirmLabel="DELETE"
        busy={deletingEvent}
        onConfirm={handleDeleteEvent}
        onCancel={() => setDeleteTargetId(null)}
      />
    </ModalShell>
  );
}

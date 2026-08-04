import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ModalLayout } from "./components/ModalLayout";
import CreateScreen from "./routes/CreateScreen";
import EventDetailScreen from "./routes/EventDetailScreen";
import ImpactScreen from "./routes/ImpactScreen";
import ItineraryScreen from "./routes/ItineraryScreen";
import MapScreen from "./routes/MapScreen";
import SettingsScreen from "./routes/SettingsScreen";
import SignInScreen from "./routes/SignInScreen";
import SignUpScreen from "./routes/SignUpScreen";
import { useSession } from "./state/SessionContext";

/**
 * Lands the user on /sign-in as soon as an OAuth same-email collision sets
 * authNotice (see SessionContext bootstrap) — the redirect back from Google
 * always returns to "/", not "/sign-in", so without this the banner would
 * have nowhere to render. Needs router context, so it lives inside
 * BrowserRouter rather than in SessionContext (which sits above it).
 *
 * Deliberately checks `window.location.pathname` (the real, synchronously-
 * updated browser location) rather than React Router's `useLocation()` —
 * SignUpScreen's own email-collision handler also sets authNotice AND
 * navigate()s to /sign-in itself (with a prefilled-email state payload) in
 * the same synchronous handler. `useLocation()`'s value can still read the
 * pre-navigation path for this effect's render, so checking it here would
 * fire a second, state-less navigate("/sign-in") that clobbers the first
 * one's state — window.location.pathname reflects the pushState immediately
 * and avoids that race entirely.
 */
function AuthNoticeRedirect() {
  const { authNotice } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (authNotice && window.location.pathname !== "/sign-in") {
      navigate("/sign-in");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authNotice]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthNoticeRedirect />
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<MapScreen />} />
          <Route path="/create" element={<CreateScreen />} />
          <Route path="/impact" element={<ImpactScreen />} />
          <Route path="/itinerary" element={<ItineraryScreen />} />
          <Route path="/events/:id" element={<EventDetailScreen />} />
          <Route path="/events/:id/edit" element={<CreateScreen />} />
        </Route>
        <Route element={<ModalLayout />}>
          <Route path="/sign-in" element={<SignInScreen />} />
          <Route path="/sign-up" element={<SignUpScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

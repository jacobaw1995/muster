import { BrowserRouter, Route, Routes } from "react-router-dom";
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

export default function App() {
  return (
    <BrowserRouter>
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

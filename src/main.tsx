import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";
import { SessionProvider } from "./state/SessionContext.tsx";
import { ToastProvider } from "./state/ToastContext.tsx";
import { ThemeProvider } from "./theme/ThemeContext.tsx";

// vite.config.ts's default `injectRegister` auto-detects this import and
// stops injecting its own plain registerSW.js (which only ever called
// `.register()`, with no update-checking at all) in favor of this. With
// registerType: "autoUpdate", this wires up workbox-window's own
// `activated` listener, which — unlike the plain injected script — reloads
// the page once a new service worker actually takes over. Without it, a
// tab left open across a deploy keeps running the JS it started with
// indefinitely: the new SW installs and activates in the background, but
// nothing ever tells the open tab to pick it up, so users can be stuck on
// stale, possibly-buggy code for as long as the tab stays open.
registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <SessionProvider>
          <App />
        </SessionProvider>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
);

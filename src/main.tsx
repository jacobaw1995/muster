import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { SessionProvider } from "./state/SessionContext.tsx";
import { ToastProvider } from "./state/ToastContext.tsx";
import { ThemeProvider } from "./theme/ThemeContext.tsx";

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

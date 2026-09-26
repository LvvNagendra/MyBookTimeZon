import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ThemeProvider } from "./theme/ThemeContext";
import "./styles/global.css";
import "./styles/admin-console.css";

/** Must match Vite `base` (e.g. `/MyBookTimeZon/` on GitHub Pages). */
const routerBasename = (import.meta.env.BASE_URL || "/").replace(/\/$/, "") || undefined;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename={routerBasename}>
      <ErrorBoundary>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>,
);

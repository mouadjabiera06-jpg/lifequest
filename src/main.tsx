import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { flushSave } from "./state/store";
import { initSync } from "./state/sync";
import { App } from "./ui/App";
import "./ui/styles/app.css";

const root = document.getElementById("root");
if (!root) throw new Error("Élément #root introuvable");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Ne rien perdre si l'app est fermée juste après une action.
document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && flushSave());
window.addEventListener("pagehide", flushSave);

void initSync();

// Hors ligne + mise à jour automatique en arrière-plan.
registerSW({ immediate: true });

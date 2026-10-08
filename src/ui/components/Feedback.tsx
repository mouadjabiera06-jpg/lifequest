import { useEffect, useRef } from "react";
import { dismissOverlay, useApp } from "../../state/store";

export function Toasts() {
  const toasts = useApp((s) => s.toasts);
  return (
    <div id="toasts" aria-live="polite" role="status">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          {t.text}
        </div>
      ))}
    </div>
  );
}

function confetti(): void {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const colors = ["#8B5CF6", "#FBBF24", "#F472B6", "#34D399", "#60A5FA"];
  for (let i = 0; i < 60; i++) {
    const c = document.createElement("i");
    c.className = "confetti";
    c.style.left = `${Math.random() * 100}vw`;
    c.style.background = colors[i % colors.length] as string;
    c.style.animationDuration = `${1.6 + Math.random() * 1.6}s`;
    c.style.animationDelay = `${Math.random() * 0.4}s`;
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 3800);
  }
}

/** Affiche les grands moments (niveau, boss vaincu, dégâts du matin) un par un. */
export function Overlays() {
  const overlay = useApp((s) => s.overlays[0]);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!overlay) return;
    button.current?.focus();
    if (overlay.celebrate) confetti();
  }, [overlay]);

  if (!overlay) return null;
  return (
    <div className="overlay" role="alertdialog" aria-modal="true" aria-labelledby="ov-title" aria-describedby="ov-body">
      <div className="box">
        <div className="big" aria-hidden="true">
          {overlay.icon}
        </div>
        <h1 id="ov-title">{overlay.title}</h1>
        <p id="ov-body">{overlay.body}</p>
        <button ref={button} className="btn primary" type="button" onClick={() => dismissOverlay(overlay.id)}>
          {overlay.cta}
        </button>
      </div>
    </div>
  );
}

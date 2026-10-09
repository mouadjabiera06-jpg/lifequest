// Panneau modal du bas de l'écran (formulaires, confirmations).
import { useEffect, useRef, type ReactNode } from "react";
import { create } from "zustand";

interface SheetState {
  content: ReactNode | null;
}

const useSheet = create<SheetState>(() => ({ content: null }));

export function openSheet(content: ReactNode): void {
  useSheet.setState({ content });
}

export function closeSheet(): void {
  useSheet.setState({ content: null });
}

export function SheetHost() {
  const content = useSheet((s) => s.content);
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    if (!content) return;
    opener.current = document.activeElement;
    // Sur ordinateur, le premier champ prend le focus ; sur mobile on évite d'ouvrir le clavier d'office.
    const first = panel.current?.querySelector<HTMLElement>("input[type=text], input[type=email], textarea, button");
    if (first && !("ontouchstart" in window)) first.focus();
    else panel.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSheet();
      if (e.key !== "Tab" || !panel.current) return;
      // Garde le focus clavier dans le panneau tant qu'il est ouvert.
      const items = panel.current.querySelectorAll<HTMLElement>("button, input, textarea, select, [href]");
      const list = Array.from(items).filter((el) => !el.hasAttribute("disabled"));
      if (!list.length) return;
      const firstEl = list[0] as HTMLElement;
      const lastEl = list[list.length - 1] as HTMLElement;
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (opener.current instanceof HTMLElement) opener.current.focus();
    };
  }, [content]);

  if (!content) return null;
  return (
    <div className="sheet-bg" onClick={(e) => e.target === e.currentTarget && closeSheet()}>
      <div className="sheet" role="dialog" aria-modal="true" ref={panel} tabIndex={-1}>
        {content}
      </div>
    </div>
  );
}

export function Confirm({ title, body, confirmLabel, onConfirm }: { title: string; body: string; confirmLabel: string; onConfirm: () => void }) {
  return (
    <>
      <h3>{title}</h3>
      <p className="note">{body}</p>
      <div className="row">
        <button className="btn" type="button" onClick={closeSheet}>
          Annuler
        </button>
        <button
          className="btn danger"
          type="button"
          onClick={() => {
            closeSheet();
            onConfirm();
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </>
  );
}

export function askConfirm(props: Parameters<typeof Confirm>[0]): void {
  openSheet(<Confirm {...props} />);
}

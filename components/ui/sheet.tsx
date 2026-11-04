"use client";

import { useEffect, useRef } from "react";
import { CloseIcon } from "@/components/icons";

// Native <dialog> gives focus trapping, Esc and the backdrop for free. Children only
// mount while open, so a re-opened sheet always starts from fresh state.
export function Sheet({
  open,
  onClose,
  title,
  closeLabel,
  footer,
  dismissable = true,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel: string;
  footer?: React.ReactNode;
  /** false for long forms, where a stray tap on the backdrop would lose typing. */
  dismissable?: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="sheet print:hidden"
      onClose={onClose}
      onCancel={(e) => {
        if (!dismissable) e.preventDefault();
      }}
      onClick={(e) => {
        if (dismissable && e.target === ref.current) onClose();
      }}
    >
      {open && (
        <>
          <div className="flex items-center justify-between gap-3 border-b border-border py-3 pr-2 pl-5">
            <h2 className="font-display text-lg font-semibold">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-sunken hover:text-foreground"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">{children}</div>
          {footer && (
            <div className="border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {footer}
            </div>
          )}
        </>
      )}
    </dialog>
  );
}

"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { WarningIcon } from "@/components/icons";

type ToastItem = { id: number; message: string; leaving: boolean };

const VISIBLE_MS = 5000;
const EXIT_MS = 180;
const MAX_TOASTS = 3;
const NONE: ToastItem[] = [];

let items = NONE;
let nextId = 1;
const listeners = new Set<() => void>();

function publish(next: ToastItem[]) {
  items = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function dismiss(id: number) {
  publish(items.map((item) => (item.id === id ? { ...item, leaving: true } : item)));
  setTimeout(() => publish(items.filter((item) => item.id !== id)), EXIT_MS);
}

export function showErrorToast(message: string) {
  if (items.some((item) => item.message === message && !item.leaving)) return;
  const id = nextId++;
  publish([...items, { id, message, leaving: false }].slice(-MAX_TOASTS));
  setTimeout(() => dismiss(id), VISIBLE_MS);
}

// A popover, because only the top layer can sit above an open <dialog> sheet.
export function Toaster() {
  const toasts = useSyncExternalStore(subscribe, () => items, () => NONE);
  const ref = useRef<HTMLDivElement>(null);
  const count = toasts.length;

  useEffect(() => {
    const toaster = ref.current;
    if (!toaster) return;
    // Re-showing moves it above any sheet opened since.
    if (toaster.matches(":popover-open")) toaster.hidePopover();
    if (count > 0) toaster.showPopover();
  }, [count]);

  return (
    <div ref={ref} popover="manual" className="toaster print:hidden">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          onClick={() => dismiss(toast.id)}
          className={`toast flex cursor-pointer items-start gap-2.5 rounded-xl bg-ink px-4 py-3 text-sm font-medium text-ink-foreground shadow-lg ${
            toast.leaving ? "toast-leaving" : ""
          }`}
        >
          <WarningIcon className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}

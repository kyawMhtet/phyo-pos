"use client";

import { useState, useTransition } from "react";
import type { FieldErrors, FormResult } from "@/lib/form";
import { showErrorToast } from "./toast";

// Runs a server action and routes what goes wrong: field errors appear under their
// inputs, which have ids matching the keys; anything else becomes a toast.
export function useSubmit(genericError: string) {
  const [pending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function showFieldErrors(errors: FieldErrors) {
    setFieldErrors(errors);
    const first = Object.keys(errors)[0];
    if (first) document.getElementById(first)?.focus();
  }

  function clearError(key: string) {
    setFieldErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function submit<T extends FormResult>(
    action: () => Promise<T | void>,
    onSuccess?: (result: T) => void
  ) {
    setFieldErrors({});
    startTransition(async () => {
      try {
        const result = await action();
        if (result?.fieldErrors) showFieldErrors(result.fieldErrors);
        else if (result?.error) showErrorToast(result.error);
        else onSuccess?.(result as T);
      } catch {
        showErrorToast(genericError);
      }
    });
  }

  return { pending, fieldErrors, submit, clearError, showFieldErrors };
}

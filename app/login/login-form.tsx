"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocaleToggle } from "@/components/locale-toggle";
import type { Dictionary, Locale } from "@/lib/i18n";

const initialState: LoginState = {};

export function LoginForm({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="flex justify-center">
          <LocaleToggle locale={locale} />
        </div>
        <form
          action={formAction}
          className="space-y-4 rounded-lg border border-dashed border-border bg-surface p-6 shadow-[3px_3px_0_0_var(--color-border)]"
        >
          <div className="space-y-1 text-center">
            <h1 className="font-display text-2xl text-accent">{dict.common.appName}</h1>
            <p className="text-sm text-muted">{dict.login.subtitle}</p>
          </div>
          <Input
            type="password"
            name="password"
            autoFocus
            required
            placeholder={dict.login.passwordPlaceholder}
          />
          {state?.error && (
            <p className="text-sm text-red-600">{dict.login.wrongPassword}</p>
          )}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? dict.login.submitting : dict.login.submit}
          </Button>
        </form>
      </div>
    </div>
  );
}

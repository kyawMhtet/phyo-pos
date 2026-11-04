"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { LocaleToggle } from "@/components/locale-toggle";
import type { Dictionary, Locale } from "@/lib/i18n";

const initialState: LoginState = {};

export function LoginForm({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-full.png"
            alt={dict.common.appName}
            className="h-32 w-auto dark:brightness-0 dark:invert"
          />
          <p className="font-display text-sm font-semibold tracking-wide text-accent">
            {dict.common.tagline}
          </p>
        </div>
        <form
          action={formAction}
          className="space-y-4 rounded-2xl border border-border bg-surface p-6"
        >
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-muted">
              {dict.login.subtitle}
            </label>
            <PasswordInput
              id="password"
              name="password"
              autoFocus
              aria-invalid={state?.error ? true : undefined}
              placeholder={dict.login.passwordPlaceholder}
              showLabel={dict.login.showPassword}
              hideLabel={dict.login.hidePassword}
            />
            <FieldError message={state?.error} />
          </div>
          <Button type="submit" size="lg" disabled={pending} className="w-full">
            {pending ? dict.login.submitting : dict.login.submit}
          </Button>
        </form>
        <div className="flex justify-center text-muted">
          <LocaleToggle locale={locale} />
        </div>
      </div>
    </div>
  );
}

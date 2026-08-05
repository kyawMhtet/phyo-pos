"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
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
          className="space-y-4 rounded-xl border border-border bg-surface p-6 shadow-md"
        >
          <div className="space-y-2 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt={dict.common.appName}
              className="mx-auto h-25 w-auto"
            />
            <p className="text-sm text-muted">{dict.login.subtitle}</p>
          </div>
          <PasswordInput
            name="password"
            autoFocus
            required
            placeholder={dict.login.passwordPlaceholder}
            showLabel={dict.login.showPassword}
            hideLabel={dict.login.hidePassword}
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

"use client";

import { useState } from "react";
import Link from "next/link";
import { HelpIcon } from "@/components/icons";
import { buttonClass } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";

export function HelpSheet({
  title,
  buttonLabel,
  allGuidesLabel,
  closeLabel,
  children,
}: {
  title: string;
  buttonLabel: string;
  allGuidesLabel: string;
  closeLabel: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label={buttonLabel}
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-border bg-surface text-sm font-semibold text-muted transition-colors hover:text-foreground sm:px-3"
      >
        <HelpIcon className="h-5 w-5" />
        <span className="hidden sm:inline">{buttonLabel}</span>
      </button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        closeLabel={closeLabel}
        footer={
          <Link href="/help" className={`${buttonClass({ variant: "secondary" })} w-full`}>
            {allGuidesLabel}
          </Link>
        }
      >
        {children}
      </Sheet>
    </>
  );
}

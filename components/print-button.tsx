"use client";

import { Button } from "./ui/button";

export function PrintButton({ label }: { label: string }) {
  return (
    <Button
      type="button"
      variant="secondary"
      onClick={() => window.print()}
      className="print:hidden"
    >
      {label}
    </Button>
  );
}

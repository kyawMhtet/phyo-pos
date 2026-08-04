"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "./input";

export function SearchBox({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQ = searchParams.get("q") ?? "";

  const [value, setValue] = useState(currentQ);
  const [syncedQ, setSyncedQ] = useState(currentQ);
  if (currentQ !== syncedQ) {
    setSyncedQ(currentQ);
    setValue(currentQ);
  }

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function handleChange(next: string) {
    setValue(next);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (next) {
        params.set("q", next);
      } else {
        params.delete("q");
      }
      params.delete("page");
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    }, 300);
  }

  return (
    <Input
      type="search"
      value={value}
      onChange={(e) => handleChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

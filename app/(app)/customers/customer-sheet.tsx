"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { PlusIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { useSubmit } from "@/components/ui/use-submit";
import { saveCustomer } from "./actions";

type Customer = { id: number; name: string; phone: string | null; address: string | null };

export function CustomerButton({ customer, dict }: { customer?: Customer; dict: Dictionary }) {
  const [open, setOpen] = useState(false);
  const title = customer ? dict.customers.editCustomer : dict.customers.addCustomer;

  return (
    <>
      <Button variant={customer ? "secondary" : "primary"} onClick={() => setOpen(true)}>
        {!customer && <PlusIcon className="h-4 w-4" />}
        {customer ? dict.common.edit : dict.customers.addCustomer}
      </Button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        closeLabel={dict.common.close}
        dismissable={false}
      >
        <CustomerForm customer={customer} dict={dict} onDone={() => setOpen(false)} />
      </Sheet>
    </>
  );
}

function CustomerForm({
  customer,
  dict,
  onDone,
}: {
  customer?: Customer;
  dict: Dictionary;
  onDone: () => void;
}) {
  const [name, setName] = useState(customer?.name ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [address, setAddress] = useState(customer?.address ?? "");
  const { pending, fieldErrors, submit, clearError } = useSubmit(dict.common.errorGeneric);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">{dict.customers.name}</Label>
        <Input
          id="name"
          value={name}
          error={fieldErrors.name}
          onChange={(e) => {
            setName(e.target.value);
            clearError("name");
          }}
        />
      </div>
      <div>
        <Label htmlFor="phone">{dict.customers.phone}</Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          error={fieldErrors.phone}
          onChange={(e) => {
            setPhone(e.target.value);
            clearError("phone");
          }}
        />
      </div>
      <div>
        <Label htmlFor="address">{dict.customers.address}</Label>
        <Textarea
          id="address"
          rows={3}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>
      <Button
        size="lg"
        className="w-full"
        disabled={pending}
        onClick={() =>
          submit(() => saveCustomer(customer?.id ?? null, { name, phone, address }), onDone)
        }
      >
        {pending ? dict.orders.saving : dict.common.save}
      </Button>
    </div>
  );
}

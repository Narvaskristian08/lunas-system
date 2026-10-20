"use client";

import { useState } from "react";
import { MapPin, Plus, ShieldCheck, UserRound } from "lucide-react";
import { createTanodAction } from "@/app/actions/authorized-accounts";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";

const inputClass = "mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-slate-50/60 px-3 py-2.5 text-sm font-normal text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:bg-white focus:ring-3 focus:ring-sky-200/60";
const labelClass = "block min-w-0 text-sm font-medium text-slate-700";

type Tanod = { id: string; firstName?: string; middleName?: string; lastName?: string; email?: string; phone?: string; accountStatus?: string; isActive?: boolean; createdAt?: string };

export function TanodAccountManager({ tanods, barangay, message, error }: { tanods: Tanod[]; barangay?: string; message?: string; error?: string }) {
  const [open, setOpen] = useState(false);
  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-brand-700">Barangay Official</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-950">Tanod Accounts</h1>
        <p className="mt-2 text-slate-600">Utility Personnel assigned to {barangay}.</p>
      </div>
      <Button onClick={() => setOpen(true)}><Plus className="size-4" aria-hidden="true" />Create Tanod Account</Button>
    </div>
    {message ? <p role={error ? "alert" : "status"} className={`rounded-xl border p-4 text-sm ${error ? "border-red-200 bg-red-50 text-red-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>{message}</p> : null}
    <Card>
      <CardHeader title={`${tanods.length} Tanod account${tanods.length === 1 ? "" : "s"}`} description="Only accounts assigned to your barangay are shown." />
      {tanods.length ? <div className="divide-y divide-slate-200">
        {tanods.map((tanod) => <div key={tanod.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="font-semibold text-slate-950">{[tanod.firstName, tanod.middleName, tanod.lastName].filter(Boolean).join(" ")}</p>
            <p className="text-sm text-slate-600">{tanod.email || "No email"} · {tanod.phone || "No phone"}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tanod.accountStatus === "active" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{tanod.accountStatus === "active" ? "Active" : "Pending activation"}</span>
        </div>)}
      </div> : <p className="p-5 text-sm text-slate-600">No Tanod accounts have been created for this barangay.</p>}
    </Card>

    {open ? <Modal open={open} title="Create Barangay Tanod" size="compact" onClose={() => setOpen(false)}>
      <form action={createTanodAction} className="space-y-6">
        <div className="flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50 p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-700 shadow-sm">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-brand-700">Assigned barangay</p>
            <p className="mt-0.5 flex items-center gap-1.5 font-semibold text-slate-950"><MapPin className="size-4 shrink-0 text-brand-600" aria-hidden="true" />{barangay}</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">This account will have access to its assigned barangay.</p>
          </div>
        </div>

        <fieldset className="min-w-0">
          <legend className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-950"><UserRound className="size-4 text-brand-700" aria-hidden="true" />Personal details</legend>
          <p className="mb-4 text-xs leading-5 text-slate-500">Enter the Tanod’s name. Fields marked <span className="text-red-600">*</span> are required.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>First name <span className="text-red-600" aria-hidden="true">*</span>
              <input name="firstName" autoComplete="given-name" required maxLength={80} placeholder="e.g. Juan" className={inputClass} />
            </label>
            <label className={labelClass}>Last name <span className="text-red-600" aria-hidden="true">*</span>
              <input name="lastName" autoComplete="family-name" required maxLength={80} placeholder="e.g. Dela Cruz" className={inputClass} />
            </label>
            <label className={labelClass}><span className="flex flex-wrap items-center justify-between gap-x-2">Middle name <span className="text-xs font-normal text-slate-500">Optional</span></span>
              <input name="middleName" autoComplete="additional-name" maxLength={80} placeholder="e.g. Santos" className={inputClass} />
            </label>
            <label className={labelClass}><span className="flex flex-wrap items-center justify-between gap-x-2">Suffix <span className="text-xs font-normal text-slate-500">Optional</span></span>
              <input name="suffix" autoComplete="honorific-suffix" maxLength={20} placeholder="e.g. Jr. or III" className={inputClass} />
            </label>
          </div>
        </fieldset>

        <fieldset className="min-w-0 border-t border-slate-200 pt-5">
          <legend className="px-1 text-sm font-semibold text-slate-950">Contact details</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>Email address <span className="text-red-600" aria-hidden="true">*</span>
              <input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="name@example.com" className={inputClass} aria-describedby="tanod-email-help" />
              <span id="tanod-email-help" className="mt-2 block text-xs font-normal leading-5 text-slate-500">Use an email the Tanod can access.</span>
            </label>
            <label className={labelClass}>Contact number <span className="text-red-600" aria-hidden="true">*</span>
              <input name="phone" type="tel" autoComplete="tel" inputMode="tel" required pattern="^(\+639|09)\d{9}$" placeholder="09XXXXXXXXX" className={inputClass} aria-describedby="tanod-phone-help" />
              <span id="tanod-phone-help" className="mt-2 block text-xs font-normal leading-5 text-slate-500">Format: 09XXXXXXXXX or +639XXXXXXXXX.</span>
            </label>
          </div>
        </fieldset>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit"><Plus className="size-4" aria-hidden="true" />Create Tanod Account</Button>
        </div>
      </form>
    </Modal> : null}
  </div>;
}

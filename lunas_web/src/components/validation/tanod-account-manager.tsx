"use client";

import { Mail, MapPin, Phone, Plus, ShieldCheck, UserRound } from "lucide-react";
import { createTanodAction } from "@/app/actions/authorized-accounts";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";

const inputClass = "mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-slate-50/60 px-3 py-2.5 text-sm font-normal text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:bg-white focus:ring-3 focus:ring-sky-200/60";
const labelClass = "block min-w-0 text-sm font-medium text-slate-700";

type Tanod = { id: string; firstName?: string; middleName?: string; lastName?: string; email?: string; phone?: string; accountStatus?: string; isActive?: boolean; createdAt?: string };

export function TanodAccountManager({ tanods, barangay, message, error }: { tanods: Tanod[]; barangay?: string; message?: string; error?: string }) {
  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-brand-700">Infrastructure Committee</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-950">Committee Staff Accounts</h1>
        <p className="mt-2 text-slate-600">Utility Personnel assigned to {barangay}.</p>
      </div>
    </div>
    {message ? <p role={error ? "alert" : "status"} className={`rounded-xl border p-4 text-sm ${error ? "border-red-200 bg-red-50 text-red-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>{message}</p> : null}
    <div className="grid items-start gap-6 xl:grid-cols-2">
    <Card className="min-w-0 overflow-hidden">
      <CardHeader title={`${tanods.length} Committee Staff account${tanods.length === 1 ? "" : "s"}`} description="Personnel assigned to your barangay." />
      {tanods.length ? <div className="divide-y divide-slate-200">
        {tanods.map((tanod) => <div key={tanod.id} className="flex items-start gap-3 p-5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><UserRound className="size-5" aria-hidden="true" /></div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="min-w-0 break-words font-semibold text-slate-950">{[tanod.firstName, tanod.middleName, tanod.lastName].filter(Boolean).join(" ")}</p>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${tanod.accountStatus === "active" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{tanod.accountStatus === "active" ? "Active" : "Pending activation"}</span>
            </div>
            <div className="mt-3 space-y-1.5 text-sm text-slate-600">
              <p className="flex items-start gap-2"><Mail className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden="true" /><span className="min-w-0 break-all">{tanod.email || "No email"}</span></p>
              <p className="flex items-center gap-2"><Phone className="size-4 shrink-0 text-slate-400" aria-hidden="true" />{tanod.phone || "No phone"}</p>
            </div>
          </div>
        </div>)}
      </div> : <div className="p-6 text-center"><UserRound className="mx-auto mb-3 size-8 text-slate-400" aria-hidden="true" /><p className="font-medium text-slate-800">No Committee Staff accounts yet</p><p className="mt-1 text-sm text-slate-500">Add your first Committee Staff member using the account form.</p></div>}
    </Card>

    <Card className="min-w-0 overflow-hidden">
      <CardHeader title="Create Barangay Committee Staff" description="Add personnel assigned to your barangay." />
      <form action={createTanodAction} aria-label="Create Barangay Committee Staff" className="space-y-5 p-5 sm:p-6">
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
          <p className="mb-4 text-xs leading-5 text-slate-500">Enter the Committee Staff member’s name. Fields marked <span className="text-red-600">*</span> are required.</p>
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
              <span id="tanod-email-help" className="mt-2 block text-xs font-normal leading-5 text-slate-500">Use an email the Committee Staff member can access.</span>
            </label>
            <label className={labelClass}>Contact number <span className="text-red-600" aria-hidden="true">*</span>
              <input name="phone" type="tel" autoComplete="tel" inputMode="tel" required pattern="^(\+639|09)\d{9}$" placeholder="09XXXXXXXXX" className={inputClass} aria-describedby="tanod-phone-help" />
              <span id="tanod-phone-help" className="mt-2 block text-xs font-normal leading-5 text-slate-500">Format: 09XXXXXXXXX or +639XXXXXXXXX.</span>
            </label>
          </div>
        </fieldset>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-end">
          <Button type="reset" variant="secondary">Clear form</Button>
          <Button type="submit"><Plus className="size-4" aria-hidden="true" />Create Committee Staff Account</Button>
        </div>
      </form>
    </Card>
    </div>
  </div>;
}

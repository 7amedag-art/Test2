"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function NewManufacturerPage() {
  const router = useRouter();
  const params = useSearchParams();
  const isLocal = (params.get("scope") ?? "local") === "local";
  const [form, setForm] = useState({
    manufacturerName: "",
    country: isLocal ? "Saudi Arabia" : "",
    city: "",
    manufacturerType: isLocal ? "local_manufacturer" : "global_oem",
    localCapabilityLevel: isLocal ? "partial_manufacturing" : "non_manufacturing",
    website: "",
    notes: "",
  });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setBusy(true);
    const res = await fetch("/api/v1/manufacturers", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...form,
        isLocal,
        capabilities: [],
        certifications: [],
      }),
    });
    setBusy(false);
    const body = await res.json();
    if (!res.ok) { setErr(body?.error?.code ?? "error"); return; }
    router.push(`/manufacturers?scope=${isLocal ? "local" : "global"}`);
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-4">
        {isLocal ? "New local manufacturer" : "New global manufacturer"}
      </h1>
      <form onSubmit={onSubmit} className="card p-5 space-y-4">
        <F label="Name"    v={form.manufacturerName} set={(v) => set("manufacturerName", v)} />
        <F label="Country" v={form.country}          set={(v) => set("country", v)} />
        <F label="City"    v={form.city}             set={(v) => set("city", v)} />
        <S label="Type"    v={form.manufacturerType} set={(v) => set("manufacturerType", v)}
           o={["global_oem", "local_manufacturer", "assembler", "distributor", "service_provider"]} />
        <S label="Capability" v={form.localCapabilityLevel} set={(v) => set("localCapabilityLevel", v)}
           o={["full_manufacturing", "partial_manufacturing", "assembly_only", "non_manufacturing"]} />
        <F label="Website" v={form.website}          set={(v) => set("website", v)} />
        <F label="Notes"   v={form.notes}            set={(v) => set("notes", v)} />
        {err && <div className="text-sm text-rose-600">{err}</div>}
        <button className="btn btn-primary" disabled={busy}>{busy ? "…" : "Create"}</button>
      </form>
    </div>
  );
}

function F({ label, v, set }: { label: string; v: string; set: (v: string) => void }) {
  return (
    <label className="block text-sm">
      <span className="text-ink-700">{label}</span>
      <input className="mt-1 w-full rounded-lg border border-surface-100 px-3 py-2 outline-none focus:border-brand-500"
             value={v} onChange={(e) => set(e.target.value)} />
    </label>
  );
}
function S({ label, v, set, o }: { label: string; v: string; set: (v: string) => void; o: string[] }) {
  return (
    <label className="block text-sm">
      <span className="text-ink-700">{label}</span>
      <select className="mt-1 w-full rounded-lg border border-surface-100 px-3 py-2 outline-none focus:border-brand-500"
              value={v} onChange={(e) => set(e.target.value)}>
        {o.map((x) => <option key={x} value={x}>{x}</option>)}
      </select>
    </label>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    productCode: "",
    productNameEn: "",
    productNameAr: "",
    category: "",
    subcategory: "",
    industrySegment: "power",
    criticalityLevel: "medium",
    hsCode: "",
    descriptionEn: "",
    descriptionAr: "",
  });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const res = await fetch("/api/v1/products", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...form,
        useCases: [],
      }),
    });
    setBusy(false);
    const body = await res.json();
    if (!res.ok) { setErr(body?.error?.code ?? "error"); return; }
    router.push(`/products/${body.data.id}`);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-4">New product</h1>
      <form onSubmit={onSubmit} className="card p-5 space-y-4">
        <Field label="Product code" value={form.productCode} onChange={(v) => set("productCode", v)} />
        <Field label="Name (EN)"    value={form.productNameEn} onChange={(v) => set("productNameEn", v)} />
        <Field label="Name (AR)"    value={form.productNameAr} onChange={(v) => set("productNameAr", v)} />
        <Field label="Category"     value={form.category}     onChange={(v) => set("category", v)} />
        <Field label="Subcategory"  value={form.subcategory}  onChange={(v) => set("subcategory", v)} />
        <Select label="Segment" value={form.industrySegment} onChange={(v) => set("industrySegment", v)}
                options={["oil_gas", "power", "renewables", "cross_sector"]} />
        <Select label="Criticality" value={form.criticalityLevel} onChange={(v) => set("criticalityLevel", v)}
                options={["high", "medium", "low"]} />
        <Field label="HS code" value={form.hsCode} onChange={(v) => set("hsCode", v)} />
        <TextArea label="Description (EN)" value={form.descriptionEn} onChange={(v) => set("descriptionEn", v)} />
        <TextArea label="Description (AR)" value={form.descriptionAr} onChange={(v) => set("descriptionAr", v)} />
        {err && <div className="text-sm text-rose-600">{err}</div>}
        <button className="btn btn-primary" disabled={busy}>{busy ? "…" : "Create"}</button>
      </form>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-sm">
      <span className="text-ink-700">{label}</span>
      <input className="mt-1 w-full rounded-lg border border-surface-100 px-3 py-2 outline-none focus:border-brand-500"
             value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-sm">
      <span className="text-ink-700">{label}</span>
      <textarea rows={3} className="mt-1 w-full rounded-lg border border-surface-100 px-3 py-2 outline-none focus:border-brand-500"
                value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <label className="block text-sm">
      <span className="text-ink-700">{label}</span>
      <select className="mt-1 w-full rounded-lg border border-surface-100 px-3 py-2 outline-none focus:border-brand-500"
              value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

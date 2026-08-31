"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { slugify } from "@/lib/format";
import type { Series, Tag } from "@/lib/types";

export function TaxonomyManager({ initialTags, initialSeries }: { initialTags: Tag[]; initialSeries: Series[] }) {
  const [tags, setTags] = useState(initialTags);
  const [series, setSeries] = useState(initialSeries);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"tag" | "series">("tag");

  async function create(event: React.FormEvent) {
    event.preventDefault();
    const input = { name: name.trim(), slug: slugify(name), description: null };
    if (kind === "tag") {
      const response = await api.createTag(input);
      setTags((current) => [...current, response.data].sort((a, b) => a.name.localeCompare(b.name)));
    } else {
      const response = await api.createSeries(input);
      setSeries((current) => [...current, response.data].sort((a, b) => a.name.localeCompare(b.name)));
    }
    setName("");
  }

  return (
    <div className="space-y-8">
      <form onSubmit={create} className="flex flex-wrap gap-3 rounded-lg border border-line p-4">
        <select value={kind} onChange={(event) => setKind(event.target.value as "tag" | "series")} className="rounded-lg border border-line px-3"><option value="tag">Tag</option><option value="series">Series</option></select>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" className="min-w-64 flex-1 rounded-lg border border-line px-3 py-2" required />
        <button className="rounded-lg bg-accent px-5 py-2 text-paper">Add</button>
      </form>
      <div className="grid gap-8 md:grid-cols-2">
        <section><h3 className="mb-3 font-serif text-xl font-semibold">Tags</h3><ul className="space-y-2">{tags.map((tag) => <li key={tag.id} className="flex justify-between rounded border border-line p-3"><span>{tag.name}</span><button onClick={async () => { await api.deleteTag(tag.id); setTags((items) => items.filter((item) => item.id !== tag.id)); }} className="text-sm text-red-700">Delete</button></li>)}</ul></section>
        <section><h3 className="mb-3 font-serif text-xl font-semibold">Series</h3><ul className="space-y-2">{series.map((item) => <li key={item.id} className="flex justify-between rounded border border-line p-3"><span>{item.name}</span><button onClick={async () => { await api.deleteSeries(item.id); setSeries((items) => items.filter((entry) => entry.id !== item.id)); }} className="text-sm text-red-700">Delete</button></li>)}</ul></section>
      </div>
    </div>
  );
}

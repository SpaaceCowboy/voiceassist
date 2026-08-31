"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { MediaAsset } from "@/lib/types";
import { SafeImage } from "@/components/SafeImage";
import { ARTICLE_FALLBACK_IMAGE } from "@/lib/images";

export function MediaManager({ initialAssets }: { initialAssets: MediaAsset[] }) {
  const [assets, setAssets] = useState(initialAssets);
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState("");
  const [status, setStatus] = useState("");
  const [width, setWidth] = useState("2000");
  const [height, setHeight] = useState("");

  async function upload(event: React.FormEvent) {
    event.preventDefault();
    if (!file || !altText.trim()) return;
    setStatus("Uploading and optimizing…");
    try {
      const response = await api.uploadMedia(file, altText.trim(), { width: Number(width) || undefined, height: Number(height) || undefined });
      setAssets((current) => [response.data, ...current]);
      setFile(null);
      setAltText("");
      setStatus("Upload complete");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed");
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={upload} className="grid gap-3 rounded-xl border border-line bg-paper-card p-5 md:grid-cols-2">
        <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => setFile(event.target.files?.[0] ?? null)} required />
        <input value={altText} onChange={(event) => setAltText(event.target.value)} placeholder="Descriptive alt text" className="rounded-lg border border-line px-3 py-2" required />
        <div className="flex gap-3"><input type="number" min="320" max="2400" value={width} onChange={(event) => setWidth(event.target.value)} aria-label="Output width" className="w-32 rounded border border-line px-3 py-2" /><input type="number" min="200" max="2400" value={height} onChange={(event) => setHeight(event.target.value)} aria-label="Crop height" placeholder="Auto height" className="w-32 rounded border border-line px-3 py-2" /><button className="rounded-lg bg-accent px-5 py-2 text-paper">Upload</button></div>
        {status && <p className="text-sm text-ink-muted md:col-span-2">{status}</p>}
      </form>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {assets.map((asset) => (
          <article key={asset.id} className="overflow-hidden rounded-lg border border-line bg-paper-card">
            <div className="relative aspect-video"><SafeImage src={asset.url} fallback={ARTICLE_FALLBACK_IMAGE} alt={asset.altText} fill className="object-cover" /></div>
            <div className="space-y-2 p-4"><p className="text-sm font-medium">{asset.altText}</p><p className="truncate text-xs text-ink-muted">{asset.url}</p>
              <div className="flex gap-3"><button type="button" onClick={() => navigator.clipboard.writeText(asset.url)} className="text-sm text-accent">Copy URL</button><button type="button" onClick={async () => { await api.deleteMedia(asset.id); setAssets((current) => current.filter((item) => item.id !== asset.id)); }} className="text-sm text-red-700">Delete</button></div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

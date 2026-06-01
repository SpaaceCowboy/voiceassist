// Path: components/calls/details/CallDetailClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { PhoneIcon, RefreshIcon, CheckCircleIcon } from "@/components/ui/icons";
import { backendGet, BackendError } from "@/lib/backend";
import { CallMetaCard } from "./CallMetaCard";
import { CallTranscriptCard } from "./CallTranscriptCard";

type CallLike = Record<string, unknown>;

function pickParam(v: unknown): string {
  if (Array.isArray(v)) return typeof v[0] === "string" ? v[0] : "";
  return typeof v === "string" ? v : "";
}

function unwrapCallEnvelope(x: unknown): CallLike {
  if (!x || typeof x !== "object") return {};
  const obj = x as Record<string, unknown>;
  const inner = obj.data;
  if (inner && typeof inner === "object") return inner as Record<string, unknown>;
  return obj;
}

export default function CallDetailClient() {
  const params = useParams();
  const callSid = useMemo(() => pickParam(params?.callSid), [params]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [call, setCall] = useState<CallLike | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setErr(null);
      setNote(null);

      if (!callSid) {
        setErr("Invalid callSid in URL.");
        setLoading(false);
        return;
      }

      try {
        const raw = await backendGet<unknown>(`/api/calls/${callSid}`);
        const unwrapped = unwrapCallEnvelope(raw);
        if (!cancelled) setCall(unwrapped);
        if (!cancelled && reloadTick > 0) setNote("Refreshed.");
      } catch (e: unknown) {
        if (cancelled) return;
        const msg =
          e instanceof BackendError
            ? `Call fetch failed (${e.status})`
            : e instanceof Error
              ? e.message
              : "Call fetch failed";
        setErr(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [callSid, reloadTick]);

  const header = (
    <PageHeader
      icon={<PhoneIcon />}
      backHref="/calls"
      title="Call detail"
      subtitle={callSid ? <span className="font-mono text-xs">{callSid}</span> : "Details and transcript."}
      actions={
        <Button
          variant="outline"
          icon={<RefreshIcon size={16} />}
          onClick={() => setReloadTick((n) => n + 1)}
          disabled={loading}
        >
          Refresh
        </Button>
      }
    />
  );

  if (loading) {
    return (
      <div className="space-y-5">
        {header}
        <Skeleton className="h-40" />
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (err) {
    return (
      <div className="space-y-5">
        {header}
        <ErrorCard message={err} />
      </div>
    );
  }

  if (!call) {
    return (
      <div className="space-y-5">
        {header}
        <Card className="p-10 text-center">
          <div className="text-sm" style={{ color: "rgb(var(--muted))" }}>
            Call not found.
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {header}

      {note ? (
        <div
          className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"
          style={{
            background: "rgba(16,185,129,0.10)",
            borderColor: "rgba(16,185,129,0.30)",
            color: "rgb(5,150,105)",
          }}
        >
          <CheckCircleIcon size={16} /> {note}
        </div>
      ) : null}

      <CallMetaCard call={call} />
      <CallTranscriptCard call={call} />
    </div>
  );
}

// Path: components/calls/details/CallDetailClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SkeletonText } from "@/components/ui/Skeleton";
import { ErrorCard } from "@/components/ui/ErrorCard";
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
  const router = useRouter();
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

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="p-4">
          <SkeletonText lines={2} />
        </Card>
        <Card className="p-4">
          <SkeletonText lines={7} />
        </Card>
        <Card className="p-4">
          <SkeletonText lines={10} />
        </Card>
      </div>
    );
  }

  if (err) return <ErrorCard message={err} />;

  if (!call) {
    return (
      <Card className="p-4">
        <div className="text-sm" style={{ color: "rgb(var(--muted))" }}>
          Not found.
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Call {callSid}</h1>
          <p className="text-sm" style={{ color: "rgb(var(--muted))" }}>
            Details and transcript.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => router.push("/calls")}>Back</Button>
          <Button variant="primary" onClick={() => setReloadTick((n) => n + 1)}>
            Refresh
          </Button>
        </div>
      </div>

      {note ? (
        <div className="text-sm" style={{ color: "rgb(var(--muted))" }}>
          {note}
        </div>
      ) : null}

      <CallMetaCard call={call} />
      <CallTranscriptCard call={call} />
    </div>
  );
}

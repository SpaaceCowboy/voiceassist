// lib/logs/group.ts
// Collapse a flat, chronological event list into render groups: consecutive
// events that share a callSid become one "call" group (rendered as a threaded
// conversation card); everything else stands alone. Kept pure for testing.

import type { LiveEvent } from "./types";

export type LogGroup =
  | { kind: "call"; callSid: string; events: LiveEvent[]; key: string }
  | { kind: "single"; event: LiveEvent; key: string };

export function callSidOf(e: LiveEvent): string | undefined {
  const v = e.meta?.callSid;
  return typeof v === "string" && v.trim() ? v : undefined;
}

export function groupEvents(events: LiveEvent[]): LogGroup[] {
  const groups: LogGroup[] = [];
  for (const e of events) {
    const sid = callSidOf(e);
    const last = groups[groups.length - 1];
    if (sid && last && last.kind === "call" && last.callSid === sid) {
      last.events.push(e);
    } else if (sid) {
      groups.push({ kind: "call", callSid: sid, events: [e], key: `call:${sid}:${e.id}` });
    } else {
      groups.push({ kind: "single", event: e, key: e.id });
    }
  }
  return groups;
}

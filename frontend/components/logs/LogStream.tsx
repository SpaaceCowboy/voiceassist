"use client";

import * as React from "react";
import { ArrowDownIcon, LogsIcon } from "@/components/ui/icons";
import type { LiveEvent } from "@/lib/logs/types";
import { groupEvents } from "@/lib/logs/group";
import { LogRow } from "./LogRow";
import { CallCard } from "./CallCard";

/** Distance from the bottom (px) still treated as "stuck to live". */
const STICK_THRESHOLD = 48;

export function LogStream({
  events,
  totalCount,
}: {
  events: LiveEvent[];
  totalCount: number;
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const stickRef = React.useRef(true);
  const [atBottom, setAtBottom] = React.useState(true);
  const [newCount, setNewCount] = React.useState(0);
  const prevLenRef = React.useRef(events.length);
  const groups = React.useMemo(() => groupEvents(events), [events]);

  const scrollToBottom = React.useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    stickRef.current = true;
    setAtBottom(true);
    setNewCount(0);
  }, []);

  const onScroll = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    const stuck = distance <= STICK_THRESHOLD;
    stickRef.current = stuck;
    setAtBottom(stuck);
    if (stuck) setNewCount(0);
  }, []);

  // When events arrive: auto-scroll if stuck to bottom, else count the backlog.
  React.useEffect(() => {
    const grew = events.length - prevLenRef.current;
    prevLenRef.current = events.length;
    if (grew <= 0) return;
    if (stickRef.current) {
      scrollToBottom("auto");
    } else {
      setNewCount((c) => c + grew);
    }
  }, [events.length, scrollToBottom]);

  return (
    <div className="relative">
      {/* Politely announce the size of the backlog instead of making the whole
          log a live region (which would read out every row, flooding the user
          on a 100-event backfill). */}
      <div className="sr-only" role="status" aria-live="polite">
        {newCount > 0 ? `${newCount} new event${newCount === 1 ? "" : "s"}` : ""}
      </div>
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="h-[calc(100vh-22rem)] min-h-[20rem] overflow-y-auto rounded-2xl border"
        style={{ background: "rgb(var(--surface))", borderColor: "rgb(var(--border))" }}
        role="log"
        aria-label="Live activity stream"
      >
        {events.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <span
              className="grid h-12 w-12 place-items-center rounded-2xl"
              style={{ background: "rgb(var(--surface2))", color: "rgb(var(--muted))" }}
            >
              <LogsIcon size={22} />
            </span>
            <div>
              <div className="text-sm font-medium" style={{ color: "rgb(var(--text))" }}>
                {totalCount === 0 ? "Waiting for activity…" : "No events match your filters"}
              </div>
              <div className="mt-0.5 text-xs" style={{ color: "rgb(var(--muted))" }}>
                {totalCount === 0
                  ? "New calls, bookings and system events will appear here in real time."
                  : "Try clearing a filter or the search box."}
              </div>
            </div>
          </div>
        ) : (
          groups.map((g) =>
            g.kind === "call" ? (
              <CallCard key={g.key} callSid={g.callSid} events={g.events} />
            ) : (
              <LogRow key={g.key} event={g.event} />
            ),
          )
        )}
      </div>

      {/* Jump-to-live pill */}
      {!atBottom && events.length > 0 ? (
        <button
          type="button"
          onClick={() => scrollToBottom("smooth")}
          className="absolute bottom-4 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-lg ring-1 ring-inset transition active:scale-95"
          style={{
            background: "rgb(var(--accent))",
            color: "white",
            boxShadow: "0 6px 20px rgba(var(--accent),0.35)",
          }}
        >
          <ArrowDownIcon size={14} />
          {newCount > 0 ? `${newCount} new` : "Jump to live"}
        </button>
      ) : null}
    </div>
  );
}

import type { Metadata } from "next";
import { Landing } from "@/components/landing/Landing";

export const metadata: Metadata = {
  title: "NeuroSpine — The AI receptionist that never sleeps",
  description:
    "NeuroSpine's voice AI answers every call, books appointments, knows your patients, and logs everything to your dashboard — 24/7, with zero hold time.",
};

export default function Home() {
  return <Landing />;
}

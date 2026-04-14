"use client";

import Link from "next/link";

const CARDS = [
  {
    href: "/cases",
    title: "Cases",
    desc: "List and apply AI recommendations for caseType/priority."
  },
  {
    href: "/documents",
    title: "Documents",
    desc: "Upload documents and review/apply classification + extraction suggestions."
  },
  {
    href: "/communications",
    title: "Communications",
    desc: "Triage threads, view summaries, and apply suggestions explicitly."
  },
  {
    href: "/ai-runs",
    title: "AI Runs",
    desc: "Observability view for AI runs, status, confidence, latency."
  }
];

export default function DashboardPage() {
  return (
    <section className="stack">
      <h1 style={{ marginBottom: 0 }}>Dashboard</h1>
      <p style={{ marginTop: 6 }}>
        Minimal operator UI over a backend-first system. Everything here is explicit and auditable.
      </p>

      <div className="formGrid formGridSingle">
        {CARDS.map((c) => (
          <Link key={c.href} href={c.href} className="card" style={{ textDecoration: "none" }}>
            <div className="cardTitle">{c.title}</div>
            <div className="muted">{c.desc}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}

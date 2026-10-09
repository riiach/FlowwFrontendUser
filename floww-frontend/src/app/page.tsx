import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Floww" };

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white p-6">
      <Link
        href="/app"
        className="inline-flex rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Go to my dashboard
      </Link>
    </main>
  );
}
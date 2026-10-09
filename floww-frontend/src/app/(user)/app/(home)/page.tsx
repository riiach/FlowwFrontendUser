import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Floww · Dashboard",
    description: "Overview",
};

export default function HomePage() {
    return (
        <div className="min-h-full w-full bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-6">
            <Link href="/app/my-wallet" className="inline-flex rounded-lg border border-outline px-4 py-2 text-sm text-gray hover:bg-surface-hover">My Wallet</Link>
        </div>
    );
}

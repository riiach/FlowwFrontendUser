import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Floww · My Wallet",
  description: "Wallet Setting",
};

export default function MyWalletPage() {
  return (
    <section className="min-h-full w-full rounded-2xl bg-white p-6">
      <h1>My Wallet</h1>
      <p className="mt-3 text-sm text-text-muted">Home 하위 메뉴 테스트 페이지입니다.</p>
      <Link href="/app/my-wallet/transactions" className="mt-6 inline-flex rounded-lg border border-outline px-4 py-2 text-sm text-gray hover:bg-surface-hover">Transactions</Link>
    </section>
  );
}
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Floww · Transactions" };

export default function TransactionsPage() {
  return (
    <section className="min-h-full w-full rounded-2xl bg-white p-6">
      <h1>Transactions</h1>
      <p className="mt-3 text-sm text-text-muted">My Wallet 안의 하위 페이지 테스트입니다.</p>
    </section>
  );
}
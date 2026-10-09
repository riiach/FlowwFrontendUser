import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Floww · Sign in",
  description: "Sign in to Floww with your wallet or email.",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

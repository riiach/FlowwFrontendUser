import type { Metadata } from "next";
import LoginFlow from "@/components/auth/LoginFlow";

export const metadata: Metadata = {
  title: "Floww · Sign up",
  description: "Create your Floww account with your wallet or email.",
};

export default function SignupPage() {
  return <LoginFlow key="signup" initialIntent="signup" />;
}

import LoginFlow from "@/components/auth/LoginFlow";

export default function LoginPage() {
  return <LoginFlow key="signin" initialIntent="signin" onComplete={undefined} />;
}

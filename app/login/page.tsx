import type { Metadata } from "next";
import { LoginPageClient } from "@/components/auth/LoginPageClient";

export const metadata: Metadata = {
  title: "Log in",
  description: "Sign in to Layout.",
};

export default function LoginPage() {
  return <LoginPageClient />;
}

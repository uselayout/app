import type { Metadata } from "next";
import { SignupClient } from "@/components/auth/SignupClient";

export const metadata: Metadata = {
  title: "Join Layout",
  description: "Create your Layout account with an invite code.",
};

export default function SignupPage() {
  return <SignupClient />;
}

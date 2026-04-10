import type { Metadata } from "next";
import { ResetPasswordClient } from "@/components/auth/ResetPasswordClient";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Choose a new password for your Layout account.",
};

export default function ResetPasswordPage() {
  return <ResetPasswordClient />;
}

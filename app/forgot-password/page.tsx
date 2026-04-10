import type { Metadata } from "next";
import { ForgotPasswordClient } from "@/components/auth/ForgotPasswordClient";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Reset your Layout password.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}

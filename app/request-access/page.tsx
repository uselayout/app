import type { Metadata } from "next";
import { RequestAccessClient } from "@/components/auth/RequestAccessClient";

export const metadata: Metadata = {
  title: "Request Early Access",
  description: "Request access to Layout's private beta.",
};

export default function RequestAccessPage() {
  return <RequestAccessClient />;
}

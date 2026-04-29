import { Suspense } from "react";
import { AdminClient } from "@/components/admin/AdminClient";

export default function AdminPage() {
  return (
    <Suspense fallback={null}>
      <AdminClient />
    </Suspense>
  );
}

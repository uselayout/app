import { Sidebar } from "@/components/dashboard/Sidebar";
import { OrgProvider } from "@/components/OrgProvider";
import { ProjectHydrator } from "@/components/ProjectHydrator";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <OrgProvider>
      <ProjectHydrator />
      <div className="flex h-screen bg-[var(--bg-app)]">
        <Sidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </OrgProvider>
  );
}

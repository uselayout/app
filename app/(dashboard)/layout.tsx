import { Sidebar } from "@/components/dashboard/Sidebar";
import { ProjectHydrator } from "@/components/ProjectHydrator";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { SunsetNotice } from "@/components/shared/SunsetNotice";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ProjectHydrator />
      <div className="flex h-screen bg-[var(--bg-app)]">
        <Sidebar />
        <main className="relative flex-1 overflow-auto">
          <SunsetNotice />
          {children}
        </main>
      </div>
      <OnboardingShell />
    </>
  );
}

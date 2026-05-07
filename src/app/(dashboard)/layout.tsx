import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { requireRecruiterContext } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireRecruiterContext();

  return (
    <DashboardShell
      orgLabel={ctx.orgName}
      userLabel={ctx.fullName ?? ctx.email}
    >
      {children}
    </DashboardShell>
  );
}

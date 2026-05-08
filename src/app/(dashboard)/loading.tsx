import { AgenticLoader } from "@/components/ui/AgenticLoader";

export default function DashboardLoading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
      <AgenticLoader />
      <p className="mt-4 text-sm font-medium text-text-secondary animate-pulse">Loading dashboard data...</p>
    </div>
  );
}

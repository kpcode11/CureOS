"use client";

import { LabTechDashboard } from "@/components/dashboards/lab-tech-dashboard";

export default function LabTechPage() {
  return (
    <div className="h-full w-full overflow-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <LabTechDashboard />
      </div>
    </div>
  );
}

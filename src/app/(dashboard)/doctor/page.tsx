"use client";

import { DoctorDashboard } from "@/components/dashboards/doctor-dashboard";

export default function DoctorPage() {
  return (
    <div className="h-full w-full overflow-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <DoctorDashboard />
      </div>
    </div>
  );
}

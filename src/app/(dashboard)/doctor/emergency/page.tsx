'use client';

import { EmergencyDashboard } from '@/components/dashboards/emergency-dashboard';

export default function DoctorEmergencyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <EmergencyDashboard />
      </div>
    </div>
  );
}

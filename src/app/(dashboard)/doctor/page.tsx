'use client';

import { DoctorDashboard } from '@/components/dashboards/doctor-dashboard';

export default function DoctorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <DoctorDashboard />
      </div>
    </div>
  );
}
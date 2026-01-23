'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PatientListComponent } from '@/components/doctor/patient-list';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export default function DoctorPatientsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/doctor">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">My Patients</h1>
          <p className="text-gray-600">Manage and view patient records</p>
        </div>
      </div>

      <PatientListComponent showActions={true} />
    </div>
  );
}

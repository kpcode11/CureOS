'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PatientListComponent } from '@/components/doctor/patient-list';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export default function DoctorPatientsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header with Back Button */}
          <div className="flex items-center gap-4">
            <Link href="/doctor">
              <Button 
                variant="ghost" 
                size="icon"
                className="hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex flex-col gap-1">
              <h1 className="text-4xl font-semibold tracking-tight text-gray-900">My Patients</h1>
              <p className="text-base text-gray-600">Manage and view patient records</p>
            </div>
          </div>

          {/* Patient List */}
          <PatientListComponent showActions={true} />
        </div>
      </div>
    </div>
  );
}

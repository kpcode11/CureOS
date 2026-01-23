'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PatientDetailComponent } from '@/components/doctor/patient-detail';
import { EMRFormComponent } from '@/components/doctor/emr-form';
import { PrescriptionFormComponent } from '@/components/doctor/prescription-form';
import { LabOrderFormComponent } from '@/components/doctor/lab-order-form';
import { Button } from '@/components/ui/button';
import { ChevronLeft, X } from 'lucide-react';

type FormType = 'emr' | 'prescription' | 'lab' | null;

export default function PatientDetailPage() {
  const params = useParams();
  const patientId = params.id as string;
  const [openForm, setOpenForm] = useState<FormType>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFormSuccess = () => {
    setOpenForm(null);
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/doctor/patients">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Patient Details</h1>
      </div>

      <div key={refreshKey}>
        <PatientDetailComponent
          patientId={patientId}
          onOpenEMR={() => setOpenForm('emr')}
          onOpenPrescription={() => setOpenForm('prescription')}
          onOpenLabOrder={() => setOpenForm('lab')}
        />
      </div>

      {/* EMR Modal */}
      {openForm === 'emr' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-bold">Create EMR Record</h2>
              <button
                onClick={() => setOpenForm(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <EMRFormComponent
                patientId={patientId}
                onSuccess={handleFormSuccess}
                onCancel={() => setOpenForm(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Prescription Modal */}
      {openForm === 'prescription' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-bold">Create Prescription</h2>
              <button
                onClick={() => setOpenForm(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <PrescriptionFormComponent
                patientId={patientId}
                onSuccess={handleFormSuccess}
                onCancel={() => setOpenForm(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Lab Order Modal */}
      {openForm === 'lab' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-bold">Order Lab Test</h2>
              <button
                onClick={() => setOpenForm(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <LabOrderFormComponent
                patientId={patientId}
                onSuccess={handleFormSuccess}
                onCancel={() => setOpenForm(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

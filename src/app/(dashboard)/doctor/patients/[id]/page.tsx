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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header with Back Button */}
          <div className="flex items-center gap-4">
            <Link href="/doctor/patients">
              <Button 
                variant="ghost" 
                size="icon"
                className="hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-4xl font-semibold tracking-tight text-gray-900">Patient Details</h1>
          </div>

          {/* Patient Detail Content */}
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
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
                  <h2 className="text-xl font-semibold text-gray-900">Create EMR Record</h2>
                  <button
                    onClick={() => setOpenForm(null)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
                <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 73px)' }}>
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
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
                  <h2 className="text-xl font-semibold text-gray-900">Create Prescription</h2>
                  <button
                    onClick={() => setOpenForm(null)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
                <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 73px)' }}>
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
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
                  <h2 className="text-xl font-semibold text-gray-900">Order Lab Test</h2>
                  <button
                    onClick={() => setOpenForm(null)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
                <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 73px)' }}>
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
      </div>
    </div>
  );
}

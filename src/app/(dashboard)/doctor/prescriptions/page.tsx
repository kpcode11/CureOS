'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pill, User, FileText, Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface Prescription {
  id: string;
  patientId: string;
  patientName?: string;
  patientEmail?: string;
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }[];
  instructions: string;
  dispensed: boolean;
  dispensedAt: string | null;
  createdAt: string;
}

export default function DoctorPrescriptionsPage() {
  const { data: session } = useSession();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/doctor/prescriptions');
        
        if (!response.ok) {
          throw new Error('Failed to fetch prescriptions');
        }

        const data = await response.json();
        setPrescriptions(Array.isArray(data) ? data : data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load prescriptions');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.role === 'DOCTOR') {
      fetchPrescriptions();
    }
  }, [session]);

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Prescriptions</h1>
          <p className="text-gray-600 mt-2">Manage prescriptions you have written</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Pill className="h-4 w-4 mr-2" />
          New Prescription
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 flex items-center gap-3 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card>
          <CardContent className="pt-6 flex items-center justify-center py-8">
            <Loader className="h-6 w-6 animate-spin text-gray-400" />
          </CardContent>
        </Card>
      ) : prescriptions.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Pill className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No prescriptions written yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {prescriptions.map((prescription) => (
            <Card key={prescription.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-bold text-gray-900">
                        {prescription.patientName || 'Patient'}
                      </h3>
                      {prescription.dispensed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300">
                          <CheckCircle className="h-3 w-3" />
                          Dispensed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
                          <Clock className="h-3 w-3" />
                          Pending
                        </span>
                      )}
                    </div>

                    {prescription.patientEmail && (
                      <p className="text-sm text-gray-600 mb-3">{prescription.patientEmail}</p>
                    )}

                    <div className="bg-gray-50 p-3 rounded-lg mb-3">
                      <p className="font-medium text-sm text-gray-900 mb-2">Medications:</p>
                      <div className="space-y-2">
                        {prescription.medications && prescription.medications.length > 0 ? (
                          prescription.medications.map((med: any, idx: number) => (
                            <div key={idx} className="text-sm text-gray-700">
                              <p className="font-medium">{med.name}</p>
                              <p className="text-xs text-gray-600">
                                {med.dosage} • {med.frequency} • {med.duration}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-600">No medications listed</p>
                        )}
                      </div>
                    </div>

                    {prescription.instructions && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="font-medium text-sm text-gray-900 mb-1">Instructions:</p>
                        <p className="text-sm text-gray-700">{prescription.instructions}</p>
                      </div>
                    )}

                    <p className="text-xs text-gray-500 mt-3">
                      Created: {new Date(prescription.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

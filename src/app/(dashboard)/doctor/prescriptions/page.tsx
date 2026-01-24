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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-4xl font-semibold tracking-tight text-gray-900">Prescriptions</h1>
              <p className="text-base text-gray-600">Manage prescriptions you have written</p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md">
              <Pill className="h-4 w-4 mr-2" />
              New Prescription
            </Button>
          </div>

          {/* Error State */}
          {error && (
            <Card className="border-red-200 bg-red-50/50 backdrop-blur-sm transition-all duration-300">
              <CardContent className="flex items-center gap-3 p-6 text-red-700">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {loading ? (
            <Card className="border-gray-200 shadow-sm">
              <CardContent className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <Loader className="h-8 w-8 animate-spin text-blue-600" />
                  <p className="text-sm text-gray-600">Loading prescriptions...</p>
                </div>
              </CardContent>
            </Card>
          ) : prescriptions.length === 0 ? (
            <Card className="border-gray-200 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-20">
                <Pill className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-base text-gray-600 font-medium">No prescriptions written yet</p>
                <p className="text-sm text-gray-500 mt-1">Your prescriptions will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {prescriptions.map((prescription) => (
                <Card 
                  key={prescription.id}
                  className="border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-300"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1 space-y-4">
                        {/* Patient Header */}
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                            <Pill className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {prescription.patientName || 'Patient'}
                            </h3>
                            {prescription.dispensed ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                <CheckCircle className="h-3.5 w-3.5" />
                                Dispensed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                                <Clock className="h-3.5 w-3.5" />
                                Pending
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Patient Email */}
                        {prescription.patientEmail && (
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            {prescription.patientEmail}
                          </p>
                        )}

                        {/* Medications Section */}
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 rounded-xl border border-blue-200">
                          <p className="text-xs font-semibold text-blue-900 uppercase tracking-wider mb-3">Medications</p>
                          <div className="space-y-3">
                            {prescription.medications && prescription.medications.length > 0 ? (
                              prescription.medications.map((med: any, idx: number) => (
                                <div key={idx} className="bg-white/70 backdrop-blur-sm p-3 rounded-lg border border-blue-100">
                                  <p className="font-semibold text-sm text-gray-900">{med.name}</p>
                                  <p className="text-xs text-gray-600 mt-1">
                                    {med.dosage} • {med.frequency} • {med.duration}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-gray-600">No medications listed</p>
                            )}
                          </div>
                        </div>

                        {/* Instructions Section */}
                        {prescription.instructions && (
                          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 p-4 rounded-xl border border-gray-200">
                            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Instructions</p>
                            <p className="text-sm text-gray-800 leading-relaxed">{prescription.instructions}</p>
                          </div>
                        )}

                        {/* Timestamp */}
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="h-3.5 w-3.5" />
                          Created: {new Date(prescription.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

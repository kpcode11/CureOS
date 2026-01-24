'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useDoctor, Surgery } from '@/hooks/use-doctor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Calendar, User, Loader, AlertCircle } from 'lucide-react';
import { SurgeryFormComponent } from '@/components/doctor/surgery-form';

export default function DoctorSurgeriesPage() {
  const { getSurgeries, getPatients, loading } = useDoctor();
  const [surgeries, setSurgeries] = useState<Surgery[]>([]);
  const [patients, setPatients] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const loadData = async () => {
      const [surgeriesData, patientsData] = await Promise.all([
        getSurgeries({}),
        getPatients()
      ]);

      setSurgeries(surgeriesData);
      const patientMap: Record<string, string> = {};
      patientsData.forEach((p: any) => {
        patientMap[p.id] = `${p.firstName} ${p.lastName}`;
      });
      setPatients(patientMap);
    };

    loadData();
  }, [mounted, getSurgeries, getPatients]);

  if (!mounted) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-orange-100 text-orange-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
                <h1 className="text-4xl font-semibold tracking-tight text-gray-900">Surgeries</h1>
                <p className="text-base text-gray-600">Schedule and manage surgeries</p>
              </div>
            </div>
            <Button 
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {showForm ? 'Close Form' : 'Schedule Surgery'}
            </Button>
          </div>

          {/* Surgery Form */}
          {showForm && (
            <Card className="border-2 border-blue-200 shadow-lg bg-gradient-to-br from-blue-50 to-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900">Schedule New Surgery</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Patient *</label>
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-gray-900"
                  >
                    <option value="">Choose a patient...</option>
                    {Object.entries(patients).map(([id, name]) => (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPatientId && (
                  <SurgeryFormComponent
                    patientId={selectedPatientId}
                    patientName={patients[selectedPatientId]}
                    onSuccess={() => {
                      setShowForm(false);
                      setSelectedPatientId('');
                      getSurgeries({}).then(setSurgeries);
                    }}
                    onCancel={() => {
                      setShowForm(false);
                      setSelectedPatientId('');
                    }}
                  />
                )}
              </CardContent>
            </Card>
          )}

          {/* Surgeries List */}
          <div className="space-y-4">
            {loading && (
              <Card className="border-gray-200 shadow-sm">
                <CardContent className="flex items-center justify-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <Loader className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-sm text-gray-600">Loading surgeries...</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {!loading && surgeries.length === 0 && (
              <Card className="border-gray-200 shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-20">
                  <Calendar className="h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-base text-gray-600 font-medium">No surgeries scheduled</p>
                  <p className="text-sm text-gray-500 mt-1">Schedule a surgery to get started</p>
                </CardContent>
              </Card>
            )}

            {surgeries.map((surgery) => (
              <Card 
                key={surgery.id}
                className="border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-300"
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start gap-6">
                    <div className="space-y-4 flex-1">
                      {/* Surgery Header */}
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                          <Calendar className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{surgery.surgeryType}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(surgery.status)}`}>
                            {surgery.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      
                      {/* Surgery Details */}
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">Patient:</span> {surgery.patientName}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">Scheduled:</span> {new Date(surgery.scheduledAt).toLocaleString()}
                        </p>
                      </div>
                      
                      {/* Notes Section */}
                      {surgery.notes && (
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 p-4 rounded-xl border border-gray-200">
                          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Notes</p>
                          <p className="text-sm text-gray-800 leading-relaxed">{surgery.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

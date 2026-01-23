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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/doctor">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Surgeries</h1>
            <p className="text-gray-600">Schedule and manage surgeries</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Close Form' : 'Schedule Surgery'}
        </Button>
      </div>

      {/* Surgery Form */}
      {showForm && (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle>Schedule New Surgery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Patient *</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full p-2 border rounded"
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* Surgeries List */}
      <div className="space-y-3">
        {loading && (
          <div className="flex items-center gap-2 text-gray-600">
            <Loader className="animate-spin h-4 w-4" />
            Loading surgeries...
          </div>
        )}

        {!loading && surgeries.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-gray-600">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No surgeries scheduled</p>
              </div>
            </CardContent>
          </Card>
        )}

        {surgeries.map((surgery) => (
          <Card key={surgery.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg">{surgery.surgeryType}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(surgery.status)}`}>
                      {surgery.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {surgery.patientName}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(surgery.scheduledAt).toLocaleString()}
                  </p>
                  {surgery.notes && (
                    <p className="text-sm text-gray-600">Notes: {surgery.notes}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

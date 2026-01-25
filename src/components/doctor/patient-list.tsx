'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useDoctor, Patient } from '@/hooks/use-doctor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Search, Loader, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface PatientWithAppointment extends Patient {
  appointments?: {
    id: string;
    status: string;
    dateTime: string;
    reason: string;
  }[];
}

interface PatientListProps {
  onSelectPatient?: (patient: Patient) => void;
  showActions?: boolean;
}

export function PatientListComponent({ onSelectPatient, showActions = true }: PatientListProps) {
  const { getPatients, loading, error } = useDoctor();
  const [patients, setPatients] = useState<PatientWithAppointment[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<PatientWithAppointment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchPatients = async () => {
      const data = await getPatients();
      setPatients(data);
      setFilteredPatients(data);
    };

    fetchPatients();
  }, [getPatients]);

  // Filter patients based on search query
  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const filtered = patients.filter(
      (p) =>
        p.firstName.toLowerCase().includes(query) ||
        p.lastName.toLowerCase().includes(query) ||
        p.phone.includes(query) ||
        (p.email && p.email.toLowerCase().includes(query))
    );
    setFilteredPatients(filtered);
  }, [searchQuery, patients]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader className="animate-spin mr-2" />
          Loading patients...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="flex items-center justify-center p-8 text-red-600">
          <AlertCircle className="mr-2" />
          {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredPatients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 text-gray-500">
            <Users className="h-12 w-12 mb-2 opacity-50" />
            {searchQuery ? 'No patients match your search' : 'No patients with completed consultations yet'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredPatients.map((patient) => {
            const lastAppointment = patient.appointments?.[0];
            const isCompleted = lastAppointment?.status === 'COMPLETED';
            
            return (
            <Card key={patient.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">
                        {patient.firstName} {patient.lastName}
                      </h3>
                      {isCompleted && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Consulted
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
                      <div>📞 {patient.phone}</div>
                      {patient.email && <div>✉️ {patient.email}</div>}
                      <div>
                        🎂{' '}
                        {new Date(patient.dateOfBirth).toLocaleDateString()}
                      </div>
                      {patient.bloodType && <div>🩸 {patient.bloodType}</div>}
                    </div>
                    {lastAppointment && (
                      <div className="mt-2 text-xs text-gray-500">
                        Last visit: {new Date(lastAppointment.dateTime).toLocaleDateString()} 
                        {lastAppointment.reason && ` - ${lastAppointment.reason}`}
                      </div>
                    )}
                  </div>

                  {showActions && (
                    <div className="flex gap-2">
                      <Link href={`/doctor/patients/${patient.id}`}>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </Link>
                      {onSelectPatient && (
                        <Button
                          size="sm"
                          onClick={() => onSelectPatient(patient)}
                        >
                          Select
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )})}
        </div>
      )}

      <div className="text-sm text-gray-500 text-center">
        Showing {filteredPatients.length} of {patients.length} patients with completed consultations
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { useDoctor, PatientDetail, Appointment } from "@/hooks/use-doctor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader,
  AlertCircle,
  Calendar,
  FileText,
  Pill,
  Microscope,
  Bed,
  ChevronDown,
  UserPlus,
  Download,
} from "lucide-react";
import { CreateReferralDialog } from "@/components/referrals/create-referral-dialog";
import { downloadPatientEMRPDF } from "@/lib/pdf-generator";
import { HealthIndexCard } from "@/components/doctor/health-index-card";

interface PatientDetailComponentProps {
  patientId: string;
  onOpenEMR?: () => void;
  onOpenPrescription?: () => void;
  onOpenLabOrder?: () => void;
}

export function PatientDetailComponent({
  patientId,
  onOpenEMR,
  onOpenPrescription,
  onOpenLabOrder,
}: PatientDetailComponentProps) {
  const { getPatientDetail, loading, error } = useDoctor();
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchPatient = async () => {
      const data = await getPatientDetail(patientId);
      setPatient(data);
    };

    fetchPatient();
  }, [patientId, getPatientDetail]);

  const handleExportPDF = async () => {
    if (!patient) return;

    try {
      setIsExporting(true);
      downloadPatientEMRPDF({
        firstName: patient.firstName,
        lastName: patient.lastName,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        bloodType: patient.bloodType || "Unknown",
        phone: patient.phone,
        email: patient.email || "N/A",
        address: patient.address || "N/A",
        emrRecords: patient.emrRecords,
        prescriptions: patient.prescriptions,
        appointments: patient.appointments,
        labTests: patient.labTests,
      });
    } catch (err) {
      console.error("Error exporting PDF:", err);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader className="animate-spin mr-2" />
          Loading patient details...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="flex items-center p-8 text-red-600">
          <AlertCircle className="mr-2" />
          {error}
        </CardContent>
      </Card>
    );
  }

  if (!patient) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          Patient not found
        </CardContent>
      </Card>
    );
  }

  const age =
    new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();

  return (
    <div className="space-y-4">
      {/* Patient Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">
                {patient.firstName} {patient.lastName}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {age} years old • {patient.gender} •{" "}
                {patient.bloodType || "Type: N/A"}
              </p>
            </div>
            <Button
              onClick={handleExportPDF}
              disabled={isExporting}
              variant="outline"
              size="sm"
              className="ml-4"
              title="Export patient EMR to PDF"
            >
              {isExporting ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase">Phone</p>
              <p className="font-medium">{patient.phone}</p>
            </div>
            {patient.email && (
              <div>
                <p className="text-xs text-gray-500 uppercase">Email</p>
                <p className="font-medium text-sm truncate">{patient.email}</p>
              </div>
            )}
            {patient.address && (
              <div className="col-span-2">
                <p className="text-xs text-gray-500 uppercase">Address</p>
                <p className="font-medium text-sm">{patient.address}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Health Index Score */}
      <HealthIndexCard patientId={patientId} />

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {onOpenEMR && (
          <Button onClick={onOpenEMR} variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            New EMR
          </Button>
        )}
        {onOpenPrescription && (
          <Button onClick={onOpenPrescription} variant="outline" size="sm">
            <Pill className="w-4 h-4 mr-2" />
            New Prescription
          </Button>
        )}
        {onOpenLabOrder && (
          <Button onClick={onOpenLabOrder} variant="outline" size="sm">
            <Microscope className="w-4 h-4 mr-2" />
            Order Lab Test
          </Button>
        )}
        <CreateReferralDialog
          defaultPatientId={patientId}
          trigger={
            <Button variant="outline" size="sm">
              <UserPlus className="w-4 h-4 mr-2" />
              Refer to Specialist
            </Button>
          }
        />
      </div>

      {/* Tabs with patient data */}
      <Tabs defaultValue="emr" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="emr">
            <FileText className="w-4 h-4 mr-2" />
            EMR
          </TabsTrigger>
          <TabsTrigger value="appointments">
            <Calendar className="w-4 h-4 mr-2" />
            Appointments
          </TabsTrigger>
          <TabsTrigger value="labs">
            <Microscope className="w-4 h-4 mr-2" />
            Labs
          </TabsTrigger>
          <TabsTrigger value="prescriptions">
            <Pill className="w-4 h-4 mr-2" />
            Rx
          </TabsTrigger>
        </TabsList>

        {/* EMR Tab */}
        <TabsContent value="emr" className="space-y-2">
          {patient.emrRecords.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                No EMR records yet
              </CardContent>
            </Card>
          ) : (
            patient.emrRecords.map((emr) => (
              <Card key={emr.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{emr.diagnosis}</CardTitle>
                  <p className="text-xs text-gray-500">
                    {new Date(emr.createdAt).toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <p className="font-medium">Symptoms:</p>
                    <p className="text-gray-600">{emr.symptoms}</p>
                  </div>
                  {emr.vitals && (
                    <div>
                      <p className="font-medium">Vitals:</p>
                      <p className="text-gray-600">
                        {JSON.stringify(emr.vitals)}
                      </p>
                    </div>
                  )}
                  {emr.notes && (
                    <div>
                      <p className="font-medium">Notes:</p>
                      <p className="text-gray-600">{emr.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="space-y-2">
          {patient.appointments.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                No appointments scheduled
              </CardContent>
            </Card>
          ) : (
            patient.appointments.map((apt) => (
              <Card key={apt.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{apt.reason}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(apt.dateTime).toLocaleString()}
                      </p>
                      <span
                        className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                          apt.status === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : apt.status === "CANCELLED"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {apt.status}
                      </span>
                    </div>
                  </div>
                  {apt.notes && (
                    <p className="text-sm text-gray-600 mt-2">
                      Notes: {apt.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Labs Tab */}
        <TabsContent value="labs" className="space-y-2">
          {patient.labTests.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                No lab tests ordered
              </CardContent>
            </Card>
          ) : (
            patient.labTests.map((lab) => (
              <Card key={lab.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{lab.testType}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(lab.createdAt).toLocaleDateString()}
                      </p>
                      <span
                        className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                          lab.status === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : lab.status === "FAILED"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {lab.status}
                      </span>
                    </div>
                  </div>
                  {lab.priority && (
                    <p className="text-xs text-gray-500 mt-2">
                      Priority: {lab.priority}
                    </p>
                  )}
                  {lab.results && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                      <p className="font-medium mb-1">Results:</p>
                      <pre className="text-xs overflow-auto">
                        {JSON.stringify(lab.results, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Prescriptions Tab */}
        <TabsContent value="prescriptions" className="space-y-2">
          {patient.prescriptions.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                No prescriptions
              </CardContent>
            </Card>
          ) : (
            patient.prescriptions.map((rx) => (
              <Card key={rx.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">Prescription</CardTitle>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        rx.dispensed
                          ? "bg-green-100 text-green-800"
                          : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {rx.dispensed ? "Dispensed" : "Pending"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <p className="font-medium">Medications:</p>
                    {rx.medications.map((med, idx) => (
                      <p key={idx} className="text-gray-600">
                        • {med.name} {med.dosage} - {med.frequency}
                      </p>
                    ))}
                  </div>
                  <div>
                    <p className="font-medium">Instructions:</p>
                    <p className="text-gray-600">{rx.instructions}</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(rx.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

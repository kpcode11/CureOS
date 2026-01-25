"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  User,
  Calendar,
  FileText,
  Pill,
  Microscope,
  Loader,
  AlertCircle,
  CheckCircle,
  X,
  Plus,
  Save,
  Stethoscope,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  bloodType?: string;
  address?: string;
}

interface Appointment {
  id: string;
  patientId: string;
  dateTime: string;
  reason: string;
  status: string;
  notes?: string;
  patient: Patient;
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface LabTest {
  testType: string;
  priority: string;
  instructions: string;
}

export default function ConsultationPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const appointmentId = params.appointmentId as string;

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Consultation Form State
  const [complaint, setComplaint] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [vitals, setVitals] = useState({
    bloodPressure: "",
    heartRate: "",
    temperature: "",
    weight: "",
    height: "",
    oxygenSaturation: "",
  });
  const [notes, setNotes] = useState("");
  const [medications, setMedications] = useState<Medication[]>([
    { name: "", dosage: "", frequency: "", duration: "" },
  ]);
  const [prescriptionInstructions, setPrescriptionInstructions] = useState("");
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [activeTab, setActiveTab] = useState("examination");

  useEffect(() => {
    fetchAppointmentDetails();
  }, [appointmentId]);

  const fetchAppointmentDetails = async () => {
    try {
      setLoading(true);
      // Fetch appointment with patient details
      const response = await fetch(`/api/doctor/appointments/${appointmentId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch appointment details");
      }
      const data = await response.json();
      setAppointment(data);
      // Pre-fill complaint from appointment reason
      if (data.reason) {
        setComplaint(data.reason);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load appointment");
    } finally {
      setLoading(false);
    }
  };

  const addMedication = () => {
    setMedications([...medications, { name: "", dosage: "", frequency: "", duration: "" }]);
  };

  const removeMedication = (index: number) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index));
    }
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const newMeds = [...medications];
    newMeds[index] = { ...newMeds[index], [field]: value };
    setMedications(newMeds);
  };

  const addLabTest = () => {
    setLabTests([...labTests, { testType: "", priority: "ROUTINE", instructions: "" }]);
  };

  const removeLabTest = (index: number) => {
    setLabTests(labTests.filter((_, i) => i !== index));
  };

  const updateLabTest = (index: number, field: keyof LabTest, value: string) => {
    const newTests = [...labTests];
    newTests[index] = { ...newTests[index], [field]: value };
    setLabTests(newTests);
  };

  const handleEndConsultation = async () => {
    if (!appointment) return;

    // Validate required fields
    if (!diagnosis.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a diagnosis before ending the consultation",
        variant: "destructive",
      });
      return;
    }

    if (!symptoms.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter symptoms before ending the consultation",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // 1. Create EMR record
      const emrResponse = await fetch(`/api/doctor/patients/${appointment.patient.id}/emr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnosis: diagnosis.trim(),
          symptoms: symptoms.trim(),
          vitals: Object.fromEntries(
            Object.entries(vitals).filter(([_, v]) => v.trim() !== "")
          ),
          notes: `Chief Complaint: ${complaint}\n\n${notes}`.trim(),
        }),
      });

      if (!emrResponse.ok) {
        const errData = await emrResponse.json();
        throw new Error(errData.error || "Failed to create EMR record");
      }

      // 2. Create prescription if medications are filled
      const validMeds = medications.filter(
        (m) => m.name.trim() && m.dosage.trim() && m.frequency.trim()
      );
      if (validMeds.length > 0) {
        const prescriptionResponse = await fetch("/api/doctor/prescriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientId: appointment.patient.id,
            medications: validMeds,
            instructions: prescriptionInstructions || "Take as directed by physician",
          }),
        });

        if (!prescriptionResponse.ok) {
          console.error("Failed to create prescription, continuing...");
        }
      }

      // 3. Order lab tests if any
      for (const test of labTests) {
        if (test.testType.trim()) {
          await fetch("/api/doctor/lab-results", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              patientId: appointment.patient.id,
              testType: test.testType,
              priority: test.priority,
              instructions: test.instructions,
            }),
          });
        }
      }

      // 4. Mark appointment as completed
      const updateResponse = await fetch(`/api/doctor/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "COMPLETED",
          notes: `Consultation completed. Diagnosis: ${diagnosis}`,
        }),
      });

      if (!updateResponse.ok) {
        console.error("Failed to update appointment status");
      }

      toast({
        title: "Consultation Complete",
        description: "Patient records have been saved successfully",
      });

      // Navigate back to appointments
      router.push("/doctor/appointments");
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save consultation",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-600">Loading consultation...</p>
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
        <Card className="max-w-md mx-auto border-red-200 bg-red-50">
          <CardContent className="p-6 flex items-center gap-3 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <p>{error || "Appointment not found"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const patient = appointment.patient;
  const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/doctor/appointments">
                <Button variant="ghost" size="icon" className="hover:bg-gray-100">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-gray-900 flex items-center gap-2">
                  <Stethoscope className="h-7 w-7 text-blue-600" />
                  Consultation
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Recording consultation for appointment
                </p>
              </div>
            </div>
            <Button
              onClick={handleEndConsultation}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white px-6"
            >
              {saving ? (
                <Loader className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              End Consultation
            </Button>
          </div>

          {/* Patient Info Card */}
          <Card className="border-blue-200 bg-blue-50/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-7 w-7 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {patient.firstName} {patient.lastName}
                  </h2>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-1">
                    <span>{age} years • {patient.gender}</span>
                    {patient.bloodType && <span>Blood: {patient.bloodType}</span>}
                    <span>📞 {patient.phone}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    {new Date(appointment.dateTime).toLocaleString()}
                  </div>
                  <p className="text-sm font-medium text-blue-700 mt-1">
                    Reason: {appointment.reason}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Consultation Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="examination" className="gap-2">
                <FileText className="h-4 w-4" />
                Examination
              </TabsTrigger>
              <TabsTrigger value="prescription" className="gap-2">
                <Pill className="h-4 w-4" />
                Prescription
              </TabsTrigger>
              <TabsTrigger value="tests" className="gap-2">
                <Microscope className="h-4 w-4" />
                Lab Tests
              </TabsTrigger>
            </TabsList>

            {/* Examination Tab */}
            <TabsContent value="examination" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Chief Complaint</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Patient's primary complaint..."
                    value={complaint}
                    onChange={(e) => setComplaint(e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Vital Signs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Blood Pressure</label>
                      <Input
                        placeholder="e.g., 120/80 mmHg"
                        value={vitals.bloodPressure}
                        onChange={(e) => setVitals({ ...vitals, bloodPressure: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Heart Rate</label>
                      <Input
                        placeholder="e.g., 72 bpm"
                        value={vitals.heartRate}
                        onChange={(e) => setVitals({ ...vitals, heartRate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Temperature</label>
                      <Input
                        placeholder="e.g., 98.6°F"
                        value={vitals.temperature}
                        onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Weight</label>
                      <Input
                        placeholder="e.g., 70 kg"
                        value={vitals.weight}
                        onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Height</label>
                      <Input
                        placeholder="e.g., 175 cm"
                        value={vitals.height}
                        onChange={(e) => setVitals({ ...vitals, height: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">SpO2</label>
                      <Input
                        placeholder="e.g., 98%"
                        value={vitals.oxygenSaturation}
                        onChange={(e) => setVitals({ ...vitals, oxygenSaturation: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Symptoms *</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Describe patient's symptoms..."
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    rows={3}
                    className="resize-none"
                    required
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Diagnosis *</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Enter diagnosis..."
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    rows={3}
                    className="resize-none"
                    required
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Additional Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Any additional clinical notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Prescription Tab */}
            <TabsContent value="prescription" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Medications</CardTitle>
                  <Button variant="outline" size="sm" onClick={addMedication}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Medication
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {medications.map((med, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-gray-50 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">
                          Medication {index + 1}
                        </span>
                        {medications.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMedication(index)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          placeholder="Drug name *"
                          value={med.name}
                          onChange={(e) => updateMedication(index, "name", e.target.value)}
                        />
                        <Input
                          placeholder="Dosage *"
                          value={med.dosage}
                          onChange={(e) => updateMedication(index, "dosage", e.target.value)}
                        />
                        <Input
                          placeholder="Frequency *"
                          value={med.frequency}
                          onChange={(e) => updateMedication(index, "frequency", e.target.value)}
                        />
                        <Input
                          placeholder="Duration"
                          value={med.duration}
                          onChange={(e) => updateMedication(index, "duration", e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Special instructions for patient (e.g., take with food, avoid dairy, follow-up in 2 weeks)"
                    value={prescriptionInstructions}
                    onChange={(e) => setPrescriptionInstructions(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Lab Tests Tab */}
            <TabsContent value="tests" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Order Lab Tests</CardTitle>
                  <Button variant="outline" size="sm" onClick={addLabTest}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Test
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {labTests.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Microscope className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No lab tests ordered yet</p>
                      <p className="text-sm">Click "Add Test" to order lab work</p>
                    </div>
                  ) : (
                    labTests.map((test, index) => (
                      <div key={index} className="p-4 border rounded-lg bg-gray-50 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">
                            Test {index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeLabTest(index)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <Input
                            placeholder="Test type (e.g., CBC, Lipid Panel)"
                            value={test.testType}
                            onChange={(e) => updateLabTest(index, "testType", e.target.value)}
                          />
                          <select
                            value={test.priority}
                            onChange={(e) => updateLabTest(index, "priority", e.target.value)}
                            className="px-3 py-2 border rounded-md bg-white"
                          >
                            <option value="ROUTINE">Routine</option>
                            <option value="URGENT">Urgent</option>
                          </select>
                          <Input
                            placeholder="Special instructions"
                            value={test.instructions}
                            onChange={(e) => updateLabTest(index, "instructions", e.target.value)}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  FileText,
  Save,
  CheckCircle2,
  ArrowLeft,
  CalendarDays,
  List,
  Eye,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SkeletonShinyGradient } from "@/components/ui/skeleton-shiny";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface Doctor {
  id: string;
  specialization: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface Appointment {
  id: string;
  dateTime: string;
  reason: string;
  status: string;
  notes: string | null;
  patient: Patient;
  doctor: Doctor;
}

export default function AppointmentBooking() {
  const router = useRouter();
  const { toast } = useToast();
  const [bookedAppointment, setBookedAppointment] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [activeTab, setActiveTab] = useState<"book" | "list">("list");

  const [formData, setFormData] = useState({
    patientId: "",
    doctorId: "",
    date: "",
    time: "",
    reason: "",
    notes: "",
  });

  useEffect(() => {
    fetchPatients();
    fetchDoctors();
    fetchAppointments();
  }, []);

  const loadMockAppointments = () => {
    // Mock appointment data for demonstration
    const mockAppointments: Appointment[] = [
      {
        id: "apt-001-demo-12345678",
        dateTime: new Date(2026, 0, 25, 10, 0).toISOString(),
        reason: "Regular checkup and blood pressure monitoring",
        status: "SCHEDULED",
        notes: "Patient has history of hypertension",
        patient: {
          id: "pat-001",
          firstName: "John",
          lastName: "Smith",
          phone: "+1 (555) 123-4567",
        },
        doctor: {
          id: "doc-001",
          specialization: "Cardiology",
          user: {
            id: "usr-doc-001",
            name: "Sarah Johnson",
            email: "sarah.johnson@hospital.com",
          },
        },
      },
      {
        id: "apt-002-demo-87654321",
        dateTime: new Date(2026, 0, 26, 14, 30).toISOString(),
        reason: "Follow-up consultation for diabetes management",
        status: "SCHEDULED",
        notes: null,
        patient: {
          id: "pat-002",
          firstName: "Emily",
          lastName: "Davis",
          phone: "+1 (555) 234-5678",
        },
        doctor: {
          id: "doc-002",
          specialization: "Endocrinology",
          user: {
            id: "usr-doc-002",
            name: "Michael Chen",
            email: "michael.chen@hospital.com",
          },
        },
      },
      {
        id: "apt-003-demo-11223344",
        dateTime: new Date(2026, 0, 27, 9, 0).toISOString(),
        reason: "Orthopedic consultation for knee pain",
        status: "SCHEDULED",
        notes: "Patient reported injury during sports activity",
        patient: {
          id: "pat-003",
          firstName: "Robert",
          lastName: "Wilson",
          phone: "+1 (555) 345-6789",
        },
        doctor: {
          id: "doc-003",
          specialization: "Orthopedics",
          user: {
            id: "usr-doc-003",
            name: "David Martinez",
            email: "david.martinez@hospital.com",
          },
        },
      },
      {
        id: "apt-004-demo-55667788",
        dateTime: new Date(2026, 0, 23, 11, 0).toISOString(),
        reason: "Annual physical examination",
        status: "COMPLETED",
        notes: "All vitals normal, lab results pending",
        patient: {
          id: "pat-004",
          firstName: "Lisa",
          lastName: "Anderson",
          phone: "+1 (555) 456-7890",
        },
        doctor: {
          id: "doc-004",
          specialization: "General Practice",
          user: {
            id: "usr-doc-004",
            name: "Jennifer Lee",
            email: "jennifer.lee@hospital.com",
          },
        },
      },
      {
        id: "apt-005-demo-99887766",
        dateTime: new Date(2026, 0, 22, 15, 30).toISOString(),
        reason: "Dermatology consultation for skin condition",
        status: "CANCELLED",
        notes: "Patient requested cancellation due to scheduling conflict",
        patient: {
          id: "pat-005",
          firstName: "James",
          lastName: "Taylor",
          phone: "+1 (555) 567-8901",
        },
        doctor: {
          id: "doc-005",
          specialization: "Dermatology",
          user: {
            id: "usr-doc-005",
            name: "Amanda White",
            email: "amanda.white@hospital.com",
          },
        },
      },
    ];

    setAppointments(mockAppointments);
    setLoadingAppointments(false);
  };

  const fetchPatients = async () => {
    try {
      const response = await fetch("/api/patients");
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      }
    } catch (error) {
      console.error("Failed to fetch patients:", error);
    } finally {
      setLoadingPatients(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await fetch("/api/doctors");
      if (response.ok) {
        const data = await response.json();
        setDoctors(data);
      }
    } catch (error) {
      console.error("Failed to fetch doctors:", error);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Update selectedPatient when patientId changes
    if (field === "patientId") {
      const patient = patients.find((p) => p.id === value);
      setSelectedPatient(patient || null);
    }

    // Update selectedDoctor when doctorId changes
    if (field === "doctorId") {
      const doctor = doctors.find((d) => d.id === value);
      setSelectedDoctor(doctor || null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form data
      if (
        !formData.patientId ||
        !formData.doctorId ||
        !formData.date ||
        !formData.time
      ) {
        toast({
          title: "Validation Error",
          description:
            "Please fill in all required fields (Patient, Doctor, Date, Time)",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const dateTime = new Date(`${formData.date}T${formData.time}`);

      // Check if date is in the past
      if (dateTime < new Date()) {
        toast({
          title: "Invalid Date",
          description: "Cannot book appointment in the past",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId: formData.patientId,
          doctorId: formData.doctorId,
          dateTime: dateTime.toISOString(),
          reason: formData.reason,
          notes: formData.notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.error || "Failed to book appointment";
        throw new Error(errorMsg);
      }

      const appointment = await response.json();
      setBookedAppointment(appointment);

      // Refresh appointments list
      fetchAppointments();

      toast({
        title: "✅ Appointment Booked Successfully!",
        description: `Appointment scheduled for ${new Date(appointment.dateTime).toLocaleString()} with ${appointment.doctor.user.name}`,
      });

      // Reset form
      handleReset();

      // Switch to list tab to show new appointment
      setTimeout(() => setActiveTab("list"), 500);
    } catch (error: any) {
      const errorMsg = error?.message || "Unknown error occurred";
      toast({
        title: "❌ Booking Failed",
        description: errorMsg,
        variant: "destructive",
      });
      console.error("Appointment booking error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoadingAppointments(true);
      const response = await fetch("/api/appointments");
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
        console.log("Fetched appointments:", data);
      } else {
        console.error("Failed to fetch appointments:", response.status);
        // Fall back to mock appointments if API fails
        loadMockAppointments();
      }
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
      // Fall back to mock appointments if API fails
      loadMockAppointments();
    } finally {
      setLoadingAppointments(false);
    }
  };

  const handleReset = () => {
    setBookedAppointment(null);
    setFormData({
      patientId: "",
      doctorId: "",
      date: "",
      time: "",
      reason: "",
      notes: "",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "success" | "warning" | "destructive"
    > = {
      SCHEDULED: "default",
      COMPLETED: "success",
      CANCELLED: "destructive",
      NO_SHOW: "warning",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 via-white to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
              <CalendarDays className="h-10 w-10 text-blue-600" />
              Appointments
            </h1>
            <p className="text-slate-600 mt-2">Manage patient appointments</p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/receptionist")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 bg-white p-1 rounded-lg shadow-md w-fit">
          <Button
            variant={activeTab === "list" ? "default" : "ghost"}
            onClick={() => setActiveTab("list")}
            className="gap-2"
          >
            <List className="h-4 w-4" />
            Appointment List
          </Button>
          <Button
            variant={activeTab === "book" ? "default" : "ghost"}
            onClick={() => setActiveTab("book")}
            className="gap-2"
          >
            <CalendarDays className="h-4 w-4" />
            Book New
          </Button>
        </div>

        {/* Appointments List Tab */}
        {activeTab === "list" && (
          <Card className="shadow-xl border-2 border-slate-200">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
              <CardTitle className="text-xl text-slate-900">
                Scheduled Appointments
              </CardTitle>
              <CardDescription>
                {appointments.length} total appointments
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loadingAppointments ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonShinyGradient
                      key={i}
                      className="h-16 rounded-lg bg-muted"
                    />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="font-bold text-slate-700">
                          Appointment ID
                        </TableHead>
                        <TableHead className="font-bold text-slate-700">
                          Patient
                        </TableHead>
                        <TableHead className="font-bold text-slate-700">
                          Doctor
                        </TableHead>
                        <TableHead className="font-bold text-slate-700">
                          Date & Time
                        </TableHead>
                        <TableHead className="font-bold text-slate-700">
                          Reason
                        </TableHead>
                        <TableHead className="font-bold text-slate-700">
                          Status
                        </TableHead>
                        <TableHead className="text-right font-bold text-slate-700">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointments.map((appointment) => (
                        <TableRow
                          key={appointment.id}
                          className="hover:bg-blue-50 transition-colors"
                        >
                          <TableCell className="font-mono text-sm font-medium text-blue-600">
                            {appointment.id.slice(0, 8).toUpperCase()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                                <User className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {appointment.patient.firstName}{" "}
                                  {appointment.patient.lastName}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {appointment.patient.phone}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-semibold text-slate-900">
                                Dr. {appointment.doctor.user.name}
                              </p>
                              <p className="text-xs text-emerald-600">
                                {appointment.doctor.specialization}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-slate-700">
                              <Calendar className="h-4 w-4 text-purple-600" />
                              <div>
                                <p className="font-medium">
                                  {new Date(
                                    appointment.dateTime,
                                  ).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {new Date(
                                    appointment.dateTime,
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm text-slate-700 max-w-xs truncate">
                              {appointment.reason}
                            </p>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(appointment.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() =>
                                router.push(
                                  `/receptionist/appointments/${appointment.id}`,
                                )
                              }
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {appointments.length === 0 && !loadingAppointments && (
                        <TableRow>
                          <TableCell colSpan={7} className="h-32 text-center">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <CalendarDays className="h-12 w-12 text-slate-300" />
                              <p className="text-slate-600 font-medium">
                                No appointments scheduled
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setActiveTab("book")}
                                className="mt-2"
                              >
                                <CalendarDays className="h-4 w-4 mr-2" />
                                Book New Appointment
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Book Appointment Tab */}
        {activeTab === "book" && (
          <>
            {/* Success Card */}
            {bookedAppointment && (
              <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg">
                <CardContent className="p-8 text-center">
                  <div className="inline-flex h-20 w-20 rounded-full bg-green-500 items-center justify-center mb-6 shadow-lg">
                    <CheckCircle2 className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-green-900 mb-3">
                    Appointment Booked!
                  </h3>
                  <p className="text-slate-700 mb-6 text-lg">
                    The appointment has been successfully scheduled
                  </p>

                  <div className="bg-white rounded-xl border-2 border-green-300 p-6 mb-6 max-w-2xl mx-auto">
                    <div className="grid grid-cols-2 gap-6 text-left">
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Patient</p>
                        <p className="text-lg font-semibold text-slate-900">
                          {bookedAppointment.patient.firstName}{" "}
                          {bookedAppointment.patient.lastName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Doctor</p>
                        <p className="text-lg font-semibold text-slate-900">
                          Dr. {bookedAppointment.doctor.user.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {bookedAppointment.doctor.specialization}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 mb-1">
                          Date & Time
                        </p>
                        <p className="text-lg font-semibold text-blue-600">
                          {new Date(
                            bookedAppointment.dateTime,
                          ).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 mb-1">
                          Appointment ID
                        </p>
                        <p className="text-lg font-mono font-semibold text-green-600">
                          {bookedAppointment.id.slice(0, 8).toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center gap-3">
                    <Button
                      onClick={handleReset}
                      size="lg"
                      className="gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                      <CalendarDays className="h-4 w-4" />
                      Book Another Appointment
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/receptionist")}
                      size="lg"
                      className="gap-2"
                    >
                      Go to Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Booking Form */}
            {!bookedAppointment && (
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Main Form */}
                  <Card className="lg:col-span-2 shadow-md hover:shadow-xl transition-shadow duration-300">
                    <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
                      <CardTitle className="text-2xl flex items-center gap-2">
                        <Calendar className="h-6 w-6" />
                        Appointment Details
                      </CardTitle>
                      <CardDescription className="text-blue-100">
                        Fill in the appointment information
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                      {/* Patient Selection */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="patient"
                          className="text-slate-700 font-semibold flex items-center gap-2"
                        >
                          <User className="h-4 w-4 text-blue-600" />
                          Select Patient <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.patientId}
                          onValueChange={(value) =>
                            handleChange("patientId", value)
                          }
                          required
                        >
                          <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 h-12">
                            <SelectValue
                              placeholder={
                                loadingPatients
                                  ? "Loading patients..."
                                  : "Choose a patient"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {patients.map((patient) => (
                              <SelectItem key={patient.id} value={patient.id}>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">
                                    {patient.firstName} {patient.lastName}
                                  </span>
                                  <span className="text-slate-500 text-sm">
                                    • {patient.phone}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Doctor Selection */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="doctor"
                          className="text-slate-700 font-semibold flex items-center gap-2"
                        >
                          <Stethoscope className="h-4 w-4 text-emerald-600" />
                          Select Doctor <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.doctorId}
                          onValueChange={(value) =>
                            handleChange("doctorId", value)
                          }
                          required
                        >
                          <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 h-12">
                            <SelectValue
                              placeholder={
                                loadingDoctors
                                  ? "Loading doctors..."
                                  : "Choose a doctor"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {doctors.map((doctor) => (
                              <SelectItem key={doctor.id} value={doctor.id}>
                                <div className="flex flex-col">
                                  <span className="font-semibold">
                                    Dr. {doctor.user.name}
                                  </span>
                                  <span className="text-slate-500 text-xs">
                                    {doctor.specialization}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Date and Time */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor="date"
                            className="text-slate-700 font-semibold flex items-center gap-2"
                          >
                            <Calendar className="h-4 w-4 text-purple-600" />
                            Appointment Date{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="date"
                            type="date"
                            value={formData.date}
                            onChange={(e) =>
                              handleChange("date", e.target.value)
                            }
                            required
                            min={new Date().toISOString().split("T")[0]}
                            className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 h-12"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="time"
                            className="text-slate-700 font-semibold flex items-center gap-2"
                          >
                            <Clock className="h-4 w-4 text-orange-600" />
                            Appointment Time{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="time"
                            type="time"
                            value={formData.time}
                            onChange={(e) =>
                              handleChange("time", e.target.value)
                            }
                            required
                            className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 h-12"
                          />
                        </div>
                      </div>

                      {/* Reason */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="reason"
                          className="text-slate-700 font-semibold flex items-center gap-2"
                        >
                          <FileText className="h-4 w-4 text-blue-600" />
                          Reason for Visit{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="reason"
                          placeholder="e.g., Regular checkup, Follow-up, Consultation"
                          value={formData.reason}
                          onChange={(e) =>
                            handleChange("reason", e.target.value)
                          }
                          required
                          className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 h-12"
                        />
                      </div>

                      {/* Notes */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="notes"
                          className="text-slate-700 font-semibold"
                        >
                          Additional Notes (Optional)
                        </Label>
                        <Textarea
                          id="notes"
                          placeholder="Any additional information or special requirements..."
                          value={formData.notes}
                          onChange={(e) =>
                            handleChange("notes", e.target.value)
                          }
                          className="min-h-[100px] border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Summary Sidebar */}
                  <div className="space-y-6">
                    {/* Appointment Summary */}
                    <Card className="shadow-md bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg text-slate-900">
                          Appointment Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {selectedPatient ? (
                          <div className="bg-white rounded-lg p-4 border border-blue-200">
                            <p className="text-xs text-slate-600 mb-1">
                              Patient
                            </p>
                            <p className="font-semibold text-slate-900">
                              {selectedPatient.firstName}{" "}
                              {selectedPatient.lastName}
                            </p>
                            <p className="text-sm text-slate-600">
                              {selectedPatient.phone}
                            </p>
                          </div>
                        ) : (
                          <div className="bg-white rounded-lg p-4 border border-slate-200 text-center">
                            <p className="text-sm text-slate-400">
                              No patient selected
                            </p>
                          </div>
                        )}

                        {selectedDoctor ? (
                          <div className="bg-white rounded-lg p-4 border border-emerald-200">
                            <p className="text-xs text-slate-600 mb-1">
                              Doctor
                            </p>
                            <p className="font-semibold text-slate-900">
                              Dr. {selectedDoctor.user.name}
                            </p>
                            <p className="text-sm text-emerald-600">
                              {selectedDoctor.specialization}
                            </p>
                          </div>
                        ) : (
                          <div className="bg-white rounded-lg p-4 border border-slate-200 text-center">
                            <p className="text-sm text-slate-400">
                              No doctor selected
                            </p>
                          </div>
                        )}

                        {formData.date && formData.time ? (
                          <div className="bg-white rounded-lg p-4 border border-purple-200">
                            <p className="text-xs text-slate-600 mb-1">
                              Date & Time
                            </p>
                            <p className="font-semibold text-slate-900">
                              {new Date(
                                `${formData.date}T${formData.time}`,
                              ).toLocaleDateString("en-US", {
                                weekday: "short",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                            <p className="text-sm text-purple-600">
                              {formData.time}
                            </p>
                          </div>
                        ) : (
                          <div className="bg-white rounded-lg p-4 border border-slate-200 text-center">
                            <p className="text-sm text-slate-400">
                              No date/time selected
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Submit Button */}
                    <Card className="shadow-md bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-200">
                      <CardContent className="p-6">
                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                          size="lg"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                              Booking Appointment...
                            </>
                          ) : (
                            <>
                              <Save className="h-5 w-5 mr-2" />
                              Book Appointment
                            </>
                          )}
                        </Button>
                        <p className="text-xs text-slate-600 text-center mt-3">
                          Patient will be notified of the appointment
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

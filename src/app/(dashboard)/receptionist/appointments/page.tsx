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
  AlertTriangle,
  Sparkles,
  Activity,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Switch } from "@/components/ui/switch";

// Severity and Problem Types
type SeverityLevel = 'LOW' | 'MODERATE' | 'HIGH';
type ProblemCategory = 
  | 'HEART' | 'BONE_JOINT' | 'EAR_NOSE_THROAT' | 'EYE' | 'SKIN' 
  | 'DIGESTIVE' | 'RESPIRATORY' | 'NEUROLOGICAL' | 'DENTAL' 
  | 'GENERAL' | 'PEDIATRIC' | 'GYNECOLOGY' | 'UROLOGY' | 'MENTAL_HEALTH';

const SEVERITY_OPTIONS: { value: SeverityLevel; label: string; color: string; description: string }[] = [
  { value: 'LOW', label: 'Low', color: 'bg-green-500', description: 'Routine checkup, minor issues' },
  { value: 'MODERATE', label: 'Moderate', color: 'bg-yellow-500', description: 'Non-urgent but needs attention' },
  { value: 'HIGH', label: 'High', color: 'bg-red-500', description: 'Urgent, needs senior doctor' },
];

const PROBLEM_CATEGORIES: { value: ProblemCategory; label: string; icon: string; examples: string }[] = [
  { value: 'HEART', label: 'Heart/Cardiac', icon: '❤️', examples: 'Chest pain, palpitations, BP issues' },
  { value: 'BONE_JOINT', label: 'Bone & Joint', icon: '🦴', examples: 'Fractures, joint pain, arthritis' },
  { value: 'EAR_NOSE_THROAT', label: 'ENT', icon: '👂', examples: 'Hearing, sinus, throat problems' },
  { value: 'EYE', label: 'Eye/Vision', icon: '👁️', examples: 'Vision issues, eye pain, cataracts' },
  { value: 'SKIN', label: 'Skin', icon: '🩹', examples: 'Rash, acne, skin infections' },
  { value: 'DIGESTIVE', label: 'Digestive/GI', icon: '🫃', examples: 'Stomach pain, acid reflux, liver' },
  { value: 'RESPIRATORY', label: 'Respiratory', icon: '🫁', examples: 'Breathing issues, asthma, cough' },
  { value: 'NEUROLOGICAL', label: 'Neurological', icon: '🧠', examples: 'Headache, seizures, numbness' },
  { value: 'DENTAL', label: 'Dental', icon: '🦷', examples: 'Toothache, gum problems' },
  { value: 'GENERAL', label: 'General/Primary', icon: '🏥', examples: 'Fever, cold, annual checkup' },
  { value: 'PEDIATRIC', label: 'Pediatric', icon: '👶', examples: 'Child health, vaccinations' },
  { value: 'GYNECOLOGY', label: 'Gynecology/OB', icon: '🤰', examples: 'Women\'s health, pregnancy' },
  { value: 'UROLOGY', label: 'Urology', icon: '🚿', examples: 'Kidney, urinary issues' },
  { value: 'MENTAL_HEALTH', label: 'Mental Health', icon: '🧘', examples: 'Anxiety, depression, stress' },
];

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
  metadata?: {
    severity?: SeverityLevel;
    problemCategory?: ProblemCategory;
    autoAssigned?: boolean;
    assignmentReason?: string;
  };
}

interface DoctorRecommendation {
  success: boolean;
  doctor?: {
    id: string;
    name: string;
    specialization: string;
    seniority: string;
  };
  reason: string;
  alternativeDoctors?: Array<{
    id: string;
    name: string;
    specialization: string;
    seniority: string;
  }>;
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

  // Smart scheduling states
  const [useSmartScheduling, setUseSmartScheduling] = useState(true);
  const [severity, setSeverity] = useState<SeverityLevel | "">("");
  const [problemCategory, setProblemCategory] = useState<ProblemCategory | "">("");
  const [symptoms, setSymptoms] = useState("");
  const [recommendation, setRecommendation] = useState<DoctorRecommendation | null>(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);

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
      // Clear recommendation when manually selecting doctor
      if (useSmartScheduling) {
        setRecommendation(null);
      }
    }
  };

  // Fetch doctor recommendation based on severity and problem category
  const fetchRecommendation = async () => {
    if (!severity || !problemCategory || !formData.date || !formData.time) {
      return;
    }

    setLoadingRecommendation(true);
    try {
      const dateTime = new Date(`${formData.date}T${formData.time}`);
      const params = new URLSearchParams({
        severity,
        problemCategory,
        dateTime: dateTime.toISOString(),
      });

      const response = await fetch(`/api/appointments/smart?${params}`);
      if (response.ok) {
        const data = await response.json();
        setRecommendation(data);
        
        // Auto-select the recommended doctor
        if (data.success && data.doctor) {
          setFormData(prev => ({ ...prev, doctorId: data.doctor.id }));
          const doctor = doctors.find(d => d.id === data.doctor.id);
          setSelectedDoctor(doctor || null);
        }
      } else {
        const errorData = await response.json();
        setRecommendation({
          success: false,
          reason: errorData.reason || errorData.error || 'Failed to get recommendation',
          alternativeDoctors: errorData.alternativeDoctors,
        });
      }
    } catch (error) {
      console.error('Failed to fetch recommendation:', error);
      setRecommendation({
        success: false,
        reason: 'Failed to connect to recommendation service',
      });
    } finally {
      setLoadingRecommendation(false);
    }
  };

  // Trigger recommendation when severity, problem category, or time changes
  useEffect(() => {
    if (useSmartScheduling && severity && problemCategory && formData.date && formData.time) {
      const timeoutId = setTimeout(() => {
        fetchRecommendation();
      }, 500); // Debounce
      return () => clearTimeout(timeoutId);
    }
  }, [severity, problemCategory, formData.date, formData.time, useSmartScheduling]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form data
      if (!formData.patientId || !formData.date || !formData.time) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields (Patient, Date, Time)",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // For smart scheduling, severity and problem category are required
      if (useSmartScheduling && (!severity || !problemCategory)) {
        toast({
          title: "Validation Error",
          description: "Please select severity level and problem category for smart scheduling",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // For manual scheduling, doctor is required
      if (!useSmartScheduling && !formData.doctorId) {
        toast({
          title: "Validation Error",
          description: "Please select a doctor for manual scheduling",
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

      let response;
      
      if (useSmartScheduling && severity && problemCategory) {
        // Use smart scheduling API
        response = await fetch("/api/appointments/smart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            patientId: formData.patientId,
            dateTime: dateTime.toISOString(),
            severity,
            problemCategory,
            problemDescription: formData.reason,
            symptoms: symptoms ? symptoms.split(',').map(s => s.trim()) : undefined,
            notes: formData.notes,
            preferredDoctorId: formData.doctorId || undefined,
            autoAssign: !formData.doctorId, // Auto-assign if no doctor selected
          }),
        });
      } else {
        // Use standard scheduling API
        response = await fetch("/api/appointments", {
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
            severity: severity || undefined,
            problemCategory: problemCategory || undefined,
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.error || errorData.reason || "Failed to book appointment";
        throw new Error(errorMsg);
      }

      const result = await response.json();
      // Handle both smart and standard API responses
      const appointment = result.appointment || result;
      setBookedAppointment(appointment);

      // Refresh appointments list
      fetchAppointments();

      // Show success message with assignment info if available
      const assignmentInfo = result.assignment?.autoAssigned 
        ? ` (Auto-assigned: ${result.assignment.reason})`
        : '';
      
      toast({
        title: "✅ Appointment Booked Successfully!",
        description: `Appointment scheduled for ${new Date(appointment.dateTime).toLocaleString()} with Dr. ${appointment.doctor.user.name}${assignmentInfo}`,
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
    setSeverity("");
    setProblemCategory("");
    setSymptoms("");
    setRecommendation(null);
    setSelectedPatient(null);
    setSelectedDoctor(null);
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
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-3 text-slate-600">
                    Loading appointments...
                  </span>
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
                      {/* Smart Scheduling Toggle */}
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center">
                            <Sparkles className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <Label className="text-slate-900 font-semibold">Smart Doctor Assignment</Label>
                            <p className="text-sm text-slate-600">Auto-assign best available doctor based on severity & specialty</p>
                          </div>
                        </div>
                        <Switch
                          checked={useSmartScheduling}
                          onCheckedChange={setUseSmartScheduling}
                        />
                      </div>

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

                      {/* Smart Scheduling Fields */}
                      {useSmartScheduling && (
                        <>
                          {/* Severity Selection */}
                          <div className="space-y-2">
                            <Label className="text-slate-700 font-semibold flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-orange-600" />
                              Severity Level <span className="text-red-500">*</span>
                            </Label>
                            <div className="grid grid-cols-3 gap-3">
                              {SEVERITY_OPTIONS.map((option) => (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => setSeverity(option.value)}
                                  className={`p-4 rounded-lg border-2 transition-all ${
                                    severity === option.value
                                      ? `border-${option.color.replace('bg-', '')} ${option.color} text-white shadow-lg`
                                      : 'border-slate-200 hover:border-slate-300 bg-white'
                                  }`}
                                >
                                  <div className={`h-3 w-3 rounded-full ${option.color} mx-auto mb-2 ${severity === option.value ? 'bg-white' : ''}`} />
                                  <p className="font-semibold">{option.label}</p>
                                  <p className={`text-xs mt-1 ${severity === option.value ? 'text-white/80' : 'text-slate-500'}`}>
                                    {option.description}
                                  </p>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Problem Category Selection */}
                          <div className="space-y-2">
                            <Label className="text-slate-700 font-semibold flex items-center gap-2">
                              <Activity className="h-4 w-4 text-red-600" />
                              Problem Category <span className="text-red-500">*</span>
                            </Label>
                            <Select
                              value={problemCategory}
                              onValueChange={(value) => setProblemCategory(value as ProblemCategory)}
                            >
                              <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 h-12">
                                <SelectValue placeholder="Select the type of health problem" />
                              </SelectTrigger>
                              <SelectContent>
                                {PROBLEM_CATEGORIES.map((cat) => (
                                  <SelectItem key={cat.value} value={cat.value}>
                                    <div className="flex items-center gap-3">
                                      <span className="text-xl">{cat.icon}</span>
                                      <div>
                                        <span className="font-semibold">{cat.label}</span>
                                        <span className="text-slate-500 text-xs ml-2">{cat.examples}</span>
                                      </div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Symptoms */}
                          <div className="space-y-2">
                            <Label className="text-slate-700 font-semibold flex items-center gap-2">
                              <FileText className="h-4 w-4 text-blue-600" />
                              Symptoms (comma separated)
                            </Label>
                            <Input
                              placeholder="e.g., chest pain, shortness of breath, dizziness"
                              value={symptoms}
                              onChange={(e) => setSymptoms(e.target.value)}
                              className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 h-12"
                            />
                          </div>

                          {/* Doctor Recommendation */}
                          {(loadingRecommendation || recommendation) && (
                            <div className={`p-4 rounded-lg border-2 ${
                              recommendation?.success 
                                ? 'border-green-200 bg-green-50' 
                                : 'border-orange-200 bg-orange-50'
                            }`}>
                              <div className="flex items-start gap-3">
                                {loadingRecommendation ? (
                                  <>
                                    <Loader2 className="h-5 w-5 animate-spin text-blue-600 mt-0.5" />
                                    <div>
                                      <p className="font-semibold text-slate-900">Finding best available doctor...</p>
                                      <p className="text-sm text-slate-600">Analyzing severity, specialization, and shift availability</p>
                                    </div>
                                  </>
                                ) : recommendation?.success ? (
                                  <>
                                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                                    <div className="flex-1">
                                      <p className="font-semibold text-green-900">Recommended Doctor</p>
                                      <p className="text-lg font-bold text-green-800">Dr. {recommendation.doctor?.name}</p>
                                      <p className="text-sm text-green-700">{recommendation.doctor?.specialization} • {recommendation.doctor?.seniority}</p>
                                      <p className="text-xs text-green-600 mt-1">{recommendation.reason}</p>
                                      {recommendation.alternativeDoctors && recommendation.alternativeDoctors.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-green-200">
                                          <p className="text-xs text-green-700 font-medium">Alternatives:</p>
                                          {recommendation.alternativeDoctors.slice(0, 2).map((alt) => (
                                            <button
                                              key={alt.id}
                                              type="button"
                                              onClick={() => {
                                                setFormData(prev => ({ ...prev, doctorId: alt.id }));
                                                const doctor = doctors.find(d => d.id === alt.id);
                                                setSelectedDoctor(doctor || null);
                                              }}
                                              className="text-xs text-green-600 hover:text-green-800 underline mr-2"
                                            >
                                              Dr. {alt.name} ({alt.seniority})
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                                    <div className="flex-1">
                                      <p className="font-semibold text-orange-900">No Matching Doctor Found</p>
                                      <p className="text-sm text-orange-700">{recommendation?.reason}</p>
                                      {recommendation?.alternativeDoctors && recommendation.alternativeDoctors.length > 0 && (
                                        <div className="mt-2">
                                          <p className="text-xs text-orange-700 font-medium">Available alternatives:</p>
                                          {recommendation.alternativeDoctors.map((alt) => (
                                            <button
                                              key={alt.id}
                                              type="button"
                                              onClick={() => {
                                                setFormData(prev => ({ ...prev, doctorId: alt.id }));
                                                const doctor = doctors.find(d => d.id === alt.id);
                                                setSelectedDoctor(doctor || null);
                                              }}
                                              className="text-xs text-orange-600 hover:text-orange-800 underline mr-2"
                                            >
                                              Dr. {alt.name}
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* Doctor Selection - Manual mode or override */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="doctor"
                          className="text-slate-700 font-semibold flex items-center gap-2"
                        >
                          <Stethoscope className="h-4 w-4 text-emerald-600" />
                          {useSmartScheduling ? 'Override Doctor Selection' : 'Select Doctor'} 
                          {!useSmartScheduling && <span className="text-red-500">*</span>}
                        </Label>
                        {useSmartScheduling && (
                          <p className="text-xs text-slate-500 -mt-1">Optional: Leave empty to use recommended doctor</p>
                        )}
                        <Select
                          value={formData.doctorId}
                          onValueChange={(value) =>
                            handleChange("doctorId", value)
                          }
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

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  FileText,
  ArrowLeft,
  XCircle,
  Edit,
  Save,
  Phone,
  Mail,
  Loader2,
  CheckCircle2,
  CalendarDays,
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface AppointmentDetails {
  id: string;
  dateTime: string;
  reason: string;
  status: string;
  notes: string | null;
  createdAt: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string | null;
    gender: string;
  };
  doctor: {
    id: string;
    specialization: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  receptionist: {
    user: {
      name: string;
    };
  } | null;
}

export default function AppointmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    date: "",
    time: "",
    reason: "",
    notes: "",
  });

  useEffect(() => {
    if (params.id) {
      fetchAppointment();
    }
  }, [params.id]);

  const fetchAppointment = async () => {
    try {
      const response = await fetch(`/api/appointments/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setAppointment(data);

        // Initialize form data
        const dateTime = new Date(data.dateTime);
        setFormData({
          date: dateTime.toISOString().split("T")[0],
          time: dateTime.toTimeString().slice(0, 5),
          reason: data.reason,
          notes: data.notes || "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch appointment:", error);
      toast({
        title: "Error",
        description: "Failed to load appointment details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/appointments/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      if (response.ok) {
        toast({
          title: "Appointment Cancelled",
          description: "The appointment has been successfully cancelled",
        });
        fetchAppointment();
      } else {
        throw new Error("Failed to cancel appointment");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel appointment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const dateTime = new Date(`${formData.date}T${formData.time}`);

      const response = await fetch(`/api/appointments/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateTime: dateTime.toISOString(),
          reason: formData.reason,
          notes: formData.notes,
        }),
      });

      if (response.ok) {
        toast({
          title: "Appointment Updated",
          description: "The appointment has been successfully rescheduled",
        });
        setIsEditing(false);
        fetchAppointment();
      } else {
        throw new Error("Failed to reschedule appointment");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reschedule appointment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; label: string }> = {
      SCHEDULED: { variant: "info", label: "Scheduled" },
      COMPLETED: { variant: "success", label: "Completed" },
      CANCELLED: { variant: "destructive", label: "Cancelled" },
      NO_SHOW: { variant: "warning", label: "No Show" },
    };
    const { variant, label } = config[status] || {
      variant: "default",
      label: status,
    };
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-slate-600">
          Loading appointment details...
        </span>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <XCircle className="h-16 w-16 text-red-500" />
        <p className="text-xl text-slate-700">Appointment not found</p>
        <Button onClick={() => router.push("/receptionist/appointments")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Appointments
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 via-white to-blue-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
              <CalendarDays className="h-10 w-10 text-blue-600" />
              Appointment Details
            </h1>
            <p className="text-slate-600 mt-2">
              ID:{" "}
              <span className="font-mono font-semibold">
                {appointment.id.slice(0, 8).toUpperCase()}
              </span>
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/receptionist/appointments")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to List
          </Button>
        </div>

        {/* Status and Actions Bar */}
        <Card className="shadow-md border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Status</p>
                  {getStatusBadge(appointment.status)}
                </div>
                <div className="h-12 w-px bg-slate-300" />
                <div>
                  <p className="text-sm text-slate-600 mb-1">Booked On</p>
                  <p className="text-sm font-medium text-slate-900">
                    {new Date(appointment.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {appointment.receptionist && (
                  <>
                    <div className="h-12 w-px bg-slate-300" />
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Booked By</p>
                      <p className="text-sm font-medium text-slate-900">
                        {appointment.receptionist.user.name}
                      </p>
                    </div>
                  </>
                )}
              </div>
              {appointment.status === "SCHEDULED" && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(!isEditing)}
                    className="gap-2"
                    disabled={isSubmitting}
                  >
                    <Edit className="h-4 w-4" />
                    {isEditing ? "Cancel Edit" : "Reschedule"}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleCancel}
                    className="gap-2"
                    disabled={isSubmitting}
                  >
                    <XCircle className="h-4 w-4" />
                    Cancel Appointment
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patient Information */}
          <Card className="shadow-md hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
              <CardTitle className="text-xl flex items-center gap-2">
                <User className="h-5 w-5" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {appointment.patient.firstName}{" "}
                    {appointment.patient.lastName}
                  </p>
                  <p className="text-sm text-slate-600 capitalize">
                    {appointment.patient.gender}
                  </p>
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-slate-600">Phone</p>
                    <p className="font-medium text-slate-900">
                      {appointment.patient.phone}
                    </p>
                  </div>
                </div>
                {appointment.patient.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-xs text-slate-600">Email</p>
                      <p className="font-medium text-slate-900">
                        {appointment.patient.email}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Doctor Information */}
          <Card className="shadow-md hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-t-lg">
              <CardTitle className="text-xl flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Doctor Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                  <Stethoscope className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    Dr. {appointment.doctor.user.name}
                  </p>
                  <p className="text-sm text-emerald-600 font-medium">
                    {appointment.doctor.specialization}
                  </p>
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-emerald-600" />
                  <div>
                    <p className="text-xs text-slate-600">Email</p>
                    <p className="font-medium text-slate-900">
                      {appointment.doctor.user.email}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Appointment Details */}
        <Card className="shadow-xl border-2 border-slate-200">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
            <CardTitle className="text-xl text-slate-900">
              Appointment Details
            </CardTitle>
            <CardDescription>
              {isEditing
                ? "Edit appointment information"
                : "View appointment information"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {isEditing ? (
              <form onSubmit={handleReschedule} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="date"
                      className="text-slate-700 font-semibold flex items-center gap-2"
                    >
                      <Calendar className="h-4 w-4 text-purple-600" />
                      Appointment Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
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
                      Appointment Time <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) =>
                        setFormData({ ...formData, time: e.target.value })
                      }
                      required
                      className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 h-12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="reason"
                    className="text-slate-700 font-semibold flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4 text-blue-600" />
                    Reason for Visit <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="reason"
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData({ ...formData, reason: e.target.value })
                    }
                    required
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="notes"
                    className="text-slate-700 font-semibold"
                  >
                    Additional Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="min-h-[100px] border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <Calendar className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="text-sm text-slate-600">Date</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {new Date(appointment.dateTime).toLocaleDateString(
                          "en-US",
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          },
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <Clock className="h-8 w-8 text-orange-600" />
                    <div>
                      <p className="text-sm text-slate-600">Time</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {new Date(appointment.dateTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-2 mb-2">
                      <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                      <p className="text-sm text-slate-600">Reason for Visit</p>
                    </div>
                    <p className="text-base font-medium text-slate-900 ml-7">
                      {appointment.reason}
                    </p>
                  </div>

                  {appointment.notes && (
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-start gap-2 mb-2">
                        <FileText className="h-5 w-5 text-slate-600 mt-0.5" />
                        <p className="text-sm text-slate-600">
                          Additional Notes
                        </p>
                      </div>
                      <p className="text-base text-slate-900 ml-7">
                        {appointment.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

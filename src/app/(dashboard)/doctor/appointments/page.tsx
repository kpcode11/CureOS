"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  User,
  Phone,
  Clock,
  AlertCircle,
  Loader,
  Play,
  CheckCircle,
} from "lucide-react";
import { ReferralBadge } from "@/components/referrals/referral-badge";
import { useToast } from "@/hooks/use-toast";

interface Appointment {
  id: string;
  patientId: string;
  dateTime: string;
  reason: string;
  status: string;
  notes?: string;
  createdAt: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
  referral?: {
    id: string;
    urgency: string;
    fromDoctor: {
      id: string;
      user: {
        name: string;
      };
    };
  } | null;
}

export default function DoctorAppointmentsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingConsultation, setStartingConsultation] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("[DoctorAppointments] Fetching appointments...");
        
        // Only fetch SCHEDULED appointments - completed ones should not appear
        const response = await fetch("/api/doctor/appointments?status=SCHEDULED");
        console.log("[DoctorAppointments] Response status:", response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.error("[DoctorAppointments] Error response:", errorData);
          throw new Error(errorData.error || "Failed to fetch appointments");
        }

        const data = await response.json();
        console.log("[DoctorAppointments] Received data:", data);
        setAppointments(Array.isArray(data) ? data : data.data || []);
      } catch (err) {
        console.error("[DoctorAppointments] Fetch error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load appointments",
        );
      } finally {
        setLoading(false);
      }
    };

    // Fetch appointments regardless of role check - let the API handle authorization
    if (session) {
      console.log("[DoctorAppointments] Session found, role:", session.user?.role);
      fetchAppointments();
    } else {
      console.log("[DoctorAppointments] No session yet, waiting...");
    }
  }, [session]);

  const handleStartConsultation = async (appointment: Appointment) => {
    setStartingConsultation(appointment.id);
    try {
      // Navigate to the consultation page for this patient
      router.push(`/doctor/consultation/${appointment.id}`);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to start consultation",
        variant: "destructive",
      });
      setStartingConsultation(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-300";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-300";
      case "NO_SHOW":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-semibold tracking-tight text-gray-900">
              Appointments
            </h1>
            <p className="text-base text-gray-600">
              Manage your patient appointments
            </p>
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
                  <p className="text-sm text-gray-600">
                    Loading appointments...
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : appointments.length === 0 ? (
            <Card className="border-gray-200 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-20">
                <Calendar className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-base text-gray-600 font-medium">
                  No appointments scheduled
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Your upcoming appointments will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {appointments.map((appointment) => {
                const patientName = appointment.patient 
                  ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
                  : 'Unknown Patient';
                const patientPhone = appointment.patient?.phone || 'N/A';
                const patientEmail = appointment.patient?.email || 'N/A';
                const appointmentDate = appointment.dateTime 
                  ? new Date(appointment.dateTime)
                  : null;
                const isScheduled = appointment.status === 'SCHEDULED';
                const isStarting = startingConsultation === appointment.id;
                
                return (
                <Card
                  key={appointment.id}
                  className={`border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-300 ${
                    isScheduled ? 'border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1 space-y-4">
                        {/* Patient Header */}
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {patientName}
                            </h3>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                appointment.status,
                              )}`}
                            >
                              {appointment.status === 'COMPLETED' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {appointment.status.replace("_", " ")}
                            </span>
                          </div>
                        </div>

                        {/* Referral Badge */}
                        {appointment.referral && (
                          <ReferralBadge referral={appointment.referral} />
                        )}

                        {/* Appointment Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span>
                              {appointmentDate 
                                ? appointmentDate.toLocaleString()
                                : 'Date not set'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{patientPhone}</span>
                          </div>
                          {patientEmail !== 'N/A' && (
                            <div className="flex items-center gap-3 text-sm text-gray-600 md:col-span-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span>{patientEmail}</span>
                            </div>
                          )}
                        </div>

                        {/* Reason Section */}
                        {appointment.reason && (
                          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 p-4 rounded-xl border border-gray-200">
                            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                              Reason for Visit
                            </p>
                            <p className="text-sm text-gray-800 leading-relaxed">
                              {appointment.reason}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2">
                        {isScheduled && (
                          <Button
                            onClick={() => handleStartConsultation(appointment)}
                            disabled={isStarting}
                            className="bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all"
                          >
                            {isStarting ? (
                              <Loader className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Play className="h-4 w-4 mr-2" />
                            )}
                            Start Consultation
                          </Button>
                        )}
                        {appointment.status === 'COMPLETED' && (
                          <Button
                            variant="outline"
                            onClick={() => router.push(`/doctor/patients/${appointment.patient?.id}`)}
                            className="border-green-200 text-green-700 hover:bg-green-50"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            View Record
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )})}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  User,
  Phone,
  Clock,
  AlertCircle,
  Loader,
} from "lucide-react";
import { ReferralBadge } from "@/components/referrals/referral-badge";

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  appointmentDate: string;
  reason: string;
  status: string;
  createdAt: string;
  referral?: {
    id: string;
    urgency: string;
    fromDoctor: {
      user: {
        name: string;
      };
    };
  } | null;
}

export default function DoctorAppointmentsPage() {
  const { data: session } = useSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/doctor/appointments");

        if (!response.ok) {
          throw new Error("Failed to fetch appointments");
        }

        const data = await response.json();
        setAppointments(Array.isArray(data) ? data : data.data || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load appointments",
        );
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.role === "DOCTOR") {
      fetchAppointments();
    }
  }, [session]);

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
              {appointments.map((appointment) => (
                <Card
                  key={appointment.id}
                  className="border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-300"
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
                              {appointment.patientName}
                            </h3>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                appointment.status,
                              )}`}
                            >
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
                              {new Date(
                                appointment.appointmentDate,
                              ).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{appointment.patientPhone}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-600 md:col-span-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span>{appointment.patientEmail}</span>
                          </div>
                        </div>

                        {/* Reason Section */}
                        {appointment.reason && (
                          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 p-4 rounded-xl border border-gray-200">
                            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                              Reason
                            </p>
                            <p className="text-sm text-gray-800 leading-relaxed">
                              {appointment.reason}
                            </p>
                          </div>
                        )}
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

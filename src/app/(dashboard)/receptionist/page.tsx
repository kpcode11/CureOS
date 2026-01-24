"use client";

import React from "react";
import Link from "next/link";
import { UserPlus, Users, Calendar, FileText, Activity, AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ReceptionistPage() {
  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 via-white to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-slate-900">
            Receptionist Dashboard
          </h1>
          <p className="text-slate-600 mt-2">
            Manage patient registrations and appointments
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/receptionist/registration">
            <Card className="cursor-pointer hover:shadow-xl transition-shadow duration-300 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center mb-2">
                  <UserPlus className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">New Registration</CardTitle>
                <CardDescription>Register a new patient</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/receptionist/search">
            <Card className="cursor-pointer hover:shadow-xl transition-shadow duration-300 border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100">
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-emerald-600 flex items-center justify-center mb-2">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Patient List</CardTitle>
                <CardDescription>View all patients</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/receptionist/appointments">
            <Card className="cursor-pointer hover:shadow-xl transition-shadow duration-300 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-purple-600 flex items-center justify-center mb-2">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Appointments</CardTitle>
                <CardDescription>Schedule appointments</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/receptionist/emergency">
            <Card className="cursor-pointer hover:shadow-xl transition-shadow duration-300 border-2 border-red-200 bg-gradient-to-br from-red-50 to-red-100">
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-red-600 flex items-center justify-center mb-2">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Emergency</CardTitle>
                <CardDescription>Emergency department</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg text-slate-700">
                Today&apos;s Registrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-600">24</div>
              <p className="text-sm text-slate-600 mt-2">+12% from yesterday</p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg text-slate-700">
                Appointments Scheduled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-emerald-600">48</div>
              <p className="text-sm text-slate-600 mt-2">For today</p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg text-slate-700">
                Active Patients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-purple-600">156</div>
              <p className="text-sm text-slate-600 mt-2">In the system</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

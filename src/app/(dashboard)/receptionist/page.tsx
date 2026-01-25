"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  UserPlus, 
  Users, 
  Calendar, 
  Search, 
  AlertTriangle, 
  ArrowRightLeft,
  Activity,
  Clock,
  TrendingUp,
  ChevronRight
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

// Sample data - in a real app, this would come from your API
const dashboardStats = [
  {
    name: "Registrations",
    stat: "24",
    limit: "50",
    percentage: 48,
    trend: "+12%",
    color: "bg-blue-50",
    iconColor: "text-blue-600",
    icon: UserPlus
  },
  {
    name: "Appointments",
    stat: "48",
    limit: "60",
    percentage: 80,
    trend: "2 pending",
    color: "bg-emerald-50",
    iconColor: "text-emerald-600",
    icon: Calendar
  },
  {
    name: "Active Patients",
    stat: "156",
    limit: "200",
    percentage: 78,
    trend: "+5 today",
    color: "bg-purple-50",
    iconColor: "text-purple-600",
    icon: Users
  },
  {
    name: "Queue Status",
    stat: "8",
    limit: "15",
    percentage: 53.3,
    trend: "Average wait",
    color: "bg-orange-50",
    iconColor: "text-orange-600",
    icon: Clock
  },
];

const quickActions = [
  {
    title: "New Patient Registration",
    description: "Register a new patient in the healthcare system",
    href: "/receptionist/registration",
    icon: UserPlus,
    iconForeground: "text-blue-700",
    iconBackground: "bg-blue-50",
    ringColorClass: "ring-blue-700/20",
  },
  {
    title: "Search Patients",
    description: "Find and view patient records and information",
    href: "/receptionist/search", 
    icon: Search,
    iconForeground: "text-emerald-700",
    iconBackground: "bg-emerald-50",
    ringColorClass: "ring-emerald-700/20",
  },
  {
    title: "Manage Appointments",
    description: "Schedule, view and manage patient appointments",
    href: "/receptionist/appointments",
    icon: Calendar,
    iconForeground: "text-purple-700", 
    iconBackground: "bg-purple-50",
    ringColorClass: "ring-purple-700/20",
  },
  {
    title: "Emergency Department",
    description: "Quick access to emergency patient registration",
    href: "/receptionist/emergency",
    icon: AlertTriangle,
    iconForeground: "text-red-700",
    iconBackground: "bg-red-50", 
    ringColorClass: "ring-red-700/20",
  },
  {
    title: "Patient Records",
    description: "View comprehensive patient medical records",
    href: "/receptionist/patients",
    icon: Users,
    iconForeground: "text-indigo-700",
    iconBackground: "bg-indigo-50",
    ringColorClass: "ring-indigo-700/20",
  },
  {
    title: "Referrals",
    description: "Manage patient referrals to specialists",
    href: "/receptionist/referrals",
    icon: ArrowRightLeft,
    iconForeground: "text-teal-700",
    iconBackground: "bg-teal-50",
    ringColorClass: "ring-teal-700/20",
  },
];

export default function ReceptionistPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading state
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/30">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Activity className="h-4 w-4 text-blue-600" />
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Receptionist Dashboard
            </h1>
          </div>
          <p className="text-slate-600 text-sm">
            Manage patient registrations, appointments, and front desk operations
          </p>
        </div>

        {/* Stats Cards */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-slate-700">Today's Overview</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {dashboardStats.map((item) => {
              const IconComponent = item.icon;
              return (
                <Card key={item.name} className="border-0 shadow-sm bg-white/60 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-xl ${item.color} flex items-center justify-center`}>
                        <IconComponent className={`h-6 w-6 ${item.iconColor}`} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <dt className="text-sm font-medium text-slate-600">{item.name}</dt>
                        <dd className="text-2xl font-semibold text-slate-900">{item.stat}</dd>
                      </div>
                    </div>
                    <div className="mt-6 space-y-3">
                      <Progress value={item.percentage} className="h-1.5" />
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">{item.trend}</span>
                        <span className="text-slate-400">
                          {item.stat} of {item.limit}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </dl>
        </div>

        {/* Quick Actions Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-700">Quick Actions</h2>
            <Button variant="ghost" size="sm" className="text-xs text-slate-500">
              View all <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <Link key={action.title} href={action.href}>
                  <Card className="group border-0 shadow-sm bg-white/60 backdrop-blur-sm hover:shadow-md hover:bg-white/80 transition-all duration-200 cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${action.ringColorClass} ${action.iconBackground}`}>
                          <IconComponent className={`h-6 w-6 ${action.iconForeground}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold text-slate-900 group-hover:text-slate-700">
                            {action.title}
                          </h3>
                          <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                            {action.description}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Activity - Could be expanded */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-slate-700">System Status</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="h-8 w-8 mx-auto rounded-full bg-green-50 flex items-center justify-center mb-3">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                </div>
                <div className="text-sm font-medium text-slate-900">All Systems</div>
                <div className="text-xs text-slate-500 mt-1">Operational</div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-8 w-8 mx-auto text-blue-600 mb-3" />
                <div className="text-sm font-medium text-slate-900">Performance</div>
                <div className="text-xs text-slate-500 mt-1">Excellent</div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Activity className="h-8 w-8 mx-auto text-emerald-600 mb-3" />
                <div className="text-sm font-medium text-slate-900">Network</div>
                <div className="text-xs text-slate-500 mt-1">Stable</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

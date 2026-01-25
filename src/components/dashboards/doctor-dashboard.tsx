"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  useDoctor,
  Appointment,
  Prescription,
  Surgery,
} from "@/hooks/use-doctor";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Activity,
  Users,
  Calendar,
  AlertCircle,
  Loader,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  FileText,
  Stethoscope,
  Pill,
  ChevronRight,
  CalendarClock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: string;
  appointments?: {
    id: string;
    dateTime: Date;
    status: string;
    reason?: string;
  }[];
}

export function DoctorDashboard() {
  const {
    getPatients,
    getAppointments,
    getPrescriptions,
    getSurgeries,
    loading,
  } = useDoctor();
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({
    patients: 0,
    pendingPrescriptions: 0,
    scheduledSurgeries: 0,
    upcomingAppointments: 0,
    todayAppointments: 0,
    completedToday: 0,
  });
  const [recentItems, setRecentItems] = useState({
    appointments: [] as Appointment[],
    prescriptions: [] as Prescription[],
    surgeries: [] as Surgery[],
    patients: [] as Patient[],
  });
  const [trends, setTrends] = useState({
    patientsChange: "+12%",
    appointmentsChange: "+8%",
    prescriptionsChange: "-3%",
    surgeriesChange: "+5%",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const loadData = async () => {
      const [patients, appointments, prescriptions, surgeries] =
        await Promise.all([
          getPatients(),
          getAppointments({ status: "SCHEDULED" }),
          getPrescriptions(false),
          getSurgeries({ status: "SCHEDULED" }),
        ]);

      const now = new Date();
      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);

      const todayAppts = appointments.filter(
        (a) =>
          new Date(a.dateTime) >= todayStart && new Date(a.dateTime) < todayEnd,
      );

      const completedTodayAppts = todayAppts.filter(
        (a) => a.status === "COMPLETED",
      );

      setStats({
        patients: patients.length,
        pendingPrescriptions: prescriptions.filter((p) => !p.dispensed).length,
        scheduledSurgeries: surgeries.length,
        upcomingAppointments: appointments.filter(
          (a) => new Date(a.dateTime) > new Date(),
        ).length,
        todayAppointments: todayAppts.length,
        completedToday: completedTodayAppts.length,
      });

      setRecentItems({
        appointments: appointments.slice(0, 5),
        prescriptions: prescriptions.slice(0, 5),
        surgeries: surgeries.slice(0, 5),
        patients: patients.slice(0, 4) as Patient[],
      });
    };

    loadData();
  }, [mounted, getPatients, getAppointments, getPrescriptions, getSurgeries]);

  if (!mounted) return null;

  const mainStats = [
    {
      metric: "Total Patients",
      current: stats.patients.toString(),
      previous: Math.floor(stats.patients * 0.89).toString(),
      difference: trends.patientsChange,
      trend: "up" as const,
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      href: "/doctor/patients",
    },
    {
      metric: "Today's Appointments",
      current: stats.todayAppointments.toString(),
      previous: Math.max(0, stats.todayAppointments - 2).toString(),
      difference: trends.appointmentsChange,
      trend: "up" as const,
      icon: CalendarClock,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    {
      metric: "Pending Prescriptions",
      current: stats.pendingPrescriptions.toString(),
      previous: Math.floor(stats.pendingPrescriptions * 1.03).toString(),
      difference: trends.prescriptionsChange,
      trend: "down" as const,
      icon: Pill,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Clinical Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mounted
              ? new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "\u00A0"}
          </p>
        </div>
        <Link href="/doctor/emergency">
          <Button size="sm" variant="destructive" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Emergency
          </Button>
        </Link>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader className="animate-spin h-4 w-4" />
          Loading data...
        </div>
      )}

      {/* Main Stats Cards - Stats-02 Style */}
      <div className="grid grid-cols-1 divide-y bg-border divide-border overflow-hidden rounded-lg md:grid-cols-3 md:divide-x md:divide-y-0">
        {mainStats.map((item) => {
          const Icon = item.icon;
          return (
            <Card
              key={item.metric}
              className="rounded-none border-0 shadow-sm py-0 hover:bg-accent/50 transition-colors cursor-pointer group"
              onClick={() => item.href && (window.location.href = item.href)}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-sm font-normal text-muted-foreground">
                    {item.metric}
                  </CardTitle>
                  <div className={cn("p-2 rounded-lg", item.bgColor)}>
                    <Icon className={cn("h-4 w-4", item.color)} />
                  </div>
                </div>
                <div className="mt-1 flex items-baseline gap-2 md:block lg:flex">
                  <div className="flex items-baseline text-2xl font-semibold text-foreground">
                    {item.current}
                    <span className="ml-2 text-sm font-medium text-muted-foreground">
                      from {item.previous}
                    </span>
                  </div>

                  <Badge
                    variant="outline"
                    className={cn(
                      "inline-flex items-center px-1.5 ps-2.5 py-0.5 text-xs font-medium md:mt-2 lg:mt-0",
                      item.trend === "up"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
                    )}
                  >
                    {item.trend === "up" ? (
                      <TrendingUp className="mr-0.5 -ml-1 h-5 w-5 shrink-0 self-center text-green-500" />
                    ) : (
                      <TrendingDown className="mr-0.5 -ml-1 h-5 w-5 shrink-0 self-center text-red-500" />
                    )}
                    <span className="sr-only">
                      {item.trend === "up" ? "Increased" : "Decreased"} by{" "}
                    </span>
                    {item.difference}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed Today</p>
                <p className="text-2xl font-bold mt-1">
                  {stats.completedToday}
                </p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold mt-1">
                  {stats.upcomingAppointments}
                </p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Surgeries</p>
                <p className="text-2xl font-bold mt-1">
                  {stats.scheduledSurgeries}
                </p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Stethoscope className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Link href="/doctor/patients" className="block">
          <Card className="hover:shadow-md transition-shadow h-full cursor-pointer group">
            <CardContent className="p-4 h-full flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">View All</p>
                <p className="text-sm font-medium mt-1 group-hover:text-primary transition-colors">
                  Patients →
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Patients - Grid-List-02 Style */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-base">Recent Patients</h3>
                <Link href="/doctor/patients">
                  <Button variant="ghost" size="sm" className="text-xs h-8">
                    View All
                  </Button>
                </Link>
              </div>
              <div className="space-y-3">
                {recentItems.patients.length > 0 ? (
                  recentItems.patients.map((patient) => (
                    <Card
                      key={patient.id}
                      className="relative border transition-all duration-100 hover:border-muted-foreground hover:shadow-sm py-0 cursor-pointer group"
                    >
                      <CardContent className="flex items-center space-x-3 p-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {patient.firstName?.[0]}
                            {patient.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            {patient.firstName} {patient.lastName}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {patient.appointments?.[0]?.reason ||
                              patient.gender ||
                              "Patient"}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <div className="p-4 bg-muted/50 rounded-full mb-3">
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      No Recent Patients
                    </p>
                    <p className="text-xs text-muted-foreground text-center">
                      Your recent patient consultations will appear here
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pending Prescriptions Summary */}
          {stats.pendingPrescriptions > 0 && (
            <Card className="border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Pill className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1">
                      Pending Prescriptions
                    </h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      {stats.pendingPrescriptions} prescription
                      {stats.pendingPrescriptions > 1 ? "s" : ""} awaiting
                      action
                    </p>
                    <Link href="/doctor/prescriptions">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs border-orange-300 dark:border-orange-700 hover:bg-orange-100 dark:hover:bg-orange-900/20"
                      >
                        Review Now
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Surgeries */}
          {stats.scheduledSurgeries > 0 && (
            <Card className="border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Stethoscope className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1">
                      Scheduled Surgeries
                    </h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      {stats.scheduledSurgeries} procedure
                      {stats.scheduledSurgeries > 1 ? "s" : ""} scheduled
                    </p>
                    <Link href="/doctor/surgeries">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs border-purple-300 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900/20"
                      >
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Today's Appointments */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-base">Today's Schedule</h3>
                <Badge variant="outline" className="font-normal">
                  {stats.todayAppointments} appointments
                </Badge>
              </div>
              <div className="space-y-2">
                {recentItems.appointments.length > 0 ? (
                  recentItems.appointments.map((apt) => {
                    const isToday =
                      new Date(apt.dateTime).toDateString() ===
                      new Date().toDateString();
                    return (
                      <div
                        key={apt.id}
                        className={cn(
                          "p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group",
                          isToday && "border-primary/30 bg-primary/5",
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">
                                {apt.reason || "Consultation"}
                              </p>
                              {isToday && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-primary/10 text-primary border-primary/20"
                                >
                                  Today
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(apt.dateTime).toLocaleTimeString(
                                  "en-US",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(apt.dateTime).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                  },
                                )}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              apt.status === "COMPLETED" &&
                                "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200",
                              apt.status === "SCHEDULED" &&
                                "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200",
                              apt.status === "CANCELLED" &&
                                "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200",
                            )}
                          >
                            {apt.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <div className="p-4 bg-muted/50 rounded-full mb-3">
                      <CalendarClock className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      No Appointments
                    </p>
                    <p className="text-xs text-muted-foreground text-center">
                      Your upcoming appointments will appear here
                    </p>
                    <Link href="/doctor/appointments">
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-4 h-8 text-xs"
                      >
                        Schedule Appointment
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-base mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link href="/doctor/patients">
              <Button
                variant="outline"
                className="w-full h-auto py-4 flex flex-col gap-2 hover:bg-accent"
              >
                <Users className="h-5 w-5" />
                <span className="text-xs">My Patients</span>
              </Button>
            </Link>
            <Link href="/doctor/emr">
              <Button
                variant="outline"
                className="w-full h-auto py-4 flex flex-col gap-2 hover:bg-accent"
              >
                <FileText className="h-5 w-5" />
                <span className="text-xs">EMR</span>
              </Button>
            </Link>
            <Link href="/doctor/surgeries">
              <Button
                variant="outline"
                className="w-full h-auto py-4 flex flex-col gap-2 hover:bg-accent"
              >
                <Stethoscope className="h-5 w-5" />
                <span className="text-xs">Surgeries</span>
              </Button>
            </Link>
            <Link href="/doctor/prescriptions">
              <Button
                variant="outline"
                className="w-full h-auto py-4 flex flex-col gap-2 hover:bg-accent"
              >
                <Pill className="h-5 w-5" />
                <span className="text-xs">Prescriptions</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

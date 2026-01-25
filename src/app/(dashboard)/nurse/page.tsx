"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  Activity,
  Bed,
  Users,
  Pill,
  FileText,
  ArrowRight,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkeletonShinyGradient } from "@/components/ui/skeleton-shiny";

export default function NurseDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    activeAssignments: 0,
    totalBeds: 0,
    nursingRecords: 0,
    pendingMedications: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [assignments, beds, records] = await Promise.all([
        fetch("/api/nurse/bed-assignments").then((r) => r.json()),
        fetch("/api/nurse/beds").then((r) => r.json()),
        fetch("/api/nurse/nursing-records").then((r) => r.json()),
      ]);

      setStats({
        activeAssignments: assignments?.length || 0,
        totalBeds: beds?.length || 0,
        nursingRecords: records?.length || 0,
        pendingMedications: 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: "Bed Assignments",
      description: "Manage patient bed assignments",
      icon: Bed,
      color: "bg-blue-600",
      href: "/nurse/bed-assignments",
      stat: stats.activeAssignments,
      statLabel: "Active",
    },
    {
      title: "Medication Administration",
      description: "View and administer medications",
      icon: Pill,
      color: "bg-green-600",
      href: "/nurse/medication",
      stat: stats.pendingMedications,
      statLabel: "Pending",
    },
    {
      title: "Nursing Records",
      description: "Record patient vitals and notes",
      icon: FileText,
      color: "bg-purple-600",
      href: "/nurse/nursing-records",
      stat: stats.nursingRecords,
      statLabel: "Records",
    },
    {
      title: "View All Beds",
      description: "Check bed availability",
      icon: Users,
      color: "bg-orange-600",
      href: "/nurse/beds",
      stat: stats.totalBeds,
      statLabel: "Total Beds",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header */}
      <motion.div
        className="relative bg-white border-b"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 to-teal-600/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-600 rounded-xl">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
                Nurse Dashboard
              </h1>
              <p className="text-slate-600 text-lg">
                Patient care and ward management
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
              >
                <Card
                  className="border-none shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer"
                  onClick={() => router.push(action.href)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 ${action.color} rounded-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-slate-900">
                          {loading ? "..." : action.stat}
                        </div>
                        <div className="text-sm text-slate-600">
                          {action.statLabel}
                        </div>
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg text-slate-900 mb-1">
                      {action.title}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {action.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-none shadow-lg">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
              <CardTitle>Quick Access</CardTitle>
              <CardDescription>Common nursing tasks</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <Button
                className="w-full justify-between bg-emerald-600 hover:bg-emerald-700"
                onClick={() => router.push("/nurse/vitals")}
              >
                <span>Record Patient Vitals</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                className="w-full justify-between"
                variant="outline"
                onClick={() => router.push("/nurse/bed-assignments")}
              >
                <span>Manage Bed Assignments</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                className="w-full justify-between"
                variant="outline"
                onClick={() => router.push("/nurse/ward/assignments")}
              >
                <span>Ward Overview</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                Alerts & Reminders
              </CardTitle>
              <CardDescription>Important notifications</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Bed className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900">
                        {stats.activeAssignments} Active Assignments
                      </p>
                      <p className="text-sm text-blue-700">
                        Monitor patient conditions
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900">
                        All systems operational
                      </p>
                      <p className="text-sm text-green-700">
                        Ward capacity normal
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

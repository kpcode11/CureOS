"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Plus, Download, FileText } from "lucide-react";

// Import dashboard-2 components
import { DashboardSidebar } from "@/components/dashboard-2/sidebar";
import { DashboardHeader } from "@/components/dashboard-2/header";
import { SidebarProvider } from "@/components/ui/sidebar";

interface StatCard {
  title: string;
  value: string | number;
  change: string;
  changeValue: string;
  isPositive: boolean;
  icon: any;
}

export default function AdminDashboard2Page() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<StatCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  // Fetch admin analytics
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch("/api/admin/analytics");
        if (response.ok) {
          const data = await response.json();
          setAnalyticsData(data);
          
          // Map API data to stat cards
          const mappedStats = [
            {
              title: "Total Revenue",
              value: `₹${(data.totalBilling || 0).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`,
              change: "+12%",
              changeValue: `(₹${(data.billingChange || 0).toLocaleString()})`,
              isPositive: true,
              icon: "💰",
            },
            {
              title: "Active Patients",
              value: data.activePatients || 0,
              change: "+8%",
              changeValue: `(${data.patientChange || 0})`,
              isPositive: true,
              icon: "👥",
            },
            {
              title: "Pending Appointments",
              value: data.pendingAppointments || 0,
              change: "-5%",
              changeValue: `(${data.appointmentChange || 0})`,
              isPositive: false,
              icon: "📅",
            },
            {
              title: "System Health",
              value: data.systemHealth || "98%",
              change: "+2%",
              changeValue: "",
              isPositive: true,
              icon: "🏥",
            },
          ];
          
          setStats(mappedStats);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <SidebarProvider className="bg-sidebar">
      <DashboardSidebar />
      <div className="h-svh overflow-hidden lg:p-2 w-full">
        <div className="lg:border lg:rounded-md overflow-hidden flex flex-col items-center justify-start bg-container h-full w-full bg-background">
          <DashboardHeader />
          
          <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 bg-background w-full">
            {/* Welcome Section */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6">
              <div className="space-y-2 sm:space-y-5">
                <h2 className="text-lg sm:text-[22px] font-semibold leading-relaxed">
                  Welcome Back, {session?.user?.name || "Admin"}!
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  System Status: <span className="text-emerald-600 font-medium">Operational</span>
                </p>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2 sm:gap-3 h-8 sm:h-9 text-xs sm:text-sm"
                    >
                      <span className="hidden xs:inline">Export</span>
                      <Download className="w-4 h-4" />
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <FileText className="w-4 h-4 mr-2" />
                      Export Report
                    </DropdownMenuItem>
                    <DropdownMenuItem>Export Dashboard</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button size="sm" className="gap-2 h-8 sm:h-9 text-xs sm:text-sm">
                  <Plus className="w-4 h-4" />
                  <span className="hidden xs:inline">Add Report</span>
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 p-3 sm:p-4 lg:p-6 rounded-xl border bg-card">
              {stats.map((stat, index) => (
                <div key={stat.title} className="flex items-start">
                  <div className="flex-1 space-y-2 sm:space-y-4 lg:space-y-6">
                    <div className="flex items-center gap-1 sm:gap-1.5 text-muted-foreground">
                      <span className="text-lg sm:text-xl">{stat.icon}</span>
                      <span className="text-[10px] sm:text-xs lg:text-sm font-medium truncate">
                        {stat.title}
                      </span>
                    </div>
                    <p className="text-lg sm:text-xl lg:text-[28px] font-semibold leading-tight tracking-tight">
                      {stat.value}
                    </p>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-[10px] sm:text-xs lg:text-sm font-medium">
                      <span className={stat.isPositive ? "text-emerald-600" : "text-red-600"}>
                        {stat.change}
                        <span className="hidden sm:inline">{stat.changeValue}</span>
                      </span>
                      <span className="text-muted-foreground hidden sm:inline">
                        vs Last Month
                      </span>
                    </div>
                  </div>
                  {index < stats.length - 1 && (
                    <div className="hidden lg:block w-px h-full bg-border mx-4 xl:mx-6" />
                  )}
                </div>
              ))}
            </div>

            {/* Charts Section */}
            <div className="flex flex-col xl:flex-row gap-4 sm:gap-6">
              {/* Placeholder for Lead Sources Chart */}
              <div className="flex-1 p-6 border rounded-xl bg-card">
                <h3 className="text-base font-semibold mb-4">Department Distribution</h3>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Chart placeholder - Charts to be connected
                </div>
              </div>

              {/* Placeholder for Revenue Flow Chart */}
              <div className="flex-1 p-6 border rounded-xl bg-card">
                <h3 className="text-base font-semibold mb-4">Monthly Revenue Trend</h3>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Chart placeholder - Charts to be connected
                </div>
              </div>
            </div>

            {/* Deals Table Placeholder */}
            <div className="p-6 border rounded-xl bg-card">
              <h3 className="text-base font-semibold mb-4">Recent Activity</h3>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Table placeholder - Activity data to be connected
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

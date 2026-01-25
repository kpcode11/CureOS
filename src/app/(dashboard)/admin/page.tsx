"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  Plus,
  Download,
  FileText,
  Users,
  Lock,
  Shield,
  TrendingUp,
  Search,
  Command,
  UserPlus,
  Settings,
  Database,
  Activity,
  CheckCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { WelcomeSection } from "@/components/dashboard-2/welcome-section";
import { LeadSourcesChart } from "@/components/dashboard-2/lead-sources-chart";
import { RevenueFlowChart } from "@/components/dashboard-2/revenue-flow-chart";
import { DealsTable } from "@/components/dashboard-2/deals-table";
import GooeyDepartmentDashboard from "@/components/gooey-department-dashboard";

interface StatCard {
  title: string;
  value: number | string;
  change: string;
  icon: React.ReactNode;
  color: string;
  link?: string;
}

export default function AdminPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<StatCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, rolesRes, permsRes] = await Promise.all([
          fetch("/api/admin/users"),
          fetch("/api/admin/roles"),
          fetch("/api/admin/permissions"),
        ]);

        // Check if responses are successful and have content
        let users = [];
        let roles = [];
        let perms = [];

        if (usersRes.ok) {
          const text = await usersRes.text();
          if (text) {
            try {
              users = JSON.parse(text);
            } catch (e) {
              console.warn("Failed to parse users response:", e);
              users = [];
            }
          }
        }

        if (rolesRes.ok) {
          const text = await rolesRes.text();
          if (text) {
            try {
              roles = JSON.parse(text);
            } catch (e) {
              console.warn("Failed to parse roles response:", e);
              roles = [];
            }
          }
        }

        if (permsRes.ok) {
          const text = await permsRes.text();
          if (text) {
            try {
              perms = JSON.parse(text);
            } catch (e) {
              console.warn("Failed to parse permissions response:", e);
              perms = [];
            }
          }
        }

        const statsData: StatCard[] = [
          {
            title: "Total Users",
            value: Array.isArray(users) ? users.length : 0,
            change: "+12%",
            icon: <Users className="w-5 h-5" />,
            color: "bg-blue-50 dark:bg-blue-900/20",
            link: "/admin/rbac?tab=users",
          },
          {
            title: "Roles",
            value: Array.isArray(roles) ? roles.length : 0,
            change: "+4%",
            icon: <Shield className="w-5 h-5" />,
            color: "bg-purple-50 dark:bg-purple-900/20",
            link: "/admin/rbac?tab=roles",
          },
          {
            title: "Permissions",
            value: Array.isArray(perms) ? perms.length : 0,
            change: "+8%",
            icon: <Lock className="w-5 h-5" />,
            color: "bg-green-50 dark:bg-green-900/20",
            link: "/admin/rbac?tab=permissions",
          },
          {
            title: "System Health",
            value: "98%",
            change: "+2%",
            icon: <TrendingUp className="w-5 h-5" />,
            color: "bg-emerald-50 dark:bg-emerald-900/20",
          },
        ];

        setStats(statsData);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="h-svh overflow-hidden lg:p-2 w-full">
      <div className="lg:border lg:rounded-md overflow-hidden flex flex-col items-center justify-start bg-container h-full w-full bg-background">
        {/* Header */}
        <header className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-3 sm:py-4 border-b bg-card sticky top-0 z-10 w-full">
          <h1 className="text-base sm:text-lg font-medium flex-1 truncate">
            Admin Dashboard
          </h1>

          <div className="hidden md:block relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
            <Input
              placeholder="Search Anything..."
              className="pl-10 pr-14 w-[180px] lg:w-[220px] h-9 bg-card border"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 bg-muted px-1 py-0.5 rounded text-xs text-muted-foreground">
              <Command className="size-3" />
              <span>K</span>
            </div>
          </div>

          <ThemeToggle />
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 bg-background w-full">
          {/* Welcome Section */}
          <WelcomeSection />

          {/* Stats Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 p-3 sm:p-4 lg:p-6 rounded-xl border bg-card">
            {stats.map((stat, index) => (
              <Link
                key={stat.title}
                href={stat.link || "#"}
                className={`group flex flex-col justify-between p-4 rounded-lg transition-all ${stat.color} hover:shadow-md cursor-pointer`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {stat.icon}
                    <span className="text-[10px] sm:text-xs lg:text-sm font-medium">
                      {stat.title}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-lg sm:text-xl lg:text-[28px] font-semibold">
                    {isLoading ? "-" : stat.value}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] sm:text-xs font-medium text-emerald-600">
                    <TrendingUp className="w-3 h-3" />
                    {stat.change}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Charts */}
          <div className="flex flex-col xl:flex-row gap-4 sm:gap-6">
            <LeadSourcesChart />
            <RevenueFlowChart />
          </div>

          {/* Department Analytics */}
          <div className="border rounded-xl bg-card overflow-hidden">
            <div className="p-4 sm:p-6 border-b bg-card">
              <h3 className="text-base sm:text-lg font-semibold">
                Department Analytics
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Real-time metrics across all hospital departments
              </p>
            </div>
            <div className="overflow-auto">
              <GooeyDepartmentDashboard />
            </div>
          </div>

          {/* Deals Table */}
          <DealsTable />

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            <Link
              href="/admin/rbac?tab=users"
              className="group relative overflow-hidden rounded-lg border bg-card p-4 transition-all hover:bg-accent hover:border-primary/20"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-blue-100 dark:bg-blue-900/30 p-2 text-blue-600 dark:text-blue-400">
                  <UserPlus className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm">Manage Users</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    Add & manage users
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/rbac?tab=roles"
              className="group relative overflow-hidden rounded-lg border bg-card p-4 transition-all hover:bg-accent hover:border-primary/20"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-purple-100 dark:bg-purple-900/30 p-2 text-purple-600 dark:text-purple-400">
                  <Shield className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm">Manage Roles</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    Configure roles
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/rbac?tab=permissions"
              className="group relative overflow-hidden rounded-lg border bg-card p-4 transition-all hover:bg-accent hover:border-primary/20"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-green-100 dark:bg-green-900/30 p-2 text-green-600 dark:text-green-400">
                  <Lock className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm">Permissions</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    Define permissions
                  </p>
                </div>
              </div>
            </Link>

            <div className="group relative overflow-hidden rounded-lg border bg-card p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-emerald-100 dark:bg-emerald-900/30 p-2 text-emerald-600 dark:text-emerald-400">
                  <Activity className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm">System Status</h4>
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle className="h-3 w-3 text-emerald-500" />
                      <span className="text-muted-foreground">Database</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle className="h-3 w-3 text-emerald-500" />
                      <span className="text-muted-foreground">Auth Active</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle className="h-3 w-3 text-emerald-500" />
                      <span className="text-muted-foreground">Sync Ready</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

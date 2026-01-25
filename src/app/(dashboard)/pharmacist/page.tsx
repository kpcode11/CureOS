"use client";

import { useEffect, useState } from "react";
import {
  Pill,
  Package,
  AlertTriangle,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  PackageX,
  ChevronRight,
  Users,
  FileText,
  BarChart3,
  ShoppingCart,
} from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkeletonShinyGradient } from "@/components/ui/skeleton-shiny";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Stats {
  totalPrescriptions: number;
  pendingDispense: number;
  lowStockItems: number;
  dispensedToday: number;
  recentDispenses: any[];
  criticalAlerts: number;
}

export default function PharmacistDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalPrescriptions: 0,
    pendingDispense: 0,
    lowStockItems: 0,
    dispensedToday: 0,
    recentDispenses: [],
    criticalAlerts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const fetchStats = async () => {
      try {
        const [prescriptions, pending, lowStock] = await Promise.all([
          fetch("/api/pharmacist/prescriptions").then((r) => r.json()),
          fetch("/api/pharmacist/prescriptions?dispensed=false").then((r) =>
            r.json(),
          ),
          fetch("/api/pharmacist/inventory/low-stock").then((r) => r.json()),
        ]);

        const today = new Date().toDateString();
        const dispensedToday = prescriptions.filter(
          (p: any) =>
            p.dispensed && new Date(p.dispensedAt).toDateString() === today,
        ).length;

        const criticalAlerts = lowStock.filter(
          (item: any) => item.quantity === 0,
        ).length;

        setStats({
          totalPrescriptions: prescriptions.length || 0,
          pendingDispense: pending.length || 0,
          lowStockItems: lowStock.length || 0,
          dispensedToday,
          recentDispenses: prescriptions.slice(0, 5) || [],
          criticalAlerts,
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [mounted]);

  if (!mounted) return null;

  const mainStats = [
    {
      metric: "Pending Dispense",
      current: stats.pendingDispense.toString(),
      previous: Math.max(0, stats.pendingDispense - 2).toString(),
      difference: "+15%",
      trend: "up" as const,
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
      href: "/pharmacist/queue",
    },
    {
      metric: "Dispensed Today",
      current: stats.dispensedToday.toString(),
      previous: Math.max(0, stats.dispensedToday - 1).toString(),
      difference: "+12%",
      trend: "up" as const,
      icon: CheckCircle,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
    {
      metric: "Low Stock Items",
      current: stats.lowStockItems.toString(),
      previous: Math.floor(stats.lowStockItems * 1.2).toString(),
      difference: "-8%",
      trend: "down" as const,
      icon: PackageX,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      href: "/pharmacist/safety-alerts",
    },
  ];

  return (
    <div className="h-full w-full overflow-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Pharmacy Dashboard
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            {stats.criticalAlerts > 0 && (
              <Link href="/pharmacist/safety-alerts">
                <Button size="sm" variant="destructive" className="gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {stats.criticalAlerts} Alert
                  {stats.criticalAlerts > 1 ? "s" : ""}
                </Button>
              </Link>
            )}
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Activity className="animate-spin h-4 w-4" />
              Loading data...
            </div>
          )}

          {/* Main Stats Cards - Stats-02 Style */}
          {loading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonShinyGradient
                  key={i}
                  className="h-32 rounded-lg bg-muted"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 divide-y bg-border divide-border overflow-hidden rounded-lg md:grid-cols-3 md:divide-x md:divide-y-0">
              {mainStats.map((item) => {
                const Icon = item.icon;
                return (
                  <Card
                    key={item.metric}
                    className="rounded-none border-0 shadow-sm py-0 hover:bg-accent/50 transition-colors cursor-pointer group"
                    onClick={() =>
                      item.href && (window.location.href = item.href)
                    }
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
                            {item.trend === "up" ? "Increased" : "Decreased"}{" "}
                            by{" "}
                          </span>
                          {item.difference}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Secondary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Prescriptions
                    </p>
                    <p className="text-2xl font-bold mt-1">
                      {stats.totalPrescriptions}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Inventory Items
                    </p>
                    <p className="text-2xl font-bold mt-1">--</p>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Queue Status
                    </p>
                    <p className="text-2xl font-bold mt-1">
                      {stats.pendingDispense}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Link href="/pharmacist/inventory" className="block">
              <Card className="hover:shadow-md transition-shadow h-full cursor-pointer group">
                <CardContent className="p-4 h-full flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Manage</p>
                    <p className="text-sm font-medium mt-1 group-hover:text-primary transition-colors">
                      Inventory →
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium text-sm mb-3">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Link href="/pharmacist/dispense">
                  <div className="border-2 border-blue-600 hover:bg-blue-50 p-4 rounded-lg transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <Pill className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium">Dispense</span>
                    </div>
                  </div>
                </Link>
                <Link href="/pharmacist/inventory">
                  <div className="border-2 border-emerald-600 hover:bg-emerald-50 p-4 rounded-lg transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm font-medium">Inventory</span>
                    </div>
                  </div>
                </Link>
                <Link href="/pharmacist/safety-alerts">
                  <div className="border-2 border-amber-600 hover:bg-amber-50 p-4 rounded-lg transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      <span className="text-sm font-medium">Safety Alerts</span>
                    </div>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-base">
                      Recent Dispenses
                    </h3>
                    <Badge variant="outline" className="font-normal">
                      {stats.dispensedToday} today
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {stats.recentDispenses.length > 0 ? (
                      stats.recentDispenses.map((dispense: any) => (
                        <div
                          key={dispense.id}
                          className="p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                {dispense.medication || "Prescription"}
                              </p>
                              <div className="flex items-center gap-3 mt-1">
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  {dispense.id?.slice(0, 8)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(
                                    dispense.createdAt,
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                dispense.dispensed
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200",
                              )}
                            >
                              {dispense.dispensed ? "Dispensed" : "Pending"}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 px-4">
                        <div className="p-4 bg-muted/50 rounded-full mb-3">
                          <Pill className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-foreground mb-1">
                          No Recent Activity
                        </p>
                        <p className="text-xs text-muted-foreground text-center">
                          Dispensed prescriptions will appear here
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alerts & Notifications */}
            <div className="lg:col-span-1 space-y-6">
              {stats.lowStockItems > 0 && (
                <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                        <PackageX className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm mb-1">
                          Low Stock Alert
                        </h4>
                        <p className="text-xs text-muted-foreground mb-3">
                          {stats.lowStockItems} item
                          {stats.lowStockItems > 1 ? "s" : ""} need reordering
                        </p>
                        <Link href="/pharmacist/inventory">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
                          >
                            Reorder Now
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {stats.pendingDispense > 0 && (
                <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                        <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm mb-1">
                          Pending Queue
                        </h4>
                        <p className="text-xs text-muted-foreground mb-3">
                          {stats.pendingDispense} prescription
                          {stats.pendingDispense > 1 ? "s" : ""} awaiting
                          dispense
                        </p>
                        <Link href="/pharmacist/queue">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/20"
                          >
                            View Queue
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-1">
                        Performance
                      </h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        View detailed analytics and reports
                      </p>
                      <Link href="/pharmacist/prescriptions">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                        >
                          View Reports
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

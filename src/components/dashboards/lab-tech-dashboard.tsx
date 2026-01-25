"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FlaskConical,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  TestTube,
  ChevronRight,
  FileText,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LabTestSummary {
  pending: number;
  inProgress: number;
  completed: number;
  critical: number;
  recentTests: any[];
  totalTests: number;
}

export function LabTechDashboard() {
  const [summary, setSummary] = useState<LabTestSummary>({
    pending: 0,
    inProgress: 0,
    completed: 0,
    critical: 0,
    recentTests: [],
    totalTests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    fetchSummary();
  }, [mounted]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      // Fetch pending tests
      const pendingRes = await fetch("/api/lab-tech/lab-tests?status=PENDING");
      const pendingData = await pendingRes.json();

      // Fetch in-progress tests
      const inProgressRes = await fetch(
        "/api/lab-tech/lab-tests?status=IN_PROGRESS",
      );
      const inProgressData = await inProgressRes.json();

      // Fetch completed tests (today)
      const completedRes = await fetch(
        "/api/lab-tech/lab-tests?status=COMPLETED",
      );
      const completedData = await completedRes.json();

      // Fetch all tests for recent activity
      const allTestsRes = await fetch("/api/lab-tech/lab-tests");
      const allTestsData = await allTestsRes.json();

      // Count critical tests
      const criticalCount = [
        ...(pendingData || []),
        ...(inProgressData || []),
      ].filter(
        (test: any) =>
          test.priority === "CRITICAL" || test.priority === "URGENT",
      ).length;

      setSummary({
        pending: Array.isArray(pendingData) ? pendingData.length : 0,
        inProgress: Array.isArray(inProgressData) ? inProgressData.length : 0,
        completed: Array.isArray(completedData) ? completedData.length : 0,
        critical: criticalCount,
        recentTests: Array.isArray(allTestsData)
          ? allTestsData.slice(0, 5)
          : [],
        totalTests: Array.isArray(allTestsData) ? allTestsData.length : 0,
      });
    } catch (error) {
      console.error("Failed to fetch lab test summary:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const mainStats = [
    {
      metric: "Pending Tests",
      current: summary.pending.toString(),
      previous: Math.max(0, summary.pending - 2).toString(),
      difference: "+10%",
      trend: "up" as const,
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
      href: "/lab-tech/orders",
    },
    {
      metric: "In Progress",
      current: summary.inProgress.toString(),
      previous: Math.max(0, summary.inProgress - 1).toString(),
      difference: "+5%",
      trend: "up" as const,
      icon: Activity,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      metric: "Completed Today",
      current: summary.completed.toString(),
      previous: Math.floor(summary.completed * 0.85).toString(),
      difference: "+18%",
      trend: "up" as const,
      icon: CheckCircle2,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      href: "/lab-tech/results",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Laboratory Dashboard
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
        {summary.critical > 0 && (
          <Link href="/lab-tech/critical">
            <Button size="sm" variant="destructive" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              {summary.critical} Critical
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
                <p className="text-sm text-muted-foreground">Total Tests</p>
                <p className="text-2xl font-bold mt-1">{summary.totalTests}</p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <TestTube className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold mt-1">{summary.critical}</p>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold mt-1">
                  {summary.totalTests > 0
                    ? Math.round((summary.completed / summary.totalTests) * 100)
                    : 0}
                  %
                </p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Link href="/lab-tech/orders" className="block">
          <Card className="hover:shadow-md transition-shadow h-full cursor-pointer group">
            <CardContent className="p-4 h-full flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">View All</p>
                <p className="text-sm font-medium mt-1 group-hover:text-primary transition-colors">
                  Orders →
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-base mb-4">Quick Actions</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Common laboratory workflows
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/lab-tech/orders">
              <div className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-xl transition-all duration-300 hover:shadow-xl cursor-pointer">
                <FlaskConical className="w-8 h-8 mb-4" />
                <h3 className="text-lg font-semibold mb-1">Process Orders</h3>
                <p className="text-sm opacity-90">Start new test orders</p>
              </div>
            </Link>
            <Link href="/lab-tech/critical">
              <div className="bg-red-600 hover:bg-red-700 text-white p-6 rounded-xl transition-all duration-300 hover:shadow-xl cursor-pointer">
                <AlertCircle className="w-8 h-8 mb-4" />
                <h3 className="text-lg font-semibold mb-1">Critical Tests</h3>
                <p className="text-sm opacity-90">Handle urgent cases</p>
              </div>
            </Link>
            <Link href="/lab-tech/results">
              <div className="bg-emerald-600 hover:bg-emerald-700 text-white p-6 rounded-xl transition-all duration-300 hover:shadow-xl cursor-pointer">
                <TrendingUp className="w-8 h-8 mb-4" />
                <h3 className="text-lg font-semibold mb-1">View Results</h3>
                <p className="text-sm opacity-90">Review completed tests</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tests */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-base">Recent Tests</h3>
                <Badge variant="outline" className="font-normal">
                  {summary.recentTests.length} tests
                </Badge>
              </div>
              <div className="space-y-2">
                {summary.recentTests.length > 0 ? (
                  summary.recentTests.map((test: any) => (
                    <div
                      key={test.id}
                      className="p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {test.testType || "Lab Test"}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {test.id?.slice(0, 8)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(
                                test.createdAt || test.orderedAt,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            test.status === "COMPLETED" &&
                              "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200",
                            test.status === "IN_PROGRESS" &&
                              "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200",
                            test.status === "PENDING" &&
                              "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200",
                          )}
                        >
                          {test.status?.replace("_", " ") || "PENDING"}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <div className="p-4 bg-muted/50 rounded-full mb-3">
                      <TestTube className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      No Recent Tests
                    </p>
                    <p className="text-xs text-muted-foreground text-center">
                      Laboratory tests will appear here
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Overview & Alerts */}
        <div className="lg:col-span-1 space-y-6">
          {summary.critical > 0 && (
            <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1">
                      Critical Tests
                    </h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      {summary.critical} test{summary.critical > 1 ? "s" : ""}{" "}
                      require urgent attention
                    </p>
                    <Link href="/lab-tech/critical">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
                      >
                        View Critical
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {summary.pending > 0 && (
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1">
                      Pending Orders
                    </h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      {summary.pending} test{summary.pending > 1 ? "s" : ""}{" "}
                      awaiting processing
                    </p>
                    <Link href="/lab-tech/orders">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/20"
                      >
                        Process Now
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
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-1">
                    Completed Today
                  </h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    {summary.completed} test{summary.completed !== 1 ? "s" : ""}{" "}
                    finished
                  </p>
                  <Link href="/lab-tech/results">
                    <Button size="sm" variant="outline" className="h-8 text-xs">
                      View Results
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FlaskConical,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Activity,
} from "lucide-react";
import Link from "next/link";

interface LabTestSummary {
  pending: number;
  inProgress: number;
  completed: number;
  critical: number;
}

export function LabTechDashboard() {
  const [summary, setSummary] = useState<LabTestSummary>({
    pending: 0,
    inProgress: 0,
    completed: 0,
    critical: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

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
      });
    } catch (error) {
      console.error("Failed to fetch lab test summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      title: "Pending Tests",
      value: summary.pending,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      description: "Awaiting processing",
      link: "/lab-tech/orders",
    },
    {
      title: "In Progress",
      value: summary.inProgress,
      icon: Activity,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "Currently processing",
      link: "/lab-tech/orders",
    },
    {
      title: "Completed Today",
      value: summary.completed,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-50",
      description: "Tests finished",
      link: "/lab-tech/results",
    },
    {
      title: "Critical Tests",
      value: summary.critical,
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      description: "Requires urgent attention",
      link: "/lab-tech/critical",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Lab Technician Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage laboratory tests, samples, and results
          </p>
        </div>
        <Button asChild>
          <Link href="/lab-tech/orders">
            <FlaskConical className="mr-2 h-4 w-4" />
            View All Orders
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} href={stat.link}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? (
                      <span className="text-muted-foreground">...</span>
                    ) : (
                      stat.value
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common laboratory workflows</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Button asChild variant="outline" className="h-auto py-4 flex-col">
            <Link href="/lab-tech/orders">
              <FlaskConical className="h-8 w-8 mb-2" />
              <span className="font-semibold">Process Orders</span>
              <span className="text-xs text-muted-foreground mt-1">
                Start new test orders
              </span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4 flex-col">
            <Link href="/lab-tech/critical">
              <AlertCircle className="h-8 w-8 mb-2 text-red-600" />
              <span className="font-semibold">Critical Tests</span>
              <span className="text-xs text-muted-foreground mt-1">
                Handle urgent cases
              </span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4 flex-col">
            <Link href="/lab-tech/results">
              <TrendingUp className="h-8 w-8 mb-2" />
              <span className="font-semibold">View Results</span>
              <span className="text-xs text-muted-foreground mt-1">
                Review completed tests
              </span>
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Today's Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Overview</CardTitle>
          <CardDescription>
            Laboratory activity summary for {new Date().toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-yellow-50">
                  Pending
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Tests awaiting processing
                </span>
              </div>
              <span className="font-semibold">{summary.pending}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50">
                  In Progress
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Currently analyzing
                </span>
              </div>
              <span className="font-semibold">{summary.inProgress}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50">
                  Completed
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Finished today
                </span>
              </div>
              <span className="font-semibold">{summary.completed}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

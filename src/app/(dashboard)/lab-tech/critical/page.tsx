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
import { SkeletonShinyGradient } from "@/components/ui/skeleton-shiny";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCircle, Play, Eye, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface LabTest {
  id: string;
  patientId: string;
  testType: string;
  priority: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  orderedAt: string;
  instructions?: string;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    phone: string;
  };
}

export default function CriticalTestsPage() {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCriticalTests();
    // Refresh every 30 seconds for critical tests
    const interval = setInterval(fetchCriticalTests, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchCriticalTests = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        "/api/lab-tech/lab-tests?status=PENDING,IN_PROGRESS",
      );
      if (res.ok) {
        const data = await res.json();
        // Filter for CRITICAL and URGENT priority
        const critical = data.filter(
          (test: LabTest) =>
            test.priority === "CRITICAL" || test.priority === "URGENT",
        );
        setTests(critical);
      }
    } catch (error) {
      console.error("Failed to fetch critical tests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async (testId: string) => {
    try {
      const res = await fetch(`/api/lab-tech/lab-tests/${testId}/start`, {
        method: "PATCH",
      });

      if (res.ok) {
        toast({
          title: "Test Started",
          description: "Critical test processing has begun",
        });
        fetchCriticalTests();
      } else {
        const error = await res.json();
        toast({
          title: "Error",
          description: error.error || "Failed to start test",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to start test:", error);
      toast({
        title: "Error",
        description: "Failed to start test",
        variant: "destructive",
      });
    }
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === "CRITICAL") {
      return (
        <Badge className="bg-red-600 hover:bg-red-700">
          <AlertCircle className="mr-1 h-3 w-3" />
          CRITICAL
        </Badge>
      );
    }
    return (
      <Badge className="bg-orange-600 hover:bg-orange-700">
        <AlertCircle className="mr-1 h-3 w-3" />
        URGENT
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-red-600 flex items-center gap-2">
            <AlertCircle className="h-8 w-8" />
            Critical Lab Tests
          </h1>
          <p className="text-muted-foreground mt-2">
            Urgent and critical priority tests requiring immediate attention
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/lab-tech">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {/* Alert Banner */}
      {tests.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {tests.length} Critical Test{tests.length !== 1 ? "s" : ""}{" "}
              Pending
            </CardTitle>
            <CardDescription className="text-red-700">
              These tests require urgent processing. Please prioritize
              accordingly.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Critical Tests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Critical Test Queue</CardTitle>
          <CardDescription>High-priority laboratory tests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Priority</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Test Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ordered</TableHead>
                  <TableHead>Instructions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div className="space-y-3 py-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <SkeletonShinyGradient
                            key={i}
                            className="h-16 rounded-lg bg-muted"
                          />
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : tests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <AlertCircle className="h-12 w-12 text-green-600" />
                        <p className="font-medium text-green-600">
                          No Critical Tests
                        </p>
                        <p className="text-sm">
                          All critical tests have been processed
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  tests.map((test) => (
                    <TableRow key={test.id} className="hover:bg-red-50">
                      <TableCell>{getPriorityBadge(test.priority)}</TableCell>
                      <TableCell>
                        {test.patient ? (
                          <div>
                            <div className="font-medium">
                              {test.patient.firstName} {test.patient.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {test.patient.gender} •{" "}
                              {new Date(
                                test.patient.dateOfBirth,
                              ).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {test.testType}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            test.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                          }
                        >
                          {test.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>
                          {new Date(test.orderedAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(test.orderedAt).toLocaleTimeString()}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm truncate">
                          {test.instructions || "No special instructions"}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/lab-tech/orders`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          {test.status === "PENDING" && (
                            <Button
                              size="sm"
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => handleStartTest(test.id)}
                            >
                              <Play className="mr-1 h-3 w-3" />
                              Start Now
                            </Button>
                          )}
                          {test.status === "IN_PROGRESS" && (
                            <Button size="sm" variant="outline" asChild>
                              <Link href="/lab-tech/orders">Continue</Link>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Priority Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <Badge className="bg-red-600 mt-1">CRITICAL</Badge>
            <p className="text-sm text-muted-foreground">
              Life-threatening conditions. Process immediately - target
              completion within 1 hour.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Badge className="bg-orange-600 mt-1">URGENT</Badge>
            <p className="text-sm text-muted-foreground">
              Time-sensitive cases. Process as soon as possible - target
              completion within 4 hours.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

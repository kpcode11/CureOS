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
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  FileText,
  User,
  Calendar,
  AlertCircle,
  Download,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface LabTest {
  id: string;
  patientId: string;
  testType: string;
  priority: string;
  status: string;
  orderedAt: string;
  completedAt?: string;
  instructions?: string;
  results?: any;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    phone: string;
  };
}

export default function ResultDetailPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const [test, setTest] = useState<LabTest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchTestDetails();
    }
  }, [orderId]);

  const fetchTestDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/lab-tech/lab-tests/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setTest(data);
      }
    } catch (error) {
      console.error("Failed to fetch test details:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, { className: string }> = {
      CRITICAL: { className: "bg-red-600 text-white" },
      URGENT: { className: "bg-orange-600 text-white" },
      ROUTINE: { className: "bg-gray-600 text-white" },
    };
    const config = variants[priority] || variants.ROUTINE;
    return (
      <Badge className={config.className}>
        {priority === "CRITICAL" && <AlertCircle className="mr-1 h-3 w-3" />}
        {priority}
      </Badge>
    );
  };

  const formatResults = (results: any) => {
    if (!results) return "No results available";
    if (typeof results === "string") return results;
    return JSON.stringify(results, null, 2);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!test) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <FileText className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Test Not Found</h2>
        <p className="text-muted-foreground">
          The requested lab test could not be found.
        </p>
        <Button asChild>
          <Link href="/lab-tech/results">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Results
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Lab Test Results
          </h1>
          <p className="text-muted-foreground mt-2">
            Detailed information and results for test {orderId.substring(0, 8)}
            ...
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button asChild variant="outline">
            <Link href="/lab-tech/results">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
      </div>

      {/* Test Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Test Information</CardTitle>
              <CardDescription>
                Basic details about this laboratory test
              </CardDescription>
            </div>
            {getPriorityBadge(test.priority)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Test ID
                </label>
                <p className="font-mono text-sm mt-1">{test.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Test Type
                </label>
                <p className="font-semibold text-lg mt-1">{test.testType}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Status
                </label>
                <div className="mt-1">
                  <Badge
                    variant="outline"
                    className="bg-green-100 text-green-800"
                  >
                    {test.status}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Ordered At
                </label>
                <p className="mt-1">
                  {new Date(test.orderedAt).toLocaleString()}
                </p>
              </div>
              {test.completedAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Completed At
                  </label>
                  <p className="mt-1">
                    {new Date(test.completedAt).toLocaleString()}
                  </p>
                </div>
              )}
              {test.instructions && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Instructions
                  </label>
                  <p className="text-sm mt-1">{test.instructions}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patient Information */}
      {test.patient && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Patient Information
            </CardTitle>
            <CardDescription>Details about the patient</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Full Name
                </label>
                <p className="font-semibold mt-1">
                  {test.patient.firstName} {test.patient.lastName}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Gender
                </label>
                <p className="mt-1">{test.patient.gender}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Date of Birth
                </label>
                <p className="mt-1">
                  {new Date(test.patient.dateOfBirth).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Phone
                </label>
                <p className="mt-1">{test.patient.phone}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Laboratory Results
          </CardTitle>
          <CardDescription>
            Detailed test findings and measurements
          </CardDescription>
        </CardHeader>
        <CardContent>
          {test.results ? (
            <div className="bg-muted/50 rounded-lg p-4">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {formatResults(test.results)}
              </pre>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 space-y-2 text-muted-foreground">
              <FileText className="h-12 w-12" />
              <p className="font-medium">No Results Available</p>
              <p className="text-sm">Test results have not been entered yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

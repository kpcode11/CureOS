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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle2, Search, Eye, FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface LabTest {
  id: string;
  patientId: string;
  testType: string;
  priority: string;
  status: string;
  orderedAt: string;
  completedAt?: string;
  results?: any;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
  };
}

export default function ResultsPage() {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [filteredTests, setFilteredTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCompletedTests();
  }, []);

  useEffect(() => {
    filterTests();
  }, [searchQuery, tests]);

  const fetchCompletedTests = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/lab-tech/lab-tests?status=COMPLETED");
      if (res.ok) {
        const data = await res.json();
        setTests(data);
      }
    } catch (error) {
      console.error("Failed to fetch completed tests:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterTests = () => {
    if (!searchQuery) {
      setFilteredTests(tests);
      return;
    }

    const filtered = tests.filter((test) => {
      const searchLower = searchQuery.toLowerCase();
      const patientName = test.patient
        ? `${test.patient.firstName} ${test.patient.lastName}`.toLowerCase()
        : "";
      return (
        test.testType.toLowerCase().includes(searchLower) ||
        patientName.includes(searchLower) ||
        test.id.toLowerCase().includes(searchLower)
      );
    });

    setFilteredTests(filtered);
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, string> = {
      CRITICAL: "bg-red-100 text-red-800",
      URGENT: "bg-orange-100 text-orange-800",
      ROUTINE: "bg-gray-100 text-gray-800",
    };
    return (
      <Badge
        variant="outline"
        className={variants[priority] || variants.ROUTINE}
      >
        {priority}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            Completed Tests
          </h1>
          <p className="text-muted-foreground mt-2">
            View and manage completed laboratory test results
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/lab-tech">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Test Results Archive</CardTitle>
              <CardDescription>
                Browse completed laboratory tests
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by test type, patient name, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test ID</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Test Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Results</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading completed tests...
                    </TableCell>
                  </TableRow>
                ) : filteredTests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <FileText className="h-12 w-12" />
                        <p className="font-medium">No Completed Tests</p>
                        <p className="text-sm">
                          Completed test results will appear here
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTests.map((test) => (
                    <TableRow key={test.id}>
                      <TableCell className="font-mono text-xs">
                        {test.id.substring(0, 8)}...
                      </TableCell>
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
                      <TableCell>{getPriorityBadge(test.priority)}</TableCell>
                      <TableCell className="text-sm">
                        {test.completedAt ? (
                          <div>
                            <div>
                              {new Date(test.completedAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(test.completedAt).toLocaleTimeString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {test.results ? (
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-800"
                          >
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Available
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-gray-100 text-gray-800"
                          >
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/lab-tech/results/${test.id}`}>
                            <Eye className="mr-1 h-3 w-3" />
                            View Details
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

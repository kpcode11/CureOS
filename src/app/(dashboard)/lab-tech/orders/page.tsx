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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FlaskConical,
  Play,
  CheckCircle,
  Search,
  Filter,
  Clock,
  Activity,
  AlertCircle,
  Eye,
  FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface LabTest {
  id: string;
  patientId: string;
  testType: string;
  priority: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
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

export default function LabOrdersPage() {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [filteredTests, setFilteredTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [resultsInput, setResultsInput] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchTests();
  }, []);

  useEffect(() => {
    filterTests();
  }, [searchQuery, tests, activeTab]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/lab-tech/lab-tests");
      if (res.ok) {
        const data = await res.json();
        setTests(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch lab tests",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to fetch lab tests:", error);
      toast({
        title: "Error",
        description: "Failed to fetch lab tests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTests = () => {
    let filtered = tests;

    // Filter by status tab
    if (activeTab !== "all") {
      filtered = filtered.filter(
        (test) => test.status === activeTab.toUpperCase(),
      );
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((test) => {
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
    }

    setFilteredTests(filtered);
  };

  const handleStartTest = async (testId: string) => {
    try {
      const res = await fetch(`/api/lab-tech/lab-tests/${testId}/start`, {
        method: "PATCH",
      });

      if (res.ok) {
        toast({
          title: "Test Started",
          description: "Lab test processing has begun",
        });
        fetchTests();
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

  const handleCompleteTest = async (testId: string) => {
    try {
      const res = await fetch(`/api/lab-tech/lab-tests/${testId}/complete`, {
        method: "PATCH",
      });

      if (res.ok) {
        toast({
          title: "Test Completed",
          description: "Lab test has been marked as completed",
        });
        fetchTests();
        setShowDetailsDialog(false);
      } else {
        const error = await res.json();
        toast({
          title: "Error",
          description: error.error || "Failed to complete test",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to complete test:", error);
      toast({
        title: "Error",
        description: "Failed to complete test",
        variant: "destructive",
      });
    }
  };

  const handleSubmitResults = async () => {
    if (!selectedTest || !resultsInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter test results",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch(
        `/api/lab-tech/lab-tests/${selectedTest.id}/results`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ results: resultsInput }),
        },
      );

      if (res.ok) {
        toast({
          title: "Results Saved",
          description: "Test results have been saved successfully",
        });
        fetchTests();
        setShowResultsDialog(false);
        setResultsInput("");
      } else {
        const error = await res.json();
        toast({
          title: "Error",
          description: error.error || "Failed to save results",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to save results:", error);
      toast({
        title: "Error",
        description: "Failed to save results",
        variant: "destructive",
      });
    }
  };

  const viewTestDetails = async (testId: string) => {
    try {
      const res = await fetch(`/api/lab-tech/lab-tests/${testId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedTest(data);
        setShowDetailsDialog(true);
      }
    } catch (error) {
      console.error("Failed to fetch test details:", error);
    }
  };

  const openResultsDialog = (test: LabTest) => {
    setSelectedTest(test);
    setResultsInput(
      typeof test.results === "string"
        ? test.results
        : JSON.stringify(test.results || "", null, 2),
    );
    setShowResultsDialog(true);
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, { variant: any; className: string }> = {
      CRITICAL: { variant: "destructive", className: "bg-red-600" },
      URGENT: { variant: "destructive", className: "bg-orange-600" },
      ROUTINE: { variant: "secondary", className: "" },
    };
    return variants[priority] || variants.ROUTINE;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { icon: any; className: string }> = {
      PENDING: { icon: Clock, className: "bg-yellow-100 text-yellow-800" },
      IN_PROGRESS: { icon: Activity, className: "bg-blue-100 text-blue-800" },
      COMPLETED: {
        icon: CheckCircle,
        className: "bg-green-100 text-green-800",
      },
      CANCELLED: { icon: AlertCircle, className: "bg-gray-100 text-gray-800" },
    };
    const config = variants[status] || variants.PENDING;
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={config.className}>
        <Icon className="mr-1 h-3 w-3" />
        {status.replace("_", " ")}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lab Test Orders</h1>
          <p className="text-muted-foreground mt-2">
            Process and manage laboratory test orders
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/lab-tech">
            <FlaskConical className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Test Queue</CardTitle>
              <CardDescription>
                View and process laboratory test orders
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by test type, patient name, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All ({tests.length})</TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({tests.filter((t) => t.status === "PENDING").length})
              </TabsTrigger>
              <TabsTrigger value="in_progress">
                In Progress (
                {tests.filter((t) => t.status === "IN_PROGRESS").length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed (
                {tests.filter((t) => t.status === "COMPLETED").length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test ID</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Test Type</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ordered</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Loading tests...
                        </TableCell>
                      </TableRow>
                    ) : filteredTests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No tests found
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
                                  {test.patient.firstName}{" "}
                                  {test.patient.lastName}
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
                            <Badge {...getPriorityBadge(test.priority)}>
                              {test.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(test.status)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(test.orderedAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => viewTestDetails(test.id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {test.status === "PENDING" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleStartTest(test.id)}
                                >
                                  <Play className="mr-1 h-3 w-3" />
                                  Start
                                </Button>
                              )}
                              {test.status === "IN_PROGRESS" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openResultsDialog(test)}
                                  >
                                    <FileText className="mr-1 h-3 w-3" />
                                    Results
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleCompleteTest(test.id)}
                                  >
                                    <CheckCircle className="mr-1 h-3 w-3" />
                                    Complete
                                  </Button>
                                </>
                              )}
                              {test.status === "COMPLETED" && (
                                <Button size="sm" variant="outline" asChild>
                                  <Link href={`/lab-tech/results/${test.id}`}>
                                    View Results
                                  </Link>
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Test Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Lab Test Details</DialogTitle>
            <DialogDescription>
              Complete information about this laboratory test
            </DialogDescription>
          </DialogHeader>
          {selectedTest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Test ID</Label>
                  <p className="font-mono text-sm">{selectedTest.id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedTest.status)}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Test Type</Label>
                  <p className="font-medium">{selectedTest.testType}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Priority</Label>
                  <div className="mt-1">
                    <Badge {...getPriorityBadge(selectedTest.priority)}>
                      {selectedTest.priority}
                    </Badge>
                  </div>
                </div>
              </div>

              {selectedTest.patient && (
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground">
                    Patient Information
                  </Label>
                  <div className="mt-2 space-y-2">
                    <p>
                      <span className="font-medium">Name:</span>{" "}
                      {selectedTest.patient.firstName}{" "}
                      {selectedTest.patient.lastName}
                    </p>
                    <p>
                      <span className="font-medium">DOB:</span>{" "}
                      {new Date(
                        selectedTest.patient.dateOfBirth,
                      ).toLocaleDateString()}
                    </p>
                    <p>
                      <span className="font-medium">Gender:</span>{" "}
                      {selectedTest.patient.gender}
                    </p>
                    <p>
                      <span className="font-medium">Phone:</span>{" "}
                      {selectedTest.patient.phone}
                    </p>
                  </div>
                </div>
              )}

              {selectedTest.instructions && (
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground">Instructions</Label>
                  <p className="mt-2 text-sm">{selectedTest.instructions}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <Label className="text-muted-foreground">Ordered At</Label>
                <p className="text-sm">
                  {new Date(selectedTest.orderedAt).toLocaleString()}
                </p>
              </div>

              {selectedTest.completedAt && (
                <div>
                  <Label className="text-muted-foreground">Completed At</Label>
                  <p className="text-sm">
                    {new Date(selectedTest.completedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDetailsDialog(false)}
            >
              Close
            </Button>
            {selectedTest?.status === "PENDING" && (
              <Button onClick={() => handleStartTest(selectedTest.id)}>
                <Play className="mr-2 h-4 w-4" />
                Start Test
              </Button>
            )}
            {selectedTest?.status === "IN_PROGRESS" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetailsDialog(false);
                    openResultsDialog(selectedTest);
                  }}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Enter Results
                </Button>
                <Button onClick={() => handleCompleteTest(selectedTest.id)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Complete
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Test Results</DialogTitle>
            <DialogDescription>
              Input the laboratory test results for this order
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Test Results</Label>
              <Textarea
                placeholder="Enter test results, measurements, observations..."
                value={resultsInput}
                onChange={(e) => setResultsInput(e.target.value)}
                rows={8}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResultsDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitResults}>Save Results</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

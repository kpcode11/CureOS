"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface InsurancePolicy {
  id: string;
  policyNumber: string;
  provider: string;
  coverageAmount: number;
}

interface InsuranceClaim {
  id: string;
  claimNumber: string;
  claimAmount: number;
  approvedAmount: number | null;
  claimDate: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PROCESSING" | "PAID";
  description: string;
  documents: string[];
  notes: string | null;
  processedAt: string | null;
  patient: Patient;
  policy: InsurancePolicy;
  createdAt: string;
}

export default function ClaimsPage() {
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [open, setOpen] = useState(false);
  const [processOpen, setProcessOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<InsuranceClaim | null>(
    null,
  );
  const [formData, setFormData] = useState({
    policyId: "",
    patientId: "",
    claimAmount: "",
    description: "",
    documents: "",
  });
  const [processData, setProcessData] = useState({
    status: "",
    approvedAmount: "",
    notes: "",
  });

  useEffect(() => {
    fetchClaims();
    fetchPolicies();
  }, [statusFilter]);

  const fetchClaims = async () => {
    try {
      const url = statusFilter && statusFilter !== 'all'
        ? `/api/insurance/claims?status=${statusFilter}`
        : "/api/insurance/claims";
      const res = await fetch(url);
      const data = await res.json();
      setClaims(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch claims:", err);
      setClaims([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPolicies = async () => {
    try {
      const res = await fetch("/api/insurance/policies?status=ACTIVE");
      const data = await res.json();
      setPolicies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch policies:", err);
      setPolicies([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/insurance/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          documents: formData.documents
            ? formData.documents.split(",").map((d) => d.trim())
            : [],
        }),
      });

      if (res.ok) {
        setOpen(false);
        fetchClaims();
        setFormData({
          policyId: "",
          patientId: "",
          claimAmount: "",
          description: "",
          documents: "",
        });
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create claim");
      }
    } catch (err) {
      console.error("Failed to create claim:", err);
      alert("Failed to create claim");
    }
  };

  const handleProcessClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim) return;

    try {
      const res = await fetch(`/api/insurance/claims/${selectedClaim.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(processData),
      });

      if (res.ok) {
        setProcessOpen(false);
        setSelectedClaim(null);
        fetchClaims();
        setProcessData({
          status: "",
          approvedAmount: "",
          notes: "",
        });
      } else {
        const error = await res.json();
        alert(error.error || "Failed to process claim");
      }
    } catch (err) {
      console.error("Failed to process claim:", err);
      alert("Failed to process claim");
    }
  };

  const openProcessDialog = (claim: InsuranceClaim) => {
    setSelectedClaim(claim);
    setProcessData({
      status: claim.status,
      approvedAmount: claim.approvedAmount?.toString() || "",
      notes: claim.notes || "",
    });
    setProcessOpen(true);
  };

  const stats = {
    total: claims.length,
    pending: claims.filter((c) => c.status === "PENDING").length,
    approved: claims.filter((c) => c.status === "APPROVED").length,
    rejected: claims.filter((c) => c.status === "REJECTED").length,
    totalClaimed: claims.reduce((sum, c) => sum + c.claimAmount, 0),
    totalApproved: claims
      .filter((c) => c.approvedAmount)
      .reduce((sum, c) => sum + (c.approvedAmount || 0), 0),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-500";
      case "PROCESSING":
        return "bg-blue-500";
      case "APPROVED":
        return "bg-green-500";
      case "REJECTED":
        return "bg-red-500";
      case "PAID":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-4 w-4" />;
      case "PROCESSING":
        return <AlertCircle className="h-4 w-4" />;
      case "APPROVED":
        return <CheckCircle className="h-4 w-4" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4" />;
      case "PAID":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex-1 bg-white">
      <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Insurance Claims
          </h1>
          <p className="text-gray-600 mt-1">
            Process and manage insurance claims
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
              <Plus className="w-4 h-4" />
              New Claim
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Create Insurance Claim</DialogTitle>
                <DialogDescription>
                  Submit a new insurance claim
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="policyId">Insurance Policy</Label>
                  <Select
                    value={formData.policyId}
                    onValueChange={(value) => {
                      const policy = policies.find((p) => p.id === value);
                      setFormData({
                        ...formData,
                        policyId: value,
                        patientId: (policy as any)?.patientId || "",
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select policy" />
                    </SelectTrigger>
                    <SelectContent>
                      {policies.map((policy: any) => (
                        <SelectItem key={policy.id} value={policy.id}>
                          {policy.policyNumber} - {policy.provider} (
                          {policy.patient.firstName} {policy.patient.lastName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="claimAmount">Claim Amount (₹)</Label>
                  <Input
                    id="claimAmount"
                    type="number"
                    placeholder="e.g., 50000"
                    value={formData.claimAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, claimAmount: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the treatment/procedure"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    required
                    rows={4}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="documents">
                    Documents (comma-separated URLs)
                  </Label>
                  <Input
                    id="documents"
                    placeholder="e.g., https://example.com/doc1.pdf, https://example.com/doc2.pdf"
                    value={formData.documents}
                    onChange={(e) =>
                      setFormData({ ...formData, documents: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Submit Claim</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-6 mb-6">
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Claims
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 dark:bg-green-900/20 border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approved}</div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 dark:bg-red-900/20 border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.rejected}</div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 dark:bg-purple-900/20 border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Claimed
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{stats.totalClaimed.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Approved
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{stats.totalApproved.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

      {/* Filters */}
      <Card className="bg-white border-gray-200 mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Claims Table */}
      <Card className="bg-white border-gray-200 mb-6">
        <CardHeader>
          <CardTitle className="text-gray-900">Insurance Claims</CardTitle>
          <CardDescription className="text-gray-600">
            {loading ? "Loading..." : `${claims.length} claims found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Claim Number</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Policy</TableHead>
                <TableHead>Claim Amount</TableHead>
                <TableHead>Approved</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claims.map((claim) => (
                <TableRow key={claim.id}>
                  <TableCell className="font-medium">
                    {claim.claimNumber}
                  </TableCell>
                  <TableCell>
                    {claim.patient.firstName} {claim.patient.lastName}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{claim.policy.policyNumber}</div>
                      <div className="text-muted-foreground">
                        {claim.policy.provider}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>₹{claim.claimAmount.toLocaleString()}</TableCell>
                  <TableCell>
                    {claim.approvedAmount
                      ? `₹${claim.approvedAmount.toLocaleString()}`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {new Date(
                      claim.claimDate || claim.createdAt,
                    ).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(claim.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(claim.status)}
                        {claim.status}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <button
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition"
                      onClick={() => openProcessDialog(claim)}
                    >
                      Process
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Process Claim Dialog */}
      <Dialog open={processOpen} onOpenChange={setProcessOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleProcessClaim}>
            <DialogHeader>
              <DialogTitle>Process Claim</DialogTitle>
              <DialogDescription>
                Update claim status and approval details
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={processData.status}
                  onValueChange={(value) =>
                    setProcessData({ ...processData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="PROCESSING">Processing</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="approvedAmount">Approved Amount (₹)</Label>
                <Input
                  id="approvedAmount"
                  type="number"
                  placeholder="e.g., 45000"
                  value={processData.approvedAmount}
                  onChange={(e) =>
                    setProcessData({
                      ...processData,
                      approvedAmount: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add processing notes"
                  value={processData.notes}
                  onChange={(e) =>
                    setProcessData({ ...processData, notes: e.target.value })
                  }
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Update Claim</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}

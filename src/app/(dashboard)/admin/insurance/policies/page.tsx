"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, FileText, Clock, CheckCircle, XCircle } from "lucide-react";
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
  policyType: string;
  coverageAmount: number;
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED" | "SUSPENDED";
  patient: Patient;
  claims: Array<{
    id: string;
    claimNumber: string;
    status: string;
    claimAmount: number;
  }>;
  createdAt: string;
}

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    patientId: "",
    provider: "",
    policyNumber: "",
    policyType: "",
    coverageAmount: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    fetchPolicies();
    fetchPatients();
  }, [statusFilter]);

  const fetchPolicies = async () => {
    try {
      const url =
        statusFilter && statusFilter !== "all"
          ? `/api/insurance/policies?status=${statusFilter}`
          : "/api/insurance/policies";
      const res = await fetch(url);
      const data = await res.json();
      setPolicies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch policies:", err);
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await fetch("/api/patients");
      const data = await res.json();
      setPatients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch patients:", err);
      setPatients([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/insurance/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setOpen(false);
        fetchPolicies();
        setFormData({
          patientId: "",
          provider: "",
          policyNumber: "",
          policyType: "",
          coverageAmount: "",
          startDate: "",
          endDate: "",
        });
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create policy");
      }
    } catch (err) {
      console.error("Failed to create policy:", err);
      alert("Failed to create policy");
    }
  };

  const stats = {
    total: policies.length,
    active: policies.filter((p) => p.status === "ACTIVE").length,
    expired: policies.filter((p) => p.status === "EXPIRED").length,
    totalCoverage: policies
      .filter((p) => p.status === "ACTIVE")
      .reduce((sum, p) => sum + p.coverageAmount, 0),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-500";
      case "EXPIRED":
        return "bg-gray-500";
      case "CANCELLED":
        return "bg-red-500";
      case "SUSPENDED":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <CheckCircle className="h-4 w-4" />;
      case "EXPIRED":
        return <Clock className="h-4 w-4" />;
      case "CANCELLED":
        return <XCircle className="h-4 w-4" />;
      case "SUSPENDED":
        return <Clock className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex-1 bg-white">
      <div className="p-8">
        <div className="flex justify-between items-center mb-8 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Insurance Policies
            </h1>
            <p className="text-gray-600 mt-1">
              Manage patient insurance policies
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                <Plus className="w-4 h-4" />
                Add Policy
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Create Insurance Policy</DialogTitle>
                  <DialogDescription>
                    Add a new insurance policy for a patient
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="patientId">Patient</Label>
                    <Select
                      value={formData.patientId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, patientId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select patient" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.firstName} {patient.lastName} -{" "}
                            {patient.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="provider">Provider</Label>
                      <Input
                        id="provider"
                        placeholder="e.g., Blue Cross Blue Shield"
                        value={formData.provider}
                        onChange={(e) =>
                          setFormData({ ...formData, provider: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="policyNumber">Policy Number</Label>
                      <Input
                        id="policyNumber"
                        placeholder="e.g., POL-123456"
                        value={formData.policyNumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            policyNumber: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="policyType">Policy Type</Label>
                      <Input
                        id="policyType"
                        placeholder="e.g., Health, Life, Dental"
                        value={formData.policyType}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            policyType: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="coverageAmount">
                        Coverage Amount (₹)
                      </Label>
                      <Input
                        id="coverageAmount"
                        type="number"
                        placeholder="e.g., 500000"
                        value={formData.coverageAmount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            coverageAmount: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            startDate: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) =>
                          setFormData({ ...formData, endDate: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Create Policy</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Policies
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 dark:bg-green-900/20 border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Policies
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-50 dark:bg-gray-900/20 border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Expired Policies
              </CardTitle>
              <Clock className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.expired}</div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 dark:bg-purple-900/20 border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Coverage
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{stats.totalCoverage.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white border-gray-200 mb-6">
          <CardHeader>
            <CardTitle className="text-gray-900">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Policies Table */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Insurance Policies</CardTitle>
            <CardDescription className="text-gray-600">
              {loading ? "Loading..." : `${policies.length} policies found`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Policy Number</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Coverage</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Claims</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell className="font-medium">
                      {policy.policyNumber}
                    </TableCell>
                    <TableCell>
                      {policy.patient.firstName} {policy.patient.lastName}
                    </TableCell>
                    <TableCell>{policy.provider}</TableCell>
                    <TableCell>{policy.policyType}</TableCell>
                    <TableCell>
                      ₹{policy.coverageAmount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>
                          {new Date(policy.startDate).toLocaleDateString()}
                        </div>
                        <div className="text-muted-foreground">
                          to {new Date(policy.endDate).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{policy.claims.length}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(policy.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(policy.status)}
                          {policy.status}
                        </span>
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

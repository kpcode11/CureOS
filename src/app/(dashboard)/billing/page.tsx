"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  IndianRupee,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowRight,
  TrendingUp,
  FileText,
  Users,
  Command,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";

interface BillingRecord {
  id: string;
  patientId: string;
  amount: number;
  description: string;
  status: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";
  dueDate: string;
  paidAt: string | null;
  createdAt: string;
  patient?: {
    name: string;
    mrn: string;
  };
}

const statusConfig = {
  PENDING: {
    color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    icon: Clock,
    label: "Pending",
  },
  PAID: {
    color: "bg-green-50 text-green-700 border-green-200",
    icon: CheckCircle2,
    label: "Paid",
  },
  OVERDUE: {
    color: "bg-red-50 text-red-700 border-red-200",
    icon: AlertCircle,
    label: "Overdue",
  },
  CANCELLED: {
    color: "bg-gray-50 text-gray-700 border-gray-200",
    icon: XCircle,
    label: "Cancelled",
  },
};

export default function BillingPage() {
  const { data: session } = useSession();
  const [bills, setBills] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    fetchBills();
  }, [statusFilter]);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const url =
        statusFilter !== "ALL"
          ? `/api/billing?status=${statusFilter}`
          : "/api/billing";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setBills(data);
      }
    } catch (error) {
      console.error("Error fetching bills:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBills = bills.filter(
    (bill) =>
      bill.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.patientId.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const stats = {
    total: bills.reduce((sum, b) => sum + b.amount, 0),
    pending: bills.filter((b) => b.status === "PENDING").length,
    paid: bills.filter((b) => b.status === "PAID").length,
    overdue: bills.filter((b) => b.status === "OVERDUE").length,
  };

  return (
    <div className="h-svh overflow-hidden lg:p-2 w-full">
      <div className="lg:border lg:rounded-md overflow-hidden flex flex-col h-full w-full bg-background">
        {/* Header */}
        <header className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-3 sm:py-4 border-b bg-card sticky top-0 z-10 w-full">
          <h1 className="text-base sm:text-lg font-medium flex-1 truncate">
            Billing & Payments
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
          <div className="space-y-2 sm:space-y-3">
            <h2 className="text-lg sm:text-[22px] font-semibold leading-relaxed">
              Welcome Back, {session?.user?.name || "Billing Officer"}!
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Financial overview and billing management
            </p>
          </div>

          {/* Stats Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 p-3 sm:p-4 lg:p-6 rounded-xl border bg-card">
            <div className="group flex flex-col justify-between p-4 rounded-lg transition-all bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <IndianRupee className="w-5 h-5" />
                  <span className="text-[10px] sm:text-xs lg:text-sm font-medium">
                    Total Revenue
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-lg sm:text-xl lg:text-[28px] font-semibold">
                  ₹{loading ? "0" : stats.total.toLocaleString()}
                </p>
                <div className="flex items-center gap-1 text-[10px] sm:text-xs font-medium text-emerald-600">
                  <TrendingUp className="w-3 h-3" />
                  +12.5%
                </div>
              </div>
            </div>

            <div className="group flex flex-col justify-between p-4 rounded-lg transition-all bg-yellow-50 dark:bg-yellow-900/20">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-5 h-5" />
                  <span className="text-[10px] sm:text-xs lg:text-sm font-medium">
                    Pending
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-lg sm:text-xl lg:text-[28px] font-semibold">
                  {loading ? "-" : stats.pending}
                </p>
              </div>
            </div>

            <div className="group flex flex-col justify-between p-4 rounded-lg transition-all bg-green-50 dark:bg-green-900/20">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-[10px] sm:text-xs lg:text-sm font-medium">
                    Paid
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-lg sm:text-xl lg:text-[28px] font-semibold">
                  {loading ? "-" : stats.paid}
                </p>
              </div>
            </div>

            <div className="group flex flex-col justify-between p-4 rounded-lg transition-all bg-red-50 dark:bg-red-900/20">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-[10px] sm:text-xs lg:text-sm font-medium">
                    Overdue
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-lg sm:text-xl lg:text-[28px] font-semibold">
                  {loading ? "-" : stats.overdue}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <Link
              href="/billing/overdue"
              className="group relative overflow-hidden rounded-lg border bg-card p-4 transition-all hover:bg-accent hover:border-primary/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-red-100 dark:bg-red-900/30 p-2 text-red-600 dark:text-red-400">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <h4 className="font-medium text-sm">View Overdue Bills</h4>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </Link>

            <Link
              href="/billing/audit-logs"
              className="group relative overflow-hidden rounded-lg border bg-card p-4 transition-all hover:bg-accent hover:border-primary/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-blue-100 dark:bg-blue-900/30 p-2 text-blue-600 dark:text-blue-400">
                    <FileText className="h-4 w-4" />
                  </div>
                  <h4 className="font-medium text-sm">Audit Logs</h4>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </Link>

            <Link
              href="/billing/patient"
              className="group relative overflow-hidden rounded-lg border bg-card p-4 transition-all hover:bg-accent hover:border-primary/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-purple-100 dark:bg-purple-900/30 p-2 text-purple-600 dark:text-purple-400">
                    <Users className="h-4 w-4" />
                  </div>
                  <h4 className="font-medium text-sm">Search by Patient</h4>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </Link>
          </div>

          {/* Search & Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search by patient ID or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {["ALL", "PENDING", "PAID", "OVERDUE", "CANCELLED"].map(
                    (status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant={
                          statusFilter === status ? "default" : "outline"
                        }
                        onClick={() => setStatusFilter(status)}
                        className="h-9 text-xs"
                      >
                        {status}
                      </Button>
                    ),
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoices Table */}
          <Card>
            <CardContent className="p-0">
              <div className="px-4 sm:px-6 py-4 border-b">
                <h3 className="text-base sm:text-lg font-semibold">
                  Recent Invoices
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Showing {filteredBills.length} of {bills.length} total bills
                </p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : filteredBills.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">
                    No bills found
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">
                          Invoice ID
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">
                          Patient
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">
                          Description
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">
                          Amount
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">
                          Due Date
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">
                          Status
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBills.map((bill) => {
                        const StatusIcon = statusConfig[bill.status].icon;
                        return (
                          <tr
                            key={bill.id}
                            className="border-b hover:bg-muted/50 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <span className="font-mono text-xs text-muted-foreground">
                                {bill.id.slice(0, 8)}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-sm font-medium">
                                {bill.patientId.slice(0, 8)}
                              </span>
                            </td>
                            <td className="py-3 px-4 max-w-xs truncate">
                              <span className="text-sm">
                                {bill.description}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-sm font-semibold">
                                ₹{bill.amount.toLocaleString()}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {new Date(bill.dueDate).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              <Badge
                                variant="outline"
                                className={`${statusConfig[bill.status].color} border flex items-center gap-1 w-fit text-xs`}
                              >
                                <StatusIcon className="w-3 h-3" />
                                {statusConfig[bill.status].label}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Link href={`/billing/${bill.id}`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-xs"
                                >
                                  View
                                  <ArrowRight className="w-3 h-3 ml-1" />
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}

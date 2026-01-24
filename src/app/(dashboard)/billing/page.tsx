"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  CreditCard,
  DollarSign,
  Search,
  Filter,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowRight,
  TrendingUp,
  FileText,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Hero Header */}
      <motion.div
        className="relative bg-white border-b"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
                  Billing & Payments
                </h1>
              </div>
              <p className="text-slate-600 text-lg">
                Manage invoices, payments, and financial records
              </p>
            </div>
            <Link href="/billing/create">
              <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg">
                <Plus className="w-4 h-4 mr-2" />
                New Invoice
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <Card className="border-none shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">
                      Total Revenue
                    </p>
                    <p className="text-3xl font-bold mt-2">
                      ₹{stats.total.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-lg">
                    <DollarSign className="w-8 h-8" />
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-4 text-blue-100">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">+12.5% from last month</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">
                      Pending
                    </p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">
                      {stats.pending}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Clock className="w-8 h-8 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Paid</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">
                      {stats.paid}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">
                      Overdue
                    </p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">
                      {stats.overdue}
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-lg">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Link href="/billing/overdue">
            <Card className="border-2 border-red-200 hover:border-red-300 hover:shadow-lg transition-all cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="font-semibold text-slate-900">
                    View Overdue Bills
                  </span>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/billing/audit-logs">
            <Card className="border-2 border-blue-200 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-slate-900">
                    Audit Logs
                  </span>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/billing/patient">
            <Card className="border-2 border-purple-200 hover:border-purple-300 hover:shadow-lg transition-all cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Search className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-slate-900">
                    Search by Patient
                  </span>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400" />
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        {/* Filters & Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="mb-6 border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Search by patient ID or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-slate-200 focus:border-blue-500 h-11"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {["ALL", "PENDING", "PAID", "OVERDUE", "CANCELLED"].map(
                    (status) => (
                      <Button
                        key={status}
                        variant={
                          statusFilter === status ? "default" : "outline"
                        }
                        onClick={() => setStatusFilter(status)}
                        className={statusFilter === status ? "bg-blue-600" : ""}
                      >
                        <Filter className="w-4 h-4 mr-2" />
                        {status}
                      </Button>
                    ),
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Billing Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Recent Invoices</CardTitle>
              <CardDescription>
                Showing {filteredBills.length} of {bills.length} total bills
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                </div>
              ) : filteredBills.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 text-lg">No bills found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-4 px-4 font-semibold text-slate-700">
                          Invoice ID
                        </th>
                        <th className="text-left py-4 px-4 font-semibold text-slate-700">
                          Patient ID
                        </th>
                        <th className="text-left py-4 px-4 font-semibold text-slate-700">
                          Description
                        </th>
                        <th className="text-left py-4 px-4 font-semibold text-slate-700">
                          Amount
                        </th>
                        <th className="text-left py-4 px-4 font-semibold text-slate-700">
                          Due Date
                        </th>
                        <th className="text-left py-4 px-4 font-semibold text-slate-700">
                          Status
                        </th>
                        <th className="text-left py-4 px-4 font-semibold text-slate-700">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBills.map((bill, index) => {
                        const StatusIcon = statusConfig[bill.status].icon;
                        return (
                          <motion.tr
                            key={bill.id}
                            className="border-b border-slate-100 hover:bg-blue-50/50 transition-colors"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <td className="py-4 px-4">
                              <span className="font-mono text-sm text-slate-600">
                                {bill.id.slice(0, 8)}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="font-medium text-slate-900">
                                {bill.patientId.slice(0, 8)}
                              </span>
                            </td>
                            <td className="py-4 px-4 max-w-xs truncate">
                              {bill.description}
                            </td>
                            <td className="py-4 px-4">
                              <span className="font-bold text-slate-900">
                                ₹{bill.amount.toLocaleString()}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-slate-600">
                              {new Date(bill.dueDate).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-4">
                              <Badge
                                className={`${statusConfig[bill.status].color} border flex items-center gap-1 w-fit`}
                              >
                                <StatusIcon className="w-3 h-3" />
                                {statusConfig[bill.status].label}
                              </Badge>
                            </td>
                            <td className="py-4 px-4">
                              <Link href={`/billing/${bill.id}`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  View Details
                                  <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                              </Link>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import {
  User,
  ArrowLeft,
  CreditCard,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    icon: AlertCircle,
    label: "Cancelled",
  },
};

export default function PatientBillingPage() {
  const params = useParams();
  const [bills, setBills] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatientBills();
  }, [params.patientId]);

  const fetchPatientBills = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/billing/patient/${params.patientId}`);
      if (res.ok) {
        const data = await res.json();
        setBills(data);
      }
    } catch (error) {
      console.error("Error fetching patient bills:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: bills.reduce((sum, b) => sum + b.amount, 0),
    pending: bills
      .filter((b) => b.status === "PENDING")
      .reduce((sum, b) => sum + b.amount, 0),
    paid: bills
      .filter((b) => b.status === "PAID")
      .reduce((sum, b) => sum + b.amount, 0),
    overdue: bills.filter((b) => b.status === "OVERDUE").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <motion.div
        className="relative bg-white border-b"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-blue-600/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/billing/patient">
              <Button variant="ghost" className="hover:bg-blue-50">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Search
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-600 rounded-xl">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Patient Billing History
                </h1>
                <p className="text-slate-600 mt-1">
                  Patient ID: {params.patientId}
                </p>
              </div>
            </div>
            <Badge className="bg-blue-100 text-blue-700 border-blue-300 border px-4 py-2 text-base">
              {bills.length} Invoices
            </Badge>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-none shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">
                    Total Billed
                  </p>
                  <p className="text-3xl font-bold mt-2">
                    ₹{stats.total.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <CreditCard className="w-8 h-8" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-4 text-purple-100">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">All time</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Pending</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">
                    ₹{stats.pending.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Paid</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">
                    ₹{stats.paid.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">
                    Overdue Bills
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

        {/* Bills List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Invoice History</CardTitle>
              <CardDescription>
                Complete billing history for patient{" "}
                {params.patientId?.toString().slice(0, 8)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
                </div>
              ) : bills.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 text-lg">
                    No bills found for this patient
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bills.map((bill, index) => {
                    const StatusIcon = statusConfig[bill.status].icon;
                    return (
                      <motion.div
                        key={bill.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="border-2 hover:border-purple-300 hover:shadow-md transition-all">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-bold text-lg text-slate-900">
                                    Invoice #{bill.id.slice(0, 8).toUpperCase()}
                                  </h3>
                                  <Badge
                                    className={`${statusConfig[bill.status].color} border flex items-center gap-1`}
                                  >
                                    <StatusIcon className="w-3 h-3" />
                                    {statusConfig[bill.status].label}
                                  </Badge>
                                </div>
                                <p className="text-slate-600 mb-3">
                                  {bill.description}
                                </p>
                                <div className="flex items-center gap-6 text-sm text-slate-500">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>
                                      Created:{" "}
                                      {new Date(
                                        bill.createdAt,
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span>
                                      Due:{" "}
                                      {new Date(
                                        bill.dueDate,
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                  {bill.paidAt && (
                                    <div className="flex items-center gap-1">
                                      <CheckCircle2 className="w-4 h-4" />
                                      <span>
                                        Paid:{" "}
                                        {new Date(
                                          bill.paidAt,
                                        ).toLocaleDateString()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-6">
                                <div className="text-right">
                                  <p className="text-sm text-slate-600 mb-1">
                                    Amount
                                  </p>
                                  <p className="text-2xl font-bold text-purple-600">
                                    ₹{bill.amount.toLocaleString()}
                                  </p>
                                </div>
                                <Link href={`/billing/${bill.id}`}>
                                  <Button
                                    variant="ghost"
                                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                  >
                                    View
                                    <ArrowRight className="w-4 h-4 ml-1" />
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowLeft,
  CreditCard,
  Calendar,
  DollarSign,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Edit,
  Wallet,
  Settings,
  Download,
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
  updatedAt: string;
  patient?: {
    name: string;
    mrn: string;
    email?: string;
    phone?: string;
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
    icon: AlertCircle,
    label: "Cancelled",
  },
};

export default function BillingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [bill, setBill] = useState<BillingRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillDetails();
  }, [params.id]);

  const fetchBillDetails = async () => {
    try {
      const res = await fetch(`/api/billing/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setBill(data);
      } else {
        console.error("Failed to fetch bill details");
      }
    } catch (error) {
      console.error("Error fetching bill:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Bill Not Found
            </h2>
            <p className="text-slate-600 mb-6">
              The bill you're looking for doesn't exist.
            </p>
            <Link href="/billing">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Billing
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const StatusIcon = statusConfig[bill.status].icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <motion.div
        className="relative bg-white border-b"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/billing">
              <Button variant="ghost" className="hover:bg-blue-50">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-xl">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Invoice Details
                </h1>
                <p className="text-slate-600 mt-1">
                  Invoice #{bill.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
            </div>
            <Badge
              className={`${statusConfig[bill.status].color} border px-4 py-2 text-lg`}
            >
              <StatusIcon className="w-5 h-5 mr-2" />
              {statusConfig[bill.status].label}
            </Badge>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-none shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <CardTitle className="text-2xl">Invoice Summary</CardTitle>
                  <CardDescription>
                    Complete billing information
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-slate-600">
                        <User className="w-4 h-4" />
                        <span className="text-sm font-medium">Patient</span>
                      </div>
                      <p className="text-lg font-semibold text-slate-900">
                        {bill.patient?.name || 'Unknown Patient'}
                      </p>
                      <p className="text-sm text-slate-600">
                        MRN: {bill.patient?.mrn || bill.patientId}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-slate-600">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-sm font-medium">Amount</span>
                      </div>
                      <p className="text-3xl font-bold text-blue-600">
                        ₹{bill.amount.toLocaleString()}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm font-medium">Due Date</span>
                      </div>
                      <p className="text-lg font-semibold text-slate-900">
                        {new Date(bill.dueDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium">Created On</span>
                      </div>
                      <p className="text-lg font-semibold text-slate-900">
                        {new Date(bill.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-start gap-2 text-slate-600 mb-2">
                      <FileText className="w-4 h-4 mt-1" />
                      <span className="text-sm font-medium">Description</span>
                    </div>
                    <p className="text-slate-900 text-lg leading-relaxed">
                      {bill.description}
                    </p>
                  </div>

                  {bill.paidAt && (
                    <div className="pt-4 border-t">
                      <div className="flex items-center gap-2 text-green-600 mb-2">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-medium">
                          Paid on{" "}
                          {new Date(bill.paidAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle>Activity Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="w-0.5 h-full bg-slate-200 mt-2" />
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-semibold text-slate-900">
                          Invoice Created
                        </p>
                        <p className="text-sm text-slate-600">
                          {new Date(bill.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {bill.updatedAt !== bill.createdAt && (
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                            <Edit className="w-5 h-5 text-yellow-600" />
                          </div>
                          <div className="w-0.5 h-full bg-slate-200 mt-2" />
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="font-semibold text-slate-900">
                            Last Updated
                          </p>
                          <p className="text-sm text-slate-600">
                            {new Date(bill.updatedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}

                    {bill.paidAt && (
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">
                            Payment Received
                          </p>
                          <p className="text-sm text-slate-600">
                            {new Date(bill.paidAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-none shadow-lg sticky top-6">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  {bill.status === "PENDING" && (
                    <Link href={`/billing/${bill.id}/pay`}>
                      <Button className="w-full bg-green-600 hover:bg-green-700 shadow-md">
                        <Wallet className="w-4 h-4 mr-2" />
                        Process Payment
                      </Button>
                    </Link>
                  )}

                  <Link href={`/billing/${bill.id}/update`}>
                    <Button className="w-full" variant="outline">
                      <Edit className="w-4 h-4 mr-2" />
                      Update Amount
                    </Button>
                  </Link>

                  <Link href={`/billing/${bill.id}/status`}>
                    <Button className="w-full" variant="outline">
                      <Settings className="w-4 h-4 mr-2" />
                      Change Status
                    </Button>
                  </Link>

                  <Button className="w-full" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download Invoice
                  </Button>

                  <div className="pt-4 border-t">
                    <Link href={`/billing/patient/${bill.patientId}`}>
                      <Button className="w-full" variant="ghost">
                        <User className="w-4 h-4 mr-2" />
                        View Patient Bills
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Info Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-l-4 border-l-blue-600 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2">
                        Need Help?
                      </h3>
                      <p className="text-sm text-slate-600">
                        Contact billing support for assistance with this invoice
                        or payment processing.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

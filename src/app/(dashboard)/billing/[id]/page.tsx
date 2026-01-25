"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  Calendar,
  IndianRupee,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Edit,
  Wallet,
  Settings,
  Download,
  Search,
  Command,
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
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { SkeletonShinyGradient } from "@/components/ui/skeleton-shiny";

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
      <div className="h-svh overflow-hidden lg:p-2 w-full">
        <div className="lg:border lg:rounded-md overflow-hidden flex flex-col bg-container h-full w-full bg-background">
          <div className="flex items-center gap-3 px-6 py-4 border-b bg-card">
            <SkeletonShinyGradient className="h-10 w-10 rounded-lg bg-muted" />
            <div className="flex-1 space-y-2">
              <SkeletonShinyGradient className="h-5 w-48 rounded bg-muted" />
              <SkeletonShinyGradient className="h-4 w-32 rounded bg-muted" />
            </div>
          </div>
          <div className="flex-1 p-6 space-y-6">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <SkeletonShinyGradient className="h-96 rounded-lg bg-muted" />
              </div>
              <div className="space-y-4">
                <SkeletonShinyGradient className="h-64 rounded-lg bg-muted" />
                <SkeletonShinyGradient className="h-32 rounded-lg bg-muted" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="h-svh overflow-hidden lg:p-2 w-full">
        <div className="lg:border lg:rounded-md overflow-hidden flex items-center justify-center bg-container h-full w-full bg-background">
          <Card className="max-w-md border">
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Bill Not Found</h2>
              <p className="text-sm text-muted-foreground mb-6">
                The bill you're looking for doesn't exist.
              </p>
              <Link href="/billing">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Billing
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const StatusIcon = statusConfig[bill.status].icon;

  return (
    <div className="h-svh overflow-hidden lg:p-2 w-full">
      <div className="lg:border lg:rounded-md overflow-hidden flex flex-col items-center justify-start bg-container h-full w-full bg-background">
        {/* Header */}
        <header className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-3 sm:py-4 border-b bg-card sticky top-0 z-10 w-full">
          <Link href="/billing">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </Link>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-lg font-medium truncate">
                Invoice Details
              </h1>
              <p className="text-xs text-muted-foreground truncate">
                Invoice #{bill.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>

          <Badge
            className={`${statusConfig[bill.status].color} border-0 text-xs px-2 py-1`}
          >
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusConfig[bill.status].label}
          </Badge>

          <ThemeToggle />
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 w-full bg-background">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                {/* Invoice Summary */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg">
                      Invoice Summary
                    </CardTitle>
                    <CardDescription>
                      Complete billing information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="w-4 h-4" />
                          <span className="text-xs font-medium">Patient</span>
                        </div>
                        <p className="text-sm font-semibold">
                          {bill.patient?.name || "Unknown Patient"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          MRN:{" "}
                          {bill.patient?.mrn?.slice(0, 20) ||
                            bill.patientId.slice(0, 20)}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <IndianRupee className="w-4 h-4" />
                          <span className="text-xs font-medium">Amount</span>
                        </div>
                        <p className="text-2xl font-bold">
                          ₹{bill.amount.toLocaleString()}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span className="text-xs font-medium">Due Date</span>
                        </div>
                        <p className="text-sm font-semibold">
                          {new Date(bill.dueDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span className="text-xs font-medium">
                            Created On
                          </span>
                        </div>
                        <p className="text-sm font-semibold">
                          {new Date(bill.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            },
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <FileText className="w-4 h-4" />
                        <span className="text-xs font-medium">Description</span>
                      </div>
                      <p className="text-sm">{bill.description}</p>
                    </div>

                    {bill.paidAt && (
                      <div className="pt-3 border-t">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-sm font-medium">
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
              </div>

              {/* Actions Sidebar */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {bill.status === "PENDING" && (
                      <Link href={`/billing/${bill.id}/pay`} className="block">
                        <Button className="w-full" size="sm">
                          <Wallet className="w-4 h-4 mr-2" />
                          Process Payment
                        </Button>
                      </Link>
                    )}

                    <Link href={`/billing/${bill.id}/update`} className="block">
                      <Button className="w-full" variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Update Amount
                      </Button>
                    </Link>

                    <Link href={`/billing/${bill.id}/status`} className="block">
                      <Button className="w-full" variant="outline" size="sm">
                        <Settings className="w-4 h-4 mr-2" />
                        Change Status
                      </Button>
                    </Link>

                    <Button className="w-full" variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download Invoice
                    </Button>

                    <div className="pt-2 border-t">
                      <Link
                        href={`/billing/patient/${bill.patientId}`}
                        className="block"
                      >
                        <Button className="w-full" variant="ghost" size="sm">
                          <User className="w-4 h-4 mr-2" />
                          View Patient Bills
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 dark:border-blue-800">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold mb-1">
                          Need Help?
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Contact billing support for assistance with this
                          invoice or payment processing.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

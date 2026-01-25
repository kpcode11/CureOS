"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Search,
  Users,
  ArrowRight,
  TrendingUp,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Command,
  ChevronDown,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
}

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

interface BillingStats {
  totalRevenue: number;
  pendingAmount: number;
  paidAmount: number;
  totalBills: number;
  pendingBills: number;
  paidBills: number;
}

const statusConfig = {
  PENDING: {
    color:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    icon: Clock,
    label: "Pending",
  },
  PAID: {
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    icon: CheckCircle2,
    label: "Paid",
  },
  OVERDUE: {
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    icon: AlertCircle,
    label: "Overdue",
  },
  CANCELLED: {
    color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
    icon: AlertCircle,
    label: "Cancelled",
  },
};

export default function PatientBillingSearchPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [stats, setStats] = useState<BillingStats>({
    totalRevenue: 0,
    pendingAmount: 0,
    paidAmount: 0,
    totalBills: 0,
    pendingBills: 0,
    paidBills: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all patients on mount
  useEffect(() => {
    const fetchPatients = async () => {
      setLoadingPatients(true);
      try {
        const res = await fetch("/api/patients");
        if (res.ok) {
          const data = await res.json();
          setPatients(data);
        }
      } catch (error) {
        console.error("Error fetching patients:", error);
      } finally {
        setLoadingPatients(false);
      }
    };
    fetchPatients();
  }, []);

  // Fetch all billing records to calculate stats
  useEffect(() => {
    const fetchBillingStats = async () => {
      try {
        const res = await fetch("/api/billing");
        if (res.ok) {
          const data = await res.json();
          const records: BillingRecord[] = data;

          const calculatedStats = {
            totalRevenue: records.reduce((sum, r) => sum + r.amount, 0),
            pendingAmount: records
              .filter((r) => r.status === "PENDING" || r.status === "OVERDUE")
              .reduce((sum, r) => sum + r.amount, 0),
            paidAmount: records
              .filter((r) => r.status === "PAID")
              .reduce((sum, r) => sum + r.amount, 0),
            totalBills: records.length,
            pendingBills: records.filter(
              (r) => r.status === "PENDING" || r.status === "OVERDUE",
            ).length,
            paidBills: records.filter((r) => r.status === "PAID").length,
          };

          setStats(calculatedStats);
          setBillingRecords(records.slice(0, 10)); // Show top 10 recent records
        }
      } catch (error) {
        console.error("Error fetching billing stats:", error);
      }
    };
    fetchBillingStats();
  }, []);

  const handlePatientSelect = (patientId: string) => {
    setSelectedPatientId(patientId);
    router.push(`/billing/patient/${patientId}`);
  };

  const filteredRecords = billingRecords.filter(
    (record) =>
      record.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.patient?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.id.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="h-svh overflow-hidden lg:p-2 w-full">
      <div className="lg:border lg:rounded-md overflow-hidden flex flex-col items-center justify-start bg-container h-full w-full bg-background">
        {/* Header */}
        <header className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-3 sm:py-4 border-b bg-card sticky top-0 z-10 w-full">
          <h1 className="text-base sm:text-lg font-medium flex-1 truncate">
            Patient Billing Search
          </h1>

          <div className="hidden md:block relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
            <Input
              placeholder="Search Anything..."
              className="pl-10 pr-14 w-[180px] lg:w-[220px] h-9 bg-card border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
              Search patient billing records and manage invoices
            </p>
          </div>

          {/* Stats Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 p-3 sm:p-4 lg:p-6 rounded-xl border bg-card">
            <div className="group flex flex-col justify-between p-4 rounded-lg transition-all bg-blue-50 dark:bg-blue-900/20 hover:shadow-md cursor-pointer">
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
                  ₹{stats.totalRevenue.toLocaleString()}
                </p>
                <div className="flex items-center gap-1 text-[10px] sm:text-xs font-medium text-emerald-600">
                  <TrendingUp className="w-3 h-3" />
                  +12%
                </div>
              </div>
            </div>

            <div className="group flex flex-col justify-between p-4 rounded-lg transition-all bg-green-50 dark:bg-green-900/20 hover:shadow-md cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-[10px] sm:text-xs lg:text-sm font-medium">
                    Paid Bills
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-lg sm:text-xl lg:text-[28px] font-semibold">
                  {stats.paidBills}
                </p>
                <div className="flex items-center gap-1 text-[10px] sm:text-xs font-medium text-emerald-600">
                  <TrendingUp className="w-3 h-3" />
                  +8%
                </div>
              </div>
            </div>

            <div className="group flex flex-col justify-between p-4 rounded-lg transition-all bg-yellow-50 dark:bg-yellow-900/20 hover:shadow-md cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-5 h-5" />
                  <span className="text-[10px] sm:text-xs lg:text-sm font-medium">
                    Pending Bills
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-lg sm:text-xl lg:text-[28px] font-semibold">
                  {stats.pendingBills}
                </p>
                <div className="flex items-center gap-1 text-[10px] sm:text-xs font-medium text-emerald-600">
                  <TrendingUp className="w-3 h-3" />
                  +4%
                </div>
              </div>
            </div>

            <div className="group flex flex-col justify-between p-4 rounded-lg transition-all bg-purple-50 dark:bg-purple-900/20 hover:shadow-md cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="w-5 h-5" />
                  <span className="text-[10px] sm:text-xs lg:text-sm font-medium">
                    Total Bills
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-lg sm:text-xl lg:text-[28px] font-semibold">
                  {stats.totalBills}
                </p>
                <div className="flex items-center gap-1 text-[10px] sm:text-xs font-medium text-emerald-600">
                  <TrendingUp className="w-3 h-3" />
                  +15%
                </div>
              </div>
            </div>
          </div>

          {/* Patient Selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">
                Select Patient
              </CardTitle>
              <CardDescription>
                Choose a patient to view their complete billing history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Select
                  value={selectedPatientId}
                  onValueChange={handlePatientSelect}
                  disabled={loadingPatients}
                >
                  <SelectTrigger className="w-full h-11 text-sm">
                    <SelectValue
                      placeholder={
                        loadingPatients
                          ? "Loading patients..."
                          : "Select a patient..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        <div className="flex items-center justify-between w-full gap-3">
                          <span className="font-medium">
                            {patient.firstName} {patient.lastName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {patient.phone ||
                              patient.email ||
                              patient.id.slice(0, 8)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <p className="text-xs text-muted-foreground">
                  {patients.length} patients available in the system
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Billing Activity */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base sm:text-lg">
                    Recent Billing Activity
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Latest billing records across all patients
                  </CardDescription>
                </div>
                <Link href="/billing">
                  <Button variant="outline" size="sm" className="gap-2">
                    View All
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="px-0">
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
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">
                        Due Date
                      </th>
                      <th className="w-[50px]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12">
                          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                          <p className="text-sm text-muted-foreground">
                            No billing records found
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((bill) => {
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
                              <div>
                                <p className="text-sm font-medium">
                                  {bill.patient?.name || "Unknown"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {bill.patient?.mrn?.slice(0, 8) ||
                                    bill.patientId.slice(0, 8)}
                                </p>
                              </div>
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
                            <td className="py-3 px-4">
                              <Badge
                                className={`${statusConfig[bill.status].color} border-0 text-xs`}
                              >
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusConfig[bill.status].label}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {new Date(bill.dueDate).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              <Link href={`/billing/${bill.id}`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <ArrowRight className="h-4 w-4" />
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <Link
              href="/billing"
              className="group relative overflow-hidden rounded-lg border bg-card p-4 transition-all hover:bg-accent hover:border-primary/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-blue-100 dark:bg-blue-900/30 p-2 text-blue-600 dark:text-blue-400">
                    <FileText className="h-4 w-4" />
                  </div>
                  <h4 className="font-medium text-sm">All Invoices</h4>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </Link>

            <Link
              href="/billing/create"
              className="group relative overflow-hidden rounded-lg border bg-card p-4 transition-all hover:bg-accent hover:border-primary/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-green-100 dark:bg-green-900/30 p-2 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <h4 className="font-medium text-sm">Create Invoice</h4>
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
                  <div className="rounded-md bg-purple-100 dark:bg-purple-900/30 p-2 text-purple-600 dark:text-purple-400">
                    <Clock className="h-4 w-4" />
                  </div>
                  <h4 className="font-medium text-sm">Audit Logs</h4>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  AlertTriangle,
  Search,
  ArrowRight,
  IndianRupee,
  Clock,
  TrendingUp,
  Command,
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
import { ThemeToggle } from "@/components/theme-toggle";

interface BillingRecord {
  id: string;
  patientId: string;
  amount: number;
  description: string;
  status: string;
  dueDate: string;
  createdAt: string;
}

export default function OverdueBillsPage() {
  const { data: session } = useSession();
  const [bills, setBills] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchOverdueBills();
  }, []);

  const fetchOverdueBills = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/overdue");
      if (res.ok) {
        const data = await res.json();
        setBills(data);
      }
    } catch (error) {
      console.error("Error fetching overdue bills:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBills = bills.filter(
    (bill) =>
      bill.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.patientId.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalOverdue = bills.reduce((sum, b) => sum + b.amount, 0);
  const avgDaysOverdue =
    bills.length > 0
      ? Math.round(
          bills.reduce((sum, b) => {
            const days = Math.floor(
              (Date.now() - new Date(b.dueDate).getTime()) /
                (1000 * 60 * 60 * 24),
            );
            return sum + days;
          }, 0) / bills.length,
        )
      : 0;

  return (
    <div className="h-svh overflow-hidden lg:p-2 w-full">
      <div className="lg:border lg:rounded-md overflow-hidden flex flex-col items-center justify-start bg-container h-full w-full bg-background">
        {/* Header */}
        <header className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-3 sm:py-4 border-b bg-card sticky top-0 z-10 w-full">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-lg font-medium truncate">
                Overdue Bills
              </h1>
              <p className="text-xs text-muted-foreground truncate">
                Bills that have passed their due date
              </p>
            </div>
          </div>

          <Link href="/billing">
            <Button variant="outline" size="sm">
              View All Bills
            </Button>
          </Link>

          <ThemeToggle />
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 bg-background w-full">
          {/* Stats Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 p-3 sm:p-4 lg:p-6 rounded-xl border bg-card">
            <div className="group flex flex-col justify-between p-4 rounded-lg transition-all bg-red-50 dark:bg-red-900/20 hover:shadow-md cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <IndianRupee className="w-5 h-5" />
                  <span className="text-[10px] sm:text-xs lg:text-sm font-medium">
                    Total Overdue Amount
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-lg sm:text-xl lg:text-[28px] font-semibold">
                  ₹{totalOverdue.toLocaleString()}
                </p>
                <div className="flex items-center gap-1 text-[10px] sm:text-xs font-medium text-red-600 dark:text-red-400">
                  <TrendingUp className="w-3 h-3" />
                  Action required
                </div>
              </div>
            </div>

            <div className="group flex flex-col justify-between p-4 rounded-lg transition-all bg-orange-50 dark:bg-orange-900/20 hover:shadow-md cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-[10px] sm:text-xs lg:text-sm font-medium">
                    Total Overdue Bills
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-lg sm:text-xl lg:text-[28px] font-semibold">
                  {bills.length}
                </p>
                <div className="flex items-center gap-1 text-[10px] sm:text-xs font-medium text-emerald-600">
                  <TrendingUp className="w-3 h-3" />
                  +0%
                </div>
              </div>
            </div>

            <div className="group flex flex-col justify-between p-4 rounded-lg transition-all bg-yellow-50 dark:bg-yellow-900/20 hover:shadow-md cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-5 h-5" />
                  <span className="text-[10px] sm:text-xs lg:text-sm font-medium">
                    Avg Days Overdue
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-lg sm:text-xl lg:text-[28px] font-semibold">
                  {avgDaysOverdue}
                </p>
                <div className="flex items-center gap-1 text-[10px] sm:text-xs font-medium text-emerald-600">
                  <TrendingUp className="w-3 h-3" />
                  Tracking
                </div>
              </div>
            </div>
          </div>

          {/* Search & Bills Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base sm:text-lg">
                    Overdue Invoices
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Showing {filteredBills.length} overdue bills requiring
                    immediate attention
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search by patient ID or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                </div>
              ) : filteredBills.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    No overdue bills found
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
                          Patient ID
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
                          Days Overdue
                        </th>
                        <th className="w-[50px]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBills.map((bill) => {
                        const daysOverdue = Math.floor(
                          (Date.now() - new Date(bill.dueDate).getTime()) /
                            (1000 * 60 * 60 * 24),
                        );
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
                              <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                                ₹{bill.amount.toLocaleString()}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {new Date(bill.dueDate).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0 text-xs">
                                {daysOverdue} days
                              </Badge>
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

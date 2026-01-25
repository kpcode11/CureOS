"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  AlertTriangle,
  PackageX,
  TrendingDown,
  ShoppingCart,
  Package,
  History,
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
import { SkeletonShinyGradient } from "@/components/ui/skeleton-shiny";
import Link from "next/link";

interface LowStockItem {
  id: string;
  itemName: string;
  category: string;
  quantity: number;
  minStock: number;
  unit: string;
}

interface AuditLog {
  id: string;
  actorId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  createdAt: string;
}

export default function SafetyAlertsPage() {
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [recentAudits, setRecentAudits] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [lowStock, audits] = await Promise.all([
        fetch("/api/pharmacist/inventory/low-stock").then((r) => r.json()),
        fetch("/api/pharmacist/audit-logs?take=10").then((r) => r.json()),
      ]);

      setLowStockItems(lowStock);
      setRecentAudits(audits.rows || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverity = (item: LowStockItem) => {
    const percentRemaining = (item.quantity / item.minStock) * 100;
    if (item.quantity === 0) {
      return { level: "Critical", color: "bg-red-600", icon: PackageX };
    } else if (percentRemaining < 50) {
      return { level: "High", color: "bg-orange-600", icon: AlertTriangle };
    } else {
      return { level: "Medium", color: "bg-amber-600", icon: TrendingDown };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActionBadge = (action: string) => {
    if (action.includes("dispense")) {
      return <Badge className="bg-green-100 text-green-800">Dispense</Badge>;
    } else if (action.includes("inventory")) {
      return <Badge className="bg-blue-100 text-blue-800">Inventory</Badge>;
    } else if (action.includes("prescription")) {
      return (
        <Badge className="bg-purple-100 text-purple-800">Prescription</Badge>
      );
    }
    return <Badge variant="secondary">{action}</Badge>;
  };

  const criticalItems = lowStockItems.filter((item) => item.quantity === 0);
  const warningItems = lowStockItems.filter((item) => item.quantity > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
              Safety Alerts
            </h1>
            {lowStockItems.length > 0 && (
              <Badge className="bg-red-100 text-red-800 text-base px-3 py-1">
                <AlertTriangle className="w-4 h-4 mr-1" />
                {lowStockItems.length} Alert
                {lowStockItems.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          <p className="text-slate-600 text-lg">
            Monitor low stock items and critical pharmacy alerts
          </p>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-red-800">
                  Critical
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold text-red-900">
                    {criticalItems.length}
                  </div>
                  <PackageX className="w-8 h-8 text-red-600" />
                </div>
                <p className="text-xs text-red-700 mt-2">Out of stock items</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-amber-800">
                  Warning
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold text-amber-900">
                    {warningItems.length}
                  </div>
                  <TrendingDown className="w-8 h-8 text-amber-600" />
                </div>
                <p className="text-xs text-amber-700 mt-2">Low stock items</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Link href="/pharmacist/inventory">
              <Card className="border-blue-200 bg-blue-50 hover:shadow-lg transition-all cursor-pointer">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-blue-800">
                    Action Required
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold text-blue-900">
                      {lowStockItems.length}
                    </div>
                    <ShoppingCart className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-xs text-blue-700 mt-2">Items to reorder</p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        </div>

        {/* Critical & Warning Items */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonShinyGradient
                key={i}
                className="h-32 rounded-lg bg-muted"
              />
            ))}
          </div>
        ) : lowStockItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-green-200 bg-green-50">
              <CardContent className="py-12 text-center">
                <Package className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-900 mb-2">
                  All Clear!
                </h3>
                <p className="text-green-700">
                  No low stock alerts at this time. All inventory levels are
                  adequate.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
            {/* Critical Items */}
            {criticalItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="border-red-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-900">
                      <PackageX className="w-5 h-5 text-red-600" />
                      Critical - Out of Stock
                    </CardTitle>
                    <CardDescription>
                      These items need immediate attention
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {criticalItems.map((item, index) => {
                        const severity = getSeverity(item);
                        const SeverityIcon = severity.icon;

                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-4 bg-red-50 border border-red-200 rounded-lg"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <SeverityIcon className="w-5 h-5 text-red-600" />
                                  <h4 className="font-semibold text-slate-900">
                                    {item.itemName}
                                  </h4>
                                  <Badge
                                    className={`${severity.color} text-white`}
                                  >
                                    {severity.level}
                                  </Badge>
                                </div>
                                <p className="text-sm text-slate-600">
                                  Category: {item.category} | Min Stock:{" "}
                                  {item.minStock} {item.unit}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-red-600">
                                  0
                                </p>
                                <p className="text-xs text-slate-500">
                                  {item.unit}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Warning Items */}
            {warningItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="border-amber-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-900">
                      <TrendingDown className="w-5 h-5 text-amber-600" />
                      Low Stock Warnings
                    </CardTitle>
                    <CardDescription>
                      Items approaching minimum stock levels
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {warningItems.map((item, index) => {
                        const severity = getSeverity(item);
                        const SeverityIcon = severity.icon;
                        const percentRemaining = (
                          (item.quantity / item.minStock) *
                          100
                        ).toFixed(0);

                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-4 bg-amber-50 border border-amber-200 rounded-lg"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <SeverityIcon className="w-5 h-5 text-amber-600" />
                                  <h4 className="font-semibold text-slate-900">
                                    {item.itemName}
                                  </h4>
                                  <Badge
                                    className={`${severity.color} text-white`}
                                  >
                                    {severity.level}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {percentRemaining}% of min
                                  </Badge>
                                </div>
                                <p className="text-sm text-slate-600">
                                  Category: {item.category} | Min Stock:{" "}
                                  {item.minStock} {item.unit}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-amber-600">
                                  {item.quantity}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {item.unit}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </>
        )}

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <History className="w-5 h-5 text-blue-600" />
                Recent Pharmacy Activity
              </CardTitle>
              <CardDescription>Latest actions and changes</CardDescription>
            </CardHeader>
            <CardContent>
              {recentAudits.length === 0 ? (
                <p className="text-center text-slate-500 py-8">
                  No recent activity
                </p>
              ) : (
                <div className="space-y-3">
                  {recentAudits.map((audit) => (
                    <div
                      key={audit.id}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getActionBadge(audit.action)}
                          <span className="text-sm font-medium text-slate-900">
                            {audit.resource} {audit.action}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          ID: {audit.resourceId?.slice(0, 8) || "N/A"}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500">
                        {formatDate(audit.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

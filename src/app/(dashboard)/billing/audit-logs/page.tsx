"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Shield,
  Search,
  Filter,
  FileText,
  Clock,
  User,
  Activity,
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
import { SkeletonShinyGradient } from "@/components/ui/skeleton-shiny";

interface AuditLog {
  id: string;
  actorId: string | null;
  action: string;
  resource: string;
  resourceId: string;
  meta: any;
  createdAt: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/audit-logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resourceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.actorId &&
        log.actorId.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter =
      actionFilter === "ALL" || log.action.includes(actionFilter);

    return matchesSearch && matchesFilter;
  });

  const actionColors: Record<string, string> = {
    create: "bg-green-50 text-green-700 border-green-200",
    update: "bg-blue-50 text-blue-700 border-blue-200",
    delete: "bg-red-50 text-red-700 border-red-200",
    pay: "bg-purple-50 text-purple-700 border-purple-200",
    status: "bg-orange-50 text-orange-700 border-orange-200",
  };

  const getActionColor = (action: string) => {
    for (const [key, color] of Object.entries(actionColors)) {
      if (action.toLowerCase().includes(key)) return color;
    }
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <motion.div
        className="relative bg-white border-b"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
              Billing Audit Logs
            </h1>
          </div>
          <p className="text-slate-600 text-lg">
            Complete history of all billing operations and changes
          </p>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">
                    Total Events
                  </p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {logs.length}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Activity className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Today</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {
                      logs.filter(
                        (l) =>
                          new Date(l.createdAt).toDateString() ===
                          new Date().toDateString(),
                      ).length
                    }
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Clock className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Creates</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {logs.filter((l) => l.action.includes("create")).length}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FileText className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Updates</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {logs.filter((l) => l.action.includes("update")).length}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <User className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="mb-6 border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Search by action, resource ID, or actor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-slate-200 focus:border-blue-500 h-11"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {["ALL", "create", "update", "pay", "status"].map(
                    (action) => (
                      <Button
                        key={action}
                        variant={
                          actionFilter === action ? "default" : "outline"
                        }
                        onClick={() => setActionFilter(action)}
                        className={actionFilter === action ? "bg-blue-600" : ""}
                      >
                        <Filter className="w-4 h-4 mr-2" />
                        {action.toUpperCase()}
                      </Button>
                    ),
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Logs Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Activity Timeline</CardTitle>
              <CardDescription>
                Showing {filteredLogs.length} of {logs.length} audit events
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonShinyGradient
                      key={i}
                      className="h-16 rounded-lg bg-muted"
                    />
                  ))}
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 text-lg">No audit logs found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-4 px-4 font-semibold text-slate-700">
                          Timestamp
                        </th>
                        <th className="text-left py-4 px-4 font-semibold text-slate-700">
                          Action
                        </th>
                        <th className="text-left py-4 px-4 font-semibold text-slate-700">
                          Resource
                        </th>
                        <th className="text-left py-4 px-4 font-semibold text-slate-700">
                          Resource ID
                        </th>
                        <th className="text-left py-4 px-4 font-semibold text-slate-700">
                          Actor
                        </th>
                        <th className="text-left py-4 px-4 font-semibold text-slate-700">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((log, index) => (
                        <motion.tr
                          key={log.id}
                          className="border-b border-slate-100 hover:bg-blue-50/50 transition-colors"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                        >
                          <td className="py-4 px-4 text-slate-600 text-sm">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="py-4 px-4">
                            <Badge
                              className={`${getActionColor(log.action)} border`}
                            >
                              {log.action}
                            </Badge>
                          </td>
                          <td className="py-4 px-4 font-medium text-slate-900">
                            {log.resource}
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-mono text-sm text-slate-600">
                              {log.resourceId.slice(0, 8)}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-slate-600">
                              {log.actorId ? log.actorId.slice(0, 8) : "System"}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-slate-500">
                              {log.meta && typeof log.meta === "object"
                                ? Object.entries(log.meta)
                                    .map(([k, v]) => `${k}: ${v}`)
                                    .join(", ")
                                : "No details"}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
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

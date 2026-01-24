"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Clock,
  User,
  CheckCircle,
  Pill,
  AlertCircle,
  ArrowRight,
  Calendar,
  Stethoscope,
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
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

interface PendingPrescription {
  id: string;
  patientId: string;
  doctorId: string;
  dispensed: boolean;
  createdAt: string;
}

export default function DispenseQueuePage() {
  const { toast } = useToast();
  const [queue, setQueue] = useState<PendingPrescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      const response = await fetch(
        "/api/pharmacist/prescriptions?dispensed=false",
      );
      const data = await response.json();
      // Sort by oldest first
      const sorted = data.sort(
        (a: PendingPrescription, b: PendingPrescription) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      setQueue(sorted);
    } catch (error) {
      console.error("Failed to fetch queue:", error);
      toast({
        title: "Error",
        description: "Failed to load dispense queue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDispense = async (prescriptionId: string) => {
    setProcessingId(prescriptionId);
    try {
      const response = await fetch(
        `/api/pharmacist/prescriptions/${prescriptionId}/dispense`,
        {
          method: "PATCH",
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to dispense");
      }

      toast({
        title: "Success",
        description: "Prescription dispensed successfully",
      });

      // Remove from queue
      setQueue(queue.filter((p) => p.id !== prescriptionId));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getWaitTime = (createdAt: string) => {
    const now = new Date().getTime();
    const created = new Date(createdAt).getTime();
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffHours > 24) {
      const days = Math.floor(diffHours / 24);
      return { value: `${days}d`, priority: "high", color: "text-red-600" };
    } else if (diffHours > 2) {
      return {
        value: `${diffHours}h`,
        priority: "medium",
        color: "text-amber-600",
      };
    } else if (diffMins > 0) {
      return {
        value: `${diffMins}m`,
        priority: "low",
        color: "text-green-600",
      };
    }
    return { value: "Just now", priority: "low", color: "text-green-600" };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center"
        >
          <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
              Dispense Queue
            </h1>
            <p className="text-slate-600 text-lg mt-1">
              Process pending prescriptions in order
            </p>
          </div>
          <Link href="/pharmacist/prescriptions">
            <Button variant="outline">
              View All Prescriptions
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </motion.div>

        {/* Queue Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">
                  In Queue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold text-slate-900">
                    {queue.length}
                  </div>
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Pending prescriptions
                </p>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-amber-800">
                  Priority
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold text-amber-900">
                    {
                      queue.filter(
                        (p) => getWaitTime(p.createdAt).priority === "high",
                      ).length
                    }
                  </div>
                  <AlertCircle className="w-8 h-8 text-amber-600" />
                </div>
                <p className="text-xs text-amber-700 mt-2">
                  Older than 24 hours
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-800">
                  Average Wait
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold text-green-900">
                    {queue.length > 0
                      ? Math.floor(
                          queue.reduce((sum, p) => {
                            const diffMs =
                              new Date().getTime() -
                              new Date(p.createdAt).getTime();
                            return sum + diffMs;
                          }, 0) /
                            queue.length /
                            60000,
                        )
                      : 0}
                    m
                  </div>
                  <Calendar className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-xs text-green-700 mt-2">Current average</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Queue List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {loading ? (
            <Card className="border-slate-200">
              <CardContent className="py-12 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-600">Loading queue...</p>
              </CardContent>
            </Card>
          ) : queue.length === 0 ? (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="py-16 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-green-900 mb-2">
                  Queue Empty!
                </h3>
                <p className="text-green-700 text-lg">
                  All prescriptions have been dispensed. Great work!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {queue.map((prescription, index) => {
                const waitTime = getWaitTime(prescription.createdAt);
                const isProcessing = processingId === prescription.id;

                return (
                  <motion.div
                    key={prescription.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className={`border-slate-200 hover:shadow-lg transition-all duration-300 ${waitTime.priority === "high" ? "border-l-4 border-l-red-500" : ""}`}
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                          {/* Left Section */}
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="bg-blue-100 text-blue-700 font-bold text-lg w-10 h-10 rounded-full flex items-center justify-center">
                                {index + 1}
                              </div>
                              <div>
                                <h3 className="text-xl font-semibold text-slate-900">
                                  Prescription #{prescription.id.slice(0, 8)}
                                </h3>
                                <p className="text-sm text-slate-500">
                                  Created {formatDate(prescription.createdAt)}
                                </p>
                              </div>
                              <Badge
                                className={`${waitTime.color} bg-transparent border`}
                              >
                                <Clock className="w-3 h-3 mr-1" />
                                Wait: {waitTime.value}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm">
                              <div className="flex items-center gap-2 text-slate-600">
                                <User className="w-4 h-4" />
                                <span>
                                  Patient: {prescription.patientId.slice(0, 8)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-slate-600">
                                <Stethoscope className="w-4 h-4" />
                                <span>
                                  Doctor: {prescription.doctorId.slice(0, 8)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right Section - Actions */}
                          <div className="flex gap-2 w-full md:w-auto">
                            <Link
                              href={`/pharmacist/prescriptions/${prescription.id}`}
                              className="flex-1 md:flex-none"
                            >
                              <Button
                                variant="outline"
                                className="w-full border-blue-300 text-blue-600 hover:bg-blue-50"
                              >
                                View Details
                              </Button>
                            </Link>
                            <Button
                              onClick={() =>
                                handleQuickDispense(prescription.id)
                              }
                              disabled={isProcessing}
                              className="flex-1 md:flex-none bg-green-600 hover:bg-green-700"
                            >
                              {isProcessing ? (
                                <>
                                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Quick Dispense
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Help Card */}
        {queue.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Pill className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 mb-1">
                      Quick Tips
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>
                        • Process prescriptions in order for best efficiency
                      </li>
                      <li>
                        • Red border indicates prescriptions waiting over 24
                        hours
                      </li>
                      <li>
                        • Use "Quick Dispense" for fast processing or "View
                        Details" for more information
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

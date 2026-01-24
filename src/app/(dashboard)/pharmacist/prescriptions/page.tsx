"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Search,
  Filter,
  CheckCircle,
  Clock,
  Calendar,
  User,
  Pill,
  Eye,
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
import Link from "next/link";

interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  pharmacistId: string | null;
  dispensed: boolean;
  dispensedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<
    Prescription[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "pending" | "dispensed"
  >("all");

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  useEffect(() => {
    filterPrescriptions();
  }, [prescriptions, searchQuery, filterStatus]);

  const fetchPrescriptions = async () => {
    try {
      const response = await fetch("/api/pharmacist/prescriptions");
      const data = await response.json();
      setPrescriptions(data);
    } catch (error) {
      console.error("Failed to fetch prescriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterPrescriptions = () => {
    let filtered = [...prescriptions];

    // Filter by status
    if (filterStatus === "pending") {
      filtered = filtered.filter((p) => !p.dispensed);
    } else if (filterStatus === "dispensed") {
      filtered = filtered.filter((p) => p.dispensed);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.patientId.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    setFilteredPrescriptions(filtered);
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
              Prescriptions
            </h1>
            <p className="text-slate-600 text-lg mt-1">
              View and manage all prescriptions
            </p>
          </div>
          <Link href="/pharmacist/queue">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Clock className="w-4 h-4 mr-2" />
              Dispense Queue
            </Button>
          </Link>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-slate-200">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <Input
                    placeholder="Search by prescription ID or patient ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-slate-300"
                  />
                </div>

                {/* Status Filter */}
                <div className="flex gap-2">
                  <Button
                    variant={filterStatus === "all" ? "default" : "outline"}
                    onClick={() => setFilterStatus("all")}
                    className="flex-1 md:flex-none"
                  >
                    All
                  </Button>
                  <Button
                    variant={filterStatus === "pending" ? "default" : "outline"}
                    onClick={() => setFilterStatus("pending")}
                    className="flex-1 md:flex-none"
                  >
                    Pending
                  </Button>
                  <Button
                    variant={
                      filterStatus === "dispensed" ? "default" : "outline"
                    }
                    onClick={() => setFilterStatus("dispensed")}
                    className="flex-1 md:flex-none"
                  >
                    Dispensed
                  </Button>
                </div>
              </div>

              {/* Results count */}
              <div className="mt-4 text-sm text-slate-600">
                Showing {filteredPrescriptions.length} of {prescriptions.length}{" "}
                prescriptions
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Prescriptions List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {loading ? (
            <Card className="border-slate-200">
              <CardContent className="py-12 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-600">Loading prescriptions...</p>
              </CardContent>
            </Card>
          ) : filteredPrescriptions.length === 0 ? (
            <Card className="border-slate-200">
              <CardContent className="py-12 text-center">
                <Pill className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 text-lg">No prescriptions found</p>
                <p className="text-slate-500 text-sm mt-2">
                  Try adjusting your filters or search query
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredPrescriptions.map((prescription, index) => (
              <motion.div
                key={prescription.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-slate-200 hover:shadow-lg transition-all duration-300 hover:border-blue-300">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      {/* Left Section */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-semibold text-slate-900">
                                Rx #{prescription.id.slice(0, 8)}
                              </h3>
                              <Badge
                                variant={
                                  prescription.dispensed
                                    ? "default"
                                    : "secondary"
                                }
                                className={
                                  prescription.dispensed
                                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                                    : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                }
                              >
                                {prescription.dispensed ? (
                                  <>
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Dispensed
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3 h-3 mr-1" />
                                    Pending
                                  </>
                                )}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm text-slate-600">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                <span>
                                  Patient ID:{" "}
                                  {prescription.patientId.slice(0, 8)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  Created: {formatDate(prescription.createdAt)}
                                </span>
                              </div>
                              {prescription.dispensedAt && (
                                <div className="flex items-center gap-2 text-green-600">
                                  <CheckCircle className="w-4 h-4" />
                                  <span>
                                    Dispensed:{" "}
                                    {formatDate(prescription.dispensedAt)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Section - Actions */}
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/pharmacist/prescriptions/${prescription.id}`}
                        >
                          <Button
                            variant="outline"
                            className="border-blue-300 text-blue-600 hover:bg-blue-50"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
}

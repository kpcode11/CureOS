"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  Pill,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Calendar,
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

interface Prescription {
  id: string;
  patientId: string;
  medications: any;
  instructions: string;
  dispensed: boolean;
  dispensedAt: string | null;
  createdAt: string;
  patient?: {
    firstName: string;
    lastName: string;
  };
  doctor?: {
    user: {
      name: string;
    };
  };
}

export default function MedicationPage() {
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "DISPENSED">("ALL");

  useEffect(() => {
    fetchMedications();
  }, []);

  const fetchMedications = async () => {
    setLoading(true);
    try {
      // Get all active bed assignments first
      const assignmentsRes = await fetch("/api/nurse/bed-assignments");
      if (!assignmentsRes.ok) return;
      
      const assignments = await assignmentsRes.json();
      
      // Fetch prescriptions for each assigned patient
      const prescriptionsPromises = assignments.map(async (assignment: any) => {
        const res = await fetch(`/api/nurse/patients/${assignment.patientId}/prescriptions`);
        if (res.ok) {
          const data = await res.json();
          return data.map((p: any) => ({
            ...p,
            patient: {
              firstName: assignment.patient?.firstName,
              lastName: assignment.patient?.lastName,
            },
          }));
        }
        return [];
      });

      const allPrescriptions = await Promise.all(prescriptionsPromises);
      setPrescriptions(allPrescriptions.flat());
    } catch (error) {
      console.error("Error fetching medications:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPrescriptions = prescriptions.filter((p) => {
    const matchesSearch =
      p.patient?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.patient?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.instructions.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filter === "ALL" ||
      (filter === "PENDING" && !p.dispensed) ||
      (filter === "DISPENSED" && p.dispensed);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header */}
      <motion.div
        className="relative bg-white border-b"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 to-teal-600/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-600 rounded-xl">
              <Pill className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
                Medication Administration
              </h1>
              <p className="text-slate-600 text-lg">
                View and track patient medications
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <motion.div
          className="flex flex-col md:flex-row gap-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search by patient name or medication..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === "ALL" ? "default" : "outline"}
              onClick={() => setFilter("ALL")}
            >
              All
            </Button>
            <Button
              variant={filter === "PENDING" ? "default" : "outline"}
              onClick={() => setFilter("PENDING")}
            >
              Pending
            </Button>
            <Button
              variant={filter === "DISPENSED" ? "default" : "outline"}
              onClick={() => setFilter("DISPENSED")}
            >
              Dispensed
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Total</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {prescriptions.length}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Pending</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {prescriptions.filter((p) => !p.dispensed).length}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">
                    Dispensed
                  </p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {prescriptions.filter((p) => p.dispensed).length}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Prescriptions List */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {loading ? (
            <Card className="border-none shadow-lg">
              <CardContent className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto" />
                <p className="text-slate-600 mt-4">Loading prescriptions...</p>
              </CardContent>
            </Card>
          ) : filteredPrescriptions.length === 0 ? (
            <Card className="border-none shadow-lg">
              <CardContent className="p-12 text-center">
                <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">No prescriptions found</p>
              </CardContent>
            </Card>
          ) : (
            filteredPrescriptions.map((prescription) => (
              <Card
                key={prescription.id}
                className="border-none shadow-lg hover:shadow-xl transition-shadow"
              >
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-600 rounded-lg">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">
                          {prescription.patient?.firstName}{" "}
                          {prescription.patient?.lastName}
                        </CardTitle>
                        <CardDescription>
                          Prescribed by Dr. {prescription.doctor?.user?.name}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge
                      className={
                        prescription.dispensed
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }
                    >
                      {prescription.dispensed ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Dispensed
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4 mr-1" />
                          Pending
                        </>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">
                        Medications:
                      </h4>
                      <div className="space-y-2">
                        {Array.isArray(prescription.medications) &&
                          prescription.medications.map((med: any, idx: number) => (
                            <div
                              key={idx}
                              className="p-3 bg-slate-50 rounded-lg"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium text-slate-900">
                                    {med.name}
                                  </p>
                                  <p className="text-sm text-slate-600">
                                    {med.dosage} - {med.frequency}
                                  </p>
                                  {med.duration && (
                                    <p className="text-sm text-slate-500">
                                      Duration: {med.duration}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">
                        Instructions:
                      </h4>
                      <p className="text-slate-700 bg-slate-50 p-3 rounded-lg">
                        {prescription.instructions}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">
                          {new Date(prescription.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <Button
                        onClick={() =>
                          router.push(`/nurse/patients/${prescription.patientId}`)
                        }
                      >
                        View Patient
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
}

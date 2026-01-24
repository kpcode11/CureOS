"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  User,
  Stethoscope,
  Calendar,
  Pill,
  FileText,
  AlertCircle,
  Undo2,
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

interface PrescriptionDetail {
  id: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    dateOfBirth: string;
  };
  doctor: {
    id: string;
    specialization: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  medications: any;
  instructions: string | null;
  dispensed: boolean;
  dispensedAt: string | null;
}

export default function PrescriptionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [prescription, setPrescription] = useState<PrescriptionDetail | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchPrescription(params.id as string);
    }
  }, [params.id]);

  const fetchPrescription = async (id: string) => {
    try {
      const response = await fetch(`/api/pharmacist/prescriptions/${id}`);
      if (!response.ok) throw new Error("Failed to fetch prescription");
      const data = await response.json();
      setPrescription(data);
    } catch (error) {
      console.error("Failed to fetch prescription:", error);
      toast({
        title: "Error",
        description: "Failed to load prescription details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDispense = async () => {
    if (!prescription) return;

    setActionLoading(true);
    try {
      const response = await fetch(
        `/api/pharmacist/prescriptions/${prescription.id}/dispense`,
        {
          method: "PATCH",
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to dispense prescription");
      }

      toast({
        title: "Success",
        description: "Prescription dispensed successfully",
      });

      // Refresh data
      await fetchPrescription(prescription.id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUndoDispense = async () => {
    if (!prescription) return;

    setActionLoading(true);
    try {
      const response = await fetch(
        `/api/pharmacist/prescriptions/${prescription.id}/undo-dispense`,
        {
          method: "PATCH",
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to undo dispense");
      }

      toast({
        title: "Success",
        description: "Dispense action reversed successfully",
      });

      // Refresh data
      await fetchPrescription(prescription.id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const parseMedications = () => {
    if (!prescription?.medications) return [];

    // Handle different medication formats
    if (Array.isArray(prescription.medications)) {
      return prescription.medications;
    }

    if (typeof prescription.medications === "object") {
      return [prescription.medications];
    }

    return [];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 p-8">
        <div className="max-w-5xl mx-auto">
          <Card className="border-slate-200">
            <CardContent className="py-12 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-600">Loading prescription details...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 p-8">
        <div className="max-w-5xl mx-auto">
          <Card className="border-slate-200">
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-slate-600 text-lg">Prescription not found</p>
              <Link href="/pharmacist/prescriptions">
                <Button className="mt-4" variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Prescriptions
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const medications = parseMedications();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-start"
        >
          <div className="space-y-2">
            <Link href="/pharmacist/prescriptions">
              <Button
                variant="ghost"
                className="mb-2 text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Prescriptions
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
                Prescription #{prescription.id.slice(0, 8)}
              </h1>
              <Badge
                variant={prescription.dispensed ? "default" : "secondary"}
                className={`text-base ${prescription.dispensed ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}
              >
                {prescription.dispensed ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
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
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {!prescription.dispensed && (
              <Button
                onClick={handleDispense}
                disabled={actionLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {actionLoading ? "Processing..." : "Dispense"}
              </Button>
            )}
            {prescription.dispensed && (
              <Button
                onClick={handleUndoDispense}
                disabled={actionLoading}
                variant="destructive"
              >
                <Undo2 className="w-4 h-4 mr-2" />
                {actionLoading ? "Processing..." : "Undo Dispense"}
              </Button>
            )}
          </div>
        </motion.div>

        {/* Patient Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <User className="w-5 h-5 text-blue-600" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Name</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {prescription.patient.firstName}{" "}
                    {prescription.patient.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Date of Birth</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {new Date(
                      prescription.patient.dateOfBirth,
                    ).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Phone</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {prescription.patient.phone}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {prescription.patient.email}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Doctor Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Stethoscope className="w-5 h-5 text-blue-600" />
                Prescribing Doctor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Name</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {prescription.doctor.user.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Specialization</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {prescription.doctor.specialization}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {prescription.doctor.user.email}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Medications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Pill className="w-5 h-5 text-blue-600" />
                Medications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {medications.length > 0 ? (
                <div className="space-y-4">
                  {medications.map((med: any, index: number) => (
                    <div
                      key={index}
                      className="p-4 bg-blue-50 rounded-lg border border-blue-200"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-slate-500">Name</p>
                          <p className="text-lg font-semibold text-slate-900">
                            {med.name || med.medication || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Dosage</p>
                          <p className="text-lg font-semibold text-slate-900">
                            {med.dosage || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Frequency</p>
                          <p className="text-lg font-semibold text-slate-900">
                            {med.frequency || "N/A"}
                          </p>
                        </div>
                        {med.duration && (
                          <div>
                            <p className="text-sm text-slate-500">Duration</p>
                            <p className="text-lg font-semibold text-slate-900">
                              {med.duration}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Pill className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">
                    No medication details available
                  </p>
                  <pre className="mt-4 p-4 bg-slate-100 rounded text-left text-sm overflow-auto">
                    {JSON.stringify(prescription.medications, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Instructions */}
        {prescription.instructions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Instructions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 leading-relaxed">
                  {prescription.instructions}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Dispense Information */}
        {prescription.dispensed && prescription.dispensedAt && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  Dispensed Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-green-700">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">
                    Dispensed on: {formatDate(prescription.dispensedAt)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

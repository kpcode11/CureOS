"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { HealthIndexDashboard } from "@/components/doctor/health-index-dashboard";
import { useEffect, useState } from "react";

export default function PatientHealthIndexPage() {
  const params = useParams();
  const patientId = params.id as string;
  const [patientName, setPatientName] = useState<string>("");

  useEffect(() => {
    // Fetch patient name for display
    const fetchPatient = async () => {
      try {
        const response = await fetch(`/api/doctor/patients/${patientId}`);
        if (response.ok) {
          const data = await response.json();
          setPatientName(`${data.firstName} ${data.lastName}`);
        }
      } catch (err) {
        console.error("Failed to fetch patient:", err);
      }
    };
    fetchPatient();
  }, [patientId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header with Back Button */}
          <div className="flex items-center gap-4">
            <Link href={`/doctor/patients/${patientId}`}>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                Health Index Analysis
              </h1>
              {patientName && (
                <p className="text-muted-foreground mt-1">{patientName}</p>
              )}
            </div>
          </div>

          {/* Health Index Dashboard */}
          <HealthIndexDashboard patientId={patientId} patientName={patientName} />
        </div>
      </div>
    </div>
  );
}

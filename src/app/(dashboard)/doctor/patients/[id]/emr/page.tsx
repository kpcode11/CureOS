"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { EMRFormComponent } from "@/components/doctor/emr-form";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function EMRPage() {
  const params = useParams();
  const patientId = params.id as string;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header with Back Button */}
          <div className="flex items-center gap-4">
            <Link href={`/doctor/patients/${patientId}`}>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-4xl font-semibold tracking-tight text-gray-900">
              Create EMR Record
            </h1>
          </div>

          {/* Form Container */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <EMRFormComponent
              patientId={patientId}
              onSuccess={() => {
                // Redirect handled in component
              }}
              onCancel={() => {
                window.history.back();
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

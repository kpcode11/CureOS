"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Heart,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Activity,
  FlaskConical,
  Stethoscope,
  BedDouble,
  Pill,
  Loader,
} from "lucide-react";
import Link from "next/link";

interface HealthIndexResult {
  overallScore: number;
  trend: "IMPROVING" | "STABLE" | "DETERIORATING" | "UNKNOWN";
  trendDelta: number;
  category: "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | "CRITICAL";
  breakdown: {
    vitalsScore: number;
    labScore: number;
    medicationScore: number;
    hospitalizationScore: number;
    diagnosisScore: number;
  };
  lastUpdated: string;
  dataPoints: number;
  hasSufficientData: boolean;
}

interface PatientHealthSummary {
  patientId: string;
  patientName: string;
  healthIndex: HealthIndexResult | null;
  loading: boolean;
  error: string | null;
}

interface HealthIndexStatsProps {
  patients: Array<{ id: string; firstName: string; lastName: string }>;
  maxPatients?: number;
}

const CATEGORY_COLORS = {
  EXCELLENT: "hsl(160, 84%, 39%)",
  GOOD: "hsl(142, 76%, 36%)",
  FAIR: "hsl(48, 96%, 53%)",
  POOR: "hsl(25, 95%, 53%)",
  CRITICAL: "hsl(0, 72%, 51%)",
};

const TREND_ICONS = {
  IMPROVING: TrendingUp,
  STABLE: Minus,
  DETERIORATING: TrendingDown,
  UNKNOWN: AlertCircle,
};

/**
 * Health Index Stats Component
 * 
 * Displays health index scores for multiple patients in a stats grid format,
 * inspired by the department analytics (Stats10) component.
 */
export function HealthIndexStats({ patients, maxPatients = 6 }: HealthIndexStatsProps) {
  const [summaries, setSummaries] = useState<PatientHealthSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllHealthIndices = async () => {
      setIsLoading(true);
      
      const patientsToFetch = patients.slice(0, maxPatients);
      
      const results = await Promise.all(
        patientsToFetch.map(async (patient) => {
          try {
            const response = await fetch(`/api/doctor/patients/${patient.id}/health-index`);
            
            if (!response.ok) {
              throw new Error("Failed to fetch");
            }
            
            const data = await response.json();
            return {
              patientId: patient.id,
              patientName: `${patient.firstName} ${patient.lastName}`,
              healthIndex: data,
              loading: false,
              error: null,
            };
          } catch (err) {
            return {
              patientId: patient.id,
              patientName: `${patient.firstName} ${patient.lastName}`,
              healthIndex: null,
              loading: false,
              error: "Failed to load",
            };
          }
        })
      );
      
      setSummaries(results);
      setIsLoading(false);
    };

    if (patients.length > 0) {
      fetchAllHealthIndices();
    } else {
      setIsLoading(false);
    }
  }, [patients, maxPatients]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10 w-full">
        <Loader className="w-5 h-5 animate-spin mr-2 text-gray-400" />
        <p className="text-gray-500">Loading patient health indices...</p>
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <div className="flex items-center justify-center p-10 w-full">
        <p className="text-gray-500">No patients to display</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4 w-full">
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 w-full">
        {summaries.map((summary) => {
          if (summary.error || !summary.healthIndex) {
            return (
              <Card key={summary.patientId} className="p-0">
                <CardContent className="p-4 flex items-center justify-center h-48">
                  <div className="text-center text-gray-500">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                    <p className="text-sm font-medium">{summary.patientName}</p>
                    <p className="text-xs">{summary.error || "No data"}</p>
                  </div>
                </CardContent>
              </Card>
            );
          }

          const { healthIndex } = summary;
          
          // Show "Awaiting Clinical Data" for patients without sufficient data
          if (!healthIndex.hasSufficientData) {
            return (
              <Card key={summary.patientId} className="p-0">
                <CardContent className="p-4 flex items-center justify-center h-48">
                  <div className="text-center text-gray-500">
                    <Activity className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">{summary.patientName}</p>
                    <p className="text-xs mt-1">Awaiting Clinical Data</p>
                    <p className="text-xs text-muted-foreground">Diagnosis or lab results required</p>
                  </div>
                </CardContent>
              </Card>
            );
          }

          const color = CATEGORY_COLORS[healthIndex.category];
          const TrendIcon = TREND_ICONS[healthIndex.trend];

          return (
            <Link
              key={summary.patientId}
              href={`/doctor/patients/${summary.patientId}/health-index`}
              className="block"
            >
              <Card className="p-0 hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 pb-0">
                  <div>
                    <dt className="text-sm font-medium text-foreground truncate">
                      {summary.patientName}{" "}
                      <span className="font-normal text-muted-foreground">
                        ({healthIndex.category})
                      </span>
                    </dt>
                    <div className="flex items-baseline justify-between mt-1">
                      <dd
                        className="text-2xl font-bold"
                        style={{ color }}
                      >
                        {healthIndex.overallScore}
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                          /100
                        </span>
                      </dd>
                      <dd className="flex items-center space-x-1 text-sm">
                        <TrendIcon
                          className={cn(
                            "w-4 h-4",
                            healthIndex.trend === "IMPROVING" && "text-green-600",
                            healthIndex.trend === "STABLE" && "text-gray-500",
                            healthIndex.trend === "DETERIORATING" && "text-red-600"
                          )}
                        />
                        <span
                          className={cn(
                            "font-medium",
                            healthIndex.trend === "IMPROVING" && "text-green-600",
                            healthIndex.trend === "STABLE" && "text-gray-500",
                            healthIndex.trend === "DETERIORATING" && "text-red-600"
                          )}
                        >
                          {healthIndex.trendDelta > 0 ? "+" : ""}
                          {healthIndex.trendDelta}
                        </span>
                      </dd>
                    </div>
                  </div>

                  {/* Component scores mini bar */}
                  <div className="flex items-center gap-1 mt-3">
                    <ComponentMini
                      icon={<Heart className="w-3 h-3" />}
                      score={healthIndex.breakdown.vitalsScore}
                      label="Vitals"
                    />
                    <ComponentMini
                      icon={<FlaskConical className="w-3 h-3" />}
                      score={healthIndex.breakdown.labScore}
                      label="Labs"
                    />
                    <ComponentMini
                      icon={<Stethoscope className="w-3 h-3" />}
                      score={healthIndex.breakdown.diagnosisScore}
                      label="Dx"
                    />
                    <ComponentMini
                      icon={<BedDouble className="w-3 h-3" />}
                      score={healthIndex.breakdown.hospitalizationScore}
                      label="Hosp"
                    />
                    <ComponentMini
                      icon={<Pill className="w-3 h-3" />}
                      score={healthIndex.breakdown.medicationScore}
                      label="Meds"
                    />
                  </div>

                  {/* Score summary bar (replaces sparkline since we don't have historical data) */}
                  <div className="mt-2 h-20 flex items-center justify-center">
                    <div className="w-full px-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">Health Score Progress</span>
                        <span className="text-xs font-medium" style={{ color }}>
                          {healthIndex.overallScore}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${healthIndex.overallScore}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                      <p className="text-xs text-center text-muted-foreground mt-2">
                        Based on {healthIndex.dataPoints} clinical data points
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </dl>
    </div>
  );
}

// Mini component score indicator
function ComponentMini({
  icon,
  score,
  label,
}: {
  icon: React.ReactNode;
  score: number;
  label: string;
}) {
  const getColor = (score: number) => {
    if (score >= 90) return "text-emerald-600 bg-emerald-50";
    if (score >= 70) return "text-green-600 bg-green-50";
    if (score >= 50) return "text-yellow-600 bg-yellow-50";
    if (score >= 30) return "text-orange-600 bg-orange-50";
    return "text-red-600 bg-red-50";
  };

  return (
    <div
      className={cn(
        "flex-1 flex flex-col items-center p-1 rounded text-center",
        getColor(score)
      )}
      title={`${label}: ${score}/100`}
    >
      {icon}
      <span className="text-[10px] font-semibold">{score}</span>
    </div>
  );
}

export default HealthIndexStats;

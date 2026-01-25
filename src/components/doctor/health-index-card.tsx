"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Heart,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Activity,
  Thermometer,
  Droplets,
  Wind,
  Pill,
  BedDouble,
  Stethoscope,
  FlaskConical,
  Loader,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import Link from "next/link";

// Types matching the backend response
interface VitalScore {
  name: string;
  value: string | number | null;
  score: number;
  status: "normal" | "warning" | "critical" | "unknown";
  normalRange?: string;
}

interface HealthIndexResult {
  overallScore: number;
  trend: "IMPROVING" | "STABLE" | "DETERIORATING" | "UNKNOWN";
  trendDelta: number;
  category: "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | "CRITICAL";
  breakdown: {
    vitals: VitalScore[];
    vitalsScore: number;
    labScore: number;
    medicationScore: number;
    hospitalizationScore: number;
    diagnosisScore: number;
  };
  lastUpdated: string;
  dataPoints: number;
  historicalScores: Array<{ date: string; score: number }>;
  hasSufficientData: boolean;
}

interface HealthIndexCardProps {
  patientId: string;
  compact?: boolean;
}

// Category colors and styling
const CATEGORY_STYLES = {
  EXCELLENT: {
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    progress: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  },
  GOOD: {
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    progress: "bg-green-500",
    badge: "bg-green-100 text-green-700 hover:bg-green-100",
  },
  FAIR: {
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    progress: "bg-yellow-500",
    badge: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
  },
  POOR: {
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    progress: "bg-orange-500",
    badge: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  },
  CRITICAL: {
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    progress: "bg-red-500",
    badge: "bg-red-100 text-red-700 hover:bg-red-100",
  },
};

const TREND_ICONS = {
  IMPROVING: <TrendingUp className="w-4 h-4 text-green-600" />,
  STABLE: <Minus className="w-4 h-4 text-gray-500" />,
  DETERIORATING: <TrendingDown className="w-4 h-4 text-red-600" />,
  UNKNOWN: <AlertCircle className="w-4 h-4 text-gray-400" />,
};

const TREND_LABELS = {
  IMPROVING: "Improving",
  STABLE: "Stable",
  DETERIORATING: "Deteriorating",
  UNKNOWN: "Unknown",
};

const VITAL_ICONS: Record<string, React.ReactNode> = {
  "Blood Pressure": <Activity className="w-4 h-4" />,
  "Heart Rate": <Heart className="w-4 h-4" />,
  Temperature: <Thermometer className="w-4 h-4" />,
  "Oxygen Saturation": <Wind className="w-4 h-4" />,
  "Respiratory Rate": <Wind className="w-4 h-4" />,
  "Blood Sugar": <Droplets className="w-4 h-4" />,
};

const STATUS_STYLES = {
  normal: "text-green-600 bg-green-50",
  warning: "text-yellow-600 bg-yellow-50",
  critical: "text-red-600 bg-red-50",
  unknown: "text-gray-500 bg-gray-50",
};

export function HealthIndexCard({ patientId, compact = false }: HealthIndexCardProps) {
  const [healthIndex, setHealthIndex] = useState<HealthIndexResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);

  const fetchHealthIndex = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/doctor/patients/${patientId}/health-index`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch health index");
      }
      
      const data = await response.json();
      setHealthIndex(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      console.error("Error fetching health index:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      fetchHealthIndex();
    }
  }, [patientId]);

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-6">
          <Loader className="w-5 h-5 animate-spin mr-2 text-gray-400" />
          <span className="text-gray-500">Calculating health index...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-red-200">
        <CardContent className="flex items-center justify-center p-6">
          <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
          <span className="text-red-600">{error}</span>
        </CardContent>
      </Card>
    );
  }

  if (!healthIndex) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-6 text-gray-500">
          No health data available
        </CardContent>
      </Card>
    );
  }

  // Show message when there's no sufficient clinical data (no diagnosis or lab tests)
  if (!healthIndex.hasSufficientData) {
    return (
      <Card className="w-full border-gray-200 border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="w-5 h-5 text-gray-400" />
            Health Index Score
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Stethoscope className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-base font-medium text-gray-700 mb-2">
            Awaiting Clinical Data
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Health Index will be calculated once the patient has a diagnosis recorded or lab test results are available.
          </p>
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Stethoscope className="w-3 h-3" />
              <span>Diagnosis</span>
            </div>
            <span>or</span>
            <div className="flex items-center gap-1">
              <FlaskConical className="w-3 h-3" />
              <span>Lab Results</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const styles = CATEGORY_STYLES[healthIndex.category];

  // Compact view for dashboard widgets
  if (compact) {
    return (
      <Card className={`w-full ${styles.border} border`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full ${styles.bg} flex items-center justify-center`}>
                <span className={`text-lg font-bold ${styles.color}`}>
                  {healthIndex.overallScore}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Health Index</p>
                <div className="flex items-center gap-1">
                  {TREND_ICONS[healthIndex.trend]}
                  <span className="text-xs text-gray-500">
                    {TREND_LABELS[healthIndex.trend]}
                    {healthIndex.trendDelta !== 0 && (
                      <span className={healthIndex.trendDelta > 0 ? "text-green-600" : "text-red-600"}>
                        {" "}({healthIndex.trendDelta > 0 ? "+" : ""}{healthIndex.trendDelta})
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
            <Badge className={styles.badge}>
              {healthIndex.category}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full view with breakdown
  return (
    <Card className={`w-full ${styles.border} border`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className={`w-5 h-5 ${styles.color}`} />
            Health Index Score
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchHealthIndex}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Score Display */}
        <div className="flex items-center gap-4">
          <div className={`w-20 h-20 rounded-full ${styles.bg} flex items-center justify-center relative`}>
            <span className={`text-3xl font-bold ${styles.color}`}>
              {healthIndex.overallScore}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={styles.badge}>
                {healthIndex.category}
              </Badge>
              <div className="flex items-center gap-1">
                {TREND_ICONS[healthIndex.trend]}
                <span className="text-sm text-gray-600">
                  {TREND_LABELS[healthIndex.trend]}
                  {healthIndex.trendDelta !== 0 && (
                    <span className={healthIndex.trendDelta > 0 ? "text-green-600" : "text-red-600"}>
                      {" "}({healthIndex.trendDelta > 0 ? "+" : ""}{healthIndex.trendDelta} pts)
                    </span>
                  )}
                </span>
              </div>
            </div>
            <Progress value={healthIndex.overallScore} className="h-2" />
            <p className="text-xs text-gray-500 mt-1">
              Based on {healthIndex.dataPoints} clinical data points
            </p>
          </div>
        </div>

        {/* Score Components Summary */}
        <div className="grid grid-cols-5 gap-2">
          <TooltipProvider>
            <ScoreIndicator
              icon={<Heart className="w-4 h-4" />}
              label="Vitals"
              score={healthIndex.breakdown.vitalsScore}
            />
            <ScoreIndicator
              icon={<FlaskConical className="w-4 h-4" />}
              label="Labs"
              score={healthIndex.breakdown.labScore}
            />
            <ScoreIndicator
              icon={<Stethoscope className="w-4 h-4" />}
              label="Diagnosis"
              score={healthIndex.breakdown.diagnosisScore}
            />
            <ScoreIndicator
              icon={<BedDouble className="w-4 h-4" />}
              label="Hospital"
              score={healthIndex.breakdown.hospitalizationScore}
            />
            <ScoreIndicator
              icon={<Pill className="w-4 h-4" />}
              label="Meds"
              score={healthIndex.breakdown.medicationScore}
            />
          </TooltipProvider>
        </div>

        {/* Detailed Vitals Breakdown (Collapsible) */}
        {healthIndex.breakdown.vitals.length > 0 && (
          <Collapsible open={isBreakdownOpen} onOpenChange={setIsBreakdownOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                <span className="text-sm text-gray-600">Vital Signs Details</span>
                {isBreakdownOpen ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              {healthIndex.breakdown.vitals.map((vital, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <span className={`p-1 rounded ${STATUS_STYLES[vital.status]}`}>
                      {VITAL_ICONS[vital.name] || <Activity className="w-4 h-4" />}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{vital.name}</p>
                      <p className="text-xs text-gray-500">Normal: {vital.normalRange}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      vital.status === "normal" ? "text-green-600" :
                      vital.status === "warning" ? "text-yellow-600" :
                      vital.status === "critical" ? "text-red-600" : "text-gray-500"
                    }`}>
                      {vital.value ?? "N/A"}
                    </p>
                    <p className="text-xs text-gray-400">Score: {vital.score}</p>
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Last Updated */}
        <div className="flex items-center justify-between">
          <Link href={`/doctor/patients/${patientId}/health-index`}>
            <Button variant="outline" size="sm" className="text-xs">
              <Activity className="w-3 h-3 mr-1" />
              View Full Dashboard
            </Button>
          </Link>
          <p className="text-xs text-gray-400">
            Last updated: {new Date(healthIndex.lastUpdated).toLocaleString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper component for score indicators
function ScoreIndicator({
  icon,
  label,
  score,
}: {
  icon: React.ReactNode;
  label: string;
  score: number;
}) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-600";
    if (score >= 70) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    if (score >= 30) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex flex-col items-center p-2 rounded-lg bg-gray-50 cursor-help">
          <span className="text-gray-500">{icon}</span>
          <span className={`text-sm font-semibold ${getScoreColor(score)}`}>
            {score}
          </span>
          <span className="text-xs text-gray-400">{label}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{label} Score: {score}/100</p>
      </TooltipContent>
    </Tooltip>
  );
}

export default HealthIndexCard;

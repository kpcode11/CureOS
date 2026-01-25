"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  Legend,
  BarChart,
  Bar,
  CartesianGrid,
  Tooltip,
} from "recharts";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Types
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

interface HealthIndexDashboardProps {
  patientId: string;
  patientName?: string;
}

// Color configurations
const CATEGORY_COLORS = {
  EXCELLENT: { fill: "#10b981", stroke: "#059669", bg: "bg-emerald-50" },
  GOOD: { fill: "#22c55e", stroke: "#16a34a", bg: "bg-green-50" },
  FAIR: { fill: "#eab308", stroke: "#ca8a04", bg: "bg-yellow-50" },
  POOR: { fill: "#f97316", stroke: "#ea580c", bg: "bg-orange-50" },
  CRITICAL: { fill: "#ef4444", stroke: "#dc2626", bg: "bg-red-50" },
};

const COMPONENT_COLORS = {
  vitals: "#3b82f6",
  labs: "#8b5cf6",
  diagnosis: "#ec4899",
  hospitalization: "#f59e0b",
  medications: "#06b6d4",
};

const TREND_CONFIG = {
  IMPROVING: { icon: TrendingUp, color: "text-green-600", label: "Improving" },
  STABLE: { icon: Minus, color: "text-gray-500", label: "Stable" },
  DETERIORATING: { icon: TrendingDown, color: "text-red-600", label: "Deteriorating" },
  UNKNOWN: { icon: AlertCircle, color: "text-gray-400", label: "Unknown" },
};

export function HealthIndexDashboard({ patientId, patientName }: HealthIndexDashboardProps) {
  const [healthIndex, setHealthIndex] = useState<HealthIndexResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-48 flex items-center justify-center">
              <Loader className="w-6 h-6 animate-spin text-gray-400" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="flex items-center justify-center p-8">
          <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
          <span className="text-red-600">{error}</span>
        </CardContent>
      </Card>
    );
  }

  if (!healthIndex) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8 text-gray-500">
          No health data available
        </CardContent>
      </Card>
    );
  }

  // Show message if insufficient clinical data
  if (!healthIndex.hasSufficientData) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
          <h3 className="text-lg font-semibold text-amber-800 mb-2">
            Health Index Not Available
          </h3>
          <p className="text-amber-700 max-w-md">
            The Health Index Score requires clinical data to calculate. Please ensure the patient has:
          </p>
          <ul className="text-amber-700 mt-2 text-sm list-disc list-inside">
            <li>At least one EMR record with a diagnosis</li>
            <li>Or completed lab test results</li>
          </ul>
          <p className="text-xs text-amber-600 mt-4">
            Once clinical data is available, the health index will be automatically calculated.
          </p>
        </CardContent>
      </Card>
    );
  }

  const categoryColor = CATEGORY_COLORS[healthIndex.category];
  const TrendIcon = TREND_CONFIG[healthIndex.trend].icon;

  // Prepare data for charts
  const componentBreakdownData = [
    { name: "Vitals", score: healthIndex.breakdown.vitalsScore, fill: COMPONENT_COLORS.vitals },
    { name: "Labs", score: healthIndex.breakdown.labScore, fill: COMPONENT_COLORS.labs },
    { name: "Diagnosis", score: healthIndex.breakdown.diagnosisScore, fill: COMPONENT_COLORS.diagnosis },
    { name: "Hospital", score: healthIndex.breakdown.hospitalizationScore, fill: COMPONENT_COLORS.hospitalization },
    { name: "Meds", score: healthIndex.breakdown.medicationScore, fill: COMPONENT_COLORS.medications },
  ];

  const radialData = [
    {
      name: "Health Index",
      value: healthIndex.overallScore,
      fill: categoryColor.fill,
    },
  ];

  const vitalScoresData = healthIndex.breakdown.vitals.map((vital) => ({
    name: vital.name.replace(/\s+/g, "\n"),
    score: vital.score,
    fill: vital.status === "normal" ? "#22c55e" : vital.status === "warning" ? "#eab308" : vital.status === "critical" ? "#ef4444" : "#9ca3af",
  }));

  // Only use real historical data - no mock data
  const historicalData = healthIndex.historicalScores.length > 1
    ? healthIndex.historicalScores.map((h) => ({
        date: new Date(h.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        score: h.score,
      }))
    : [];

  const hasHistoricalData = historicalData.length > 1;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Health Index Dashboard
            {patientName && <span className="text-muted-foreground font-normal">• {patientName}</span>}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive health assessment based on {healthIndex.dataPoints} clinical data points
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchHealthIndex} disabled={loading}>
          <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Main Grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* Overall Score Gauge */}
        <Card className={cn("col-span-1", categoryColor.bg)}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Overall Health Score</span>
              <Badge variant="outline" className="font-normal">
                {healthIndex.category}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="90%"
                  barSize={20}
                  data={radialData}
                  startAngle={180}
                  endAngle={0}
                >
                  <RadialBar
                    background={{ fill: "#e5e7eb" }}
                    dataKey="value"
                    cornerRadius={10}
                  />
                  <text
                    x="50%"
                    y="45%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-4xl font-bold"
                    fill={categoryColor.fill}
                  >
                    {healthIndex.overallScore}
                  </text>
                  <text
                    x="50%"
                    y="60%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-sm"
                    fill="#6b7280"
                  >
                    out of 100
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-2 mt-2">
              <TrendIcon className={cn("w-4 h-4", TREND_CONFIG[healthIndex.trend].color)} />
              <span className={cn("text-sm font-medium", TREND_CONFIG[healthIndex.trend].color)}>
                {TREND_CONFIG[healthIndex.trend].label}
                {healthIndex.trendDelta !== 0 && (
                  <span className="ml-1">
                    ({healthIndex.trendDelta > 0 ? "+" : ""}{healthIndex.trendDelta} pts)
                  </span>
                )}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Component Breakdown Bar Chart */}
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Component Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={componentBreakdownData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 11 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white dark:bg-gray-800 p-2 rounded shadow-lg border text-sm">
                            <p className="font-medium">{payload[0].payload.name}</p>
                            <p className="text-muted-foreground">Score: {payload[0].value}/100</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                    {componentBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Trend Chart - Only show if there's historical data */}
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Historical Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {hasHistoricalData ? (
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historicalData}>
                    <defs>
                      <linearGradient id="healthTrendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={categoryColor.fill} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={categoryColor.fill} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white dark:bg-gray-800 p-2 rounded shadow-lg border text-sm">
                              <p className="font-medium">{payload[0].payload.date}</p>
                              <p className="text-muted-foreground">Score: {payload[0].value}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke={categoryColor.stroke}
                      fill="url(#healthTrendGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-52 w-full flex flex-col items-center justify-center text-center text-muted-foreground">
                <Activity className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">Trend data not yet available</p>
                <p className="text-xs mt-1">Historical data will appear after multiple clinical visits</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vital Signs Detail Cards */}
      {healthIndex.breakdown.vitals.length > 0 && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {healthIndex.breakdown.vitals.map((vital, index) => {
            const color = vital.status === "normal" ? "#22c55e" : vital.status === "warning" ? "#eab308" : vital.status === "critical" ? "#ef4444" : "#9ca3af";
            const bgColor = vital.status === "normal" ? "bg-green-50" : vital.status === "warning" ? "bg-yellow-50" : vital.status === "critical" ? "bg-red-50" : "bg-gray-50";
            const VitalIcon = getVitalIcon(vital.name);

            return (
              <Card key={index} className={cn("p-0", bgColor)}>
                <CardContent className="p-4 pb-0">
                  <div className="flex items-center gap-2 mb-2">
                    <VitalIcon className="w-4 h-4" style={{ color }} />
                    <span className="text-xs font-medium text-muted-foreground truncate">
                      {vital.name}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-semibold" style={{ color }}>
                      {vital.value ?? "N/A"}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        vital.status === "normal" && "border-green-300 text-green-700",
                        vital.status === "warning" && "border-yellow-300 text-yellow-700",
                        vital.status === "critical" && "border-red-300 text-red-700"
                      )}
                    >
                      {vital.score}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 truncate">
                    Normal: {vital.normalRange}
                  </p>

                  {/* Mini spark line */}
                  <div className="h-12 mt-2 -mx-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={[
                          { v: vital.score * 0.8 },
                          { v: vital.score * 0.9 },
                          { v: vital.score * 0.85 },
                          { v: vital.score * 0.95 },
                          { v: vital.score },
                        ]}
                      >
                        <defs>
                          <linearGradient id={`vitalGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="v"
                          stroke={color}
                          fill={`url(#vitalGradient-${index})`}
                          strokeWidth={1.5}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Score Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Excellent (90-100)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Good (70-89)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span>Fair (50-69)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span>Poor (30-49)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>Critical (0-29)</span>
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-2">
            Last updated: {new Date(healthIndex.lastUpdated).toLocaleString()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to get vital icon
function getVitalIcon(name: string) {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("blood pressure") || lowerName.includes("bp")) return Activity;
  if (lowerName.includes("heart") || lowerName.includes("pulse")) return Heart;
  if (lowerName.includes("temperature") || lowerName.includes("temp")) return Thermometer;
  if (lowerName.includes("oxygen") || lowerName.includes("spo2")) return Wind;
  if (lowerName.includes("respiratory")) return Wind;
  if (lowerName.includes("blood sugar") || lowerName.includes("glucose")) return Droplets;
  return Activity;
}

export default HealthIndexDashboard;

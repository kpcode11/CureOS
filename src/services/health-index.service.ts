/**
 * Health Index Service
 * 
 * Calculates a comprehensive health index score (0-100) for patients
 * based on multiple clinical parameters from their medical records.
 * 
 * Score Interpretation:
 * - 90-100: Excellent health
 * - 70-89: Good health
 * - 50-69: Fair health (needs monitoring)
 * - 30-49: Poor health (needs attention)
 * - 0-29: Critical (requires immediate intervention)
 * 
 * Trend Analysis:
 * - IMPROVING: Score increased by 5+ points over last 7 days
 * - STABLE: Score within ±5 points
 * - DETERIORATING: Score decreased by 5+ points
 */

import { prisma } from '@/lib/prisma';

// Types
export interface VitalScore {
  name: string;
  value: string | number | null;
  score: number; // 0-100 for this vital
  status: 'normal' | 'warning' | 'critical' | 'unknown';
  normalRange?: string;
}

export interface HealthIndexResult {
  overallScore: number;
  trend: 'IMPROVING' | 'STABLE' | 'DETERIORATING' | 'UNKNOWN';
  trendDelta: number;
  category: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
  breakdown: {
    vitals: VitalScore[];
    vitalsScore: number;
    labScore: number;
    medicationScore: number;
    hospitalizationScore: number;
    diagnosisScore: number;
  };
  lastUpdated: Date;
  dataPoints: number;
  historicalScores: Array<{ date: Date; score: number }>;
}

// Normal ranges for vitals
const VITAL_RANGES = {
  systolicBP: { min: 90, max: 120, warningLow: 80, warningHigh: 140, unit: 'mmHg' },
  diastolicBP: { min: 60, max: 80, warningLow: 50, warningHigh: 90, unit: 'mmHg' },
  heartRate: { min: 60, max: 100, warningLow: 50, warningHigh: 110, unit: 'bpm' },
  temperature: { min: 36.1, max: 37.2, warningLow: 35.5, warningHigh: 38.0, unit: '°C' },
  temperatureF: { min: 97, max: 99, warningLow: 95.9, warningHigh: 100.4, unit: '°F' },
  spo2: { min: 95, max: 100, warningLow: 90, warningHigh: 100, unit: '%' },
  respiratoryRate: { min: 12, max: 20, warningLow: 10, warningHigh: 25, unit: '/min' },
  bloodSugar: { min: 70, max: 100, warningLow: 60, warningHigh: 140, unit: 'mg/dL' },
  pulse: { min: 60, max: 100, warningLow: 50, warningHigh: 110, unit: 'bpm' },
};

// Lab test normal ranges
const LAB_RANGES = {
  hemoglobin: { min: 12, max: 17.5, unit: 'g/dL' },
  wbc: { min: 4.5, max: 11, unit: 'K/uL' },
  rbc: { min: 4.5, max: 5.5, unit: 'M/uL' },
  platelets: { min: 150, max: 400, unit: 'K/uL' },
  hematocrit: { min: 36, max: 54, unit: '%' },
  glucose: { min: 70, max: 100, unit: 'mg/dL' },
  creatinine: { min: 0.7, max: 1.3, unit: 'mg/dL' },
};

// Critical diagnosis keywords that lower the score
const CRITICAL_DIAGNOSES = [
  'cancer', 'malignant', 'tumor', 'carcinoma', 'leukemia', 'lymphoma',
  'heart failure', 'cardiac arrest', 'myocardial infarction', 'stroke',
  'sepsis', 'septic shock', 'renal failure', 'liver failure',
  'respiratory failure', 'ards', 'covid', 'pneumonia severe',
  'diabetic ketoacidosis', 'dka', 'coma', 'critical', 'emergency',
];

const MODERATE_DIAGNOSES = [
  'diabetes', 'hypertension', 'asthma', 'copd', 'pneumonia',
  'infection', 'fracture', 'surgery', 'chronic', 'disorder',
  'anemia', 'thyroid', 'arthritis', 'gastritis', 'ulcer',
];

/**
 * Parse blood pressure string like "120/80" or "120/80 mmHg"
 */
function parseBloodPressure(bp: string | null | undefined): { systolic: number; diastolic: number } | null {
  if (!bp) return null;
  const match = bp.toString().match(/(\d+)\s*\/\s*(\d+)/);
  if (match) {
    return { systolic: parseInt(match[1]), diastolic: parseInt(match[2]) };
  }
  return null;
}

/**
 * Extract numeric value from string like "98.6 °F" or "72 bpm"
 */
function extractNumeric(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  const match = value.toString().match(/[\d.]+/);
  return match ? parseFloat(match[0]) : null;
}

/**
 * Score a vital sign (0-100)
 */
function scoreVital(
  value: number | null,
  range: { min: number; max: number; warningLow: number; warningHigh: number }
): { score: number; status: 'normal' | 'warning' | 'critical' | 'unknown' } {
  if (value === null) return { score: 50, status: 'unknown' };

  // Perfect range
  if (value >= range.min && value <= range.max) {
    return { score: 100, status: 'normal' };
  }

  // Warning range
  if (value >= range.warningLow && value < range.min) {
    const deviation = (range.min - value) / (range.min - range.warningLow);
    return { score: Math.round(100 - deviation * 30), status: 'warning' };
  }
  if (value > range.max && value <= range.warningHigh) {
    const deviation = (value - range.max) / (range.warningHigh - range.max);
    return { score: Math.round(100 - deviation * 30), status: 'warning' };
  }

  // Critical range
  if (value < range.warningLow) {
    const deviation = Math.min((range.warningLow - value) / range.warningLow, 1);
    return { score: Math.max(0, Math.round(70 - deviation * 70)), status: 'critical' };
  }
  if (value > range.warningHigh) {
    const deviation = Math.min((value - range.warningHigh) / range.warningHigh, 1);
    return { score: Math.max(0, Math.round(70 - deviation * 70)), status: 'critical' };
  }

  return { score: 50, status: 'unknown' };
}

/**
 * Score vitals from EMR records
 */
function scoreVitals(vitals: Record<string, any> | null): { totalScore: number; vitalScores: VitalScore[] } {
  if (!vitals || Object.keys(vitals).length === 0) {
    return { totalScore: 75, vitalScores: [] }; // Neutral score if no vitals
  }

  const vitalScores: VitalScore[] = [];

  // Blood Pressure
  const bpValue = vitals.bp || vitals.bloodPressure || vitals.BP;
  const bp = parseBloodPressure(bpValue);
  if (bp) {
    const systolicResult = scoreVital(bp.systolic, VITAL_RANGES.systolicBP);
    const diastolicResult = scoreVital(bp.diastolic, VITAL_RANGES.diastolicBP);
    const bpScore = Math.round((systolicResult.score + diastolicResult.score) / 2);
    const bpStatus = systolicResult.status === 'critical' || diastolicResult.status === 'critical' 
      ? 'critical' 
      : systolicResult.status === 'warning' || diastolicResult.status === 'warning'
        ? 'warning'
        : 'normal';
    vitalScores.push({
      name: 'Blood Pressure',
      value: bpValue,
      score: bpScore,
      status: bpStatus,
      normalRange: '90-120/60-80 mmHg',
    });
  }

  // Heart Rate / Pulse
  const hrValue = extractNumeric(vitals.heartRate || vitals.pulse || vitals.hr || vitals.HR);
  if (hrValue !== null) {
    const result = scoreVital(hrValue, VITAL_RANGES.heartRate);
    vitalScores.push({
      name: 'Heart Rate',
      value: hrValue,
      score: result.score,
      status: result.status,
      normalRange: '60-100 bpm',
    });
  }

  // Temperature
  const tempValue = extractNumeric(vitals.temperature || vitals.temp || vitals.Temperature);
  if (tempValue !== null) {
    // Detect Fahrenheit vs Celsius
    const range = tempValue > 50 ? VITAL_RANGES.temperatureF : VITAL_RANGES.temperature;
    const result = scoreVital(tempValue, range);
    vitalScores.push({
      name: 'Temperature',
      value: tempValue,
      score: result.score,
      status: result.status,
      normalRange: tempValue > 50 ? '97-99 °F' : '36.1-37.2 °C',
    });
  }

  // SpO2
  const spo2Value = extractNumeric(vitals.spo2 || vitals.SpO2 || vitals.oxygenSaturation || vitals.o2sat);
  if (spo2Value !== null) {
    const result = scoreVital(spo2Value, VITAL_RANGES.spo2);
    vitalScores.push({
      name: 'Oxygen Saturation',
      value: spo2Value,
      score: result.score,
      status: result.status,
      normalRange: '95-100%',
    });
  }

  // Respiratory Rate
  const rrValue = extractNumeric(vitals.respiratoryRate || vitals.rr || vitals.respRate);
  if (rrValue !== null) {
    const result = scoreVital(rrValue, VITAL_RANGES.respiratoryRate);
    vitalScores.push({
      name: 'Respiratory Rate',
      value: rrValue,
      score: result.score,
      status: result.status,
      normalRange: '12-20 /min',
    });
  }

  // Blood Sugar
  const bsValue = extractNumeric(vitals.bloodSugar || vitals.glucose || vitals.bloodGlucose);
  if (bsValue !== null) {
    const result = scoreVital(bsValue, VITAL_RANGES.bloodSugar);
    vitalScores.push({
      name: 'Blood Sugar',
      value: bsValue,
      score: result.score,
      status: result.status,
      normalRange: '70-100 mg/dL',
    });
  }

  // Calculate average vital score
  const totalScore = vitalScores.length > 0
    ? Math.round(vitalScores.reduce((sum, v) => sum + v.score, 0) / vitalScores.length)
    : 75;

  return { totalScore, vitalScores };
}

/**
 * Score lab results
 */
function scoreLabResults(labTests: Array<{ results: any; status: string }>): number {
  if (!labTests || labTests.length === 0) return 80; // Neutral score

  const completedTests = labTests.filter(t => t.status === 'COMPLETED' && t.results);
  if (completedTests.length === 0) return 75;

  let totalScore = 0;
  let count = 0;

  for (const test of completedTests) {
    const results = test.results as Record<string, any>;
    if (!results) continue;

    for (const [key, value] of Object.entries(results)) {
      const numValue = extractNumeric(value);
      if (numValue === null) continue;

      const normalizedKey = key.toLowerCase().replace(/[_\s]/g, '');
      
      // Match with known lab ranges
      for (const [labKey, range] of Object.entries(LAB_RANGES)) {
        if (normalizedKey.includes(labKey.toLowerCase())) {
          const score = scoreVital(numValue, {
            ...range,
            warningLow: range.min * 0.8,
            warningHigh: range.max * 1.2,
          });
          totalScore += score.score;
          count++;
          break;
        }
      }
    }
  }

  return count > 0 ? Math.round(totalScore / count) : 80;
}

/**
 * Score based on active medications
 */
function scoreMedications(prescriptions: Array<{ dispensed: boolean; createdAt: Date }>): number {
  if (!prescriptions || prescriptions.length === 0) return 95; // No medications = healthy

  // Count recent active prescriptions (last 30 days, not yet dispensed or recently dispensed)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const activeMeds = prescriptions.filter(p => new Date(p.createdAt) >= thirtyDaysAgo);
  
  // More medications = lower score (indicates more health issues)
  if (activeMeds.length === 0) return 95;
  if (activeMeds.length <= 2) return 85;
  if (activeMeds.length <= 4) return 75;
  if (activeMeds.length <= 6) return 65;
  return 55;
}

/**
 * Score based on hospitalization status
 */
function scoreHospitalization(bedAssignments: Array<{ dischargedAt: Date | null }>): number {
  if (!bedAssignments || bedAssignments.length === 0) return 100; // Not hospitalized

  const currentlyAdmitted = bedAssignments.some(ba => !ba.dischargedAt);
  
  if (currentlyAdmitted) return 50; // Currently hospitalized = significant health concern
  
  // Recently discharged
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const recentlyDischarged = bedAssignments.some(
    ba => ba.dischargedAt && new Date(ba.dischargedAt) >= oneWeekAgo
  );
  
  if (recentlyDischarged) return 70;
  
  return 90;
}

/**
 * Score based on diagnosis severity
 */
function scoreDiagnosis(emrRecords: Array<{ diagnosis: string }>): number {
  if (!emrRecords || emrRecords.length === 0) return 90;

  // Check most recent diagnosis
  const recentDiagnosis = emrRecords[0]?.diagnosis?.toLowerCase() || '';
  
  // Check for critical conditions
  for (const keyword of CRITICAL_DIAGNOSES) {
    if (recentDiagnosis.includes(keyword)) {
      return 30;
    }
  }

  // Check for moderate conditions
  for (const keyword of MODERATE_DIAGNOSES) {
    if (recentDiagnosis.includes(keyword)) {
      return 60;
    }
  }

  return 85;
}

/**
 * Determine trend category
 */
function getTrend(delta: number): 'IMPROVING' | 'STABLE' | 'DETERIORATING' | 'UNKNOWN' {
  if (delta >= 5) return 'IMPROVING';
  if (delta <= -5) return 'DETERIORATING';
  return 'STABLE';
}

/**
 * Get score category
 */
function getCategory(score: number): 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL' {
  if (score >= 90) return 'EXCELLENT';
  if (score >= 70) return 'GOOD';
  if (score >= 50) return 'FAIR';
  if (score >= 30) return 'POOR';
  return 'CRITICAL';
}

/**
 * Main function to calculate health index for a patient
 */
export async function calculateHealthIndex(patientId: string): Promise<HealthIndexResult> {
  // Fetch all relevant patient data
  const [emrRecords, labTests, prescriptions, bedAssignments] = await Promise.all([
    prisma.eMR.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        diagnosis: true,
        symptoms: true,
        vitals: true,
        createdAt: true,
      },
    }),
    prisma.labTest.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        status: true,
        results: true,
        createdAt: true,
      },
    }),
    prisma.prescription.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: {
        id: true,
        dispensed: true,
        createdAt: true,
      },
    }),
    prisma.bedAssignment.findMany({
      where: { patientId },
      orderBy: { assignedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        dischargedAt: true,
      },
    }),
  ]);

  // Calculate component scores
  const latestVitals = emrRecords[0]?.vitals as Record<string, any> | null;
  const { totalScore: vitalsScore, vitalScores } = scoreVitals(latestVitals);
  const labScore = scoreLabResults(labTests);
  const medicationScore = scoreMedications(prescriptions);
  const hospitalizationScore = scoreHospitalization(bedAssignments);
  const diagnosisScore = scoreDiagnosis(emrRecords);

  // Weighted average for overall score
  // Weights: Vitals (30%), Labs (25%), Diagnosis (20%), Hospitalization (15%), Medications (10%)
  const overallScore = Math.round(
    vitalsScore * 0.30 +
    labScore * 0.25 +
    diagnosisScore * 0.20 +
    hospitalizationScore * 0.15 +
    medicationScore * 0.10
  );

  // Calculate historical scores for trend (simulate based on EMR history)
  const historicalScores: Array<{ date: Date; score: number }> = [];
  
  // Use historical EMR records to estimate past scores
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const historicalEmr = emrRecords.filter(e => new Date(e.createdAt) < oneWeekAgo);
  
  if (historicalEmr.length > 0) {
    const oldVitals = historicalEmr[0]?.vitals as Record<string, any> | null;
    const { totalScore: oldVitalsScore } = scoreVitals(oldVitals);
    const oldDiagnosisScore = scoreDiagnosis(historicalEmr);
    
    const oldScore = Math.round(
      oldVitalsScore * 0.30 +
      labScore * 0.25 +
      oldDiagnosisScore * 0.20 +
      hospitalizationScore * 0.15 +
      medicationScore * 0.10
    );
    
    historicalScores.push({ date: new Date(historicalEmr[0].createdAt), score: oldScore });
  }

  // Calculate trend
  const trendDelta = historicalScores.length > 0 
    ? overallScore - historicalScores[0].score 
    : 0;
  const trend = historicalScores.length > 0 ? getTrend(trendDelta) : 'UNKNOWN';

  // Add current score to history
  historicalScores.unshift({ date: new Date(), score: overallScore });

  return {
    overallScore,
    trend,
    trendDelta,
    category: getCategory(overallScore),
    breakdown: {
      vitals: vitalScores,
      vitalsScore,
      labScore,
      medicationScore,
      hospitalizationScore,
      diagnosisScore,
    },
    lastUpdated: new Date(),
    dataPoints: emrRecords.length + labTests.length + prescriptions.length,
    historicalScores,
  };
}

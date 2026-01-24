'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  Users,
  Ambulance,
  Clock,
  Plus,
  RefreshCw,
  Shield,
  Loader2,
  Activity,
  UserPlus,
} from 'lucide-react';
import {
  useEmergency,
  EmergencyCase,
  EmergencySeverity,
  EmergencyStatus,
} from '@/hooks/use-emergency';

const severityColors: Record<EmergencySeverity, string> = {
  CRITICAL: 'bg-red-600 text-white',
  HIGH: 'bg-orange-500 text-white',
  MEDIUM: 'bg-yellow-500 text-black',
  LOW: 'bg-green-500 text-white',
};

const statusColors: Record<EmergencyStatus, string> = {
  ACTIVE: 'bg-red-100 text-red-800',
  TREATED: 'bg-blue-100 text-blue-800',
  DISCHARGED: 'bg-green-100 text-green-800',
  TRANSFERRED: 'bg-purple-100 text-purple-800',
};

export function EmergencyDashboard() {
  const [mounted, setMounted] = useState(false);
  const [cases, setCases] = useState<EmergencyCase[]>([]);
  const [isNewPatientOpen, setIsNewPatientOpen] = useState(false);
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // New patient form state
  const [newPatient, setNewPatient] = useState({
    patientName: '',
    condition: '',
    severity: 'MEDIUM' as EmergencySeverity,
  });

  // Override form state
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideToken, setOverrideToken] = useState<string | null>(null);
  const [overrideExpiry, setOverrideExpiry] = useState<string | null>(null);

  const {
    loading,
    getEmergencyCases,
    createEmergencyCase,
    requestEmergencyOverride,
  } = useEmergency();

  const loadCases = useCallback(async () => {
    const data = await getEmergencyCases();
    setCases(data);
  }, [getEmergencyCases]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      loadCases();
    }
  }, [mounted, loadCases]);

  if (!mounted) return null;

  // Calculate stats from actual data
  const activeCases = cases.filter((c) => c.status === 'ACTIVE').length;
  const treatedCases = cases.filter((c) => c.status === 'TREATED').length;
  const criticalCases = cases.filter(
    (c) => c.severity === 'CRITICAL' && c.status === 'ACTIVE'
  ).length;
  const totalToday = cases.filter((c) => {
    const today = new Date();
    const caseDate = new Date(c.arrivedAt);
    return caseDate.toDateString() === today.toDateString();
  }).length;

  const stats = [
    {
      title: 'Active Cases',
      value: activeCases,
      icon: AlertTriangle,
      color: 'bg-red-500',
    },
    {
      title: 'Critical',
      value: criticalCases,
      icon: Activity,
      color: 'bg-orange-600',
    },
    {
      title: 'Treated',
      value: treatedCases,
      icon: Ambulance,
      color: 'bg-blue-500',
    },
    {
      title: 'Today\'s Arrivals',
      value: totalToday,
      icon: Clock,
      color: 'bg-green-500',
    },
  ];

  const handleCreatePatient = async () => {
    if (!newPatient.patientName || !newPatient.condition) return;

    const created = await createEmergencyCase(newPatient);
    if (created) {
      setNewPatient({ patientName: '', condition: '', severity: 'MEDIUM' });
      setIsNewPatientOpen(false);
      loadCases();
    }
  };

  const handleRequestOverride = async () => {
    if (!overrideReason || overrideReason.length < 5) return;

    const override = await requestEmergencyOverride({
      reason: overrideReason,
      ttlMinutes: 15,
    });
    if (override) {
      setOverrideToken(override.token);
      setOverrideExpiry(override.expiresAt);
      setOverrideReason('');
    }
  };

  const filteredCases =
    filterStatus === 'all'
      ? cases
      : cases.filter((c) => c.status === filterStatus);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Emergency Dashboard</h1>
          <p className="text-gray-600">Real-time emergency department status</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadCases}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <div className={`${stat.color} p-2 rounded text-white`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Actions Row */}
      <div className="flex gap-4 flex-wrap">
        {/* New Patient Dialog */}
        <Dialog open={isNewPatientOpen} onOpenChange={setIsNewPatientOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700">
              <UserPlus className="h-4 w-4 mr-2" />
              New Emergency Patient
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register Emergency Patient</DialogTitle>
              <DialogDescription>
                Enter the patient details for emergency intake.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="patientName">Patient Name</Label>
                <Input
                  id="patientName"
                  placeholder="Enter patient name"
                  value={newPatient.patientName}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, patientName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="condition">Condition / Chief Complaint</Label>
                <Textarea
                  id="condition"
                  placeholder="Describe the emergency condition"
                  value={newPatient.condition}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, condition: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="severity">Severity Level</Label>
                <Select
                  value={newPatient.severity}
                  onValueChange={(value: EmergencySeverity) =>
                    setNewPatient({ ...newPatient, severity: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CRITICAL">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-600" />
                        Critical - Immediate
                      </span>
                    </SelectItem>
                    <SelectItem value="HIGH">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                        High - Urgent
                      </span>
                    </SelectItem>
                    <SelectItem value="MEDIUM">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-yellow-500" />
                        Medium - Semi-Urgent
                      </span>
                    </SelectItem>
                    <SelectItem value="LOW">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        Low - Non-Urgent
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsNewPatientOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreatePatient}
                disabled={loading || !newPatient.patientName || !newPatient.condition}
                className="bg-red-600 hover:bg-red-700"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Register Patient
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Emergency Override Dialog */}
        <Dialog open={isOverrideOpen} onOpenChange={setIsOverrideOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50">
              <Shield className="h-4 w-4 mr-2" />
              Request Break-Glass Access
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-orange-500" />
                Emergency Override Request
              </DialogTitle>
              <DialogDescription>
                Request temporary elevated access for emergency situations. This
                action will be logged and audited.
              </DialogDescription>
            </DialogHeader>
            {overrideToken ? (
              <div className="py-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">
                    Access Granted
                  </h4>
                  <p className="text-sm text-green-700 mb-2">
                    Your emergency override token has been issued.
                  </p>
                  <div className="bg-white p-2 rounded border font-mono text-xs break-all">
                    {overrideToken}
                  </div>
                  <p className="text-xs text-green-600 mt-2">
                    Expires: {overrideExpiry ? new Date(overrideExpiry).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <Button
                  className="w-full mt-4"
                  onClick={() => {
                    setOverrideToken(null);
                    setOverrideExpiry(null);
                    setIsOverrideOpen(false);
                  }}
                >
                  Close
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-4 py-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Warning:</strong> Break-glass access should only be
                      used in genuine emergency situations. All access will be
                      logged and reviewed.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="overrideReason">Reason for Emergency Access</Label>
                    <Textarea
                      id="overrideReason"
                      placeholder="Describe why emergency access is needed (minimum 5 characters)"
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsOverrideOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRequestOverride}
                    disabled={loading || overrideReason.length < 5}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Request Override
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Emergency Cases Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Emergency Cases
            </CardTitle>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cases</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="TREATED">Treated</SelectItem>
                <SelectItem value="DISCHARGED">Discharged</SelectItem>
                <SelectItem value="TRANSFERRED">Transferred</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading && cases.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Ambulance className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No emergency cases found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium text-gray-600">
                      Patient
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600">
                      Condition
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600">
                      Severity
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600">
                      Status
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600">
                      Arrived
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCases.map((emergencyCase) => (
                    <tr
                      key={emergencyCase.id}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-2">
                        <span className="font-medium">
                          {emergencyCase.patientName}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-gray-700 line-clamp-1">
                          {emergencyCase.condition || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <Badge
                          className={severityColors[emergencyCase.severity]}
                        >
                          {emergencyCase.severity}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <Badge className={statusColors[emergencyCase.status]}>
                          {emergencyCase.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-sm text-gray-600">
                        {new Date(emergencyCase.arrivedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

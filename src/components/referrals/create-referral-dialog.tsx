"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Loader2, Search, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Doctor {
  id: string;
  specialization: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface CreateReferralDialogProps {
  trigger?: React.ReactNode;
  defaultPatientId?: string;
  onSuccess?: () => void;
}

export function CreateReferralDialog({
  trigger,
  defaultPatientId,
  onSuccess,
}: CreateReferralDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [searchDoctor, setSearchDoctor] = useState("");
  const [searchPatient, setSearchPatient] = useState("");

  const [formData, setFormData] = useState({
    toDoctorId: "",
    patientId: defaultPatientId || "",
    reason: "",
    urgency: "ROUTINE",
    clinicalNotes: "",
    requestedTests: "",
    expiresInDays: "30",
  });

  useEffect(() => {
    if (open) {
      fetchDoctors();
      if (!defaultPatientId) {
        fetchPatients();
      }
    }
  }, [open, defaultPatientId]);

  const fetchDoctors = async () => {
    try {
      setLoadingDoctors(true);
      const response = await fetch("/api/doctors");
      if (!response.ok) throw new Error("Failed to fetch doctors");
      const data = await response.json();
      setDoctors(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load doctors",
        variant: "destructive",
      });
    } finally {
      setLoadingDoctors(false);
    }
  };

  const fetchPatients = async () => {
    try {
      setLoadingPatients(true);
      // Try doctor-specific endpoint first, fallback to general patients endpoint
      let response = await fetch("/api/doctor/patients");

      // If doctor endpoint fails, try general patients endpoint
      if (!response.ok) {
        response = await fetch("/api/patients");
      }

      if (!response.ok) throw new Error("Failed to fetch patients");

      const data = await response.json();
      setPatients(Array.isArray(data) ? data : data.patients || []);
    } catch (error) {
      console.error("Failed to fetch patients:", error);
      toast({
        title: "Error",
        description: "Failed to load patients",
        variant: "destructive",
      });
    } finally {
      setLoadingPatients(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.toDoctorId || !formData.patientId || !formData.reason) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const requestedTests = formData.requestedTests
        ? formData.requestedTests
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      const expiresAt = formData.expiresInDays
        ? new Date(
            Date.now() + parseInt(formData.expiresInDays) * 24 * 60 * 60 * 1000,
          )
        : null;

      const payload = {
        toDoctorId: formData.toDoctorId,
        patientId: formData.patientId,
        reason: formData.reason,
        urgency: formData.urgency,
        clinicalNotes: formData.clinicalNotes,
        requestedTests,
        expiresAt: expiresAt?.toISOString(),
      };

      console.log("[CreateReferralDialog] Sending payload:", payload);

      const response = await fetch("/api/doctor/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create referral");
      }

      toast({
        title: "Referral Created",
        description: "The referral has been sent successfully",
      });

      setOpen(false);
      setFormData({
        toDoctorId: "",
        patientId: defaultPatientId || "",
        reason: "",
        urgency: "ROUTINE",
        clinicalNotes: "",
        requestedTests: "",
        expiresInDays: "30",
      });

      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create referral",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter(
    (doc) =>
      doc.user.name.toLowerCase().includes(searchDoctor.toLowerCase()) ||
      doc.specialization.toLowerCase().includes(searchDoctor.toLowerCase()),
  );

  const filteredPatients = patients.filter(
    (patient) =>
      `${patient.firstName} ${patient.lastName}`
        .toLowerCase()
        .includes(searchPatient.toLowerCase()) ||
      patient.phone.includes(searchPatient),
  );

  const selectedDoctor = doctors.find((d) => d.id === formData.toDoctorId);
  const selectedPatient = patients.find((p) => p.id === formData.patientId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Create Referral
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Doctor Referral</DialogTitle>
          <DialogDescription>
            Refer this patient to another specialist for consultation
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Select Doctor */}
          <div className="space-y-2">
            <Label htmlFor="doctor">
              Target Doctor <span className="text-red-500">*</span>
            </Label>
            {loadingDoctors ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading doctors...
              </div>
            ) : (
              <>
                <Input
                  placeholder="Search by name or specialization..."
                  value={searchDoctor}
                  onChange={(e) => setSearchDoctor(e.target.value)}
                  className="mb-2"
                />
                <Select
                  value={formData.toDoctorId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, toDoctorId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select target doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredDoctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {doctor.user.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {doctor.specialization}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedDoctor && (
                  <Badge variant="outline" className="mt-1">
                    {selectedDoctor.specialization}
                  </Badge>
                )}
              </>
            )}
          </div>

          {/* Select Patient */}
          {!defaultPatientId && (
            <div className="space-y-2">
              <Label htmlFor="patient">
                Patient <span className="text-red-500">*</span>
              </Label>
              {loadingPatients ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading patients...
                </div>
              ) : (
                <>
                  <Input
                    placeholder="Search patient by name or phone..."
                    value={searchPatient}
                    onChange={(e) => setSearchPatient(e.target.value)}
                    className="mb-2"
                  />
                  <Select
                    value={formData.patientId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, patientId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredPatients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {patient.firstName} {patient.lastName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {patient.phone}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
          )}

          {/* Urgency */}
          <div className="space-y-2">
            <Label htmlFor="urgency">
              Urgency <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.urgency}
              onValueChange={(value) =>
                setFormData({ ...formData, urgency: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ROUTINE">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    Routine
                  </div>
                </SelectItem>
                <SelectItem value="URGENT">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-yellow-500" />
                    Urgent
                  </div>
                </SelectItem>
                <SelectItem value="EMERGENCY">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    Emergency
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason for Referral <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="E.g., Requires cardiology consultation for chest pain evaluation"
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              rows={3}
              required
            />
          </div>

          {/* Clinical Notes */}
          <div className="space-y-2">
            <Label htmlFor="clinicalNotes">Clinical Notes</Label>
            <Textarea
              id="clinicalNotes"
              placeholder="Patient history, current medications, observations..."
              value={formData.clinicalNotes}
              onChange={(e) =>
                setFormData({ ...formData, clinicalNotes: e.target.value })
              }
              rows={4}
            />
          </div>

          {/* Requested Tests */}
          <div className="space-y-2">
            <Label htmlFor="requestedTests">
              Requested Tests (comma-separated)
            </Label>
            <Input
              id="requestedTests"
              placeholder="ECG, Blood Work, X-Ray"
              value={formData.requestedTests}
              onChange={(e) =>
                setFormData({ ...formData, requestedTests: e.target.value })
              }
            />
          </div>

          {/* Expiration */}
          <div className="space-y-2">
            <Label htmlFor="expiresInDays">Expires In (days)</Label>
            <Input
              id="expiresInDays"
              type="number"
              min="1"
              max="365"
              value={formData.expiresInDays}
              onChange={(e) =>
                setFormData({ ...formData, expiresInDays: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground">
              Referral will expire if not acted upon within this period
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Referral
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

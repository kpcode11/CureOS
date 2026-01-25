"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SkeletonShinyGradient } from "@/components/ui/skeleton-shiny";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowRight,
  User,
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock as ClockIcon,
  FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Referral {
  id: string;
  reason: string;
  urgency: string;
  status: string;
  clinicalNotes: string | null;
  requestedTests: string[];
  createdAt: string;
  expiresAt: string | null;
  fromDoctor: {
    id: string;
    specialization: string;
    user: { name: string; email: string };
  };
  toDoctor: {
    id: string;
    specialization: string;
    user: { name: string; email: string };
  };
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string | null;
    dateOfBirth: string;
    gender: string;
  };
  appointment: {
    id: string;
    dateTime: string;
    status: string;
  } | null;
}

export default function ReceptionistReferralsPage() {
  const { toast } = useToast();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(
    null,
  );
  const [actionDialog, setActionDialog] = useState<"accept" | "reject" | null>(
    null,
  );
  const [actionLoading, setActionLoading] = useState(false);

  const [acceptData, setAcceptData] = useState({
    notes: "",
    createAppointment: false,
    appointmentDateTime: "",
    appointmentNotes: "",
  });

  const [rejectData, setRejectData] = useState({
    reason: "",
  });

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/receptionist/referrals");
      if (!response.ok) throw new Error("Failed to fetch referrals");
      const data = await response.json();
      setReferrals(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load referrals",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!selectedReferral) return;

    try {
      setActionLoading(true);
      const response = await fetch(
        `/api/referrals/${selectedReferral.id}/accept`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notes: acceptData.notes,
            createAppointment: acceptData.createAppointment,
            appointmentData: acceptData.createAppointment
              ? {
                  dateTime: acceptData.appointmentDateTime,
                  notes: acceptData.appointmentNotes,
                }
              : undefined,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to accept referral");
      }

      toast({
        title: "Referral Accepted",
        description: acceptData.createAppointment
          ? "Referral accepted and appointment created"
          : "Referral accepted successfully",
      });

      setActionDialog(null);
      setSelectedReferral(null);
      setAcceptData({
        notes: "",
        createAppointment: false,
        appointmentDateTime: "",
        appointmentNotes: "",
      });
      fetchReferrals();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to accept referral",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedReferral || !rejectData.reason) return;

    try {
      setActionLoading(true);
      const response = await fetch(
        `/api/referrals/${selectedReferral.id}/reject`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: rejectData.reason }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reject referral");
      }

      toast({
        title: "Referral Rejected",
        description: "The referring doctor has been notified",
      });

      setActionDialog(null);
      setSelectedReferral(null);
      setRejectData({ reason: "" });
      fetchReferrals();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject referral",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: any }> = {
      PENDING: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-300",
        icon: ClockIcon,
      },
      ACCEPTED: {
        color: "bg-blue-100 text-blue-800 border-blue-300",
        icon: CheckCircle2,
      },
      CONVERTED: {
        color: "bg-green-100 text-green-800 border-green-300",
        icon: CheckCircle2,
      },
      REJECTED: {
        color: "bg-red-100 text-red-800 border-red-300",
        icon: XCircle,
      },
      EXPIRED: {
        color: "bg-gray-100 text-gray-800 border-gray-300",
        icon: AlertCircle,
      },
    };
    const config = variants[status] || variants.PENDING;
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const colors: Record<string, string> = {
      ROUTINE: "bg-green-100 text-green-800 border-green-300",
      URGENT: "bg-yellow-100 text-yellow-800 border-yellow-300",
      EMERGENCY: "bg-red-100 text-red-800 border-red-300",
    };
    return (
      <Badge className={colors[urgency] || colors.ROUTINE}>
        {urgency === "EMERGENCY" && <AlertCircle className="h-3 w-3 mr-1" />}
        {urgency}
      </Badge>
    );
  };

  const pendingCount = referrals.filter((r) => r.status === "PENDING").length;
  const emergencyCount = referrals.filter(
    (r) => r.status === "PENDING" && r.urgency === "EMERGENCY",
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <SkeletonShinyGradient className="h-12 w-96 rounded-lg bg-muted" />
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonShinyGradient
                  key={i}
                  className="h-24 rounded-lg bg-muted"
                />
              ))}
            </div>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonShinyGradient
                  key={i}
                  className="h-48 rounded-lg bg-muted"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-semibold tracking-tight text-gray-900">
              Referrals Queue
            </h1>
            <p className="text-base text-gray-600">
              Process incoming patient referrals
            </p>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Pending Referrals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{pendingCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-600">
                  Emergency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-red-600">
                  {emergencyCount}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Referrals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{referrals.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Referrals List */}
          {referrals.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Referrals
                </h3>
                <p className="text-gray-600">
                  There are no referrals to process at this time
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {referrals.map((referral) => (
                <Card
                  key={referral.id}
                  className={
                    referral.urgency === "EMERGENCY"
                      ? "border-red-300 shadow-md"
                      : "hover:shadow-md transition-shadow"
                  }
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <ArrowRight className="h-4 w-4 text-blue-600" />
                          <h3 className="font-semibold text-lg">
                            From: Dr. {referral.fromDoctor.user.name} → Dr.{" "}
                            {referral.toDoctor.user.name}
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {referral.fromDoctor.specialization} →{" "}
                          {referral.toDoctor.specialization}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        {getStatusBadge(referral.status)}
                        {getUrgencyBadge(referral.urgency)}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {referral.patient.firstName}{" "}
                          {referral.patient.lastName}
                        </span>
                        <span className="text-muted-foreground">
                          • {referral.patient.gender} •{" "}
                          {format(
                            new Date(referral.patient.dateOfBirth),
                            "MMM dd, yyyy",
                          )}
                        </span>
                      </div>

                      <div className="bg-blue-50 p-3 rounded-md">
                        <p className="text-sm font-medium text-blue-900 mb-1">
                          Reason:
                        </p>
                        <p className="text-sm text-blue-800">
                          {referral.reason}
                        </p>
                      </div>

                      {referral.clinicalNotes && (
                        <div className="bg-gray-50 p-3 rounded-md">
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            Clinical Notes:
                          </p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {referral.clinicalNotes}
                          </p>
                        </div>
                      )}

                      {referral.requestedTests &&
                        referral.requestedTests.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-1">
                              Requested Tests:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {referral.requestedTests.map((test, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {test}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                      {referral.appointment && (
                        <div className="flex items-center gap-2 text-sm bg-green-50 p-3 rounded-md">
                          <Calendar className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-900">
                            Appointment Scheduled:
                          </span>
                          <span className="text-green-800">
                            {format(
                              new Date(referral.appointment.dateTime),
                              "MMM dd, yyyy hh:mm a",
                            )}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-xs text-muted-foreground">
                          Created:{" "}
                          {format(
                            new Date(referral.createdAt),
                            "MMM dd, yyyy hh:mm a",
                          )}
                        </span>
                        {referral.expiresAt && (
                          <span className="text-xs text-orange-600">
                            Expires:{" "}
                            {format(
                              new Date(referral.expiresAt),
                              "MMM dd, yyyy",
                            )}
                          </span>
                        )}
                      </div>

                      {referral.status === "PENDING" && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              setSelectedReferral(referral);
                              setActionDialog("accept");
                            }}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              setSelectedReferral(referral);
                              setActionDialog("reject");
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Accept Dialog */}
      <Dialog
        open={actionDialog === "accept"}
        onOpenChange={(open) => {
          if (!open) {
            setActionDialog(null);
            setSelectedReferral(null);
            setAcceptData({
              notes: "",
              createAppointment: false,
              appointmentDateTime: "",
              appointmentNotes: "",
            });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Referral</DialogTitle>
            <DialogDescription>
              Accept this referral and optionally create an appointment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Patient</Label>
              <p className="text-sm font-medium">
                {selectedReferral?.patient.firstName}{" "}
                {selectedReferral?.patient.lastName}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="acceptNotes">Acceptance Notes</Label>
              <Textarea
                id="acceptNotes"
                placeholder="Optional notes about this acceptance..."
                value={acceptData.notes}
                onChange={(e) =>
                  setAcceptData({ ...acceptData, notes: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="createAppointment"
                checked={acceptData.createAppointment}
                onChange={(e) =>
                  setAcceptData({
                    ...acceptData,
                    createAppointment: e.target.checked,
                  })
                }
                className="h-4 w-4"
              />
              <Label htmlFor="createAppointment" className="cursor-pointer">
                Create appointment immediately
              </Label>
            </div>

            {acceptData.createAppointment && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="appointmentDateTime">
                    Appointment Date & Time{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="appointmentDateTime"
                    type="datetime-local"
                    value={acceptData.appointmentDateTime}
                    onChange={(e) =>
                      setAcceptData({
                        ...acceptData,
                        appointmentDateTime: e.target.value,
                      })
                    }
                    required={acceptData.createAppointment}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appointmentNotes">Appointment Notes</Label>
                  <Textarea
                    id="appointmentNotes"
                    placeholder="Additional appointment notes..."
                    value={acceptData.appointmentNotes}
                    onChange={(e) =>
                      setAcceptData({
                        ...acceptData,
                        appointmentNotes: e.target.value,
                      })
                    }
                    rows={2}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setActionDialog(null)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleAccept} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Accepting...
                </>
              ) : (
                "Confirm Accept"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={actionDialog === "reject"}
        onOpenChange={(open) => {
          if (!open) {
            setActionDialog(null);
            setSelectedReferral(null);
            setRejectData({ reason: "" });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Referral</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this referral
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Patient</Label>
              <p className="text-sm font-medium">
                {selectedReferral?.patient.firstName}{" "}
                {selectedReferral?.patient.lastName}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rejectReason">
                Rejection Reason <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="rejectReason"
                placeholder="E.g., Patient needs different specialty, doctor unavailable..."
                value={rejectData.reason}
                onChange={(e) =>
                  setRejectData({ ...rejectData, reason: e.target.value })
                }
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setActionDialog(null)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading || !rejectData.reason}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Confirm Reject"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

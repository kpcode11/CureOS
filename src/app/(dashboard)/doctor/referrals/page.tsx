"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowRight,
  ArrowLeft,
  User,
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { CreateReferralDialog } from "@/components/referrals/create-referral-dialog";
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
  acceptedAt: string | null;
  rejectedReason: string | null;
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
  };
  appointment: {
    id: string;
    dateTime: string;
    status: string;
  } | null;
}

export default function DoctorReferralsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [sentReferrals, setSentReferrals] = useState<Referral[]>([]);
  const [receivedReferrals, setReceivedReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("sent");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [schedulingReferral, setSchedulingReferral] = useState<Referral | null>(
    null,
  );
  const [scheduleDateTime, setScheduleDateTime] = useState("");
  const [scheduleNotes, setScheduleNotes] = useState("");
  const [scheduling, setScheduling] = useState(false);

  useEffect(() => {
    fetchReferrals();
    const onOpen = (e: any) => {
      const { referralId, referral } = e.detail || {};
      if (referral) {
        setSchedulingReferral(referral);
      }
      setScheduleOpen(true);
    };
    window.addEventListener("open-schedule-modal", onOpen as EventListener);
    return () =>
      window.removeEventListener(
        "open-schedule-modal",
        onOpen as EventListener,
      );
  }, []);

  const fetchReferrals = async () => {
    try {
      setLoading(true);

      // Fetch sent referrals
      const sentResponse = await fetch("/api/doctor/referrals?type=sent");
      if (sentResponse.ok) {
        const sentData = await sentResponse.json();
        setSentReferrals(Array.isArray(sentData) ? sentData : []);
      }

      // Fetch received referrals
      const receivedResponse = await fetch(
        "/api/doctor/referrals?type=received",
      );
      if (receivedResponse.ok) {
        const receivedData = await receivedResponse.json();
        setReceivedReferrals(Array.isArray(receivedData) ? receivedData : []);
      }
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

  const scheduleConvert = async () => {
    if (!schedulingReferral) return;
    try {
      setScheduling(true);
      const iso = new Date(scheduleDateTime).toISOString();
      const res = await fetch(
        `/api/doctor/referrals/${schedulingReferral.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "convert",
            appointment: {
              dateTime: iso,
              reason: schedulingReferral.reason,
              notes: scheduleNotes,
            },
          }),
        },
      );
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to convert referral");
      }
      toast({
        title: "Appointment scheduled",
        description: "Referral converted to appointment",
      });
      setScheduleOpen(false);
      setSchedulingReferral(null);
      setScheduleDateTime("");
      setScheduleNotes("");
      fetchReferrals();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to schedule appointment",
        variant: "destructive",
      });
    } finally {
      setScheduling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: any }> = {
      PENDING: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-300",
        icon: Clock,
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

  const ReferralCard = ({
    referral,
    type,
  }: {
    referral: Referral;
    type: "sent" | "received";
  }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {type === "sent" ? (
                <ArrowRight className="h-4 w-4 text-blue-600" />
              ) : (
                <ArrowLeft className="h-4 w-4 text-green-600" />
              )}
              <h3 className="font-semibold text-lg">
                {type === "sent"
                  ? `To: Dr. ${referral.toDoctor.user.name}`
                  : `From: Dr. ${referral.fromDoctor.user.name}`}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {type === "sent"
                ? referral.toDoctor.specialization
                : referral.fromDoctor.specialization}
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
              {referral.patient.firstName} {referral.patient.lastName}
            </span>
            <span className="text-muted-foreground">
              • {referral.patient.phone}
            </span>
          </div>

          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-sm font-medium text-blue-900 mb-1">Reason:</p>
            <p className="text-sm text-blue-800">{referral.reason}</p>
          </div>

          {referral.clinicalNotes && (
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm font-medium text-gray-900 mb-1">
                Clinical Notes:
              </p>
              <p className="text-sm text-gray-700">{referral.clinicalNotes}</p>
            </div>
          )}

          {referral.requestedTests && referral.requestedTests.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-1">Requested Tests:</p>
              <div className="flex flex-wrap gap-1">
                {referral.requestedTests.map((test, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
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

          {referral.rejectedReason && (
            <div className="bg-red-50 p-3 rounded-md">
              <p className="text-sm font-medium text-red-900 mb-1">
                Rejection Reason:
              </p>
              <p className="text-sm text-red-800">{referral.rejectedReason}</p>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t">
            <div>
              <span className="text-xs text-muted-foreground">
                Created: {format(new Date(referral.createdAt), "MMM dd, yyyy")}
              </span>
              {referral.acceptedAt && (
                <div className="text-xs text-green-600">
                  Accepted:{" "}
                  {format(new Date(referral.acceptedAt), "MMM dd, yyyy")}
                </div>
              )}
            </div>

            {/* Actions: show Accept/Reject for received pending referrals */}
            {type === "received" &&
              (referral.status || "").toString().toUpperCase() ===
                "PENDING" && (
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch(
                          `/api/doctor/referrals/${referral.id}`,
                          {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ action: "accept" }),
                          },
                        );
                        if (!res.ok)
                          throw new Error("Failed to accept referral");
                        toast({
                          title: "Referral accepted",
                          description: "Referral accepted successfully",
                        });
                        fetchReferrals();
                      } catch (err: any) {
                        toast({
                          title: "Error",
                          description:
                            err.message || "Failed to accept referral",
                          variant: "destructive",
                        });
                      }
                    }}
                    className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Accept
                  </button>

                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch(
                          `/api/doctor/referrals/${referral.id}`,
                          {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ action: "reject" }),
                          },
                        );
                        if (!res.ok)
                          throw new Error("Failed to reject referral");
                        toast({
                          title: "Referral rejected",
                          description: "Referral rejected",
                        });
                        fetchReferrals();
                      } catch (err: any) {
                        toast({
                          title: "Error",
                          description:
                            err.message || "Failed to reject referral",
                          variant: "destructive",
                        });
                      }
                    }}
                    className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      const ev = new CustomEvent("open-schedule-modal", {
                        detail: { referralId: referral.id, referral },
                      });
                      window.dispatchEvent(ev);
                    }}
                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Convert
                  </button>
                </div>
              )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-gray-900">
                Referrals
              </h1>
              <p className="text-base text-gray-600 mt-1">
                Manage patient referrals to other specialists
              </p>
            </div>
            <CreateReferralDialog onSuccess={fetchReferrals} />
          </div>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="sent" className="gap-2">
                <ArrowRight className="h-4 w-4" />
                Sent ({sentReferrals.length})
              </TabsTrigger>
              <TabsTrigger value="received" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Received ({receivedReferrals.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sent" className="mt-6">
              {sentReferrals.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <ArrowRight className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Sent Referrals
                    </h3>
                    <p className="text-gray-600 mb-4">
                      You haven't sent any referrals yet
                    </p>
                    <CreateReferralDialog
                      trigger={<Button>Create Your First Referral</Button>}
                      onSuccess={fetchReferrals}
                    />
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {sentReferrals.map((referral) => (
                    <ReferralCard
                      key={referral.id}
                      referral={referral}
                      type="sent"
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="received" className="mt-6">
              {receivedReferrals.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <ArrowLeft className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Received Referrals
                    </h3>
                    <p className="text-gray-600">
                      You haven't received any referrals yet
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {receivedReferrals.map((referral) => (
                    <ReferralCard
                      key={referral.id}
                      referral={referral}
                      type="received"
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Scheduling Modal for Convert */}
          <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Appointment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Patient</p>
                  <div className="font-medium">
                    {schedulingReferral
                      ? `${schedulingReferral.patient.firstName} ${schedulingReferral.patient.lastName}`
                      : ""}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium">
                    Date & time
                  </label>
                  <input
                    type="datetime-local"
                    className="mt-1 block w-full border rounded px-2 py-1"
                    value={scheduleDateTime}
                    onChange={(e) => setScheduleDateTime(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">Notes</label>
                  <textarea
                    className="mt-1 block w-full border rounded px-2 py-1"
                    value={scheduleNotes}
                    onChange={(e) => setScheduleNotes(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setScheduleOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={scheduleConvert}
                  disabled={scheduling || !scheduleDateTime}
                >
                  Schedule
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

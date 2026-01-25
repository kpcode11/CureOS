"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, AlertCircle } from "lucide-react";

interface ReferralBadgeProps {
  referral?: {
    id: string;
    fromDoctor: {
      user: {
        name: string;
      };
    };
    urgency?: string;
    status?: string;
  } | null;
  compact?: boolean;
}

export function ReferralBadge({ referral, compact = false }: ReferralBadgeProps) {
  if (!referral) return null;

  const urgencyColors = {
    ROUTINE: "bg-green-100 text-green-800 border-green-300",
    URGENT: "bg-yellow-100 text-yellow-800 border-yellow-300",
    EMERGENCY: "bg-red-100 text-red-800 border-red-300",
  };

  const urgencyColor = urgencyColors[referral.urgency as keyof typeof urgencyColors] || urgencyColors.ROUTINE;

  if (compact) {
    return (
      <Badge variant="outline" className="gap-1 text-xs">
        <ArrowRight className="h-3 w-3" />
        Referral
      </Badge>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="outline" className="gap-1.5">
        <ArrowRight className="h-3 w-3" />
        Referred by: {referral.fromDoctor.user.name}
      </Badge>
      {referral.urgency && (
        <Badge className={urgencyColor}>
          {referral.urgency === "EMERGENCY" && <AlertCircle className="h-3 w-3 mr-1" />}
          {referral.urgency}
        </Badge>
      )}
    </div>
  );
}

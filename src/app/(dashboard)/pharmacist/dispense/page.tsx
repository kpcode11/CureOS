"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { SkeletonShinyGradient } from "@/components/ui/skeleton-shiny";

export default function DispensePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to queue page as they serve the same purpose
    router.replace("/pharmacist/queue");
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-4"
      >
        <SkeletonShinyGradient className="w-16 h-16 rounded-full mx-auto bg-muted" />
        <p className="text-slate-600 text-lg">
          Redirecting to dispense queue...
        </p>
        <ArrowRight className="w-6 h-6 text-blue-600 mx-auto animate-pulse" />
      </motion.div>
    </div>
  );
}

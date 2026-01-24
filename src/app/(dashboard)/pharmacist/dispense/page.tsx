"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

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
        className="text-center"
      >
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-slate-600 text-lg">
          Redirecting to dispense queue...
        </p>
        <ArrowRight className="w-6 h-6 text-blue-600 mx-auto mt-4 animate-pulse" />
      </motion.div>
    </div>
  );
}

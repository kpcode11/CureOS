import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesGrid } from "@/components/landing/features-grid";
import { ModulesShowcase } from "@/components/landing/modules-showcase";
import { BenefitsSection } from "@/components/landing/benefits-section";
import { SecuritySection } from "@/components/landing/security-section";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  // Server-side session check
  const session = await getServerSession(authOptions);

  // If user is authenticated, redirect based on role
  if (session?.user) {
    const redirectMap: Record<string, string> = {
      ADMIN: "/admin",
      DOCTOR: "/doctor",
      NURSE: "/nurse",
      PHARMACIST: "/pharmacist",
      LAB_TECH: "/lab-tech",
      LAB_TECHNICIAN: "/lab-tech",
      RECEPTIONIST: "/receptionist",
      EMERGENCY: "/emergency",
      BILLING_OFFICER: "/billing",
    };

    const role = session.user.role?.toUpperCase() || "ADMIN";
    const redirectPath = redirectMap[role] || "/admin";

    redirect(redirectPath);
  }

  return (
    <main className="overflow-hidden">
      <HeroSection />
      <FeaturesGrid />
      <ModulesShowcase />
      <BenefitsSection />
      <SecuritySection />
      <CTASection />
      <Footer />
    </main>
  );
}

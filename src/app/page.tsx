import { HeroSection } from '@/components/landing/hero-section';
import { FeaturesGrid } from '@/components/landing/features-grid';
import { ModulesShowcase } from '@/components/landing/modules-showcase';
import { BenefitsSection } from '@/components/landing/benefits-section';
import { SecuritySection } from '@/components/landing/security-section';
import { CTASection } from '@/components/landing/cta-section';
import { Footer } from '@/components/landing/footer';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  // Server-side session check
  const session = await getServerSession(authOptions);
  
  // If user is authenticated, redirect based on role
  if (session?.user) {
    const redirectMap: Record<string, string> = {
      admin: '/admin',
      doctor: '/doctor',
      nurse: '/nurse',
      pharmacist: '/pharmacist',
      'lab-tech': '/lab-tech',
      receptionist: '/receptionist',
      emergency: '/emergency',
    };

    const role = session.user.role?.toLowerCase() || 'admin';
    const redirectPath = redirectMap[role] || '/admin';
    
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
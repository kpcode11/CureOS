import { HeroSection } from '@/components/landing/hero-section';
import { FeaturesGrid } from '@/components/landing/features-grid';
import { ModulesShowcase } from '@/components/landing/modules-showcase';
import { BenefitsSection } from '@/components/landing/benefits-section';
import { SecuritySection } from '@/components/landing/security-section';
import { CTASection } from '@/components/landing/cta-section';
import { Footer } from '@/components/landing/footer';

export default function Home() {
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
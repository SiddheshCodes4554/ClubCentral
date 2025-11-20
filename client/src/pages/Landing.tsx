import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { InstitutionMode } from "@/components/landing/InstitutionMode";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ProductPreview } from "@/components/landing/ProductPreview";
import { Benefits } from "@/components/landing/Benefits";
import { DashboardShowcase } from "@/components/landing/DashboardShowcase";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";
import { tokens, imageConfig } from "@/components/landing/constants";

export default function Landing() {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: tokens.colors.neutral.bgPrimary }}
    >
      <Navbar />
      <HeroSection />
      <FeatureGrid />
      <InstitutionMode />
      <HowItWorks />
      <ProductPreview />
      <Benefits />
      <DashboardShowcase />
      <FinalCTA />
      <Footer />
    </div>
  );
}

export { imageConfig };

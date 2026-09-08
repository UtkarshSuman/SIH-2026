import Navbar from "@/components/marketing/Navbar";
import HomeSection from "@/components/marketing/Home/HomeSection";
import AuthorityHubSection from "@/components/marketing/Authority/AuthorityHubSection";
import FeaturesSection from "@/components/marketing/Features/FeaturesSection";
import HowItWorkSection from "@/components/marketing/HowItWorks/HowItWorkSection";
import AboutSection from "@/components/marketing/About/AboutSection";
import ImpactSection from "@/components/marketing/Impact/ImpactSection";
import ContactSection from "@/components/marketing/Contact/ContactSection";
import { Footer } from "@/components/marketing/footer";

export default function MarketingPage() {
  return (
    <div className="bg-[#fbfdfb] min-h-screen text-slate-800 flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-950">
      <Navbar />
      <main className="flex-1 w-full">
        <HomeSection />
        <AuthorityHubSection />
        <FeaturesSection />
        <HowItWorkSection />
        <AboutSection />
        <ImpactSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}

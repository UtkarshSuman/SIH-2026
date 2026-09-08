import Navbar from "@/components/marketing/Navbar";
import HomeSection from "@/components/marketing/Home/Homesection";
import AuthorityHubSection from "@/components/marketing/Authority/Authorityhubsection";
import FeaturesSection from "@/components/marketing/Features/Featuressection";
import HowItWorkSection from "@/components/marketing/HowItWorks/Howitworksection";
import AboutSection from "@/components/marketing/About/Aboutsection";
import ImpactSection from "@/components/marketing/Impact/Impactsection";
import ContactSection from "@/components/marketing/Contact/Contactsection";
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

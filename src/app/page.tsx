import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeaturedCollections from "@/components/FeaturedCollections";
import Testimonials from "@/components/Testimonials";
import EmailSignup from "@/components/EmailSignup";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <FeaturedCollections />
        <Testimonials />
        <CTA />
        <EmailSignup />
      </main>
      <Footer />
    </>
  );
}

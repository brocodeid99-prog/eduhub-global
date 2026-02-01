import { ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CTASection = () => {
  const benefits = [
    "Gratis untuk 100 pengguna pertama",
    "Setup dalam 5 menit",
    "Dukungan teknis 24/7",
    "Update fitur gratis selamanya",
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-accent/20 via-transparent to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
            Siap Meningkatkan Kualitas Pembelajaran?
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Bergabung dengan ribuan institusi pendidikan yang telah menggunakan
            BroCodeID untuk transformasi digital pembelajaran mereka.
          </p>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-primary-foreground/10 px-4 py-2 rounded-full"
              >
                <CheckCircle className="w-4 h-4 text-accent" />
                <span className="text-sm text-primary-foreground">{benefit}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="xl" asChild>
              <Link to="/register">
                Daftar Sekarang
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="xl"
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              asChild
            >
              <Link to="/contact">Hubungi Sales</Link>
            </Button>
          </div>

          <p className="mt-6 text-sm text-primary-foreground/60">
            Tidak perlu kartu kredit. Batalkan kapan saja.
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;

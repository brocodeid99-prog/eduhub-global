import { ArrowRight, Play, Users, BookOpen, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HeroSection = () => {
  const stats = [
    { icon: <Users className="w-5 h-5" />, value: "10,000+", label: "Pengguna Aktif" },
    { icon: <BookOpen className="w-5 h-5" />, value: "500+", label: "Mata Kuliah" },
    { icon: <Award className="w-5 h-5" />, value: "95%", label: "Tingkat Kelulusan" },
  ];

  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-primary/20 text-primary-foreground/90 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              Platform Pembelajaran Terdepan
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight mb-6">
              Belajar Lebih Mudah dengan{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-info">
                BroCodeID
              </span>
            </h1>
            
            <p className="text-lg text-primary-foreground/80 mb-8 max-w-xl mx-auto lg:mx-0">
              Platform LMS dan CBT modern untuk SMK dan Universitas. 
              Kelola pembelajaran, ujian online, dan pantau kemajuan siswa dalam satu tempat.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <Button variant="hero" size="xl" asChild>
                <Link to="/register">
                  Mulai Gratis
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="xl" 
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Play className="w-5 h-5 mr-2" />
                Lihat Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start gap-2 text-accent mb-1">
                    {stat.icon}
                    <span className="text-2xl font-bold text-primary-foreground">
                      {stat.value}
                    </span>
                  </div>
                  <p className="text-sm text-primary-foreground/60">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content - Dashboard Preview */}
          <div className="relative">
            <div className="bg-card rounded-2xl shadow-elevated p-4 transform lg:rotate-2 hover:rotate-0 transition-transform duration-500">
              <div className="bg-background rounded-xl p-6">
                {/* Mock Dashboard Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-semibold text-foreground">Dashboard Siswa</h3>
                    <p className="text-sm text-muted-foreground">Selamat datang kembali!</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">AS</span>
                  </div>
                </div>

                {/* Progress Cards */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-primary/5 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Mata Kuliah Aktif</p>
                    <p className="text-2xl font-bold text-foreground">8</p>
                  </div>
                  <div className="bg-accent/10 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Tugas Selesai</p>
                    <p className="text-2xl font-bold text-foreground">24</p>
                  </div>
                </div>

                {/* Course List Preview */}
                <div className="space-y-3">
                  {["Algoritma & Pemrograman", "Basis Data", "Jaringan Komputer"].map((course, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{course}</p>
                        <div className="w-full bg-border rounded-full h-1.5 mt-1">
                          <div 
                            className="bg-gradient-primary h-1.5 rounded-full" 
                            style={{ width: `${60 + i * 15}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-accent text-accent-foreground px-4 py-2 rounded-lg shadow-lg animate-bounce">
              <span className="text-sm font-semibold">🎉 Ujian Lulus!</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

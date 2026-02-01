import {
  BookOpen,
  ClipboardCheck,
  BarChart3,
  Users,
  Shield,
  Smartphone,
  Zap,
  Clock,
} from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Manajemen Mata Kuliah",
      description:
        "Kelola materi pembelajaran, video, dokumen, dan sumber daya pendidikan dalam satu platform terintegrasi.",
      color: "bg-primary/10 text-primary",
    },
    {
      icon: <ClipboardCheck className="w-6 h-6" />,
      title: "Ujian CBT Online",
      description:
        "Buat dan kelola ujian berbasis komputer dengan berbagai tipe soal, timer otomatis, dan anti-cheat system.",
      color: "bg-accent/10 text-accent",
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Analitik & Laporan",
      description:
        "Pantau kemajuan siswa dengan dashboard analitik lengkap dan laporan yang dapat diunduh.",
      color: "bg-info/10 text-info",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Multi-Role User",
      description:
        "Mendukung berbagai peran: Admin, Dosen/Guru, Mahasiswa/Siswa dengan hak akses yang berbeda.",
      color: "bg-warning/10 text-warning",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Keamanan Terjamin",
      description:
        "Data aman dengan enkripsi end-to-end dan sistem backup otomatis untuk melindungi informasi.",
      color: "bg-destructive/10 text-destructive",
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: "Responsif & Mobile",
      description:
        "Akses platform dari perangkat apapun dengan tampilan yang optimal dan pengalaman pengguna terbaik.",
      color: "bg-success/10 text-success",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Performa Cepat",
      description:
        "Platform ringan dan cepat untuk pengalaman belajar yang lancar tanpa hambatan teknis.",
      color: "bg-primary/10 text-primary",
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Jadwal Otomatis",
      description:
        "Penjadwalan kelas, ujian, dan deadline tugas dengan notifikasi otomatis ke semua pengguna.",
      color: "bg-accent/10 text-accent",
    },
  ];

  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block text-sm font-semibold text-primary mb-4 uppercase tracking-wider">
            Fitur Unggulan
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Semua yang Anda Butuhkan untuk Pembelajaran Modern
          </h2>
          <p className="text-lg text-muted-foreground">
            Platform lengkap dengan fitur-fitur canggih untuk mendukung proses
            belajar mengajar yang efektif dan efisien.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 bg-card rounded-xl border border-border hover:border-primary/50 hover:shadow-card-hover transition-all duration-300"
            >
              <div
                className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
              >
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;

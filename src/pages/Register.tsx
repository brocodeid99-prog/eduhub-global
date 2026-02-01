import { BookOpen, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Link } from "react-router-dom";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"student" | "teacher">("student");

  const benefits = [
    "Akses ke 500+ mata kuliah",
    "Ujian CBT dengan anti-cheat system",
    "Sertifikat digital resmi",
    "Komunitas belajar aktif",
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Image */}
      <div className="hidden lg:flex flex-1 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent/20 via-transparent to-transparent" />
        <div className="relative z-10 flex flex-col items-start justify-center p-12">
          <div className="max-w-md">
            <h2 className="text-3xl font-bold text-primary-foreground mb-4">
              Bergabung dengan EduLearn
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8">
              Platform pembelajaran terdepan untuk SMK dan Universitas di
              Indonesia.
            </p>

            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-accent" />
                  </div>
                  <span className="text-primary-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">EduLearn</span>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Buat Akun Baru
            </h1>
            <p className="text-muted-foreground">
              Daftar gratis dan mulai belajar hari ini
            </p>
          </div>

          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              onClick={() => setRole("student")}
              className={`p-4 rounded-lg border-2 transition-all ${
                role === "student"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="text-2xl mb-2">🎓</div>
              <p className="font-medium text-foreground">Mahasiswa/Siswa</p>
              <p className="text-xs text-muted-foreground">
                Akses materi & ujian
              </p>
            </button>
            <button
              type="button"
              onClick={() => setRole("teacher")}
              className={`p-4 rounded-lg border-2 transition-all ${
                role === "teacher"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="text-2xl mb-2">👨‍🏫</div>
              <p className="font-medium text-foreground">Dosen/Guru</p>
              <p className="text-xs text-muted-foreground">Buat & kelola kelas</p>
            </button>
          </div>

          {/* Form */}
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nama Depan</Label>
                <Input id="firstName" placeholder="John" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nama Belakang</Label>
                <Input id="lastName" placeholder="Doe" className="h-11" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="institution">Institusi</Label>
              <Input
                id="institution"
                placeholder="Nama SMK atau Universitas"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimal 8 karakter"
                  className="h-11 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Dengan mendaftar, Anda menyetujui{" "}
              <Link to="/terms" className="text-primary hover:underline">
                Syarat & Ketentuan
              </Link>{" "}
              dan{" "}
              <Link to="/privacy" className="text-primary hover:underline">
                Kebijakan Privasi
              </Link>{" "}
              kami.
            </p>

            <Button variant="hero" size="lg" className="w-full" asChild>
              <Link to="/dashboard">Daftar Sekarang</Link>
            </Button>
          </form>

          {/* Login Link */}
          <p className="text-center text-sm text-muted-foreground mt-8">
            Sudah punya akun?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

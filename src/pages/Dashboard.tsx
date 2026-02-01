import DashboardSidebar from "@/components/layout/DashboardSidebar";
import {
  BookOpen,
  Clock,
  TrendingUp,
  Calendar,
  ChevronRight,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const stats = [
    {
      label: "Mata Kuliah Aktif",
      value: "8",
      change: "+2 bulan ini",
      icon: <BookOpen className="w-5 h-5" />,
      color: "bg-primary/10 text-primary",
    },
    {
      label: "Tugas Pending",
      value: "5",
      change: "3 deadline minggu ini",
      icon: <Clock className="w-5 h-5" />,
      color: "bg-warning/10 text-warning",
    },
    {
      label: "Rata-rata Nilai",
      value: "85.5",
      change: "+5.2 dari semester lalu",
      icon: <TrendingUp className="w-5 h-5" />,
      color: "bg-success/10 text-success",
    },
    {
      label: "Ujian Mendatang",
      value: "2",
      change: "UTS minggu depan",
      icon: <Calendar className="w-5 h-5" />,
      color: "bg-info/10 text-info",
    },
  ];

  const upcomingExams = [
    {
      subject: "Algoritma & Pemrograman",
      date: "15 Feb 2025",
      time: "09:00 - 11:00",
      type: "UTS",
    },
    {
      subject: "Basis Data",
      date: "17 Feb 2025",
      time: "13:00 - 15:00",
      type: "Quiz",
    },
  ];

  const recentCourses = [
    {
      title: "Algoritma & Pemrograman",
      instructor: "Dr. Budi Santoso",
      progress: 75,
      lastAccessed: "2 jam lalu",
    },
    {
      title: "Basis Data",
      instructor: "Prof. Rina Wijaya",
      progress: 60,
      lastAccessed: "5 jam lalu",
    },
    {
      title: "Jaringan Komputer",
      instructor: "Dr. Ahmad Fauzi",
      progress: 45,
      lastAccessed: "1 hari lalu",
    },
    {
      title: "Pemrograman Web",
      instructor: "Ir. Siti Nurhaliza",
      progress: 90,
      lastAccessed: "2 hari lalu",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />

      {/* Main Content */}
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Selamat Datang, Ahmad! 👋
          </h1>
          <p className="text-muted-foreground">
            Lanjutkan pembelajaran Anda hari ini. Anda memiliki 5 tugas yang
            perlu diselesaikan.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-card rounded-xl border border-border p-6 hover:shadow-card transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}
                >
                  {stat.icon}
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-xs text-primary mt-2">{stat.change}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Courses */}
          <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">
                Mata Kuliah Terakhir
              </h2>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard/courses">
                  Lihat Semua
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>

            <div className="space-y-4">
              {recentCourses.map((course, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {course.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {course.instructor}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      {course.progress}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {course.lastAccessed}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Play className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Exams */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">
                Ujian Mendatang
              </h2>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard/exams">
                  Lihat Semua
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>

            <div className="space-y-4">
              {upcomingExams.map((exam, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <p className="font-medium text-foreground">{exam.subject}</p>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-warning/10 text-warning">
                      {exam.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{exam.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Clock className="w-4 h-4" />
                    <span>{exam.time}</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                    <Link to="/exam/1">Mulai Ujian</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

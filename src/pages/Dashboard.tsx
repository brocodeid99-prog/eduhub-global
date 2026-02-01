import DashboardSidebar from "@/components/layout/DashboardSidebar";
import {
  BookOpen,
  Clock,
  TrendingUp,
  Calendar,
  ChevronRight,
  Play,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const { profile, isTeacher } = useAuth();

  // Fetch enrolled courses for students
  const { data: enrollments, isLoading: loadingEnrollments } = useQuery({
    queryKey: ["enrollments", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("enrollments")
        .select(`
          *,
          course:courses(*)
        `)
        .eq("student_id", profile.id)
        .eq("status", "active");

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  // Fetch upcoming exams
  const { data: upcomingExams, isLoading: loadingExams } = useQuery({
    queryKey: ["upcoming-exams", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from("exams")
        .select(`
          *,
          course:courses(title)
        `)
        .eq("is_published", true)
        .gte("end_time", new Date().toISOString())
        .order("start_time", { ascending: true })
        .limit(3);

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  // Fetch teacher's courses
  const { data: teacherCourses } = useQuery({
    queryKey: ["teacher-courses", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("owner_id", profile.id);

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id && isTeacher,
  });

  const stats = [
    {
      label: isTeacher ? "Mata Kuliah Dibuat" : "Mata Kuliah Aktif",
      value: isTeacher ? teacherCourses?.length || 0 : enrollments?.length || 0,
      change: isTeacher ? "Klik untuk mengelola" : "+2 bulan ini",
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
      value: upcomingExams?.length || 0,
      change: "Lihat jadwal",
      icon: <Calendar className="w-5 h-5" />,
      color: "bg-info/10 text-info",
    },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loadingEnrollments || loadingExams) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />

      {/* Main Content */}
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Selamat Datang, {profile?.first_name || "User"}! 👋
          </h1>
          <p className="text-muted-foreground">
            {isTeacher
              ? "Kelola mata kuliah dan ujian Anda hari ini."
              : "Lanjutkan pembelajaran Anda hari ini."}
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
                {isTeacher ? "Mata Kuliah Saya" : "Mata Kuliah Terakhir"}
              </h2>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard/courses">
                  Lihat Semua
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>

            <div className="space-y-4">
              {isTeacher ? (
                teacherCourses && teacherCourses.length > 0 ? (
                  teacherCourses.slice(0, 4).map((course: any) => (
                    <div
                      key={course.id}
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
                          {course.is_published ? "Dipublikasi" : "Draft"}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/dashboard/courses/${course.id}`}>
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      Belum ada mata kuliah
                    </p>
                    <Button variant="hero" asChild>
                      <Link to="/dashboard/courses">Buat Mata Kuliah</Link>
                    </Button>
                  </div>
                )
              ) : enrollments && enrollments.length > 0 ? (
                enrollments.slice(0, 4).map((enrollment: any) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {enrollment.course?.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Enrolled {formatDate(enrollment.enrolled_at)}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon">
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Belum ada mata kuliah yang diikuti
                  </p>
                  <Button variant="hero" asChild>
                    <Link to="/dashboard/courses">Jelajahi Mata Kuliah</Link>
                  </Button>
                </div>
              )}
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
              {upcomingExams && upcomingExams.length > 0 ? (
                upcomingExams.map((exam: any) => (
                  <div
                    key={exam.id}
                    className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <p className="font-medium text-foreground">{exam.title}</p>
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-warning/10 text-warning uppercase">
                        {exam.exam_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(exam.start_time)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {formatTime(exam.start_time)} - {formatTime(exam.end_time)}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-4"
                      asChild
                    >
                      <Link to={`/exam/${exam.id}`}>Mulai Ujian</Link>
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Tidak ada ujian mendatang
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

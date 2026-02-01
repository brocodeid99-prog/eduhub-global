import DashboardSidebar from "@/components/layout/DashboardSidebar";
import {
  ClipboardList,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle,
  Plus,
  Loader2,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ExamList = () => {
  const { profile, isTeacher, isAdmin } = useAuth();

  // Fetch upcoming exams
  const { data: upcomingExams, isLoading: loadingUpcoming } = useQuery({
    queryKey: ["upcoming-exams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exams")
        .select(`
          *,
          course:courses(title, owner_id)
        `)
        .eq("is_published", true)
        .gte("end_time", new Date().toISOString())
        .order("start_time", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Fetch teacher's own exams
  const { data: myExams, isLoading: loadingMyExams } = useQuery({
    queryKey: ["my-exams", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from("exams")
        .select(`
          *,
          course:courses!inner(title, owner_id)
        `)
        .eq("course.owner_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id && (isTeacher || isAdmin),
  });

  // Fetch completed exam attempts
  const { data: completedAttempts, isLoading: loadingCompleted } = useQuery({
    queryKey: ["completed-attempts", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from("exam_attempts")
        .select(`
          *,
          exam:exams(title, max_score, course:courses(title))
        `)
        .eq("student_id", profile.id)
        .eq("status", "graded")
        .order("submitted_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

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

  const isLoading = loadingUpcoming || loadingCompleted || loadingMyExams;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />

      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Ujian CBT
            </h1>
            <p className="text-muted-foreground">
              Kelola dan ikuti ujian berbasis komputer
            </p>
          </div>
          {(isTeacher || isAdmin) && (
            <Button variant="hero" asChild>
              <Link to="/dashboard/exams/create">
                <Plus className="w-4 h-4 mr-2" />
                Buat Ujian
              </Link>
            </Button>
          )}
        </div>

        {/* My Exams (Teacher Only) */}
        {(isTeacher || isAdmin) && myExams && myExams.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Ujian Saya
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myExams.map((exam: any) => (
                <div
                  key={exam.id}
                  className="bg-card rounded-xl border border-border p-6 hover:shadow-card-hover transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <ClipboardList className="w-6 h-6 text-primary" />
                    </div>
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full uppercase ${
                        exam.is_published
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {exam.is_published ? "Published" : "Draft"}
                    </span>
                  </div>

                  <h3 className="font-semibold text-foreground mb-1">
                    {exam.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {exam.course?.title}
                  </p>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{exam.duration_minutes} menit</span>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full" asChild>
                    <Link to={`/dashboard/exams/${exam.id}/questions`}>
                      <Settings className="w-4 h-4 mr-2" />
                      Kelola Soal
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Exams */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-warning" />
            Ujian Mendatang
          </h2>

          {upcomingExams && upcomingExams.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingExams.map((exam: any) => (
                <div
                  key={exam.id}
                  className="bg-card rounded-xl border border-border p-6 hover:shadow-card-hover hover:border-warning/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                      <ClipboardList className="w-6 h-6 text-warning" />
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-warning/10 text-warning uppercase">
                      {exam.exam_type}
                    </span>
                  </div>

                  <h3 className="font-semibold text-foreground mb-1">
                    {exam.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {exam.course?.title}
                  </p>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(exam.start_time)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>
                        {formatTime(exam.start_time)} - {formatTime(exam.end_time)}{" "}
                        ({exam.duration_minutes} menit)
                      </span>
                    </div>
                  </div>

                  <Button variant="hero" className="w-full" asChild>
                    <Link to={`/exam/${exam.id}`}>Mulai Ujian</Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                Tidak ada ujian mendatang
              </p>
            </div>
          )}
        </div>

        {/* Completed Exams */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success" />
            Ujian Selesai
          </h2>

          {completedAttempts && completedAttempts.length > 0 ? (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                      Ujian
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                      Mata Kuliah
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                      Tanggal
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                      Nilai
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {completedAttempts.map((attempt: any) => (
                    <tr key={attempt.id} className="border-t border-border">
                      <td className="px-6 py-4 font-medium text-foreground">
                        {attempt.exam?.title}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {attempt.exam?.course?.title}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {formatDate(attempt.submitted_at)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-foreground">
                          {attempt.score}
                        </span>
                        <span className="text-muted-foreground">
                          /{attempt.exam?.max_score}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full bg-success/10 text-success">
                          <CheckCircle className="w-3 h-3" />
                          Selesai
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm">
                          Lihat Detail
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <CheckCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                Belum ada ujian yang diselesaikan
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ExamList;

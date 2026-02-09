import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Download,
  Loader2,
  BookOpen,
} from "lucide-react";

const Grades = () => {
  const { profile, isTeacher, isAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");

  // Fetch exam attempts for grades
  const { data: attempts, isLoading } = useQuery({
    queryKey: ["grade-attempts", profile?.id],
    queryFn: async () => {
      if (isTeacher || isAdmin) {
        // Teachers see all attempts for their courses
        const { data: courses, error: courseError } = await supabase
          .from("courses")
          .select("id")
          .eq("owner_id", profile?.id);

        if (courseError) throw courseError;
        const courseIds = courses?.map((c) => c.id) || [];

        if (courseIds.length === 0) return [];

        const { data, error } = await supabase
          .from("exam_attempts")
          .select(`
            *,
            exam:exams(title, max_score, course:courses(id, title)),
            student:profiles(first_name, last_name)
          `)
          .eq("status", "completed");

        if (error) throw error;
        return data?.filter((a: any) => 
          courseIds.includes(a.exam?.course?.id)
        ) || [];
      } else {
        // Students see their own attempts
        const { data, error } = await supabase
          .from("exam_attempts")
          .select(`
            *,
            exam:exams(title, max_score, course:courses(id, title))
          `)
          .eq("student_id", profile?.id)
          .eq("status", "completed");

        if (error) throw error;
        return data || [];
      }
    },
    enabled: !!profile?.id,
  });

  // Get unique courses from attempts
  const courses = attempts
    ? [...new Set(attempts.map((a: any) => a.exam?.course?.id))]
        .filter(Boolean)
        .map((id) => {
          const attempt = attempts.find((a: any) => a.exam?.course?.id === id);
          return { id, title: attempt?.exam?.course?.title };
        })
    : [];

  const filteredAttempts = attempts?.filter((attempt: any) => {
    const matchesSearch =
      attempt.exam?.title?.toLowerCase().includes(search.toLowerCase()) ||
      attempt.student?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      attempt.student?.last_name?.toLowerCase().includes(search.toLowerCase());

    const matchesCourse =
      selectedCourse === "all" || attempt.exam?.course?.id === selectedCourse;

    return matchesSearch && matchesCourse;
  });

  const getGradeColor = (score: number | null, maxScore: number) => {
    if (score === null) return "text-muted-foreground";
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return "text-success";
    if (percentage >= 60) return "text-warning";
    return "text-destructive";
  };

  const getGradeLetter = (score: number | null, maxScore: number) => {
    if (score === null) return "-";
    const percentage = (score / maxScore) * 100;
    if (percentage >= 85) return "A";
    if (percentage >= 80) return "A-";
    if (percentage >= 75) return "B+";
    if (percentage >= 70) return "B";
    if (percentage >= 65) return "B-";
    if (percentage >= 60) return "C+";
    if (percentage >= 55) return "C";
    if (percentage >= 50) return "D";
    return "E";
  };

  // Calculate statistics
  const stats = {
    totalExams: filteredAttempts?.length || 0,
    avgScore:
      filteredAttempts && filteredAttempts.length > 0
        ? (
            filteredAttempts.reduce((acc: number, a: any) => {
              const percentage = ((a.score || 0) / (a.exam?.max_score || 100)) * 100;
              return acc + percentage;
            }, 0) / filteredAttempts.length
          ).toFixed(1)
        : 0,
    passed:
      filteredAttempts?.filter((a: any) => {
        const percentage = ((a.score || 0) / (a.exam?.max_score || 100)) * 100;
        return percentage >= 60;
      }).length || 0,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {isTeacher || isAdmin ? "Nilai Mahasiswa" : "Nilai Saya"}
            </h1>
            <p className="text-muted-foreground">
              {isTeacher || isAdmin
                ? "Lihat dan kelola nilai mahasiswa"
                : "Pantau hasil ujian dan tugas Anda"}
            </p>
          </div>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Total Ujian</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats.totalExams}</p>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-success/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <span className="text-sm text-muted-foreground">Rata-rata Nilai</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats.avgScore}%</p>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-warning/10 rounded-lg">
                <BookOpen className="w-5 h-5 text-warning" />
              </div>
              <span className="text-sm text-muted-foreground">Lulus</span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {stats.passed}/{stats.totalExams}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Semua Mata Kuliah" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Mata Kuliah</SelectItem>
              {courses.map((course: any) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Grades Table */}
        <div className="bg-card rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                {(isTeacher || isAdmin) && <TableHead>Mahasiswa</TableHead>}
                <TableHead>Mata Kuliah</TableHead>
                <TableHead>Ujian</TableHead>
                <TableHead className="text-center">Nilai</TableHead>
                <TableHead className="text-center">Grade</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAttempts && filteredAttempts.length > 0 ? (
                filteredAttempts.map((attempt: any) => {
                  const percentage =
                    ((attempt.score || 0) / (attempt.exam?.max_score || 100)) * 100;
                  const isPassed = percentage >= 60;

                  return (
                    <TableRow key={attempt.id}>
                      {(isTeacher || isAdmin) && (
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">
                                {attempt.student?.first_name?.[0] || "S"}
                              </span>
                            </div>
                            <span className="font-medium">
                              {attempt.student?.first_name} {attempt.student?.last_name}
                            </span>
                          </div>
                        </TableCell>
                      )}
                      <TableCell className="text-muted-foreground">
                        {attempt.exam?.course?.title}
                      </TableCell>
                      <TableCell className="font-medium">
                        {attempt.exam?.title}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`font-bold ${getGradeColor(
                            attempt.score,
                            attempt.exam?.max_score || 100
                          )}`}
                        >
                          {attempt.score || 0}/{attempt.exam?.max_score || 100}
                        </span>
                        <span className="text-muted-foreground ml-1">
                          ({percentage.toFixed(0)}%)
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            percentage >= 80
                              ? "default"
                              : percentage >= 60
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {getGradeLetter(attempt.score, attempt.exam?.max_score || 100)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {isPassed ? (
                          <div className="flex items-center justify-center gap-1 text-success">
                            <TrendingUp className="w-4 h-4" />
                            <span>Lulus</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1 text-destructive">
                            <TrendingDown className="w-4 h-4" />
                            <span>Tidak Lulus</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={isTeacher || isAdmin ? 6 : 5}
                    className="text-center py-8"
                  >
                    <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-muted-foreground">Belum ada data nilai</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
    </DashboardLayout>
  );
};

export default Grades;

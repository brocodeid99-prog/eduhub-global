import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Users,
  Search,
  Download,
  Loader2,
  Mail,
  GraduationCap,
  BarChart3,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const Students = () => {
  const { profile, isTeacher, isAdmin, loading } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [pageSize, setPageSize] = useState<string>("10");

  // Fetch teacher's courses
  const { data: courses } = useQuery({
    queryKey: ["teacher-courses", profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title")
        .eq("owner_id", profile?.id);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id && (isTeacher || isAdmin),
  });

  // Fetch enrolled students with grades
  const { data: enrollments, isLoading } = useQuery({
    queryKey: ["course-students", profile?.id, selectedCourse],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrollments")
        .select(`
          *,
          student:profiles(id, first_name, last_name, institution, created_at),
          course:courses(id, title, owner_id),
          grade:grades(final_score, grade_letter)
        `)
        .eq("status", "active");

      if (error) throw error;

      const teacherCourseIds = courses?.map((c) => c.id) || [];
      return data?.filter((e: any) => teacherCourseIds.includes(e.course?.id)) || [];
    },
    enabled: !!profile?.id && !!courses && (isTeacher || isAdmin),
  });

  // Fetch progress data for all enrollments
  const enrollmentIds = enrollments?.map((e: any) => e.id) || [];
  const { data: progressData } = useQuery({
    queryKey: ["students-progress", enrollmentIds],
    queryFn: async () => {
      if (enrollmentIds.length === 0) return [];
      const { data, error } = await supabase
        .from("progress_tracking")
        .select("enrollment_id, completed")
        .in("enrollment_id", enrollmentIds);
      if (error) throw error;
      return data;
    },
    enabled: enrollmentIds.length > 0,
  });

  // Compute progress per enrollment
  const progressMap = new Map<string, { total: number; completed: number }>();
  progressData?.forEach((p: any) => {
    const entry = progressMap.get(p.enrollment_id) || { total: 0, completed: 0 };
    entry.total += 1;
    if (p.completed) entry.completed += 1;
    progressMap.set(p.enrollment_id, entry);
  });

  const filteredStudents = enrollments?.filter((enrollment: any) => {
    const student = enrollment.student;
    const matchesSearch =
      student?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      student?.last_name?.toLowerCase().includes(search.toLowerCase()) ||
      student?.institution?.toLowerCase().includes(search.toLowerCase());
    const matchesCourse =
      selectedCourse === "all" || enrollment.course?.id === selectedCourse;
    return matchesSearch && matchesCourse;
  });

  // Build unique students with courses, grades, progress
  const studentMap = new Map();
  filteredStudents?.forEach((enrollment: any) => {
    const studentId = enrollment.student?.id;
    if (!studentId) return;

    const progress = progressMap.get(enrollment.id);
    const progressPercent = progress && progress.total > 0
      ? Math.round((progress.completed / progress.total) * 100)
      : 0;

    if (!studentMap.has(studentId)) {
      studentMap.set(studentId, {
        ...enrollment.student,
        courses: [],
        grades: [],
        progressValues: [],
        enrolledAt: enrollment.enrolled_at,
      });
    }

    const s = studentMap.get(studentId);
    s.courses.push(enrollment.course?.title);
    s.grades.push({
      course: enrollment.course?.title,
      score: enrollment.grade?.final_score ?? null,
      letter: enrollment.grade?.grade_letter ?? null,
    });
    s.progressValues.push(progressPercent);
  });

  const uniqueStudents = Array.from(studentMap.values());

  // Pagination
  const displayStudents =
    pageSize === "all"
      ? uniqueStudents
      : uniqueStudents.slice(0, parseInt(pageSize));

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isTeacher && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Daftar Mahasiswa</h1>
          <p className="text-muted-foreground">Kelola mahasiswa yang terdaftar di mata kuliah Anda</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Total Mahasiswa</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{uniqueStudents.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-success/10 rounded-lg">
              <GraduationCap className="w-5 h-5 text-success" />
            </div>
            <span className="text-sm text-muted-foreground">Total Mata Kuliah</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{courses?.length || 0}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-warning/10 rounded-lg">
              <BarChart3 className="w-5 h-5 text-warning" />
            </div>
            <span className="text-sm text-muted-foreground">Total Pendaftaran</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{filteredStudents?.length || 0}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari mahasiswa..."
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
            {courses?.map((course) => (
              <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={pageSize} onValueChange={setPageSize}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 data</SelectItem>
            <SelectItem value="20">20 data</SelectItem>
            <SelectItem value="all">Semua</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Students Table */}
      <div className="bg-card rounded-xl border border-border overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mahasiswa</TableHead>
                <TableHead>Institusi</TableHead>
                <TableHead>Mata Kuliah</TableHead>
                <TableHead>Progres</TableHead>
                <TableHead>Nilai</TableHead>
                <TableHead>Terdaftar</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayStudents.length > 0 ? (
                displayStudents.map((student: any) => {
                  const avgProgress =
                    student.progressValues.length > 0
                      ? Math.round(
                          student.progressValues.reduce((a: number, b: number) => a + b, 0) /
                            student.progressValues.length
                        )
                      : 0;

                  const avgScore =
                    student.grades.filter((g: any) => g.score !== null).length > 0
                      ? (
                          student.grades
                            .filter((g: any) => g.score !== null)
                            .reduce((sum: number, g: any) => sum + g.score, 0) /
                          student.grades.filter((g: any) => g.score !== null).length
                        ).toFixed(1)
                      : null;

                  const bestLetter = student.grades.find((g: any) => g.letter)?.letter;

                  return (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-primary">
                              {student.first_name?.[0]}{student.last_name?.[0]}
                            </span>
                          </div>
                          <p className="font-medium text-foreground">
                            {student.first_name} {student.last_name}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {student.institution || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {student.courses.slice(0, 2).map((course: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {course}
                            </Badge>
                          ))}
                          {student.courses.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{student.courses.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <Progress value={avgProgress} className="h-2 flex-1" />
                          <span className="text-xs text-muted-foreground w-8 text-right">{avgProgress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {avgScore ? (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{avgScore}</span>
                            {bestLetter && (
                              <Badge
                                variant={
                                  bestLetter === "A" ? "default" :
                                  bestLetter === "B" ? "secondary" :
                                  "outline"
                                }
                                className="text-xs"
                              >
                                {bestLetter}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {format(new Date(student.enrolledAt), "d MMM yyyy", { locale: id })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Mail className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <BarChart3 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-muted-foreground">Belum ada mahasiswa terdaftar</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination info */}
      {pageSize !== "all" && uniqueStudents.length > parseInt(pageSize) && (
        <p className="text-sm text-muted-foreground mt-4 text-center">
          Menampilkan {displayStudents.length} dari {uniqueStudents.length} mahasiswa
        </p>
      )}
    </DashboardLayout>
  );
};

export default Students;

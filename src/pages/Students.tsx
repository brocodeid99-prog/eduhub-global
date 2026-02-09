import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
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

  // Fetch enrolled students
  const { data: enrollments, isLoading } = useQuery({
    queryKey: ["course-students", profile?.id, selectedCourse],
    queryFn: async () => {
      let query = supabase
        .from("enrollments")
        .select(`
          *,
          student:profiles(id, first_name, last_name, institution, created_at),
          course:courses(id, title, owner_id)
        `)
        .eq("status", "active");

      const { data, error } = await query;

      if (error) throw error;

      // Filter by teacher's courses
      const teacherCourseIds = courses?.map((c) => c.id) || [];
      return data?.filter((e: any) => 
        teacherCourseIds.includes(e.course?.id)
      ) || [];
    },
    enabled: !!profile?.id && !!courses && (isTeacher || isAdmin),
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

  // Get unique students with their enrolled courses
  const studentMap = new Map();
  filteredStudents?.forEach((enrollment: any) => {
    const studentId = enrollment.student?.id;
    if (!studentId) return;

    if (!studentMap.has(studentId)) {
      studentMap.set(studentId, {
        ...enrollment.student,
        courses: [],
        enrolledAt: enrollment.enrolled_at,
      });
    }
    studentMap.get(studentId).courses.push(enrollment.course?.title);
  });
  const uniqueStudents = Array.from(studentMap.values());

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Daftar Mahasiswa
            </h1>
            <p className="text-muted-foreground">
              Kelola mahasiswa yang terdaftar di mata kuliah Anda
            </p>
          </div>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
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
            <p className="text-3xl font-bold text-foreground">
              {filteredStudents?.length || 0}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
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
                <SelectItem key={course.id} value={course.id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Students Table */}
        <div className="bg-card rounded-xl border border-border">
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
                  <TableHead>Terdaftar</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uniqueStudents.length > 0 ? (
                  uniqueStudents.map((student: any) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                              {student.first_name?.[0]}
                              {student.last_name?.[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {student.first_name} {student.last_name}
                            </p>
                          </div>
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
                      <TableCell className="text-muted-foreground">
                        {format(new Date(student.enrolledAt), "d MMM yyyy", {
                          locale: id,
                        })}
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
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-muted-foreground">
                        Belum ada mahasiswa terdaftar
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
    </DashboardLayout>
  );
};

export default Students;

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  BookOpen,
  FileText,
  GraduationCap,
  Search,
  Loader2,
  Shield,
  UserCheck,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";

type AppRole = "admin" | "teacher" | "student";

interface UserWithRole {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  institution: string | null;
  created_at: string;
  role: AppRole;
}

const AdminDashboard = () => {
  const { isAdmin, loading } = useAuth();
  const queryClient = useQueryClient();
  const [userSearch, setUserSearch] = useState("");
  const [selectedTab, setSelectedTab] = useState("users");

  // Fetch all users with their roles
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Get all roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Merge profiles with roles
      const usersWithRoles: UserWithRole[] = profiles.map((profile) => {
        const userRole = roles.find((r) => r.user_id === profile.user_id);
        return {
          ...profile,
          role: (userRole?.role as AppRole) || "student",
        };
      });

      return usersWithRoles;
    },
    enabled: isAdmin,
  });

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [coursesRes, examsRes, enrollmentsRes, attemptsRes] = await Promise.all([
        supabase.from("courses").select("id", { count: "exact" }),
        supabase.from("exams").select("id", { count: "exact" }),
        supabase.from("enrollments").select("id", { count: "exact" }),
        supabase.from("exam_attempts").select("id, score", { count: "exact" }),
      ]);

      const totalUsers = users?.length || 0;
      const teachers = users?.filter((u) => u.role === "teacher").length || 0;
      const students = users?.filter((u) => u.role === "student").length || 0;
      const admins = users?.filter((u) => u.role === "admin").length || 0;

      return {
        totalUsers,
        teachers,
        students,
        admins,
        courses: coursesRes.count || 0,
        exams: examsRes.count || 0,
        enrollments: enrollmentsRes.count || 0,
        attempts: attemptsRes.count || 0,
      };
    },
    enabled: isAdmin && !!users,
  });

  // Fetch all courses
  const { data: courses } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select(`
          *,
          owner:profiles(first_name, last_name),
          enrollments:enrollments(count)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Fetch all exams
  const { data: exams } = useQuery({
    queryKey: ["admin-exams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exams")
        .select(`
          *,
          course:courses(title),
          questions:questions(count),
          attempts:exam_attempts(count)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Update user role mutation
  const updateRole = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Role pengguna berhasil diubah!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal mengubah role");
    },
  });

  const filteredUsers = users?.filter(
    (user) =>
      user.first_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.institution?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const getRoleBadgeVariant = (role: AppRole) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "teacher":
        return "default";
      default:
        return "secondary";
    }
  };

  const getRoleLabel = (role: AppRole) => {
    switch (role) {
      case "admin":
        return "Admin";
      case "teacher":
        return "Dosen/Guru";
      default:
        return "Mahasiswa";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <DashboardLayout>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Dashboard Admin
          </h1>
          <p className="text-muted-foreground">
            Kelola pengguna, mata kuliah, dan data sistem
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Total Pengguna</span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {stats?.totalUsers || 0}
            </p>
            <div className="mt-2 flex gap-2 text-xs">
              <span className="text-muted-foreground">
                {stats?.admins || 0} Admin
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                {stats?.teachers || 0} Guru
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                {stats?.students || 0} Siswa
              </span>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-success/10 rounded-lg">
                <BookOpen className="w-5 h-5 text-success" />
              </div>
              <span className="text-sm text-muted-foreground">Mata Kuliah</span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {stats?.courses || 0}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {stats?.enrollments || 0} total pendaftaran
            </p>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-warning/10 rounded-lg">
                <FileText className="w-5 h-5 text-warning" />
              </div>
              <span className="text-sm text-muted-foreground">Total Ujian</span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {stats?.exams || 0}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {stats?.attempts || 0} percobaan ujian
            </p>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-accent/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-accent-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">Aktivitas</span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {(stats?.enrollments || 0) + (stats?.attempts || 0)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Total interaksi sistem
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              Pengguna
            </TabsTrigger>
            <TabsTrigger value="courses" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Mata Kuliah
            </TabsTrigger>
            <TabsTrigger value="exams" className="gap-2">
              <FileText className="w-4 h-4" />
              Ujian
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="bg-card rounded-xl border border-border">
              <div className="p-4 border-b border-border">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari pengguna..."
                    className="pl-9"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
              </div>

              {usersLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Institusi</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Terdaftar</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers && filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-medium text-primary">
                                  {user.first_name?.[0] || "U"}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-foreground">
                                  {user.first_name} {user.last_name}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {user.institution || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(user.role)}>
                              {getRoleLabel(user.role)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(user.created_at), "d MMM yyyy", {
                              locale: id,
                            })}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={user.role}
                              onValueChange={(value: AppRole) =>
                                updateRole.mutate({
                                  userId: user.user_id,
                                  newRole: value,
                                })
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="student">Mahasiswa</SelectItem>
                                <SelectItem value="teacher">Dosen/Guru</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <p className="text-muted-foreground">
                            Tidak ada pengguna ditemukan
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses">
            <div className="bg-card rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mata Kuliah</TableHead>
                    <TableHead>Pengajar</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pendaftar</TableHead>
                    <TableHead>Dibuat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses && courses.length > 0 ? (
                    courses.map((course: any) => (
                      <TableRow key={course.id}>
                        <TableCell>
                          <p className="font-medium text-foreground">
                            {course.title}
                          </p>
                          {course.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {course.description}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {course.owner?.first_name} {course.owner?.last_name}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={course.is_published ? "default" : "secondary"}
                          >
                            {course.is_published ? "Published" : "Draft"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <GraduationCap className="w-4 h-4" />
                            {course.enrollments?.[0]?.count || 0}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(course.created_at), "d MMM yyyy", {
                            locale: id,
                          })}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <p className="text-muted-foreground">
                          Belum ada mata kuliah
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Exams Tab */}
          <TabsContent value="exams">
            <div className="bg-card rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ujian</TableHead>
                    <TableHead>Mata Kuliah</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Soal</TableHead>
                    <TableHead>Percobaan</TableHead>
                    <TableHead>Dibuat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams && exams.length > 0 ? (
                    exams.map((exam: any) => (
                      <TableRow key={exam.id}>
                        <TableCell>
                          <p className="font-medium text-foreground">
                            {exam.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {exam.duration_minutes} menit
                          </p>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {exam.course?.title || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={exam.is_published ? "default" : "secondary"}
                          >
                            {exam.is_published ? "Published" : "Draft"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <FileText className="w-4 h-4" />
                            {exam.questions?.[0]?.count || 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <UserCheck className="w-4 h-4" />
                            {exam.attempts?.[0]?.count || 0}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(exam.created_at), "d MMM yyyy", {
                            locale: id,
                          })}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <p className="text-muted-foreground">Belum ada ujian</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
    </DashboardLayout>
  );
};

export default AdminDashboard;

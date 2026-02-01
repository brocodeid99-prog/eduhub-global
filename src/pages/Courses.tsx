import DashboardSidebar from "@/components/layout/DashboardSidebar";
import {
  BookOpen,
  Users,
  Star,
  Search,
  Filter,
  Plus,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const Courses = () => {
  const { profile, isTeacher, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: "", description: "" });

  // Fetch all published courses
  const { data: courses, isLoading } = useQuery({
    queryKey: ["courses", profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select(`
          *,
          owner:profiles(first_name, last_name),
          enrollments:enrollments(count),
          modules:modules(count)
        `)
        .or(`is_published.eq.true,owner_id.eq.${profile?.id || "00000000-0000-0000-0000-000000000000"}`);

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  // Get user's enrollments
  const { data: myEnrollments } = useQuery({
    queryKey: ["my-enrollments", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("enrollments")
        .select("course_id")
        .eq("student_id", profile.id);

      if (error) throw error;
      return data.map((e) => e.course_id);
    },
    enabled: !!profile?.id,
  });

  // Create course mutation
  const createCourse = useMutation({
    mutationFn: async (courseData: { title: string; description: string }) => {
      if (!profile?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("courses")
        .insert({
          title: courseData.title,
          description: courseData.description,
          owner_id: profile.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast.success("Mata kuliah berhasil dibuat!");
      setIsCreateOpen(false);
      setNewCourse({ title: "", description: "" });
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal membuat mata kuliah");
    },
  });

  // Enroll mutation
  const enrollCourse = useMutation({
    mutationFn: async (courseId: string) => {
      if (!profile?.id) throw new Error("Not authenticated");

      const { error } = await supabase.from("enrollments").insert({
        course_id: courseId,
        student_id: profile.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast.success("Berhasil mendaftar mata kuliah!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal mendaftar");
    },
  });

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.title.trim()) {
      toast.error("Judul mata kuliah wajib diisi");
      return;
    }
    createCourse.mutate(newCourse);
  };

  const filteredCourses = courses?.filter((course: any) =>
    course.title.toLowerCase().includes(search.toLowerCase())
  );

  const isEnrolled = (courseId: string) => myEnrollments?.includes(courseId);
  const isOwner = (ownerId: string) => ownerId === profile?.id;

  const courseEmojis = ["📚", "💻", "🔬", "📐", "🎨", "🌐", "⚙️", "📊"];

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
              {isTeacher || isAdmin ? "Kelola Mata Kuliah" : "Mata Kuliah"}
            </h1>
            <p className="text-muted-foreground">
              {isTeacher || isAdmin
                ? "Buat dan kelola mata kuliah Anda"
                : "Jelajahi dan ikuti mata kuliah yang tersedia"}
            </p>
          </div>
          {(isTeacher || isAdmin) && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button variant="hero">
                  <Plus className="w-4 h-4 mr-2" />
                  Buat Mata Kuliah
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Buat Mata Kuliah Baru</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateCourse} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Judul Mata Kuliah</Label>
                    <Input
                      id="title"
                      placeholder="Contoh: Algoritma & Pemrograman"
                      value={newCourse.title}
                      onChange={(e) =>
                        setNewCourse({ ...newCourse, title: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Deskripsi</Label>
                    <Textarea
                      id="description"
                      placeholder="Deskripsi mata kuliah..."
                      value={newCourse.description}
                      onChange={(e) =>
                        setNewCourse({ ...newCourse, description: e.target.value })
                      }
                      rows={4}
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="hero"
                    className="w-full"
                    disabled={createCourse.isPending}
                  >
                    {createCourse.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Buat Mata Kuliah"
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Search & Filter */}
        <div className="flex gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Cari mata kuliah..."
              className="pl-10 h-11"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-11">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>

        {/* Courses Grid */}
        {filteredCourses && filteredCourses.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCourses.map((course: any, index: number) => (
              <div
                key={course.id}
                className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-card-hover hover:border-primary/50 transition-all duration-300"
              >
                {/* Course Image */}
                <div className="h-32 bg-gradient-primary flex items-center justify-center text-5xl">
                  {courseEmojis[index % courseEmojis.length]}
                </div>

                {/* Course Content */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {course.title}
                    </h3>
                    {isOwner(course.owner_id) && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        Milik Anda
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {course.owner?.first_name} {course.owner?.last_name}
                  </p>

                  {course.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {course.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      <span>{course.modules?.[0]?.count || 0} modul</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{course.enrollments?.[0]?.count || 0} siswa</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-warning text-warning" />
                      <span>4.5</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  {isOwner(course.owner_id) ? (
                    <Button variant="outline" className="w-full" asChild>
                      <Link to={`/dashboard/courses/${course.id}`}>
                        Kelola
                      </Link>
                    </Button>
                  ) : isEnrolled(course.id) ? (
                    <Button variant="success" className="w-full" asChild>
                      <Link to={`/dashboard/courses/${course.id}`}>
                        Akses Materi
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      variant="hero"
                      className="w-full"
                      onClick={() => enrollCourse.mutate(course.id)}
                      disabled={enrollCourse.isPending}
                    >
                      {enrollCourse.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Daftar Sekarang"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Belum ada mata kuliah
            </h3>
            <p className="text-muted-foreground">
              {isTeacher || isAdmin
                ? "Mulai dengan membuat mata kuliah pertama Anda"
                : "Mata kuliah akan muncul di sini"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Courses;

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Plus,
  Loader2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const Assignments = () => {
  const { profile, isTeacher, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    course_id: "",
    due_date: "",
    max_score: 100,
  });

  // Fetch courses for dropdown (teachers see their courses, students see enrolled)
  const { data: courses } = useQuery({
    queryKey: ["user-courses", profile?.id],
    queryFn: async () => {
      if (isTeacher || isAdmin) {
        const { data, error } = await supabase
          .from("courses")
          .select("id, title")
          .eq("owner_id", profile?.id);
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("enrollments")
          .select("course:courses(id, title)")
          .eq("student_id", profile?.id);
        if (error) throw error;
        return data.map((e: any) => e.course);
      }
    },
    enabled: !!profile?.id,
  });

  // For demo purposes, we'll show mock assignments since there's no assignments table yet
  const mockAssignments = [
    {
      id: "1",
      title: "Tugas 1 - Membuat Website Sederhana",
      course: "Pemrograman Web",
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: "pending",
      max_score: 100,
      submissions: 5,
    },
    {
      id: "2",
      title: "Tugas 2 - Responsive Design",
      course: "Pemrograman Web",
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      status: "pending",
      max_score: 100,
      submissions: 0,
    },
    {
      id: "3",
      title: "Praktikum 1 - Database Query",
      course: "Basis Data",
      due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: "completed",
      max_score: 50,
      submissions: 12,
    },
  ];

  const filteredAssignments = mockAssignments.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string, dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);

    if (status === "completed") {
      return <Badge variant="default">Selesai</Badge>;
    }
    if (due < now) {
      return <Badge variant="destructive">Terlambat</Badge>;
    }
    const daysLeft = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 3) {
      return <Badge variant="secondary" className="bg-warning/20 text-warning">
        {daysLeft} hari lagi
      </Badge>;
    }
    return <Badge variant="outline">Aktif</Badge>;
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    toast.info("Fitur ini memerlukan tabel assignments di database");
    setIsCreateOpen(false);
  };

  return (
    <DashboardLayout>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {isTeacher || isAdmin ? "Kelola Tugas" : "Tugas Saya"}
            </h1>
            <p className="text-muted-foreground">
              {isTeacher || isAdmin
                ? "Buat dan kelola tugas untuk mata kuliah Anda"
                : "Lihat dan kumpulkan tugas Anda"}
            </p>
          </div>
          {(isTeacher || isAdmin) && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button variant="hero">
                  <Plus className="w-4 h-4 mr-2" />
                  Buat Tugas
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Buat Tugas Baru</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateAssignment} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Mata Kuliah</Label>
                    <Select
                      value={newAssignment.course_id}
                      onValueChange={(v) =>
                        setNewAssignment({ ...newAssignment, course_id: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih mata kuliah" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses?.map((course: any) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Judul Tugas</Label>
                    <Input
                      id="title"
                      placeholder="Contoh: Tugas 1 - Membuat Website"
                      value={newAssignment.title}
                      onChange={(e) =>
                        setNewAssignment({ ...newAssignment, title: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Deskripsi</Label>
                    <Textarea
                      id="description"
                      placeholder="Instruksi tugas..."
                      value={newAssignment.description}
                      onChange={(e) =>
                        setNewAssignment({ ...newAssignment, description: e.target.value })
                      }
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="due_date">Deadline</Label>
                      <Input
                        id="due_date"
                        type="datetime-local"
                        value={newAssignment.due_date}
                        onChange={(e) =>
                          setNewAssignment({ ...newAssignment, due_date: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max_score">Nilai Maksimal</Label>
                      <Input
                        id="max_score"
                        type="number"
                        min={1}
                        max={100}
                        value={newAssignment.max_score}
                        onChange={(e) =>
                          setNewAssignment({
                            ...newAssignment,
                            max_score: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                  <Button type="submit" variant="hero" className="w-full">
                    Buat Tugas
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Search */}
        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari tugas..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Assignments Grid */}
        {filteredAssignments.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="bg-card rounded-xl border border-border p-6 hover:shadow-card-hover transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  {getStatusBadge(assignment.status, assignment.due_date)}
                </div>

                <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                  {assignment.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {assignment.course}
                </p>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Deadline:{" "}
                      {format(new Date(assignment.due_date), "d MMM yyyy, HH:mm", {
                        locale: id,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Nilai maks: {assignment.max_score}</span>
                  </div>
                  {(isTeacher || isAdmin) && (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>{assignment.submissions} pengumpulan</span>
                    </div>
                  )}
                </div>

                <Button variant="outline" className="w-full mt-4">
                  {isTeacher || isAdmin ? "Lihat Detail" : "Kumpulkan"}
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Belum ada tugas
            </h3>
            <p className="text-muted-foreground">
              {isTeacher || isAdmin
                ? "Mulai dengan membuat tugas pertama"
                : "Tugas akan muncul di sini"}
            </p>
          </div>
        )}
    </DashboardLayout>
  );
};

export default Assignments;

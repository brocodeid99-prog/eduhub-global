import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus, Loader2, Search, Users } from "lucide-react";

interface EnrollStudentDialogProps {
  courseId: string;
  enrolledStudentIds: string[];
}

export const EnrollStudentDialog = ({
  courseId,
  enrolledStudentIds,
}: EnrollStudentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const queryClient = useQueryClient();

  // Fetch all students (profiles with student role)
  const { data: students, isLoading } = useQuery({
    queryKey: ["students-for-enrollment", search],
    queryFn: async () => {
      // Get all profiles that have student role
      const { data: studentRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "student");

      if (rolesError) throw rolesError;

      const studentUserIds = studentRoles.map((r) => r.user_id);
      if (studentUserIds.length === 0) return [];

      let query = supabase
        .from("profiles")
        .select("id, first_name, last_name, institution, user_id")
        .in("user_id", studentUserIds);

      if (search.trim()) {
        query = query.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%`
        );
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;

      // Filter out already enrolled students
      return data.filter((s) => !enrolledStudentIds.includes(s.id));
    },
    enabled: open,
  });

  const enrollStudents = useMutation({
    mutationFn: async (studentIds: string[]) => {
      const enrollments = studentIds.map((studentId) => ({
        course_id: courseId,
        student_id: studentId,
        status: "active",
      }));

      const { error } = await supabase.from("enrollments").insert(enrollments);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-enrollments", courseId] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast.success(`${selectedStudents.length} mahasiswa berhasil didaftarkan!`);
      setSelectedStudents([]);
      setOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal mendaftarkan mahasiswa");
    },
  });

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (students && selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else if (students) {
      setSelectedStudents(students.map((s) => s.id));
    }
  };

  const handleSubmit = () => {
    if (selectedStudents.length === 0) {
      toast.error("Pilih minimal 1 mahasiswa");
      return;
    }
    enrollStudents.mutate(selectedStudents);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserPlus className="w-4 h-4 mr-2" />
          Tambah Mahasiswa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Mahasiswa ke Mata Kuliah</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama mahasiswa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Student List */}
          <div className="border border-border rounded-lg">
            {isLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : students && students.length > 0 ? (
              <>
                {/* Select All */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedStudents.length === students.length}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm font-medium">Pilih Semua</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {selectedStudents.length} dipilih
                  </span>
                </div>

                <ScrollArea className="h-[250px]">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer border-b border-border last:border-0"
                      onClick={() => handleToggleStudent(student.id)}
                    >
                      <Checkbox
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={() => handleToggleStudent(student.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {student.first_name} {student.last_name}
                        </p>
                        {student.institution && (
                          <p className="text-xs text-muted-foreground truncate">
                            {student.institution}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </>
            ) : (
              <div className="p-8 text-center">
                <Users className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {search
                    ? "Tidak ada mahasiswa yang cocok"
                    : "Semua mahasiswa sudah terdaftar"}
                </p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            variant="hero"
            className="w-full"
            onClick={handleSubmit}
            disabled={selectedStudents.length === 0 || enrollStudents.isPending}
          >
            {enrollStudents.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              `Daftarkan ${selectedStudents.length} Mahasiswa`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

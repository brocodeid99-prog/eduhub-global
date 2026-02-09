import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trash2, Users, Loader2 } from "lucide-react";

interface EnrolledStudent {
  id: string;
  enrolled_at: string;
  student: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    institution: string | null;
  };
}

interface EnrolledStudentsListProps {
  courseId: string;
  enrollments: EnrolledStudent[];
  canManage: boolean;
  isLoading: boolean;
}

export const EnrolledStudentsList = ({
  courseId,
  enrollments,
  canManage,
  isLoading,
}: EnrolledStudentsListProps) => {
  const queryClient = useQueryClient();

  const enrollmentIds = enrollments?.map((e) => e.id) || [];

  // Fetch grades for all enrollments
  const { data: gradesData } = useQuery({
    queryKey: ["enrollment-grades", courseId, enrollmentIds],
    queryFn: async () => {
      if (enrollmentIds.length === 0) return [];
      const { data, error } = await supabase
        .from("grades")
        .select("enrollment_id, final_score, grade_letter")
        .in("enrollment_id", enrollmentIds);
      if (error) throw error;
      return data;
    },
    enabled: enrollmentIds.length > 0,
  });

  // Fetch progress for all enrollments
  const { data: progressData } = useQuery({
    queryKey: ["enrollment-progress", courseId, enrollmentIds],
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

  // Build lookup maps
  const gradesMap = new Map<string, { score: number | null; letter: string | null }>();
  gradesData?.forEach((g) => {
    gradesMap.set(g.enrollment_id, { score: g.final_score, letter: g.grade_letter });
  });

  const progressMap = new Map<string, number>();
  const progressCounts = new Map<string, { total: number; completed: number }>();
  progressData?.forEach((p) => {
    const entry = progressCounts.get(p.enrollment_id) || { total: 0, completed: 0 };
    entry.total += 1;
    if (p.completed) entry.completed += 1;
    progressCounts.set(p.enrollment_id, entry);
  });
  progressCounts.forEach((val, key) => {
    progressMap.set(key, val.total > 0 ? Math.round((val.completed / val.total) * 100) : 0);
  });

  const removeStudent = useMutation({
    mutationFn: async (enrollmentId: string) => {
      const { error } = await supabase
        .from("enrollments")
        .delete()
        .eq("id", enrollmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-enrollments", courseId] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast.success("Mahasiswa berhasil dihapus dari mata kuliah");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus mahasiswa");
    },
  });

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "?";
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
      </div>
    );
  }

  if (!enrollments || enrollments.length === 0) {
    return (
      <div className="p-8 text-center bg-muted/30 rounded-lg">
        <Users className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">Belum ada mahasiswa terdaftar</p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-muted/50 border-b border-border">
        <span className="text-sm font-medium text-foreground">
          {enrollments.length} Mahasiswa Terdaftar
        </span>
      </div>
      <ScrollArea className="max-h-[400px]">
        {enrollments.map((enrollment) => {
          const grade = gradesMap.get(enrollment.id);
          const progress = progressMap.get(enrollment.id) ?? 0;

          return (
            <div
              key={enrollment.id}
              className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0 hover:bg-muted/30 gap-3"
            >
              {/* Student info */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Avatar className="w-9 h-9 flex-shrink-0">
                  <AvatarImage src={enrollment.student.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {getInitials(enrollment.student.first_name, enrollment.student.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {enrollment.student.first_name} {enrollment.student.last_name}
                  </p>
                  {enrollment.student.institution && (
                    <p className="text-xs text-muted-foreground truncate">
                      {enrollment.student.institution}
                    </p>
                  )}
                </div>
              </div>

              {/* Progress */}
              <div className="flex items-center gap-2 w-28 flex-shrink-0">
                <Progress value={progress} className="h-2 flex-1" />
                <span className="text-xs text-muted-foreground w-8 text-right">{progress}%</span>
              </div>

              {/* Grade */}
              <div className="w-16 flex-shrink-0 text-center">
                {grade?.score != null ? (
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-sm font-medium text-foreground">{grade.score}</span>
                    {grade.letter && (
                      <Badge
                        variant={grade.letter === "A" ? "default" : grade.letter === "B" ? "secondary" : "outline"}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {grade.letter}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </div>

              {/* Actions */}
              {canManage && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-shrink-0"
                  onClick={() => {
                    if (confirm(`Hapus ${enrollment.student.first_name} dari mata kuliah ini?`)) {
                      removeStudent.mutate(enrollment.id);
                    }
                  }}
                  disabled={removeStudent.isPending}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              )}
            </div>
          );
        })}
      </ScrollArea>
    </div>
  );
};

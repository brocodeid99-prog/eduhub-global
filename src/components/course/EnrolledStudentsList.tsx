import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
      <ScrollArea className="max-h-[300px]">
        {enrollments.map((enrollment) => (
          <div
            key={enrollment.id}
            className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0 hover:bg-muted/30"
          >
            <div className="flex items-center gap-3">
              <Avatar className="w-9 h-9">
                <AvatarImage src={enrollment.student.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {getInitials(
                    enrollment.student.first_name,
                    enrollment.student.last_name
                  )}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {enrollment.student.first_name} {enrollment.student.last_name}
                </p>
                {enrollment.student.institution && (
                  <p className="text-xs text-muted-foreground">
                    {enrollment.student.institution}
                  </p>
                )}
              </div>
            </div>
            {canManage && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (
                    confirm(
                      `Hapus ${enrollment.student.first_name} dari mata kuliah ini?`
                    )
                  ) {
                    removeStudent.mutate(enrollment.id);
                  }
                }}
                disabled={removeStudent.isPending}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            )}
          </div>
        ))}
      </ScrollArea>
    </div>
  );
};

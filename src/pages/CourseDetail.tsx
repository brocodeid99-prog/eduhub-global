import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Plus,
  Loader2,
  BookOpen,
  FileText,
  Video,
  File,
  Trash2,
  Upload,
  Eye,
  Download,
  GripVertical,
  Users,
  Globe,
  Lock,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { EnrollStudentDialog } from "@/components/course/EnrollStudentDialog";
import { EnrolledStudentsList } from "@/components/course/EnrolledStudentsList";
import { MaterialPreview } from "@/components/course/MaterialPreview";

type MaterialType = "text" | "video" | "pdf" | "document";

interface Material {
  id: string;
  title: string;
  material_type: MaterialType;
  content: string | null;
  file_url: string | null;
  sort_order: number | null;
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  sort_order: number | null;
  materials: Material[];
}

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { profile, isTeacher, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [isModuleOpen, setIsModuleOpen] = useState(false);
  const [isMaterialOpen, setIsMaterialOpen] = useState(false);
  const [isEditCourseOpen, setIsEditCourseOpen] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [newModule, setNewModule] = useState({ title: "", description: "" });
  const [newMaterial, setNewMaterial] = useState({
    title: "",
    type: "text" as MaterialType,
    content: "",
  });
  const [editCourse, setEditCourse] = useState({ title: "", description: "" });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);

  // Fetch course details
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*, owner:profiles(first_name, last_name)")
        .eq("id", courseId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  // Fetch modules with materials
  const { data: modules, isLoading: modulesLoading } = useQuery({
    queryKey: ["modules", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modules")
        .select(`
          *,
          materials(*)
        `)
        .eq("course_id", courseId)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as Module[];
    },
    enabled: !!courseId,
  });

  // Fetch enrolled students
  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["course-enrollments", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrollments")
        .select(`
          id,
          enrolled_at,
          student:profiles!enrollments_student_id_fkey(
            id,
            first_name,
            last_name,
            avatar_url,
            institution
          )
        `)
        .eq("course_id", courseId)
        .eq("status", "active")
        .order("enrolled_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  const enrolledStudentIds = enrollments?.map((e: any) => e.student?.id).filter(Boolean) || [];

  const isOwner = course?.owner_id === profile?.id;
  const canManage = isOwner || isAdmin;

  // Toggle publish mutation
  const togglePublish = useMutation({
    mutationFn: async (isPublished: boolean) => {
      const { error } = await supabase
        .from("courses")
        .update({ is_published: isPublished })
        .eq("id", courseId);

      if (error) throw error;
    },
    onSuccess: (_, isPublished) => {
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast.success(isPublished ? "Mata kuliah dipublikasikan!" : "Mata kuliah di-unpublish!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal mengubah status publikasi");
    },
  });

  // Update course mutation
  const updateCourse = useMutation({
    mutationFn: async (data: { title: string; description: string }) => {
      const { error } = await supabase
        .from("courses")
        .update({ 
          title: data.title,
          description: data.description || null,
        })
        .eq("id", courseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast.success("Mata kuliah berhasil diperbarui!");
      setIsEditCourseOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal memperbarui mata kuliah");
    },
  });

  // Delete course mutation
  const deleteCourse = useMutation({
    mutationFn: async () => {
      // First delete all related data
      // Delete materials for all modules in this course
      const { data: moduleIds } = await supabase
        .from("modules")
        .select("id")
        .eq("course_id", courseId);

      if (moduleIds && moduleIds.length > 0) {
        const ids = moduleIds.map((m) => m.id);
        
        // Delete materials
        await supabase
          .from("materials")
          .delete()
          .in("module_id", ids);
      }

      // Delete modules
      await supabase
        .from("modules")
        .delete()
        .eq("course_id", courseId);

      // Delete enrollments
      await supabase
        .from("enrollments")
        .delete()
        .eq("course_id", courseId);

      // Delete exams and related data
      const { data: examIds } = await supabase
        .from("exams")
        .select("id")
        .eq("course_id", courseId);

      if (examIds && examIds.length > 0) {
        const ids = examIds.map((e) => e.id);
        
        // Delete exam attempts
        await supabase
          .from("exam_attempts")
          .delete()
          .in("exam_id", ids);

        // Delete questions
        await supabase
          .from("questions")
          .delete()
          .in("exam_id", ids);
      }

      await supabase
        .from("exams")
        .delete()
        .eq("course_id", courseId);

      // Finally delete the course
      const { error } = await supabase
        .from("courses")
        .delete()
        .eq("id", courseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast.success("Mata kuliah berhasil dihapus!");
      navigate("/dashboard/courses");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus mata kuliah");
    },
  });

  // Create module mutation
  const createModule = useMutation({
    mutationFn: async (moduleData: { title: string; description: string }) => {
      const maxOrder = modules?.length || 0;
      const { data, error } = await supabase
        .from("modules")
        .insert({
          course_id: courseId,
          title: moduleData.title,
          description: moduleData.description || null,
          sort_order: maxOrder,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules", courseId] });
      toast.success("Modul berhasil dibuat!");
      setIsModuleOpen(false);
      setNewModule({ title: "", description: "" });
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal membuat modul");
    },
  });

  // Delete module mutation
  const deleteModule = useMutation({
    mutationFn: async (moduleId: string) => {
      const { error } = await supabase
        .from("modules")
        .delete()
        .eq("id", moduleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules", courseId] });
      toast.success("Modul berhasil dihapus!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus modul");
    },
  });

  // Create material mutation
  const createMaterial = useMutation({
    mutationFn: async (data: {
      moduleId: string;
      title: string;
      type: MaterialType;
      content?: string;
      fileUrl?: string;
    }) => {
      const module = modules?.find((m) => m.id === data.moduleId);
      const maxOrder = module?.materials?.length || 0;

      const { data: material, error } = await supabase
        .from("materials")
        .insert({
          module_id: data.moduleId,
          title: data.title,
          material_type: data.type,
          content: data.content || null,
          file_url: data.fileUrl || null,
          sort_order: maxOrder,
        })
        .select()
        .single();

      if (error) throw error;
      return material;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules", courseId] });
      toast.success("Materi berhasil ditambahkan!");
      setIsMaterialOpen(false);
      setNewMaterial({ title: "", type: "text", content: "" });
      setSelectedFile(null);
      setSelectedModuleId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menambahkan materi");
    },
  });

  // Delete material mutation
  const deleteMaterial = useMutation({
    mutationFn: async (material: Material) => {
      // Delete file from storage if exists
      if (material.file_url) {
        const path = material.file_url.split("/course-materials/")[1];
        if (path) {
          await supabase.storage.from("course-materials").remove([path]);
        }
      }

      const { error } = await supabase
        .from("materials")
        .delete()
        .eq("id", material.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules", courseId] });
      toast.success("Materi berhasil dihapus!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus materi");
    },
  });

  const handleCreateModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModule.title.trim()) {
      toast.error("Judul modul wajib diisi");
      return;
    }
    createModule.mutate(newModule);
  };

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterial.title.trim() || !selectedModuleId) {
      toast.error("Judul materi wajib diisi");
      return;
    }

    let fileUrl: string | undefined;

    // Upload file if selected
    if (selectedFile && newMaterial.type !== "text") {
      setUploadingFile(true);
      try {
        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `${courseId}/${selectedModuleId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("course-materials")
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("course-materials")
          .getPublicUrl(fileName);

        fileUrl = urlData.publicUrl;
      } catch (error: any) {
        toast.error(error.message || "Gagal mengupload file");
        setUploadingFile(false);
        return;
      }
      setUploadingFile(false);
    }

    createMaterial.mutate({
      moduleId: selectedModuleId,
      title: newMaterial.title,
      type: newMaterial.type,
      content: newMaterial.type === "text" ? newMaterial.content : undefined,
      fileUrl,
    });
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="w-4 h-4 text-primary" />;
      case "pdf":
        return <FileText className="w-4 h-4 text-destructive" />;
      case "document":
        return <File className="w-4 h-4 text-warning" />;
      default:
        return <BookOpen className="w-4 h-4 text-success" />;
    }
  };

  const getAcceptedFileTypes = (type: MaterialType) => {
    switch (type) {
      case "video":
        return "video/mp4,video/webm,video/quicktime";
      case "pdf":
        return "application/pdf";
      case "document":
        return ".doc,.docx,.ppt,.pptx";
      default:
        return "";
    }
  };

  if (courseLoading || modulesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Mata kuliah tidak ditemukan</p>
      </div>
    );
  }

  return (
    <DashboardLayout>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard/courses">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{course.title}</h1>
                {course.is_published ? (
                  <span className="inline-flex items-center gap-1 text-xs bg-success/10 text-success px-2 py-1 rounded-full">
                    <Globe className="w-3 h-3" />
                    Dipublikasikan
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                    <Lock className="w-3 h-3" />
                    Draft
                  </span>
                )}
                {canManage && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditCourse({
                        title: course.title,
                        description: course.description || "",
                      });
                      setIsEditCourseOpen(true);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <p className="text-muted-foreground">
                {course.owner?.first_name} {course.owner?.last_name}
              </p>
            </div>
          </div>
          
          {canManage && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                  {course.is_published ? (
                    <Globe className="w-4 h-4 text-success" />
                  ) : (
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">
                    {course.is_published ? "Publik" : "Draft"}
                  </span>
                </div>
                <Switch
                  checked={course.is_published || false}
                  onCheckedChange={(checked) => togglePublish.mutate(checked)}
                  disabled={togglePublish.isPending}
                />
              </div>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Hapus
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hapus Mata Kuliah?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Apakah Anda yakin ingin menghapus mata kuliah <strong>"{course.title}"</strong>? 
                      Tindakan ini akan menghapus semua modul, materi, ujian, dan data pendaftaran mahasiswa. 
                      Tindakan ini tidak dapat dibatalkan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteCourse.mutate()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={deleteCourse.isPending}
                    >
                      {deleteCourse.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      Ya, Hapus
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>

        {course.description && (
          <p className="text-muted-foreground mb-8 max-w-3xl">
            {course.description}
          </p>
        )}

        {/* Edit Course Dialog */}
        <Dialog open={isEditCourseOpen} onOpenChange={setIsEditCourseOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Mata Kuliah</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editCourse.title.trim()) {
                  toast.error("Judul mata kuliah wajib diisi");
                  return;
                }
                updateCourse.mutate(editCourse);
              }}
              className="space-y-4 mt-4"
            >
              <div className="space-y-2">
                <Label htmlFor="edit-title">Judul Mata Kuliah</Label>
                <Input
                  id="edit-title"
                  placeholder="Contoh: Algoritma & Pemrograman"
                  value={editCourse.title}
                  onChange={(e) =>
                    setEditCourse({ ...editCourse, title: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Deskripsi</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Deskripsi mata kuliah..."
                  value={editCourse.description}
                  onChange={(e) =>
                    setEditCourse({ ...editCourse, description: e.target.value })
                  }
                  rows={4}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsEditCourseOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  className="flex-1"
                  disabled={updateCourse.isPending}
                >
                  {updateCourse.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Simpan Perubahan"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Tabs for Modules and Students */}
        <Tabs defaultValue="modules" className="space-y-6">
          <TabsList>
            <TabsTrigger value="modules">
              <BookOpen className="w-4 h-4 mr-2" />
              Modul
            </TabsTrigger>
            <TabsTrigger value="students">
              <Users className="w-4 h-4 mr-2" />
              Mahasiswa ({enrollments?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="modules">
            {/* Modules Section */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">Modul Pembelajaran</h2>
              {canManage && (
                <Dialog open={isModuleOpen} onOpenChange={setIsModuleOpen}>
                  <DialogTrigger asChild>
                    <Button variant="hero">
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Modul
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Tambah Modul Baru</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateModule} className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="module-title">Judul Modul</Label>
                        <Input
                          id="module-title"
                          placeholder="Contoh: Pengenalan Algoritma"
                          value={newModule.title}
                          onChange={(e) =>
                            setNewModule({ ...newModule, title: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="module-desc">Deskripsi</Label>
                        <Textarea
                          id="module-desc"
                          placeholder="Deskripsi modul..."
                          value={newModule.description}
                          onChange={(e) =>
                            setNewModule({ ...newModule, description: e.target.value })
                          }
                          rows={3}
                        />
                      </div>
                      <Button
                        type="submit"
                        variant="hero"
                        className="w-full"
                        disabled={createModule.isPending}
                      >
                        {createModule.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Buat Modul"
                        )}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Material Dialog */}
            <Dialog open={isMaterialOpen} onOpenChange={setIsMaterialOpen}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Tambah Materi</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateMaterial} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="material-title">Judul Materi</Label>
                    <Input
                      id="material-title"
                      placeholder="Contoh: Video Pengantar"
                      value={newMaterial.title}
                      onChange={(e) =>
                        setNewMaterial({ ...newMaterial, title: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipe Materi</Label>
                    <Select
                      value={newMaterial.type}
                      onValueChange={(value: MaterialType) =>
                        setNewMaterial({ ...newMaterial, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Teks / Artikel</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="document">Dokumen (Word/PPT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newMaterial.type === "text" ? (
                    <div className="space-y-2">
                      <Label htmlFor="material-content">Konten</Label>
                      <Textarea
                        id="material-content"
                        placeholder="Tulis konten materi di sini..."
                        value={newMaterial.content}
                        onChange={(e) =>
                          setNewMaterial({ ...newMaterial, content: e.target.value })
                        }
                        rows={6}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Upload File</Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                        {selectedFile ? (
                          <div className="flex items-center justify-center gap-2">
                            {getMaterialIcon(newMaterial.type)}
                            <span className="text-sm text-foreground">
                              {selectedFile.name}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedFile(null)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground mb-2">
                              Klik atau drag file ke sini
                            </p>
                            <Input
                              type="file"
                              accept={getAcceptedFileTypes(newMaterial.type)}
                              onChange={(e) =>
                                setSelectedFile(e.target.files?.[0] || null)
                              }
                              className="cursor-pointer"
                            />
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="hero"
                    className="w-full"
                    disabled={createMaterial.isPending || uploadingFile}
                  >
                    {createMaterial.isPending || uploadingFile ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        {uploadingFile ? "Mengupload..." : "Menyimpan..."}
                      </>
                    ) : (
                      "Simpan Materi"
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            {/* Modules List */}
            {modules && modules.length > 0 ? (
              <Accordion type="multiple" className="space-y-4">
                {modules.map((module, index) => (
                  <AccordionItem
                    key={module.id}
                    value={module.id}
                    className="border border-border rounded-xl overflow-hidden bg-card"
                  >
                    <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
                      <div className="flex items-center gap-4">
                        {canManage && (
                          <GripVertical className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className="bg-primary/10 text-primary text-sm font-medium px-2 py-1 rounded">
                          Modul {index + 1}
                        </span>
                        <span className="font-semibold text-foreground">
                          {module.title}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4">
                      {module.description && (
                        <p className="text-muted-foreground text-sm mb-4">
                          {module.description}
                        </p>
                      )}

                      {/* Materials List */}
                      <div className="space-y-2 mb-4">
                        {module.materials && module.materials.length > 0 ? (
                          module.materials.map((material) => (
                            <div
                              key={material.id}
                              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer group"
                              onClick={() => setPreviewMaterial(material)}
                            >
                              <div className="flex items-center gap-3">
                                {getMaterialIcon(material.material_type)}
                                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                  {material.title}
                                </span>
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                  {material.material_type === "text" && "Teks"}
                                  {material.material_type === "video" && "Video"}
                                  {material.material_type === "pdf" && "PDF"}
                                  {material.material_type === "document" && "Dokumen"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setPreviewMaterial(material)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {material.file_url && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    asChild
                                  >
                                    <a
                                      href={material.file_url}
                                      download
                                    >
                                      <Download className="w-4 h-4" />
                                    </a>
                                  </Button>
                                )}
                                {canManage && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteMaterial.mutate(material)}
                                    disabled={deleteMaterial.isPending}
                                  >
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground py-2">
                            Belum ada materi
                          </p>
                        )}
                      </div>

                      {/* Module Actions */}
                      {canManage && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedModuleId(module.id);
                              setIsMaterialOpen(true);
                            }}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Tambah Materi
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm("Hapus modul ini beserta semua materinya?")) {
                                deleteModule.mutate(module.id);
                              }
                            }}
                            disabled={deleteModule.isPending}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="text-center py-16 bg-card rounded-xl border border-border">
                <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Belum ada modul
                </h3>
                <p className="text-muted-foreground">
                  {canManage
                    ? "Mulai dengan membuat modul pertama"
                    : "Modul pembelajaran akan muncul di sini"}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="students">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Mahasiswa Terdaftar</h2>
                {canManage && (
                  <EnrollStudentDialog
                    courseId={courseId!}
                    enrolledStudentIds={enrolledStudentIds}
                  />
                )}
              </div>

              <EnrolledStudentsList
                courseId={courseId!}
                enrollments={enrollments as any}
                canManage={canManage}
                isLoading={enrollmentsLoading}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Material Preview Dialog */}
        <MaterialPreview
          material={previewMaterial}
          open={!!previewMaterial}
          onClose={() => setPreviewMaterial(null)}
        />
    </DashboardLayout>
  );
};

export default CourseDetail;

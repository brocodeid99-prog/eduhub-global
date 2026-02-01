import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
} from "lucide-react";
import { toast } from "sonner";

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
  const { profile, isTeacher, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [isModuleOpen, setIsModuleOpen] = useState(false);
  const [isMaterialOpen, setIsMaterialOpen] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [newModule, setNewModule] = useState({ title: "", description: "" });
  const [newMaterial, setNewMaterial] = useState({
    title: "",
    type: "text" as MaterialType,
    content: "",
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

  const isOwner = course?.owner_id === profile?.id;
  const canManage = isOwner || isAdmin;

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
    <div className="min-h-screen bg-background">
      <DashboardSidebar />

      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard/courses">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{course.title}</h1>
            <p className="text-muted-foreground">
              {course.owner?.first_name} {course.owner?.last_name}
            </p>
          </div>
        </div>

        {course.description && (
          <p className="text-muted-foreground mb-8 max-w-3xl">
            {course.description}
          </p>
        )}

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
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            {getMaterialIcon(material.material_type)}
                            <span className="text-sm font-medium text-foreground">
                              {material.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {material.file_url && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  asChild
                                >
                                  <a
                                    href={material.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </a>
                                </Button>
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
                              </>
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
      </main>
    </div>
  );
};

export default CourseDetail;

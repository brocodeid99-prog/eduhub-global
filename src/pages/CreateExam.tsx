import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

interface Course {
  id: string;
  title: string;
}

const CreateExam = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");
  const [examType, setExamType] = useState("quiz");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [maxScore, setMaxScore] = useState(100);
  const [passingScore, setPassingScore] = useState(60);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [showResult, setShowResult] = useState(true);
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, [profile]);

  const fetchCourses = async () => {
    if (!profile?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title")
        .eq("owner_id", profile.id)
        .order("title", { ascending: true });

      if (error) throw error;
      setCourses(data || []);
    } catch (error: any) {
      console.error("Error fetching courses:", error);
      toast.error("Gagal memuat daftar mata kuliah");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Judul ujian tidak boleh kosong");
      return;
    }

    if (!courseId) {
      toast.error("Pilih mata kuliah terlebih dahulu");
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from("exams")
        .insert({
          title,
          description: description || null,
          course_id: courseId,
          exam_type: examType,
          duration_minutes: durationMinutes,
          max_score: maxScore,
          passing_score: passingScore,
          start_time: startTime || null,
          end_time: endTime || null,
          shuffle_questions: shuffleQuestions,
          show_result: showResult,
          is_published: isPublished,
        })
        .select("id")
        .single();

      if (error) throw error;

      toast.success("Ujian berhasil dibuat");
      navigate(`/dashboard/exams/${data.id}/questions`);
    } catch (error: any) {
      console.error("Error creating exam:", error);
      toast.error("Gagal membuat ujian");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <DashboardSidebar />
        <main className="flex-1 ml-64 p-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Buat Ujian Baru</h1>
            <p className="text-muted-foreground">
              Isi detail ujian dan tambahkan soal
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informasi Dasar</CardTitle>
                  <CardDescription>
                    Detail utama tentang ujian
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Judul Ujian *</Label>
                    <Input
                      id="title"
                      placeholder="Contoh: UTS Algoritma & Pemrograman"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Deskripsi</Label>
                    <Textarea
                      id="description"
                      placeholder="Deskripsi atau petunjuk ujian..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Mata Kuliah *</Label>
                      <Select value={courseId} onValueChange={setCourseId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih mata kuliah" />
                        </SelectTrigger>
                        <SelectContent>
                          {courses.length === 0 ? (
                            <SelectItem value="none" disabled>
                              Tidak ada mata kuliah
                            </SelectItem>
                          ) : (
                            courses.map((course) => (
                              <SelectItem key={course.id} value={course.id}>
                                {course.title}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Tipe Ujian</Label>
                      <Select value={examType} onValueChange={setExamType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="quiz">Quiz</SelectItem>
                          <SelectItem value="uts">UTS</SelectItem>
                          <SelectItem value="uas">UAS</SelectItem>
                          <SelectItem value="tugas">Tugas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Jadwal & Durasi</CardTitle>
                  <CardDescription>
                    Atur waktu pelaksanaan ujian
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Waktu Mulai</Label>
                      <Input
                        id="startTime"
                        type="datetime-local"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endTime">Waktu Selesai</Label>
                      <Input
                        id="endTime"
                        type="datetime-local"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Durasi (menit)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min={1}
                      value={durationMinutes}
                      onChange={(e) =>
                        setDurationMinutes(parseInt(e.target.value) || 60)
                      }
                    />
                    <p className="text-sm text-muted-foreground">
                      Waktu maksimal pengerjaan ujian per siswa
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Penilaian</CardTitle>
                  <CardDescription>
                    Pengaturan skor dan penilaian
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxScore">Skor Maksimal</Label>
                      <Input
                        id="maxScore"
                        type="number"
                        min={1}
                        value={maxScore}
                        onChange={(e) =>
                          setMaxScore(parseInt(e.target.value) || 100)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="passingScore">Skor Kelulusan</Label>
                      <Input
                        id="passingScore"
                        type="number"
                        min={0}
                        value={passingScore}
                        onChange={(e) =>
                          setPassingScore(parseInt(e.target.value) || 60)
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Settings */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pengaturan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Acak Soal</Label>
                      <p className="text-sm text-muted-foreground">
                        Urutan soal berbeda tiap siswa
                      </p>
                    </div>
                    <Switch
                      checked={shuffleQuestions}
                      onCheckedChange={setShuffleQuestions}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Tampilkan Hasil</Label>
                      <p className="text-sm text-muted-foreground">
                        Siswa bisa lihat nilai setelah selesai
                      </p>
                    </div>
                    <Switch
                      checked={showResult}
                      onCheckedChange={setShowResult}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Publikasikan</Label>
                      <p className="text-sm text-muted-foreground">
                        Ujian terlihat oleh siswa
                      </p>
                    </div>
                    <Switch
                      checked={isPublished}
                      onCheckedChange={setIsPublished}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSaving || courses.length === 0}
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Buat Ujian & Tambah Soal
                  </Button>

                  {courses.length === 0 && (
                    <p className="text-sm text-destructive mt-2 text-center">
                      Buat mata kuliah terlebih dahulu
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CreateExam;

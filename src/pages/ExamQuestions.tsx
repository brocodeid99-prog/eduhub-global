import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  options: string[] | null;
  correct_answer: string | null;
  points: number;
  sort_order: number | null;
}

interface Exam {
  id: string;
  title: string;
  course_id: string;
  max_score: number;
}

const ExamQuestions = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<Question | null>(null);

  // Form state
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState("multiple_choice");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [points, setPoints] = useState(1);

  useEffect(() => {
    if (examId) {
      fetchExamAndQuestions();
    }
  }, [examId]);

  const fetchExamAndQuestions = async () => {
    setIsLoading(true);
    try {
      // Fetch exam details
      const { data: examData, error: examError } = await supabase
        .from("exams")
        .select("id, title, course_id, max_score")
        .eq("id", examId)
        .maybeSingle();

      if (examError) throw examError;
      if (!examData) {
        toast.error("Ujian tidak ditemukan");
        navigate("/dashboard/exams");
        return;
      }

      setExam(examData);

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .eq("exam_id", examId)
        .order("sort_order", { ascending: true });

      if (questionsError) throw questionsError;
      
      // Parse options from JSON
      const parsedQuestions = (questionsData || []).map((q) => ({
        ...q,
        options: q.options ? (q.options as string[]) : null,
      }));
      
      setQuestions(parsedQuestions);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Gagal memuat data ujian");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setQuestionText("");
    setQuestionType("multiple_choice");
    setOptions(["", "", "", ""]);
    setCorrectAnswer("");
    setPoints(1);
    setEditingQuestion(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (question: Question) => {
    setEditingQuestion(question);
    setQuestionText(question.question_text);
    setQuestionType(question.question_type);
    setOptions(question.options || ["", "", "", ""]);
    setCorrectAnswer(question.correct_answer || "");
    setPoints(question.points);
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (question: Question) => {
    setDeletingQuestion(question);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveQuestion = async () => {
    if (!questionText.trim()) {
      toast.error("Pertanyaan tidak boleh kosong");
      return;
    }

    if (questionType === "multiple_choice" || questionType === "true_false") {
      if (!correctAnswer) {
        toast.error("Jawaban benar harus dipilih");
        return;
      }
    }

    setIsSaving(true);
    try {
      const questionData = {
        exam_id: examId,
        question_text: questionText,
        question_type: questionType,
        options: questionType === "multiple_choice" ? options.filter((o) => o.trim()) : 
                 questionType === "true_false" ? ["Benar", "Salah"] : null,
        correct_answer: correctAnswer || null,
        points,
        sort_order: editingQuestion ? editingQuestion.sort_order : questions.length,
      };

      if (editingQuestion) {
        const { error } = await supabase
          .from("questions")
          .update(questionData)
          .eq("id", editingQuestion.id);

        if (error) throw error;
        toast.success("Soal berhasil diperbarui");
      } else {
        const { error } = await supabase.from("questions").insert(questionData);

        if (error) throw error;
        toast.success("Soal berhasil ditambahkan");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchExamAndQuestions();
    } catch (error: any) {
      console.error("Error saving question:", error);
      toast.error("Gagal menyimpan soal");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!deletingQuestion) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("questions")
        .delete()
        .eq("id", deletingQuestion.id);

      if (error) throw error;

      toast.success("Soal berhasil dihapus");
      setIsDeleteDialogOpen(false);
      setDeletingQuestion(null);
      fetchExamAndQuestions();
    } catch (error: any) {
      console.error("Error deleting question:", error);
      toast.error("Gagal menghapus soal");
    } finally {
      setIsSaving(false);
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
    if (correctAnswer === options[index]) {
      setCorrectAnswer("");
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case "multiple_choice":
        return "Pilihan Ganda";
      case "true_false":
        return "Benar/Salah";
      case "essay":
        return "Essay";
      case "short_answer":
        return "Jawaban Singkat";
      default:
        return type;
    }
  };

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Kelola Soal</h1>
            <p className="text-muted-foreground">{exam?.title}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Poin</p>
            <p className="text-xl font-bold text-foreground">
              {totalPoints} / {exam?.max_score}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-foreground">{questions.length}</div>
              <p className="text-sm text-muted-foreground">Total Soal</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-foreground">
                {questions.filter((q) => q.question_type === "multiple_choice").length}
              </div>
              <p className="text-sm text-muted-foreground">Pilihan Ganda</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-foreground">
                {questions.filter((q) => q.question_type === "essay").length}
              </div>
              <p className="text-sm text-muted-foreground">Essay</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-foreground">{totalPoints}</div>
              <p className="text-sm text-muted-foreground">Total Poin</p>
            </CardContent>
          </Card>
        </div>

        {/* Add Question Button */}
        <div className="mb-6">
          <Button onClick={openAddDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Soal
          </Button>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {questions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  Belum ada soal untuk ujian ini
                </p>
                <Button onClick={openAddDialog}>
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Soal Pertama
                </Button>
              </CardContent>
            </Card>
          ) : (
            questions.map((question, index) => (
              <Card key={question.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GripVertical className="w-5 h-5" />
                      <span className="font-semibold text-lg">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">
                          {getQuestionTypeLabel(question.question_type)}
                        </Badge>
                        <Badge variant="outline">{question.points} poin</Badge>
                      </div>
                      <CardTitle className="text-base font-normal">
                        {question.question_text}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(question)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => openDeleteDialog(question)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {question.options && question.options.length > 0 && (
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-2 ml-11">
                      {question.options.map((option, optIndex) => (
                        <div
                          key={optIndex}
                          className={`flex items-center gap-2 p-2 rounded-lg ${
                            option === question.correct_answer
                              ? "bg-accent/10 text-accent"
                              : "bg-muted/50"
                          }`}
                        >
                          {option === question.correct_answer ? (
                            <CheckCircle className="w-4 h-4 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                          )}
                          <span className="text-sm">{option}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>

        {/* Add/Edit Question Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingQuestion ? "Edit Soal" : "Tambah Soal Baru"}
              </DialogTitle>
              <DialogDescription>
                Isi detail soal di bawah ini
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Question Type */}
              <div className="space-y-2">
                <Label>Jenis Soal</Label>
                <Select value={questionType} onValueChange={setQuestionType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple_choice">Pilihan Ganda</SelectItem>
                    <SelectItem value="true_false">Benar/Salah</SelectItem>
                    <SelectItem value="essay">Essay</SelectItem>
                    <SelectItem value="short_answer">Jawaban Singkat</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Question Text */}
              <div className="space-y-2">
                <Label>Pertanyaan</Label>
                <Textarea
                  placeholder="Tulis pertanyaan di sini..."
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Options for Multiple Choice */}
              {questionType === "multiple_choice" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Pilihan Jawaban</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addOption}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Tambah Opsi
                    </Button>
                  </div>
                  {options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correct_answer"
                        checked={correctAnswer === option && option.trim() !== ""}
                        onChange={() => setCorrectAnswer(option)}
                        className="w-4 h-4"
                      />
                      <Input
                        placeholder={`Opsi ${String.fromCharCode(65 + index)}`}
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        className="flex-1"
                      />
                      {options.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOption(index)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <p className="text-sm text-muted-foreground">
                    Pilih radio button untuk menandai jawaban benar
                  </p>
                </div>
              )}

              {/* Options for True/False */}
              {questionType === "true_false" && (
                <div className="space-y-2">
                  <Label>Jawaban Benar</Label>
                  <Select value={correctAnswer} onValueChange={setCorrectAnswer}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jawaban benar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Benar">Benar</SelectItem>
                      <SelectItem value="Salah">Salah</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Correct Answer for Short Answer */}
              {questionType === "short_answer" && (
                <div className="space-y-2">
                  <Label>Jawaban Benar (Opsional)</Label>
                  <Input
                    placeholder="Masukkan jawaban benar"
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Jawaban akan digunakan untuk auto-grading
                  </p>
                </div>
              )}

              {/* Essay note */}
              {questionType === "essay" && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Soal essay memerlukan penilaian manual dari guru/dosen.
                  </p>
                </div>
              )}

              {/* Points */}
              <div className="space-y-2">
                <Label>Poin</Label>
                <Input
                  type="number"
                  min={1}
                  value={points}
                  onChange={(e) => setPoints(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSaving}
              >
                Batal
              </Button>
              <Button onClick={handleSaveQuestion} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {editingQuestion ? "Simpan Perubahan" : "Tambah Soal"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Hapus Soal</DialogTitle>
              <DialogDescription>
                Apakah Anda yakin ingin menghapus soal ini? Tindakan ini tidak
                dapat dibatalkan.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isSaving}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteQuestion}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Hapus
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </DashboardLayout>
  );
};

export default ExamQuestions;

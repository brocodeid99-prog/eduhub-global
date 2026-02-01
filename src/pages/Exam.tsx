import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  Send,
  Loader2,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface QuestionOption {
  id: string;
  text: string;
}

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  options: QuestionOption[] | null;
  points: number;
  sort_order: number;
}

const Exam = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);

  // Fetch exam details
  const { data: exam, isLoading: loadingExam } = useQuery({
    queryKey: ["exam", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exams")
        .select("*, course:courses(title)")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch questions
  const { data: questions, isLoading: loadingQuestions } = useQuery({
    queryKey: ["exam-questions", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("exam_id", id)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      // Parse options from JSON
      return data.map((q) => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        points: q.points,
        sort_order: q.sort_order,
        options: Array.isArray(q.options) ? (q.options as unknown as QuestionOption[]) : null,
      })) as Question[];
    },
    enabled: !!id,
  });

  // Create or get existing attempt
  const createAttempt = useMutation({
    mutationFn: async () => {
      if (!profile?.id || !id) throw new Error("Missing data");

      // Check for existing in-progress attempt
      const { data: existing } = await supabase
        .from("exam_attempts")
        .select("id, started_at")
        .eq("exam_id", id)
        .eq("student_id", profile.id)
        .eq("status", "in_progress")
        .maybeSingle();

      if (existing) {
        return existing;
      }

      // Create new attempt
      const { data, error } = await supabase
        .from("exam_attempts")
        .insert({
          exam_id: id,
          student_id: profile.id,
          status: "in_progress",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setAttemptId(data.id);
      // Calculate remaining time based on when attempt started
      if (exam?.duration_minutes) {
        const startedAt = new Date(data.started_at).getTime();
        const endTime = startedAt + exam.duration_minutes * 60 * 1000;
        const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
        setTimeLeft(remaining);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal memulai ujian");
      navigate("/dashboard/exams");
    },
  });

  // Submit exam mutation
  const submitExam = useMutation({
    mutationFn: async () => {
      if (!attemptId || !questions) throw new Error("Missing data");

      // Save all answers
      const answersToSave = questions.map((q) => ({
        attempt_id: attemptId,
        question_id: q.id,
        answer: answers[q.id] || null,
        is_correct: answers[q.id] === (q.options ? q.options.find(o => o.id === answers[q.id])?.id : null) ? 
          answers[q.id] === q.options?.find(o => o.text === "correct")?.id : null,
      }));

      // Upsert answers
      for (const answer of answersToSave) {
        await supabase
          .from("student_answers")
          .upsert(answer, { onConflict: "attempt_id,question_id" });
      }

      // Calculate score (simplified - just counting answered questions)
      const answeredCount = Object.keys(answers).length;
      const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
      const score = (answeredCount / questions.length) * totalPoints;

      // Update attempt status
      const { error } = await supabase
        .from("exam_attempts")
        .update({
          status: "submitted",
          submitted_at: new Date().toISOString(),
          score: score,
          time_spent_seconds: exam?.duration_minutes ? exam.duration_minutes * 60 - timeLeft : 0,
        })
        .eq("id", attemptId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ujian berhasil dikumpulkan!");
      navigate("/dashboard/exams");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal mengumpulkan ujian");
    },
  });

  // Initialize attempt when exam loads
  useEffect(() => {
    if (exam && profile?.id && !attemptId) {
      createAttempt.mutate();
    }
  }, [exam, profile?.id]);

  // Timer effect
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          submitExam.mutate();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswer = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const toggleFlag = (questionId: string) => {
    setFlagged((prev) => {
      const newFlagged = new Set(prev);
      if (newFlagged.has(questionId)) {
        newFlagged.delete(questionId);
      } else {
        newFlagged.add(questionId);
      }
      return newFlagged;
    });
  };

  const handleSubmit = () => {
    submitExam.mutate();
  };

  if (loadingExam || loadingQuestions || createAttempt.isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Memuat ujian...</p>
        </div>
      </div>
    );
  }

  if (!exam || !questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Ujian tidak ditemukan atau belum ada soal</p>
          <Button variant="outline" onClick={() => navigate("/dashboard/exams")}>
            Kembali
          </Button>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const question = questions[currentQuestion];
  const options = question.options as { id: string; text: string }[] | null;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-foreground">{exam.title}</h1>
            <p className="text-sm text-muted-foreground">
              Soal {currentQuestion + 1} dari {questions.length}
            </p>
          </div>

          <div className="flex items-center gap-6">
            {/* Timer */}
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                timeLeft < 600
                  ? "bg-destructive/10 text-destructive"
                  : "bg-muted text-foreground"
              }`}
            >
              <Clock className="w-5 h-5" />
              <span className="font-mono font-semibold">
                {formatTime(timeLeft)}
              </span>
            </div>

            <Button
              variant="hero"
              onClick={() => setShowSubmitDialog(true)}
              disabled={submitExam.isPending}
            >
              {submitExam.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Selesai
                </>
              )}
            </Button>
          </div>
        </header>

        {/* Question Area */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            {/* Question */}
            <div className="bg-card rounded-xl border border-border p-8 mb-6">
              <div className="flex items-start justify-between mb-6">
                <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                  Soal {currentQuestion + 1} ({question.points} poin)
                </span>
                <button
                  onClick={() => toggleFlag(question.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    flagged.has(question.id)
                      ? "bg-warning/10 text-warning"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Flag className="w-5 h-5" />
                </button>
              </div>

              <p className="text-lg text-foreground whitespace-pre-line mb-8">
                {question.question_text}
              </p>

              {/* Options */}
              {options && (
                <div className="space-y-3">
                  {options.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleAnswer(question.id, option.id)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                        answers[question.id] === option.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                            answers[question.id] === option.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {option.id.toUpperCase()}
                        </span>
                        <span className="text-foreground">{option.text}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Sebelumnya
              </Button>

              <Button
                variant="outline"
                onClick={() =>
                  setCurrentQuestion((prev) =>
                    Math.min(questions.length - 1, prev + 1)
                  )
                }
                disabled={currentQuestion === questions.length - 1}
              >
                Selanjutnya
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar - Question Navigator */}
      <aside className="w-72 bg-card border-l border-border p-6">
        <h3 className="font-semibold text-foreground mb-4">Navigasi Soal</h3>

        <div className="grid grid-cols-5 gap-2 mb-6">
          {questions.map((q, index) => (
            <button
              key={q.id}
              onClick={() => setCurrentQuestion(index)}
              className={`w-10 h-10 rounded-lg text-sm font-medium transition-all relative ${
                currentQuestion === index
                  ? "bg-primary text-primary-foreground"
                  : answers[q.id]
                  ? "bg-success/20 text-success border border-success"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {index + 1}
              {flagged.has(q.id) && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-warning rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-success/20 border border-success" />
            <span className="text-muted-foreground">Dijawab</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-muted" />
            <span className="text-muted-foreground">Belum dijawab</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-warning" />
            <span className="text-muted-foreground">Ditandai</span>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground mb-2">Progress</p>
          <div className="w-full bg-muted rounded-full h-2 mb-2">
            <div
              className="bg-success h-2 rounded-full transition-all"
              style={{
                width: `${(answeredCount / questions.length) * 100}%`,
              }}
            />
          </div>
          <p className="text-sm text-foreground">
            {answeredCount} dari {questions.length} soal dijawab
          </p>
        </div>
      </aside>

      {/* Submit Dialog */}
      {showSubmitDialog && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-warning" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">
                Kumpulkan Jawaban?
              </h3>
            </div>

            <p className="text-muted-foreground mb-6">
              Anda telah menjawab {answeredCount} dari {questions.length} soal.
              {answeredCount < questions.length && (
                <span className="text-warning font-medium block mt-2">
                  Masih ada {questions.length - answeredCount} soal yang belum dijawab!
                </span>
              )}
            </p>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowSubmitDialog(false)}
              >
                Kembali
              </Button>
              <Button
                variant="hero"
                className="flex-1"
                onClick={handleSubmit}
                disabled={submitExam.isPending}
              >
                {submitExam.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Kumpulkan"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Exam;

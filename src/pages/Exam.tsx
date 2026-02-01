import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  Send,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Exam = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(7200); // 2 hours in seconds
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  const questions = [
    {
      id: 1,
      text: "Apa output dari kode berikut?\n\nfor i in range(5):\n    print(i, end=' ')",
      options: [
        { id: "a", text: "1 2 3 4 5" },
        { id: "b", text: "0 1 2 3 4" },
        { id: "c", text: "0 1 2 3 4 5" },
        { id: "d", text: "1 2 3 4" },
      ],
    },
    {
      id: 2,
      text: "Manakah yang merupakan tipe data primitif dalam Python?",
      options: [
        { id: "a", text: "list" },
        { id: "b", text: "dictionary" },
        { id: "c", text: "integer" },
        { id: "d", text: "set" },
      ],
    },
    {
      id: 3,
      text: "Apa fungsi dari keyword 'def' dalam Python?",
      options: [
        { id: "a", text: "Mendefinisikan variabel" },
        { id: "b", text: "Mendefinisikan fungsi" },
        { id: "c", text: "Mendefinisikan class" },
        { id: "d", text: "Mendefinisikan modul" },
      ],
    },
    {
      id: 4,
      text: "Bagaimana cara mengakses elemen terakhir dari list dalam Python?",
      options: [
        { id: "a", text: "list[0]" },
        { id: "b", text: "list[-1]" },
        { id: "c", text: "list[last]" },
        { id: "d", text: "list.last()" },
      ],
    },
    {
      id: 5,
      text: "Apa perbedaan antara '==' dan 'is' dalam Python?",
      options: [
        { id: "a", text: "Tidak ada perbedaan" },
        { id: "b", text: "'==' membandingkan nilai, 'is' membandingkan identitas objek" },
        { id: "c", text: "'==' membandingkan identitas, 'is' membandingkan nilai" },
        { id: "d", text: "'is' hanya untuk string" },
      ],
    },
    {
      id: 6,
      text: "Manakah yang bukan merupakan struktur data built-in dalam Python?",
      options: [
        { id: "a", text: "List" },
        { id: "b", text: "Tuple" },
        { id: "c", text: "Array" },
        { id: "d", text: "Dictionary" },
      ],
    },
    {
      id: 7,
      text: "Apa output dari: print(type([]))?",
      options: [
        { id: "a", text: "<class 'list'>" },
        { id: "b", text: "<class 'array'>" },
        { id: "c", text: "list" },
        { id: "d", text: "[]" },
      ],
    },
    {
      id: 8,
      text: "Bagaimana cara menambahkan elemen ke akhir list?",
      options: [
        { id: "a", text: "list.add(element)" },
        { id: "b", text: "list.append(element)" },
        { id: "c", text: "list.insert(element)" },
        { id: "d", text: "list.push(element)" },
      ],
    },
    {
      id: 9,
      text: "Apa fungsi dari 'break' dalam loop?",
      options: [
        { id: "a", text: "Melanjutkan ke iterasi berikutnya" },
        { id: "b", text: "Menghentikan loop" },
        { id: "c", text: "Mengulang loop dari awal" },
        { id: "d", text: "Mengembalikan nilai" },
      ],
    },
    {
      id: 10,
      text: "Manakah yang merupakan cara yang benar untuk membuat dictionary?",
      options: [
        { id: "a", text: "d = []" },
        { id: "b", text: "d = ()" },
        { id: "c", text: "d = {}" },
        { id: "d", text: "d = <>" },
      ],
    },
  ];

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswer = (questionId: number, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const toggleFlag = (questionId: number) => {
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
    navigate("/dashboard/exams");
  };

  const answeredCount = Object.keys(answers).length;
  const question = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-foreground">
              UTS Algoritma & Pemrograman
            </h1>
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
            >
              <Send className="w-4 h-4 mr-2" />
              Selesai
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
                  Soal {currentQuestion + 1}
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
                {question.text}
              </p>

              {/* Options */}
              <div className="space-y-3">
                {question.options.map((option) => (
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
              >
                Kumpulkan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Exam;

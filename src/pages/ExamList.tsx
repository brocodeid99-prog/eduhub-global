import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { ClipboardList, Clock, Calendar, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const ExamList = () => {
  const upcomingExams = [
    {
      id: 1,
      title: "UTS Algoritma & Pemrograman",
      subject: "Algoritma & Pemrograman",
      date: "15 Feb 2025",
      time: "09:00 - 11:00",
      duration: "120 menit",
      questions: 40,
      type: "UTS",
      status: "upcoming",
    },
    {
      id: 2,
      title: "Quiz 3 Basis Data",
      subject: "Basis Data",
      date: "17 Feb 2025",
      time: "13:00 - 14:00",
      duration: "60 menit",
      questions: 20,
      type: "Quiz",
      status: "upcoming",
    },
    {
      id: 3,
      title: "UTS Jaringan Komputer",
      subject: "Jaringan Komputer",
      date: "20 Feb 2025",
      time: "09:00 - 11:00",
      duration: "120 menit",
      questions: 35,
      type: "UTS",
      status: "upcoming",
    },
  ];

  const completedExams = [
    {
      id: 4,
      title: "Quiz 2 Algoritma & Pemrograman",
      subject: "Algoritma & Pemrograman",
      date: "5 Feb 2025",
      score: 85,
      maxScore: 100,
      status: "passed",
    },
    {
      id: 5,
      title: "Quiz 2 Basis Data",
      subject: "Basis Data",
      date: "3 Feb 2025",
      score: 78,
      maxScore: 100,
      status: "passed",
    },
    {
      id: 6,
      title: "Quiz 1 Pemrograman Web",
      subject: "Pemrograman Web",
      date: "28 Jan 2025",
      score: 92,
      maxScore: 100,
      status: "passed",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />

      <main className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Ujian CBT
          </h1>
          <p className="text-muted-foreground">
            Kelola dan ikuti ujian berbasis komputer
          </p>
        </div>

        {/* Upcoming Exams */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-warning" />
            Ujian Mendatang
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingExams.map((exam) => (
              <div
                key={exam.id}
                className="bg-card rounded-xl border border-border p-6 hover:shadow-card-hover hover:border-warning/50 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                    <ClipboardList className="w-6 h-6 text-warning" />
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-warning/10 text-warning">
                    {exam.type}
                  </span>
                </div>

                <h3 className="font-semibold text-foreground mb-1">
                  {exam.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {exam.subject}
                </p>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{exam.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>
                      {exam.time} ({exam.duration})
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {exam.questions} soal
                  </p>
                </div>

                <Button variant="hero" className="w-full" asChild>
                  <Link to={`/exam/${exam.id}`}>Mulai Ujian</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Completed Exams */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success" />
            Ujian Selesai
          </h2>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                    Ujian
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                    Mata Kuliah
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                    Tanggal
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                    Nilai
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {completedExams.map((exam) => (
                  <tr key={exam.id} className="border-t border-border">
                    <td className="px-6 py-4 font-medium text-foreground">
                      {exam.title}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {exam.subject}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {exam.date}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-foreground">
                        {exam.score}
                      </span>
                      <span className="text-muted-foreground">
                        /{exam.maxScore}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full bg-success/10 text-success">
                        <CheckCircle className="w-3 h-3" />
                        Lulus
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm">
                        Lihat Detail
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExamList;

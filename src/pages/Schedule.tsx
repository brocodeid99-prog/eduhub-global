import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  BookOpen,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { id } from "date-fns/locale";

const Schedule = () => {
  const { profile, isTeacher, isAdmin } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Fetch exams for schedule
  const { data: exams, isLoading } = useQuery({
    queryKey: ["scheduled-exams", profile?.id],
    queryFn: async () => {
      if (isTeacher || isAdmin) {
        const { data, error } = await supabase
          .from("exams")
          .select(`
            *,
            course:courses(title, owner_id)
          `)
          .not("start_time", "is", null);

        if (error) throw error;
        return data?.filter((e: any) => e.course?.owner_id === profile?.id) || [];
      } else {
        const { data: enrollments, error: enrollError } = await supabase
          .from("enrollments")
          .select("course_id")
          .eq("student_id", profile?.id);

        if (enrollError) throw enrollError;

        const courseIds = enrollments?.map((e) => e.course_id) || [];
        if (courseIds.length === 0) return [];

        const { data, error } = await supabase
          .from("exams")
          .select(`
            *,
            course:courses(title)
          `)
          .in("course_id", courseIds)
          .eq("is_published", true)
          .not("start_time", "is", null);

        if (error) throw error;
        return data || [];
      }
    },
    enabled: !!profile?.id,
  });

  // Mock schedule data for demonstration
  const mockSchedule = [
    {
      id: "1",
      title: "Pemrograman Web",
      type: "kuliah",
      day: 1, // Monday
      start_time: "08:00",
      end_time: "10:00",
      room: "Lab Komputer 1",
    },
    {
      id: "2",
      title: "Basis Data",
      type: "kuliah",
      day: 2, // Tuesday
      start_time: "10:00",
      end_time: "12:00",
      room: "Ruang 302",
    },
    {
      id: "3",
      title: "Algoritma & Pemrograman",
      type: "kuliah",
      day: 3, // Wednesday
      start_time: "13:00",
      end_time: "15:00",
      room: "Lab Komputer 2",
    },
    {
      id: "4",
      title: "Jaringan Komputer",
      type: "kuliah",
      day: 4, // Thursday
      start_time: "08:00",
      end_time: "10:00",
      room: "Ruang 401",
    },
    {
      id: "5",
      title: "Praktikum Web",
      type: "praktikum",
      day: 5, // Friday
      start_time: "10:00",
      end_time: "12:00",
      room: "Lab Komputer 1",
    },
  ];

  const getScheduleForDay = (dayIndex: number) => {
    return mockSchedule.filter((s) => s.day === dayIndex);
  };

  const getExamsForDay = (date: Date) => {
    return (
      exams?.filter((exam: any) => {
        if (!exam.start_time) return false;
        return isSameDay(new Date(exam.start_time), date);
      }) || []
    );
  };

  const navigateWeek = (direction: "prev" | "next") => {
    setCurrentDate((prev) =>
      direction === "next" ? addDays(prev, 7) : addDays(prev, -7)
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Jadwal</h1>
            <p className="text-muted-foreground">
              Lihat jadwal kuliah dan ujian Anda
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateWeek("prev")}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
              Hari Ini
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigateWeek("next")}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Week Header */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            {format(weekStart, "d MMMM", { locale: id })} -{" "}
            {format(addDays(weekStart, 6), "d MMMM yyyy", { locale: id })}
          </h2>
        </div>

        {/* Weekly Calendar */}
        <div className="grid grid-cols-7 gap-4">
          {weekDays.map((day, index) => {
            const daySchedule = getScheduleForDay(index + 1);
            const dayExams = getExamsForDay(day);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={index}
                className={`bg-card rounded-xl border ${
                  isToday ? "border-primary" : "border-border"
                } overflow-hidden`}
              >
                {/* Day Header */}
                <div
                  className={`p-3 text-center ${
                    isToday ? "bg-primary text-primary-foreground" : "bg-muted/50"
                  }`}
                >
                  <p className="text-xs font-medium uppercase">
                    {format(day, "EEE", { locale: id })}
                  </p>
                  <p className="text-lg font-bold">{format(day, "d")}</p>
                </div>

                {/* Schedule Items */}
                <div className="p-2 space-y-2 min-h-[200px]">
                  {daySchedule.map((item) => (
                    <div
                      key={item.id}
                      className={`p-2 rounded-lg text-xs ${
                        item.type === "praktikum"
                          ? "bg-warning/10 border border-warning/30"
                          : "bg-primary/10 border border-primary/30"
                      }`}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {item.start_time} - {item.end_time}
                        </span>
                      </div>
                      <p className="font-medium text-foreground line-clamp-2">
                        {item.title}
                      </p>
                      <p className="text-muted-foreground">{item.room}</p>
                    </div>
                  ))}

                  {dayExams.map((exam: any) => (
                    <div
                      key={exam.id}
                      className="p-2 rounded-lg text-xs bg-destructive/10 border border-destructive/30"
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <FileText className="w-3 h-3 text-destructive" />
                        <span className="text-destructive font-medium">UJIAN</span>
                      </div>
                      <p className="font-medium text-foreground line-clamp-2">
                        {exam.title}
                      </p>
                      <p className="text-muted-foreground">{exam.course?.title}</p>
                      <p className="text-muted-foreground">
                        {format(new Date(exam.start_time), "HH:mm", { locale: id })}
                      </p>
                    </div>
                  ))}

                  {daySchedule.length === 0 && dayExams.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Tidak ada jadwal
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-primary/30"></div>
            <span className="text-sm text-muted-foreground">Kuliah</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-warning/30"></div>
            <span className="text-sm text-muted-foreground">Praktikum</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-destructive/30"></div>
            <span className="text-sm text-muted-foreground">Ujian</span>
          </div>
        </div>
    </DashboardLayout>
  );
};

export default Schedule;

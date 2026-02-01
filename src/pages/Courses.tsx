import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { BookOpen, Clock, Users, Star, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

const Courses = () => {
  const courses = [
    {
      id: 1,
      title: "Algoritma & Pemrograman",
      instructor: "Dr. Budi Santoso",
      progress: 75,
      totalModules: 12,
      completedModules: 9,
      duration: "3 jam 45 menit",
      students: 156,
      rating: 4.8,
      image: "🖥️",
    },
    {
      id: 2,
      title: "Basis Data",
      instructor: "Prof. Rina Wijaya",
      progress: 60,
      totalModules: 10,
      completedModules: 6,
      duration: "4 jam 20 menit",
      students: 142,
      rating: 4.7,
      image: "🗄️",
    },
    {
      id: 3,
      title: "Jaringan Komputer",
      instructor: "Dr. Ahmad Fauzi",
      progress: 45,
      totalModules: 15,
      completedModules: 7,
      duration: "5 jam 10 menit",
      students: 98,
      rating: 4.5,
      image: "🌐",
    },
    {
      id: 4,
      title: "Pemrograman Web",
      instructor: "Ir. Siti Nurhaliza",
      progress: 90,
      totalModules: 8,
      completedModules: 7,
      duration: "2 jam 30 menit",
      students: 203,
      rating: 4.9,
      image: "💻",
    },
    {
      id: 5,
      title: "Matematika Diskrit",
      instructor: "Prof. Joko Widodo",
      progress: 30,
      totalModules: 14,
      completedModules: 4,
      duration: "6 jam 15 menit",
      students: 87,
      rating: 4.3,
      image: "📐",
    },
    {
      id: 6,
      title: "Sistem Operasi",
      instructor: "Dr. Maya Putri",
      progress: 55,
      totalModules: 11,
      completedModules: 6,
      duration: "4 jam 45 menit",
      students: 124,
      rating: 4.6,
      image: "⚙️",
    },
    {
      id: 7,
      title: "Kecerdasan Buatan",
      instructor: "Prof. Andi Pratama",
      progress: 20,
      totalModules: 16,
      completedModules: 3,
      duration: "7 jam 30 menit",
      students: 178,
      rating: 4.8,
      image: "🤖",
    },
    {
      id: 8,
      title: "Keamanan Siber",
      instructor: "Dr. Dewi Lestari",
      progress: 0,
      totalModules: 9,
      completedModules: 0,
      duration: "3 jam 15 menit",
      students: 65,
      rating: 4.4,
      image: "🔒",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />

      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Mata Kuliah Saya
            </h1>
            <p className="text-muted-foreground">
              Kelola dan akses semua mata kuliah yang Anda ikuti
            </p>
          </div>
          <Button variant="hero">+ Tambah Mata Kuliah</Button>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input placeholder="Cari mata kuliah..." className="pl-10 h-11" />
          </div>
          <Button variant="outline" className="h-11">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>

        {/* Courses Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {courses.map((course) => (
            <Link
              key={course.id}
              to={`/dashboard/courses/${course.id}`}
              className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-card-hover hover:border-primary/50 transition-all duration-300"
            >
              {/* Course Image */}
              <div className="h-32 bg-gradient-primary flex items-center justify-center text-5xl">
                {course.image}
              </div>

              {/* Course Content */}
              <div className="p-5">
                <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                  {course.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {course.instructor}
                </p>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium text-foreground">
                      {course.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-gradient-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {course.completedModules}/{course.totalModules} modul selesai
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{course.students}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-warning text-warning" />
                    <span>{course.rating}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Courses;

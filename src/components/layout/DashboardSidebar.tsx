import {
  BookOpen,
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  LogOut,
  ClipboardList,
  BarChart3,
  Calendar,
  PlusCircle,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import logoImage from "@/assets/logo-brocode.jpeg";

interface SidebarLink {
  name: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
  teacherOnly?: boolean;
}

const DashboardSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, isTeacher, isAdmin, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const mainLinks: SidebarLink[] = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      name: "Mata Kuliah",
      path: "/dashboard/courses",
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      name: "Ujian CBT",
      path: "/dashboard/exams",
      icon: <ClipboardList className="w-5 h-5" />,
    },
    {
      name: "Tugas",
      path: "/dashboard/assignments",
      icon: <FileText className="w-5 h-5" />,
    },
    {
      name: "Jadwal",
      path: "/dashboard/schedule",
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      name: "Nilai",
      path: "/dashboard/grades",
      icon: <BarChart3 className="w-5 h-5" />,
    },
  ];

  const teacherLinks: SidebarLink[] = [
    {
      name: "Buat Mata Kuliah",
      path: "/dashboard/courses/create",
      icon: <PlusCircle className="w-5 h-5" />,
      teacherOnly: true,
    },
    {
      name: "Buat Ujian",
      path: "/dashboard/exams/create",
      icon: <PlusCircle className="w-5 h-5" />,
      teacherOnly: true,
    },
  ];

  const secondaryLinks: SidebarLink[] = [
    {
      name: "Mahasiswa",
      path: "/dashboard/students",
      icon: <Users className="w-5 h-5" />,
      teacherOnly: true,
    },
    {
      name: "Pengaturan",
      path: "/dashboard/settings",
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  const NavLink = ({ link }: { link: SidebarLink }) => {
    const isActive = location.pathname === link.path;

    if (link.teacherOnly && !isTeacher && !isAdmin) return null;

    return (
      <Link
        to={link.path}
        className={cn(
          "flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200",
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        )}
      >
        <div className="flex items-center gap-3">
          {link.icon}
          <span className="font-medium">{link.name}</span>
        </div>
        {link.badge && (
          <span
            className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded-full",
              isActive
                ? "bg-sidebar-primary-foreground/20 text-sidebar-primary-foreground"
                : "bg-sidebar-primary/20 text-sidebar-primary"
            )}
          >
            {link.badge}
          </span>
        )}
      </Link>
    );
  };

  const getInitials = () => {
    const first = profile?.first_name?.[0] || "";
    const last = profile?.last_name?.[0] || "";
    return (first + last).toUpperCase() || "U";
  };

  return (
    <aside className="w-64 bg-sidebar h-screen fixed left-0 top-0 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-3">
          <img src={logoImage} alt="BroCodeID Logo" className="h-10 w-auto" />
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider px-4 mb-3">
          Menu Utama
        </p>
        {mainLinks.map((link) => (
          <NavLink key={link.path} link={link} />
        ))}

        {(isTeacher || isAdmin) && (
          <div className="pt-6">
            <p className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider px-4 mb-3">
              Kelola
            </p>
            {teacherLinks.map((link) => (
              <NavLink key={link.path} link={link} />
            ))}
          </div>
        )}

        <div className="pt-6">
          <p className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider px-4 mb-3">
            Lainnya
          </p>
          {secondaryLinks.map((link) => (
            <NavLink key={link.path} link={link} />
          ))}
        </div>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 rounded-full bg-sidebar-primary/20 flex items-center justify-center">
            <span className="text-sm font-semibold text-sidebar-primary">
              {getInitials()}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-sidebar-foreground">
              {profile?.first_name} {profile?.last_name}
            </p>
            <p className="text-xs text-sidebar-foreground/60">
              {isAdmin ? "Admin" : isTeacher ? "Dosen/Guru" : "Mahasiswa"}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
          >
            <LogOut className="w-4 h-4 text-sidebar-foreground/60" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default DashboardSidebar;

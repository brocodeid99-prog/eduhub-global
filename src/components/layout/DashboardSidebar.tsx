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
  Shield,
  Menu,
  X,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import logoImage from "@/assets/logo-brocode.jpeg";
import { useState, useEffect } from "react";

interface SidebarLink {
  name: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
  teacherOnly?: boolean;
  adminOnly?: boolean;
}

const DashboardSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, isTeacher, isAdmin, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (isMobile) setOpen(false);
  }, [location.pathname, isMobile]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const mainLinks: SidebarLink[] = [
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: "Mata Kuliah", path: "/dashboard/courses", icon: <BookOpen className="w-5 h-5" /> },
    { name: "Ujian CBT", path: "/dashboard/exams", icon: <ClipboardList className="w-5 h-5" /> },
    { name: "Tugas", path: "/dashboard/assignments", icon: <FileText className="w-5 h-5" /> },
    { name: "Jadwal", path: "/dashboard/schedule", icon: <Calendar className="w-5 h-5" /> },
    { name: "Nilai", path: "/dashboard/grades", icon: <BarChart3 className="w-5 h-5" /> },
  ];

  const teacherLinks: SidebarLink[] = [
    { name: "Buat Mata Kuliah", path: "/dashboard/courses/create", icon: <PlusCircle className="w-5 h-5" />, teacherOnly: true },
    { name: "Buat Ujian", path: "/dashboard/exams/create", icon: <PlusCircle className="w-5 h-5" />, teacherOnly: true },
  ];

  const adminLinks: SidebarLink[] = [
    { name: "Dashboard Admin", path: "/dashboard/admin", icon: <Shield className="w-5 h-5" />, adminOnly: true },
  ];

  const secondaryLinks: SidebarLink[] = [
    { name: "Mahasiswa", path: "/dashboard/students", icon: <Users className="w-5 h-5" />, teacherOnly: true },
    { name: "Pengaturan", path: "/dashboard/settings", icon: <Settings className="w-5 h-5" /> },
  ];

  const NavLinkItem = ({ link }: { link: SidebarLink }) => {
    const isActive = location.pathname === link.path;
    if (link.teacherOnly && !isTeacher && !isAdmin) return null;
    if (link.adminOnly && !isAdmin) return null;

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
          <span className={cn(
            "text-xs font-semibold px-2 py-0.5 rounded-full",
            isActive ? "bg-sidebar-primary-foreground/20 text-sidebar-primary-foreground" : "bg-sidebar-primary/20 text-sidebar-primary"
          )}>
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

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-3">
          <img src={logoImage} alt="BroCodeID Logo" className="h-10 w-auto" />
        </Link>
        {isMobile && (
          <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider px-4 mb-3">Menu Utama</p>
        {mainLinks.map((link) => <NavLinkItem key={link.path} link={link} />)}

        {(isTeacher || isAdmin) && (
          <div className="pt-6">
            <p className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider px-4 mb-3">Kelola</p>
            {teacherLinks.map((link) => <NavLinkItem key={link.path} link={link} />)}
          </div>
        )}

        {isAdmin && (
          <div className="pt-6">
            <p className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider px-4 mb-3">Admin</p>
            {adminLinks.map((link) => <NavLinkItem key={link.path} link={link} />)}
          </div>
        )}

        <div className="pt-6">
          <p className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider px-4 mb-3">Lainnya</p>
          {secondaryLinks.map((link) => <NavLinkItem key={link.path} link={link} />)}
        </div>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 rounded-full bg-sidebar-primary/20 flex items-center justify-center">
            <span className="text-sm font-semibold text-sidebar-primary">{getInitials()}</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-sidebar-foreground">{profile?.first_name} {profile?.last_name}</p>
            <p className="text-xs text-sidebar-foreground/60">{isAdmin ? "Admin" : isTeacher ? "Dosen/Guru" : "Mahasiswa"}</p>
          </div>
          <button onClick={handleSignOut} className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors">
            <LogOut className="w-4 h-4 text-sidebar-foreground/60" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      {isMobile && !open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border shadow-md"
        >
          <Menu className="w-5 h-5 text-foreground" />
        </button>
      )}

      {/* Overlay */}
      {isMobile && open && (
        <div className="fixed inset-0 z-40 bg-foreground/50" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "bg-sidebar h-screen fixed left-0 top-0 flex flex-col z-50 transition-transform duration-300",
          isMobile ? "w-72" : "w-64",
          isMobile && !open && "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default DashboardSidebar;

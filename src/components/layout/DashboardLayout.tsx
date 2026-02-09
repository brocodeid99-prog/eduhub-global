import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className={cn("p-4 sm:p-6 lg:p-8", isMobile ? "ml-0 pt-16" : "ml-64")}>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;

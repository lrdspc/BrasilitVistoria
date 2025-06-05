import { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showSidebar?: boolean;
  showBottomNav?: boolean;
  className?: string;
}

export function AppLayout({ 
  children, 
  title,
  showSidebar = true,
  showBottomNav = true,
  className 
}: AppLayoutProps) {
  const { user } = useAuthStore();

  // Get pending inspections count for bottom nav badge
  const { data: inspections = [] } = useQuery({
    queryKey: ["/api/inspections", { userId: user?.id, status: "pending" }],
    enabled: !!user,
  });

  const pendingCount = inspections.length;

  return (
    <div className="min-h-screen bg-background-primary">
      {/* Desktop Layout */}
      <div className="hidden lg:flex h-screen">
        {/* Sidebar */}
        {showSidebar && (
          <Sidebar className="w-64 flex-shrink-0" />
        )}
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            title={title}
            className="flex-shrink-0"
          />
          
          <main className={cn(
            'flex-1 overflow-auto p-6',
            className
          )}>
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden min-h-screen flex flex-col">
        <Header 
          title={title}
          className="flex-shrink-0"
        />
        
        <main className={cn(
          'flex-1 overflow-auto p-4 pb-20', // pb-20 for bottom nav space
          className
        )}>
          {children}
        </main>
        
        {showBottomNav && (
          <BottomNav pendingCount={pendingCount} />
        )}
      </div>
    </div>
  );
}

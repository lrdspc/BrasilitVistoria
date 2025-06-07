import { useState } from 'react';
import { useLocation } from 'wouter';
import { Menu, X, Bell, RefreshCw, User, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { useAuthStore } from '@/stores/authStore';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  className?: string;
}

export function Header({ 
  title = 'VIGITEL', 
  showBackButton = false, 
  onBackClick,
  className 
}: HeaderProps) {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuthStore();
  const { forceSync, isSyncing, pendingCount } = useOfflineSync();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  const handleSync = () => {
    forceSync();
  };

  return (
    <header className={cn(
      'bg-white border-b border-border-primary px-4 py-3',
      'flex items-center justify-between',
      'lg:px-6 lg:py-4',
      className
    )}>
      {/* Left side */}
      <div className="flex items-center space-x-4">
        {/* Mobile menu button */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="lg:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex h-full flex-col">
              {/* Mobile menu header */}
              <div className="flex h-16 items-center justify-between px-6 border-b">
                <h2 className="text-lg font-semibold">Menu</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Mobile menu content */}
              <nav className="flex-1 px-4 py-6 space-y-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setLocation('/dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full justify-start"
                >
                  Dashboard
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setLocation('/inspection/client');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full justify-start"
                >
                  Nova Vistoria
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setLocation('/configuracoes');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full justify-start"
                >
                  Configurações
                </Button>
              </nav>
              
              {/* Mobile menu footer */}
              <div className="border-t p-4">
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start text-danger"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Title */}
        <div>
          <h1 className="text-xl font-semibold text-text-primary lg:text-2xl">
            {title}
          </h1>
          {user && (
            <p className="text-sm text-text-secondary hidden lg:block">
              {/* Supabase user object structure: user.email, user.user_metadata for custom fields */}
              {/* Example: {user.user_metadata?.department} - {user.user_metadata?.unit} */}
              {user.email} {/* Display email as an example */}
            </p>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-3">
        {/* Connection Status */}
        <ConnectionStatus />

        {/* Sync Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSync}
          disabled={isSyncing}
          className="relative"
        >
          <RefreshCw className={cn(
            'w-5 h-5',
            isSyncing && 'animate-spin'
          )} />
          {pendingCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs"
            >
              {pendingCount > 9 ? '9+' : pendingCount}
            </Badge>
          )}
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          {/* Notification badge placeholder */}
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="relative">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {/* Supabase user: user.email?.charAt(0).toUpperCase() or user.user_metadata.name?.charAt(0) */}
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              {/* Supabase user: user.user_metadata.name or user.email */}
              <p className="text-sm font-medium">{user?.user_metadata?.name || user?.email || 'Usuário'}</p>
              <p className="text-xs text-text-secondary">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setLocation('/perfil')}>
              <User className="w-4 h-4 mr-2" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocation('/configuracoes')}>
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-danger">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

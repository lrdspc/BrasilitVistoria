import { useLocation } from 'wouter';
import { Home, FileText, Plus, Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  className?: string;
  pendingCount?: number;
}

export function BottomNav({ className, pendingCount = 0 }: BottomNavProps) {
  const [location, setLocation] = useLocation();

  const navigation = [
    {
      name: 'Home',
      href: '/dashboard',
      icon: Home,
      current: location === '/dashboard',
    },
    {
      name: 'Vistorias',
      href: '/vistorias',
      icon: FileText,
      current: location.startsWith('/vistorias'),
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      name: 'Nova',
      href: '/inspection/client',
      icon: Plus,
      current: location.startsWith('/inspection'),
      primary: true,
    },
    {
      name: 'Config',
      href: '/configuracoes',
      icon: Settings,
      current: location === '/configuracoes',
    },
    {
      name: 'Perfil',
      href: '/perfil',
      icon: User,
      current: location === '/perfil',
    },
  ];

  return (
    <nav className={cn(
      'fixed bottom-0 left-0 right-0 bg-white border-t border-border-primary',
      'flex items-center justify-around px-2 py-2 safe-area-pb',
      'lg:hidden', // Hide on desktop
      className
    )}>
      {navigation.map((item) => (
        <Button
          key={item.name}
          variant="ghost"
          size="sm"
          onClick={() => setLocation(item.href)}
          className={cn(
            'flex flex-col items-center space-y-1 h-auto py-2 px-3 relative',
            'min-w-0 flex-1',
            item.current && 'text-primary',
            item.primary && 'bg-primary text-white hover:bg-primaryHover hover:text-white'
          )}
        >
          <item.icon className={cn(
            'w-5 h-5',
            item.primary && 'text-white'
          )} />
          <span className={cn(
            'text-xs font-medium truncate',
            item.primary && 'text-white'
          )}>
            {item.name}
          </span>
          
          {item.badge && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {item.badge > 99 ? '99+' : item.badge}
            </Badge>
          )}
        </Button>
      ))}
    </nav>
  );
}

import { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  Home, 
  FileText, 
  Settings, 
  LogOut, 
  ChevronDown,
  Plus,
  Clock,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [, setLocation] = useLocation();
  const [location] = useLocation();
  const { user, logout } = useAuthStore();
  const [vistoriasOpen, setVistoriasOpen] = useState(false);

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      current: location === '/dashboard',
    },
    {
      name: 'Vistorias',
      icon: FileText,
      current: location.startsWith('/inspection') || location.startsWith('/vistorias'),
      children: [
        {
          name: 'Nova Vistoria',
          href: '/inspection/client',
          icon: Plus,
          current: location.startsWith('/inspection'),
        },
        {
          name: 'Pendentes',
          href: '/vistorias?status=pending',
          icon: Clock,
          current: false,
        },
        {
          name: 'Concluídas',
          href: '/vistorias?status=completed',
          icon: CheckCircle,
          current: false,
        },
      ],
    },
    {
      name: 'Configurações',
      href: '/configuracoes',
      icon: Settings,
      current: location === '/configuracoes',
    },
  ];

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  return (
    <div className={cn(
      'flex h-full w-64 flex-col bg-secondary-secondary border-r border-border-primary',
      className
    )}>
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-border-primary">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Home className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary">VIGITEL</h1>
            <p className="text-xs text-text-secondary">Brasilit</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => (
          <div key={item.name}>
            {item.children ? (
              <Collapsible open={vistoriasOpen} onOpenChange={setVistoriasOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      'w-full justify-between text-left font-normal',
                      item.current && 'bg-primary/10 text-primary'
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </div>
                    <ChevronDown className={cn(
                      'w-4 h-4 transition-transform',
                      vistoriasOpen && 'rotate-180'
                    )} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 mt-1">
                  {item.children.map((child) => (
                    <Button
                      key={child.name}
                      variant="ghost"
                      onClick={() => setLocation(child.href)}
                      className={cn(
                        'w-full justify-start text-left font-normal pl-12',
                        child.current && 'bg-primary/10 text-primary'
                      )}
                    >
                      <child.icon className="w-4 h-4 mr-3" />
                      {child.name}
                    </Button>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <Button
                variant="ghost"
                onClick={() => setLocation(item.href)}
                className={cn(
                  'w-full justify-start text-left font-normal',
                  item.current && 'bg-primary/10 text-primary'
                )}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </Button>
            )}
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className="border-t border-border-primary p-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user?.name?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {user?.name || 'Usuário'}
            </p>
            <p className="text-xs text-text-secondary truncate">
              {user?.department || 'Assistência Técnica'}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-left font-normal text-danger hover:bg-danger/10"
        >
          <LogOut className="w-4 h-4 mr-3" />
          Sair
        </Button>
      </div>
    </div>
  );
}

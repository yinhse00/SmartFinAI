import React from 'react';
import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, MessageSquare, FileText, User, Settings, HelpCircle, CreditCard } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarLayoutProps {
  children: ReactNode;
}

const navigationItems = [
  { title: 'Chat', url: '/chat', icon: MessageSquare },
  { title: 'IPO Prospectus', url: '/ipo-prospectus', icon: FileText },
];

const userMenuItems = [
  { title: 'Profile', url: '/profile', icon: User },
  { title: 'Settings', url: '/settings', icon: Settings },
  { title: 'Billing', url: '/billing', icon: CreditCard },
  { title: 'Support', url: '/support', icon: HelpCircle },
];

function AppSidebar() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const sidebar = useSidebar();
  
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const getUserInitials = (email: string) => {
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  return (
    <Sidebar className={sidebar.open ? "w-56" : "w-14"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <div className={`px-4 py-6 ${!sidebar.open ? 'px-2' : ''}`}>
              <div className={`font-bold text-lg text-primary ${!sidebar.open ? 'text-center text-sm' : ''}`}>
                {!sidebar.open ? 'SF' : 'SmartFinAI'}
              </div>
            </div>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton asChild>
                          <Link 
                            to={item.url} 
                            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                              isActive(item.url) 
                                ? 'bg-primary text-primary-foreground' 
                                : 'hover:bg-accent hover:text-accent-foreground'
                            }`}
                          >
                            <item.icon className="h-5 w-5" />
                            {sidebar.open && <span>{item.title}</span>}
                          </Link>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      {!sidebar.open && (
                        <TooltipContent side="right">
                          {item.title}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className={`w-full justify-start gap-3 ${!sidebar.open ? 'px-2' : 'px-3'}`}>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-sm">
                    {getUserInitials(user.email || '')}
                  </AvatarFallback>
                </Avatar>
                {sidebar.open && (
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-medium truncate max-w-[120px]">
                      {user.email?.split('@')[0]}
                    </span>
                    <span className="text-xs text-muted-foreground">Account</span>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" className="w-56">
              {userMenuItems.map((item) => (
                <DropdownMenuItem key={item.title} asChild>
                  <Link to={item.url} className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem onClick={signOut} className="text-destructive">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

const SidebarLayout = ({ children }: SidebarLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default SidebarLayout;
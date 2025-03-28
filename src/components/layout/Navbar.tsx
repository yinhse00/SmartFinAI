
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  History,
  Database,
  Settings,
  Menu,
  X,
  LogOut,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NavItem = ({ 
  to, 
  icon: Icon, 
  label, 
  active = false,
  onClick
}: { 
  to: string; 
  icon: React.ElementType; 
  label: string; 
  active?: boolean;
  onClick?: () => void;
}) => (
  <Link 
    to={to} 
    className={cn(
      'flex items-center gap-2 p-2 rounded-md transition-colors',
      active 
        ? 'bg-finance-medium-blue text-white' 
        : 'text-gray-700 dark:text-gray-300 hover:bg-finance-highlight dark:hover:bg-finance-medium-blue/50 hover:text-finance-dark-blue dark:hover:text-white'
    )}
    onClick={onClick}
  >
    <Icon size={20} />
    <span>{label}</span>
  </Link>
);

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentPath = window.location.pathname;

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="bg-white dark:bg-finance-dark-blue shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-finance-dark-blue dark:text-white">
              FinanceGrok
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <NavItem to="/" icon={LayoutDashboard} label="Dashboard" active={currentPath === '/'} />
            <NavItem to="/chat" icon={MessageSquare} label="Chat" active={currentPath === '/chat'} />
            <NavItem to="/references" icon={FileText} label="References" active={currentPath === '/references'} />
            <NavItem to="/history" icon={History} label="History" active={currentPath === '/history'} />
            <NavItem to="/database" icon={Database} label="Database" active={currentPath === '/database'} />
          </div>

          {/* User Menu */}
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="text-finance-dark-blue dark:text-white mr-2">
              <User size={20} />
            </Button>
            <Button variant="ghost" size="icon" className="text-finance-dark-blue dark:text-white">
              <Settings size={20} />
            </Button>
            
            {/* Mobile Menu Button */}
            <div className="md:hidden ml-2">
              <Button variant="ghost" size="icon" onClick={toggleMobileMenu} className="text-finance-dark-blue dark:text-white">
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-finance-dark-blue border-t border-gray-200 dark:border-finance-medium-blue">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <NavItem to="/" icon={LayoutDashboard} label="Dashboard" active={currentPath === '/'} onClick={toggleMobileMenu} />
            <NavItem to="/chat" icon={MessageSquare} label="Chat" active={currentPath === '/chat'} onClick={toggleMobileMenu} />
            <NavItem to="/references" icon={FileText} label="References" active={currentPath === '/references'} onClick={toggleMobileMenu} />
            <NavItem to="/history" icon={History} label="History" active={currentPath === '/history'} onClick={toggleMobileMenu} />
            <NavItem to="/database" icon={Database} label="Database" active={currentPath === '/database'} onClick={toggleMobileMenu} />
            <div className="pt-2 border-t border-gray-200 dark:border-finance-medium-blue">
              <NavItem to="/logout" icon={LogOut} label="Logout" onClick={toggleMobileMenu} />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

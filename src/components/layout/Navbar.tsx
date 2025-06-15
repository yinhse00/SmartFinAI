
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/components/auth/AuthProvider';
import { UserNav } from '@/components/auth/UserNav';
import { Skeleton } from '@/components/ui/skeleton';
import { LayoutDashboard } from 'lucide-react';

const Navbar = () => {
  const { user, loading } = useAuth();

  return (
    <nav className="bg-white dark:bg-finance-dark-blue border-b border-gray-200 dark:border-finance-medium-blue">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-finance-dark-blue dark:text-white">
          SmartFinAI
        </Link>
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center text-gray-600 dark:text-gray-400 hover:text-finance-light-blue dark:hover:text-finance-accent-blue">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </Link>
          <Link to="/chat" className="text-gray-600 dark:text-gray-400 hover:text-finance-light-blue dark:hover:text-finance-accent-blue">
            Chat
          </Link>
          <Link to="/deal-structuring" className="text-gray-600 dark:text-gray-400 hover:text-finance-light-blue dark:hover:text-finance-accent-blue">
            Deal Structuring
          </Link>
          {loading ? (
            <Skeleton className="h-9 w-9 rounded-full" />
          ) : user ? (
            <UserNav />
          ) : (
            <Button asChild variant="outline">
              <Link to="/auth">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

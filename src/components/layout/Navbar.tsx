
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/components/auth/AuthProvider';
import { UserNav } from '@/components/auth/UserNav';
import { Skeleton } from '@/components/ui/skeleton';
import { LayoutDashboard, Lock } from 'lucide-react';

const Navbar = () => {
  const { user, loading } = useAuth();

  return (
    <nav className="bg-white dark:bg-finance-dark-blue border-b border-gray-200 dark:border-finance-medium-blue">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <span className="text-xl font-bold text-finance-dark-blue dark:text-white">
          SmartFinAI
        </span>
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center text-gray-600 dark:text-gray-400 hover:text-finance-light-blue dark:hover:text-finance-accent-blue">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </Link>
          {user ? (
            <>
              <Link to="/chat" className="text-gray-600 dark:text-gray-400 hover:text-finance-light-blue dark:hover:text-finance-accent-blue">
                Chat
              </Link>
              <Link to="/deal-structuring" className="text-gray-600 dark:text-gray-400 hover:text-finance-light-blue dark:hover:text-finance-accent-blue">
                Deal Structuring
              </Link>
              <Link to="/presentations" className="text-gray-600 dark:text-gray-400 hover:text-finance-light-blue dark:hover:text-finance-accent-blue">
                Presentations
              </Link>
              <Link to="/execution" className="text-gray-600 dark:text-gray-400 hover:text-finance-light-blue dark:hover:text-finance-accent-blue">
                Execution
              </Link>
              <Link to="/ipo-prospectus" className="text-gray-600 dark:text-gray-400 hover:text-finance-light-blue dark:hover:text-finance-accent-blue">
                IPO Prospectus
              </Link>
            </>
          ) : (
            <>
              <Link to="/auth" className="flex items-center text-gray-500 dark:text-gray-500 hover:text-finance-light-blue dark:hover:text-finance-accent-blue">
                <Lock className="mr-1 h-3 w-3" />
                <span>Chat</span>
              </Link>
              <Link to="/auth" className="flex items-center text-gray-500 dark:text-gray-500 hover:text-finance-light-blue dark:hover:text-finance-accent-blue">
                <Lock className="mr-1 h-3 w-3" />
                <span>Deal Structuring</span>
              </Link>
              <Link to="/auth" className="flex items-center text-gray-500 dark:text-gray-500 hover:text-finance-light-blue dark:hover:text-finance-accent-blue">
                <Lock className="mr-1 h-3 w-3" />
                <span>Presentations</span>
              </Link>
              <Link to="/auth" className="flex items-center text-gray-500 dark:text-gray-500 hover:text-finance-light-blue dark:hover:text-finance-accent-blue">
                <Lock className="mr-1 h-3 w-3" />
                <span>Execution</span>
              </Link>
              <Link to="/auth" className="flex items-center text-gray-500 dark:text-gray-500 hover:text-finance-light-blue dark:hover:text-finance-accent-blue">
                <Lock className="mr-1 h-3 w-3" />
                <span>IPO Prospectus</span>
              </Link>
            </>
          )}
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

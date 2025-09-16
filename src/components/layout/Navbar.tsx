import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/components/auth/AuthProvider';
import { UserNav } from '@/components/auth/UserNav';
import { Skeleton } from '@/components/ui/skeleton';
import { LayoutDashboard, Lock } from 'lucide-react';
const Navbar = () => {
  const {
    user,
    loading
  } = useAuth();
  return <nav className="bg-white dark:bg-finance-dark-blue border-b border-gray-200 dark:border-finance-medium-blue">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <span className="text-xl font-bold text-finance-dark-blue dark:text-white">
          SmartFinAI
        </span>
        
      </div>
    </nav>;
};
export default Navbar;
import { Link } from 'react-router-dom';
import { useTheme } from "@/components/theme-provider";
import { Moon, Sun } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useEffect, useState } from 'react';

const Navbar = () => {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    if (mounted) {
      const newTheme = document.documentElement.classList.contains("dark") ? "light" : "dark";
      setTheme(newTheme);
    }
  };

  return (
    <nav className="bg-white dark:bg-finance-dark-blue border-b border-gray-200 dark:border-finance-medium-blue">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-finance-dark-blue dark:text-white">
          SmartFinAI
        </Link>
        <div className="flex items-center space-x-4">
          <Link to="/dashboard" className="text-gray-600 dark:text-gray-400 hover:text-finance-light-blue dark:hover:text-finance-accent-blue">
            Dashboard
          </Link>
          <Link to="/chat" className="text-gray-600 dark:text-gray-400 hover:text-finance-light-blue dark:hover:text-finance-accent-blue">
            Chat
          </Link>
          <Link to="/references" className="text-gray-600 dark:text-gray-400 hover:text-finance-light-blue dark:hover:text-finance-accent-blue">
            References
          </Link>
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

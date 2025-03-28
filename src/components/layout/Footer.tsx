
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-finance-dark-blue border-t border-gray-200 dark:border-finance-medium-blue mt-auto py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              &copy; {new Date().getFullYear()} FinanceGrok. All rights reserved.
            </p>
          </div>
          <div className="flex space-x-6">
            <Link to="/terms" className="text-sm text-gray-600 dark:text-gray-400 hover:text-finance-light-blue dark:hover:text-finance-accent-blue">
              Terms of Service
            </Link>
            <Link to="/privacy" className="text-sm text-gray-600 dark:text-gray-400 hover:text-finance-light-blue dark:hover:text-finance-accent-blue">
              Privacy Policy
            </Link>
            <Link to="/help" className="text-sm text-gray-600 dark:text-gray-400 hover:text-finance-light-blue dark:hover:text-finance-accent-blue">
              Help Center
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

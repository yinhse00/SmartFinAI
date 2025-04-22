
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <h1 className="text-4xl font-bold text-finance-dark-blue dark:text-white mb-4">
          SmartFinAI
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-xl">
          Your intelligent assistant for Hong Kong regulatory compliance in listings and takeovers
        </p>
        
        <Button asChild size="lg" className="bg-finance-medium-blue hover:bg-finance-dark-blue">
          <Link to="/chat" className="flex items-center">
            <MessageSquare className="mr-2 h-5 w-5" />
            Start Regulatory Query
          </Link>
        </Button>
      </div>
    </MainLayout>
  );
};

export default Index;

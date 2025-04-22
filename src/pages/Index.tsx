
import MainLayout from '@/components/layout/MainLayout';
import StatCard from '@/components/dashboard/StatCard';
import QuickActions from '@/components/dashboard/QuickActions';
import RecentQueries from '@/components/dashboard/RecentQueries';
import TranslationWidget from '@/components/dashboard/TranslationWidget';
import { Button } from '@/components/ui/button';
import { MessageSquare, Database, FileText, BarChart, BookOpen, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-finance-dark-blue dark:text-white mb-2">Welcome to FinanceGrok</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Your intelligent assistant for Hong Kong regulatory compliance in listings and takeovers
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Queries" 
          value="156" 
          icon={<MessageSquare size={20} />} 
          description="This month" 
          trend="up" 
          trendValue="12% from last month"
        />
        <StatCard 
          title="References" 
          value="342" 
          icon={<FileText size={20} />} 
          description="Regulatory documents" 
          trend="up" 
          trendValue="24 new this month"
        />
        <StatCard 
          title="Database Entries" 
          value="1,256" 
          icon={<Database size={20} />} 
          description="Indexed items" 
        />
        <StatCard 
          title="Accuracy Rate" 
          value="94.8%" 
          icon={<BarChart size={20} />} 
          description="Based on feedback" 
          trend="up" 
          trendValue="2.3% improvement"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <RecentQueries />
        </div>
        <div className="space-y-6">
          <QuickActions />
          <TranslationWidget />
        </div>
      </div>

      <div className="mb-4 text-center">
        <Button asChild variant="default" className="bg-finance-medium-blue hover:bg-finance-dark-blue">
          <Link to="/chat">
            Begin Regulatory Query
          </Link>
        </Button>
      </div>
    </MainLayout>
  );
};

export default Index;

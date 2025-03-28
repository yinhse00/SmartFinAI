
import MainLayout from '@/components/layout/MainLayout';
import StatCard from '@/components/dashboard/StatCard';
import QuickActions from '@/components/dashboard/QuickActions';
import RecentQueries from '@/components/dashboard/RecentQueries';
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
        <div>
          <QuickActions />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="finance-card p-6 rounded-lg finance-gradient text-white">
          <h3 className="text-xl font-semibold mb-3">New to FinanceGrok?</h3>
          <p className="mb-4">Learn how our AI-powered system can help streamline your regulatory compliance workflow.</p>
          <Button variant="secondary" asChild>
            <Link to="/tutorial">
              Start Tutorial <ArrowRight size={16} className="ml-2" />
            </Link>
          </Button>
        </div>
        <div className="finance-card p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-3">Regulatory Updates</h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="mt-0.5">
                <BookOpen size={16} className="text-finance-medium-blue dark:text-finance-accent-blue" />
              </div>
              <div>
                <h4 className="text-sm font-medium">SFC Updates Takeovers Code Exemptions</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">New guidance effective from June 1, 2023</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="mt-0.5">
                <BookOpen size={16} className="text-finance-medium-blue dark:text-finance-accent-blue" />
              </div>
              <div>
                <h4 className="text-sm font-medium">HKEx Revises Connected Transaction Rules</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">Updated Chapter 14A with new thresholds</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="mt-0.5">
                <BookOpen size={16} className="text-finance-medium-blue dark:text-finance-accent-blue" />
              </div>
              <div>
                <h4 className="text-sm font-medium">New ESG Disclosure Requirements</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">Enhanced reporting standards from Q4 2023</p>
              </div>
            </div>
          </div>
          <div className="mt-4 text-right">
            <Button variant="link" className="text-finance-medium-blue dark:text-finance-accent-blue p-0">
              View all updates <ArrowRight size={14} className="ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;

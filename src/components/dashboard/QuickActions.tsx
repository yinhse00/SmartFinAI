
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquareText, Upload, History, Database, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const QuickAction = ({ 
  icon: Icon, 
  title, 
  description, 
  to 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string; 
  to: string;
}) => (
  <Link to={to} className="block">
    <div className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-finance-medium-blue/20 transition-colors">
      <div className="p-2 rounded-full bg-finance-highlight dark:bg-finance-medium-blue/30">
        <Icon size={18} className="text-finance-medium-blue dark:text-finance-accent-blue" />
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-medium text-finance-dark-blue dark:text-white">{title}</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <div className="text-gray-400">
        <ChevronRight size={16} />
      </div>
    </div>
  </Link>
);

const QuickActions = () => {
  return (
    <Card className="finance-card">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <QuickAction
          icon={MessageSquareText}
          title="New Regulatory Query"
          description="Ask a question about HK listing rules or takeovers"
          to="/chat"
        />
        <QuickAction
          icon={Upload}
          title="Upload References"
          description="Add documents to improve the system's knowledge"
          to="/references"
        />
        <QuickAction
          icon={History}
          title="View Recent Activity"
          description="Check recent queries and responses"
          to="/chat"
        />
        <QuickAction
          icon={Database}
          title="Manage Database"
          description="View and edit stored references"
          to="/references"
        />
        <div className="pt-2">
          <Button variant="outline" className="w-full text-finance-medium-blue dark:text-finance-accent-blue">
            View All Actions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;

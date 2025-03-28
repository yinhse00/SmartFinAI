
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// Mock data for recent queries
const recentQueries = [
  {
    id: '1',
    query: 'What are the disclosure requirements for related party transactions?',
    timestamp: '2 hours ago',
    category: 'Listing Rules',
  },
  {
    id: '2',
    query: 'How to handle a mandatory general offer triggered by share repurchase?',
    timestamp: '1 day ago',
    category: 'Takeovers',
  },
  {
    id: '3',
    query: 'Requirements for profit forecast in IPO prospectus',
    timestamp: '2 days ago',
    category: 'Listing Rules',
  },
  {
    id: '4',
    query: 'Procedures for whitewash waiver application',
    timestamp: '3 days ago',
    category: 'Takeovers',
  },
];

const RecentQueries = () => {
  return (
    <Card className="finance-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">Recent Queries</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <div className="space-y-0">
          {recentQueries.map((query, index) => (
            <div key={query.id}>
              <Link to={`/history/${query.id}`} className="block px-6 py-3 hover:bg-gray-50 dark:hover:bg-finance-medium-blue/20 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs font-normal bg-finance-highlight dark:bg-finance-medium-blue/30 text-finance-medium-blue dark:text-finance-accent-blue">
                        {query.category}
                      </Badge>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{query.timestamp}</span>
                    </div>
                    <p className="text-sm text-finance-dark-blue dark:text-white line-clamp-2">{query.query}</p>
                  </div>
                  <div className="text-gray-400 pt-1">
                    <ChevronRight size={16} />
                  </div>
                </div>
              </Link>
              {index < recentQueries.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentQueries;

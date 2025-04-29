
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Database, FileText, BookOpen, HelpCircle } from 'lucide-react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

const RegulatoryDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['regulatoryStats'],
    queryFn: async () => {
      try {
        // Get counts from various tables
        const [categoriesResult, provisionsResult, definitionsResult, faqsResult] = await Promise.all([
          supabase.from('regulatory_categories').select('*', { count: 'exact', head: true }),
          supabase.from('regulatory_provisions').select('*', { count: 'exact', head: true }),
          supabase.from('regulatory_definitions').select('*', { count: 'exact', head: true }),
          supabase.from('regulatory_faqs').select('*', { count: 'exact', head: true }),
        ]);

        // Get recent entries
        const recentProvisions = await supabase
          .from('regulatory_provisions')
          .select('id, rule_number, title, created_at')
          .order('created_at', { ascending: false })
          .limit(5);

        return {
          categories: categoriesResult.count || 0,
          provisions: provisionsResult.count || 0,
          definitions: definitionsResult.count || 0,
          faqs: faqsResult.count || 0,
          recentProvisions: recentProvisions.data || []
        };
      } catch (error) {
        console.error('Error fetching database stats:', error);
        return {
          categories: 0,
          provisions: 0,
          definitions: 0,
          faqs: 0,
          recentProvisions: []
        };
      }
    }
  });

  if (isLoading) {
    return (
      <div className="w-full flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-finance-medium-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Database className="h-5 w-5 text-finance-medium-blue mr-2" />
              <span className="text-2xl font-bold">{stats?.categories || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Provisions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-finance-light-blue mr-2" />
              <span className="text-2xl font-bold">{stats?.provisions || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Definitions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <BookOpen className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-2xl font-bold">{stats?.definitions || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">FAQs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <HelpCircle className="h-5 w-5 text-amber-500 mr-2" />
              <span className="text-2xl font-bold">{stats?.faqs || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Provisions</CardTitle>
          <CardDescription>
            Recently added regulatory provisions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.recentProvisions && stats.recentProvisions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule Number</TableHead>
                  <TableHead className="hidden sm:table-cell">Title</TableHead>
                  <TableHead>Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentProvisions.map((provision) => (
                  <TableRow key={provision.id}>
                    <TableCell className="font-medium">{provision.rule_number}</TableCell>
                    <TableCell className="hidden sm:table-cell">{provision.title}</TableCell>
                    <TableCell>
                      {new Date(provision.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No regulatory provisions have been added yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RegulatoryDashboard;

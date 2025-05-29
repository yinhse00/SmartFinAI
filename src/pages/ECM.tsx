
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useEcmDeals, useEcmIssuers, useEcmInvestors, useCreateDeal } from '@/hooks/useEcmData';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  Users, 
  Building, 
  FileText, 
  BarChart3, 
  Plus,
  Search,
  Filter,
  DollarSign
} from 'lucide-react';
import { EcmDeal } from '@/types/ecm';

const ECMPlatform: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Data hooks
  const { data: deals = [], isLoading: dealsLoading } = useEcmDeals();
  const { data: issuers = [], isLoading: issuersLoading } = useEcmIssuers();
  const { data: investors = [], isLoading: investorsLoading } = useEcmInvestors();
  const createDealMutation = useCreateDeal();

  // Dashboard metrics
  const totalDeals = deals.length;
  const activeDeals = deals.filter(d => d.deal_status !== 'completed' && d.deal_status !== 'cancelled').length;
  const totalFundsRaised = deals
    .filter(d => d.deal_status === 'completed' && d.final_amount)
    .reduce((sum, d) => sum + (d.final_amount || 0), 0);
  const avgDealSize = totalFundsRaised / Math.max(deals.filter(d => d.deal_status === 'completed').length, 1);

  // Filter deals
  const filteredDeals = deals.filter(deal => {
    const matchesSearch = deal.deal_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || deal.deal_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateDeal = async (dealData: Partial<EcmDeal>) => {
    try {
      await createDealMutation.mutateAsync(dealData);
      toast({
        title: "Deal Created",
        description: "New deal has been successfully created.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create deal. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'execution': return 'bg-blue-100 text-blue-800';
      case 'marketing': return 'bg-purple-100 text-purple-800';
      case 'preparation': return 'bg-yellow-100 text-yellow-800';
      case 'pipeline': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (dealsLoading || issuersLoading || investorsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading ECM Platform...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ECM Platform</h1>
          <p className="text-gray-600">Equity Capital Markets for Hong Kong Secondary Fundraising</p>
        </div>
        <Button 
          onClick={() => setActiveTab('deals')}
          className="bg-finance-medium-blue hover:bg-finance-dark-blue"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Deal
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="deals">Deal Pipeline</TabsTrigger>
          <TabsTrigger value="investors">Investors</TabsTrigger>
          <TabsTrigger value="issuers">Issuers</TabsTrigger>
          <TabsTrigger value="market">Market Intelligence</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalDeals}</div>
                <p className="text-xs text-muted-foreground">
                  {activeDeals} active deals
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Funds Raised</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  HKD {(totalFundsRaised / 1000000).toFixed(1)}M
                </div>
                <p className="text-xs text-muted-foreground">
                  Total completed deals
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  HKD {(avgDealSize / 1000000).toFixed(1)}M
                </div>
                <p className="text-xs text-muted-foreground">
                  Per completed deal
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Investors</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{investors.length}</div>
                <p className="text-xs text-muted-foreground">
                  Registered investors
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Deals */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Deal Activity</CardTitle>
              <CardDescription>Latest updates from your deal pipeline</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deals.slice(0, 5).map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold">{deal.deal_name}</h4>
                      <p className="text-sm text-gray-600">
                        {deal.deal_type} • {deal.currency} {deal.target_amount?.toLocaleString()}
                      </p>
                    </div>
                    <Badge className={getStatusColor(deal.deal_status)}>
                      {deal.deal_status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deal Pipeline Tab */}
        <TabsContent value="deals">
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search deals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pipeline">Pipeline</SelectItem>
                  <SelectItem value="preparation">Preparation</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="execution">Execution</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Deals Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredDeals.map((deal) => (
                <Card key={deal.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{deal.deal_name}</CardTitle>
                        <CardDescription>
                          {deal.deal_type.replace('_', ' ').toUpperCase()}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(deal.deal_status)}>
                        {deal.deal_status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Target Amount:</span>
                        <span className="font-semibold">
                          {deal.currency} {deal.target_amount?.toLocaleString()}
                        </span>
                      </div>
                      {deal.launch_date && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Launch Date:</span>
                          <span>{new Date(deal.launch_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      {deal.book_runner && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Book Runner:</span>
                          <span>{deal.book_runner}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" className="flex-1">
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        <Users className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredDeals.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No deals found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filters' 
                      : 'Get started by creating your first deal'}
                  </p>
                  <Button 
                    onClick={() => handleCreateDeal({
                      deal_name: 'New Deal',
                      deal_type: 'private_placement',
                      deal_status: 'pipeline',
                      currency: 'HKD'
                    })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Deal
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Investors Tab */}
        <TabsContent value="investors">
          <Card>
            <CardHeader>
              <CardTitle>Investor Database</CardTitle>
              <CardDescription>
                Manage your investor relationships and track investment preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {investors.slice(0, 10).map((investor) => (
                  <div key={investor.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold">{investor.investor_name}</h4>
                      <p className="text-sm text-gray-600">
                        {investor.investor_type} • {investor.aum_range}
                      </p>
                      {investor.sector_preferences && investor.sector_preferences.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {investor.sector_preferences.slice(0, 3).map((sector, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {sector}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={investor.kyc_status === 'approved' ? 'default' : 'secondary'}>
                        {investor.kyc_status}
                      </Badge>
                      {investor.esg_focused && (
                        <Badge variant="outline" className="text-green-600">
                          ESG Focused
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Issuers Tab */}
        <TabsContent value="issuers">
          <Card>
            <CardHeader>
              <CardTitle>Issuer Database</CardTitle>
              <CardDescription>
                Track listed companies and their fundraising activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {issuers.slice(0, 10).map((issuer) => (
                  <div key={issuer.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold">
                        {issuer.company_name}
                        {issuer.stock_code && (
                          <span className="ml-2 text-gray-500">({issuer.stock_code})</span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {issuer.sector} • Market Cap: HKD {issuer.market_cap?.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="outline">
                        Risk Score: {issuer.compliance_risk_score}/10
                      </Badge>
                      {issuer.esg_rating && (
                        <Badge variant="outline" className="text-green-600">
                          ESG: {issuer.esg_rating}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Market Intelligence Tab */}
        <TabsContent value="market">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Market Conditions</CardTitle>
                <CardDescription>Real-time Hong Kong market analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Market Sentiment</span>
                    <Badge className="bg-green-100 text-green-800">Positive</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>ECM Activity</span>
                    <span className="font-semibold">Moderate</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Stock Connect Flow</span>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ECM Pipeline</CardTitle>
                <CardDescription>Upcoming market activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Market intelligence dashboard coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ECMPlatform;

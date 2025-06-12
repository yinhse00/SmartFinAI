
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Star, Clock, DollarSign, AlertTriangle, CheckCircle, Target } from 'lucide-react';
import { TransactionData } from '@/pages/DealStructuring';

interface StructureRecommendationsProps {
  transactionData: TransactionData;
  onBack: () => void;
}

interface StructureOption {
  id: string;
  name: string;
  type: 'capital_raising' | 'ma_transaction';
  description: string;
  pros: string[];
  cons: string[];
  timeline: number; // weeks
  cost: number; // as percentage of transaction amount
  regulatoryComplexity: 'low' | 'medium' | 'high';
  shareholderApproval: boolean;
  recommendationScore: number; // 0-100
  suitability: string;
  executionSteps: string[];
}

export const StructureRecommendations = ({ transactionData, onBack }: StructureRecommendationsProps) => {
  
  const generateRecommendations = (): StructureOption[] => {
    const dilution = (transactionData.amount / transactionData.marketCap) * 100;
    const isLarge = dilution > 50;
    const hasConnectedParties = transactionData.regulatoryConstraints.includes('Connected Party Transaction');
    
    if (transactionData.type === 'capital_raising') {
      const options: StructureOption[] = [
        {
          id: 'rights_issue',
          name: 'Rights Issue',
          type: 'capital_raising',
          description: 'Offer new shares to existing shareholders in proportion to their current holdings',
          pros: [
            'Maintains existing shareholder proportions',
            'Generally lower regulatory hurdles',
            'Tradeable nil-paid rights provide value to non-participating shareholders',
            'Lower professional fees compared to other methods'
          ],
          cons: [
            'May require shareholder approval if >50% threshold',
            'Market volatility can affect success',
            'Underwriting costs if guaranteed',
            'Longer execution timeline'
          ],
          timeline: isLarge ? 14 : 10,
          cost: 3.5,
          regulatoryComplexity: isLarge ? 'medium' : 'low',
          shareholderApproval: isLarge,
          recommendationScore: isLarge ? 75 : 85,
          suitability: 'Ideal for maintaining shareholder structure while raising capital',
          executionSteps: [
            'Board resolution and announcement',
            'Prepare and vet listing documents (15 business days)',
            'Record date determination and PAL dispatch',
            '10-day nil-paid rights trading period',
            'Acceptance and payment deadline',
            'New shares listing'
          ]
        },
        {
          id: 'open_offer',
          name: 'Open Offer',
          type: 'capital_raising',
          description: 'Offer new shares to existing shareholders with no tradeable rights',
          pros: [
            'Simpler structure than rights issue',
            'No nil-paid rights trading complications',
            'Faster execution than rights issue',
            'Lower market risk during offer period'
          ],
          cons: [
            'No value for non-participating shareholders',
            'May dilute non-participating shareholders significantly',
            'Still requires shareholder approval if >50%',
            'Limited flexibility for shareholders'
          ],
          timeline: isLarge ? 12 : 8,
          cost: 3.0,
          regulatoryComplexity: isLarge ? 'medium' : 'low',
          shareholderApproval: isLarge,
          recommendationScore: 70,
          suitability: 'Suitable when simplicity and speed are priorities',
          executionSteps: [
            'Board resolution and announcement',
            'Prepare and vet listing documents (15 business days)',
            'Application form dispatch to shareholders',
            'Acceptance period (typically 14 days)',
            'New shares allotment and listing'
          ]
        },
        {
          id: 'placing',
          name: 'Share Placing',
          type: 'capital_raising',
          description: 'Issue new shares to selected institutional or professional investors',
          pros: [
            'Fastest execution method',
            'Guaranteed funding if properly structured',
            'No shareholder approval required (subject to limits)',
            'Can bring in strategic investors'
          ],
          cons: [
            'Dilutes existing shareholders',
            'Limited by 20% annual limit (general mandate)',
            'May face market discount',
            'No participation rights for existing shareholders'
          ],
          timeline: 4,
          cost: 2.5,
          regulatoryComplexity: 'low',
          shareholderApproval: false,
          recommendationScore: dilution <= 20 ? 90 : 40,
          suitability: 'Best for smaller amounts within general mandate limits',
          executionSteps: [
            'Board resolution',
            'Placing agreement execution',
            'Announcement of placing',
            'Share allotment to placees',
            'New shares listing (T+3)'
          ]
        }
      ];
      
      return options.sort((a, b) => b.recommendationScore - a.recommendationScore);
    } else {
      // M&A recommendations
      const options: StructureOption[] = [
        {
          id: 'scheme_arrangement',
          name: 'Scheme of Arrangement',
          type: 'ma_transaction',
          description: 'Court-sanctioned process for acquisition requiring 75% shareholder approval',
          pros: [
            'Can proceed with 75% approval (vs 90% for takeover)',
            'Certainty of outcome once approved',
            'No holdout minority shareholders',
            'Court protection for process'
          ],
          cons: [
            'Complex court process required',
            'Longer timeline due to court procedures',
            'Higher professional costs',
            'Regulatory and court approval needed'
          ],
          timeline: 20,
          cost: 2.0,
          regulatoryComplexity: 'high',
          shareholderApproval: true,
          recommendationScore: 85,
          suitability: 'Preferred for friendly acquisitions with broad support',
          executionSteps: [
            'Announcement and initial court application',
            'Scheme document preparation and vetting',
            'Court meeting and shareholder approval',
            'Final court approval',
            'Scheme effective date'
          ]
        },
        {
          id: 'general_offer',
          name: 'General Offer',
          type: 'ma_transaction',
          description: 'Direct offer to all shareholders under Takeovers Code',
          pros: [
            'Standard process under Takeovers Code',
            'Flexible acceptance conditions',
            'Can be extended if competing offers',
            'Clear regulatory framework'
          ],
          cons: [
            'Requires 90% acceptance for compulsory acquisition',
            'Risk of partial acceptance',
            'Longer offer period (minimum 21 days)',
            'Potential for competing offers'
          ],
          timeline: 16,
          cost: 1.8,
          regulatoryComplexity: 'high',
          shareholderApproval: false,
          recommendationScore: 75,
          suitability: 'Standard route for acquisitions under Takeovers Code',
          executionSteps: [
            'Rule 3.5 announcement of firm intention',
            'Offer document preparation and SFC vetting',
            'Offer document dispatch',
            'Offer period (minimum 21 days)',
            'Settlement of accepted offers'
          ]
        }
      ];
      
      return options.sort((a, b) => b.recommendationScore - a.recommendationScore);
    }
  };

  const recommendations = generateRecommendations();
  const topRecommendation = recommendations[0];

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatCurrency = (percentage: number) => {
    const amount = (transactionData.amount * percentage) / 100;
    return new Intl.NumberFormat('en-HK', {
      style: 'currency',
      currency: transactionData.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Analysis
        </Button>
        <h1 className="text-2xl font-bold">Structure Recommendations</h1>
      </div>

      {/* Top Recommendation Highlight */}
      <Card className="border-2 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <span>Recommended Structure</span>
            <Badge variant="secondary">{topRecommendation.recommendationScore}% Match</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">{topRecommendation.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{topRecommendation.description}</p>
              <Badge variant="outline">{topRecommendation.suitability}</Badge>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Timeline</span>
                </span>
                <span className="font-medium">{topRecommendation.timeline} weeks</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Est. Cost</span>
                </span>
                <span className="font-medium">{formatCurrency(topRecommendation.cost)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Complexity</span>
                <span className={`font-medium capitalize ${getComplexityColor(topRecommendation.regulatoryComplexity)}`}>
                  {topRecommendation.regulatoryComplexity}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                {topRecommendation.shareholderApproval ? (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                <span className="text-sm">
                  {topRecommendation.shareholderApproval ? 'Shareholder approval required' : 'No shareholder approval needed'}
                </span>
              </div>
              <Progress value={topRecommendation.recommendationScore} className="h-2" />
              <p className="text-xs text-gray-600">Recommendation score based on your requirements</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Structure Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="execution">Execution</TabsTrigger>
              <TabsTrigger value="comparison">Side-by-Side</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              {recommendations.map((option) => (
                <Card key={option.id} className={option.id === topRecommendation.id ? 'border-blue-200' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <span>{option.name}</span>
                        {option.id === topRecommendation.id && <Star className="h-4 w-4 text-yellow-500" />}
                      </CardTitle>
                      <Badge variant="outline">{option.recommendationScore}% Match</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{option.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-green-600 mb-2 flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4" />
                          <span>Advantages</span>
                        </h4>
                        <ul className="space-y-1 text-sm">
                          {option.pros.map((pro, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="text-green-500 mt-1">•</span>
                              <span>{pro}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-red-600 mb-2 flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4" />
                          <span>Considerations</span>
                        </h4>
                        <ul className="space-y-1 text-sm">
                          {option.cons.map((con, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="text-red-500 mt-1">•</span>
                              <span>{con}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            
            <TabsContent value="execution" className="space-y-6">
              {recommendations.map((option) => (
                <Card key={option.id}>
                  <CardHeader>
                    <CardTitle>{option.name} - Execution Steps</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {option.executionSteps.map((step, index) => (
                        <div key={index} className="flex items-start space-x-4">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                          </div>
                          <div className="flex-grow">
                            <p className="text-sm">{step}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            
            <TabsContent value="comparison" className="space-y-6">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200 dark:border-gray-700">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left">Criteria</th>
                      {recommendations.map((option) => (
                        <th key={option.id} className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center">
                          {option.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 font-medium">Timeline</td>
                      {recommendations.map((option) => (
                        <td key={option.id} className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center">
                          {option.timeline} weeks
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 font-medium">Est. Cost</td>
                      {recommendations.map((option) => (
                        <td key={option.id} className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center">
                          {formatCurrency(option.cost)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 font-medium">Complexity</td>
                      {recommendations.map((option) => (
                        <td key={option.id} className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center">
                          <span className={`capitalize ${getComplexityColor(option.regulatoryComplexity)}`}>
                            {option.regulatoryComplexity}
                          </span>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 font-medium">Shareholder Approval</td>
                      {recommendations.map((option) => (
                        <td key={option.id} className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center">
                          {option.shareholderApproval ? (
                            <AlertTriangle className="h-4 w-4 text-red-500 mx-auto" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 font-medium">Recommendation Score</td>
                      {recommendations.map((option) => (
                        <td key={option.id} className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Progress value={option.recommendationScore} className="h-2 w-16" />
                            <span className="text-sm font-medium">{option.recommendationScore}%</span>
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

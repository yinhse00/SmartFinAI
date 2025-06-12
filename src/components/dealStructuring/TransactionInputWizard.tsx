import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, Plus, Trash2 } from 'lucide-react';
import { TransactionData } from '@/types/dealStructuring';

interface TransactionInputWizardProps {
  onSubmit: (data: TransactionData) => void;
}

export const TransactionInputWizard = ({ onSubmit }: TransactionInputWizardProps) => {
  const [formData, setFormData] = useState<TransactionData>({
    type: '',
    subtype: '',
    amount: 0,
    currency: 'HKD',
    currentShares: 0,
    marketCap: 0,
    objectives: [],
    timeline: '',
    shareholderStructure: [],
    regulatoryConstraints: [],
    jurisdiction: 'Hong Kong'
  });

  const [newShareholder, setNewShareholder] = useState({
    name: '',
    percentage: 0,
    type: 'institutional' as const
  });

  const transactionTypes = [
    { value: 'capital_raising', label: 'Capital Raising' },
    { value: 'ma_transaction', label: 'M&A Transaction' },
    { value: 'hybrid', label: 'Hybrid Transaction' }
  ];

  const capitalRaisingSubtypes = [
    'Rights Issue', 'Open Offer', 'Placing', 'Convertible Bonds', 'Warrant Issue'
  ];

  const maSubtypes = [
    'General Offer', 'Mandatory Offer', 'Scheme of Arrangement', 'Asset Acquisition', 'Reverse Takeover'
  ];

  const transactionObjectives = [
    'Growth Capital', 'Debt Refinancing', 'Acquisition Funding', 'Working Capital',
    'Strategic Investment', 'Market Expansion', 'Technology Investment', 'ESG Initiatives'
  ];

  const regulatoryConstraints = [
    'Connected Party Transaction', 'Major Transaction (>25%)', 'Very Substantial Transaction (>100%)',
    'Reverse Takeover', 'Notifiable Transaction', 'Whitewash Waiver Required', 'Shareholder Approval Required'
  ];

  const handleSubmit = () => {
    if (formData.type && formData.amount > 0) {
      onSubmit(formData);
    }
  };

  const addShareholder = () => {
    if (newShareholder.name && newShareholder.percentage > 0) {
      setFormData(prev => ({
        ...prev,
        shareholderStructure: [...prev.shareholderStructure, newShareholder]
      }));
      setNewShareholder({ name: '', percentage: 0, type: 'institutional' });
    }
  };

  const removeShareholder = (index: number) => {
    setFormData(prev => ({
      ...prev,
      shareholderStructure: prev.shareholderStructure.filter((_, i) => i !== index)
    }));
  };

  const toggleObjective = (objective: string) => {
    setFormData(prev => ({
      ...prev,
      objectives: prev.objectives.includes(objective)
        ? prev.objectives.filter(o => o !== objective)
        : [...prev.objectives, objective]
    }));
  };

  const toggleConstraint = (constraint: string) => {
    setFormData(prev => ({
      ...prev,
      regulatoryConstraints: prev.regulatoryConstraints.includes(constraint)
        ? prev.regulatoryConstraints.filter(c => c !== constraint)
        : [...prev.regulatoryConstraints, constraint]
    }));
  };

  const getSubtypes = () => {
    switch (formData.type) {
      case 'capital_raising':
        return capitalRaisingSubtypes;
      case 'ma_transaction':
        return maSubtypes;
      default:
        return [...capitalRaisingSubtypes, ...maSubtypes];
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Transaction Details Input</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Transaction Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="transaction-type">Transaction Type</Label>
            <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value, subtype: '' }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select transaction type" />
              </SelectTrigger>
              <SelectContent>
                {transactionTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.type && (
            <div className="space-y-2">
              <Label htmlFor="subtype">Transaction Subtype</Label>
              <Select value={formData.subtype} onValueChange={(value) => setFormData(prev => ({ ...prev, subtype: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subtype" />
                </SelectTrigger>
                <SelectContent>
                  {getSubtypes().map(subtype => (
                    <SelectItem key={subtype} value={subtype}>
                      {subtype}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Financial Details */}
        <Separator />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="amount">Transaction Amount</Label>
            <div className="flex space-x-2">
              <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HKD">HKD</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="CNY">CNY</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Amount"
                value={formData.amount || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="current-shares">Current Issued Shares</Label>
            <Input
              type="number"
              placeholder="Number of shares"
              value={formData.currentShares || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, currentShares: Number(e.target.value) }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="market-cap">Current Market Cap</Label>
            <Input
              type="number"
              placeholder="Market capitalization"
              value={formData.marketCap || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, marketCap: Number(e.target.value) }))}
            />
          </div>
        </div>

        {/* Transaction Objectives */}
        <Separator />
        <div className="space-y-3">
          <Label>Transaction Objectives</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {transactionObjectives.map(objective => (
              <div key={objective} className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.objectives.includes(objective)}
                  onCheckedChange={() => toggleObjective(objective)}
                />
                <label className="text-sm">{objective}</label>
              </div>
            ))}
          </div>
          {formData.objectives.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.objectives.map(objective => (
                <Badge key={objective} variant="secondary">
                  {objective}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Shareholder Structure */}
        <Separator />
        <div className="space-y-4">
          <Label>Current Shareholder Structure</Label>
          
          {/* Add Shareholder */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
            <Input
              placeholder="Shareholder name"
              value={newShareholder.name}
              onChange={(e) => setNewShareholder(prev => ({ ...prev, name: e.target.value }))}
            />
            <Input
              type="number"
              placeholder="Percentage"
              value={newShareholder.percentage || ''}
              onChange={(e) => setNewShareholder(prev => ({ ...prev, percentage: Number(e.target.value) }))}
            />
            <Select 
              value={newShareholder.type} 
              onValueChange={(value: any) => setNewShareholder(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="institutional">Institutional</SelectItem>
                <SelectItem value="connected">Connected Party</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={addShareholder} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Existing Shareholders */}
          {formData.shareholderStructure.length > 0 && (
            <div className="space-y-2">
              {formData.shareholderStructure.map((shareholder, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <span className="font-medium">{shareholder.name}</span>
                    <Badge variant="outline">{shareholder.percentage}%</Badge>
                    <Badge variant="secondary">{shareholder.type}</Badge>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeShareholder(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Regulatory Constraints */}
        <Separator />
        <div className="space-y-3">
          <Label>Known Regulatory Constraints</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {regulatoryConstraints.map(constraint => (
              <div key={constraint} className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.regulatoryConstraints.includes(constraint)}
                  onCheckedChange={() => toggleConstraint(constraint)}
                />
                <label className="text-sm">{constraint}</label>
              </div>
            ))}
          </div>
          {formData.regulatoryConstraints.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.regulatoryConstraints.map(constraint => (
                <Badge key={constraint} variant="destructive">
                  {constraint}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Timeline */}
        <Separator />
        <div className="space-y-2">
          <Label htmlFor="timeline">Target Timeline</Label>
          <Select value={formData.timeline} onValueChange={(value) => setFormData(prev => ({ ...prev, timeline: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select target timeline" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="urgent">Urgent (&lt; 3 months)</SelectItem>
              <SelectItem value="normal">Normal (3-6 months)</SelectItem>
              <SelectItem value="flexible">Flexible (6+ months)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <Button 
            onClick={handleSubmit}
            disabled={!formData.type || !formData.amount}
            className="flex items-center space-x-2"
          >
            <span>Analyze Transaction</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

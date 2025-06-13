
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { OptimizationParameters } from '@/services/dealStructuring/optimizationEngine';
import { TrendingUp } from 'lucide-react';

interface OptimizationPreferencesProps {
  preferences: OptimizationParameters;
  onPreferencesChange: (preferences: OptimizationParameters) => void;
}

export const OptimizationPreferences: React.FC<OptimizationPreferencesProps> = ({
  preferences,
  onPreferencesChange
}) => {
  const updatePreference = (key: keyof OptimizationParameters, value: any) => {
    onPreferencesChange({
      ...preferences,
      [key]: value
    });
  };

  const handleObjectiveToggle = (objective: string, checked: boolean) => {
    const updatedObjectives = checked
      ? [...preferences.strategicObjectives, objective]
      : preferences.strategicObjectives.filter(obj => obj !== objective);
    
    updatePreference('strategicObjectives', updatedObjectives);
  };

  const availableObjectives = [
    'cost minimization',
    'speed optimization',
    'control retention',
    'regulatory certainty',
    'flexibility maximization',
    'synergy realization',
    'market timing',
    'stakeholder satisfaction'
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          Optimization Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primary Priority */}
        <div className="space-y-2">
          <Label>Primary Priority</Label>
          <Select 
            value={preferences.priority} 
            onValueChange={(value: OptimizationParameters['priority']) => updatePreference('priority', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select primary focus" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cost">Cost Minimization</SelectItem>
              <SelectItem value="speed">Speed Optimization</SelectItem>
              <SelectItem value="control">Control Retention</SelectItem>
              <SelectItem value="flexibility">Flexibility</SelectItem>
              <SelectItem value="regulatory_certainty">Regulatory Certainty</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Risk Tolerance */}
        <div className="space-y-2">
          <Label>Risk Tolerance</Label>
          <Select 
            value={preferences.riskTolerance} 
            onValueChange={(value: OptimizationParameters['riskTolerance']) => updatePreference('riskTolerance', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select risk tolerance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Conservative (Low Risk)</SelectItem>
              <SelectItem value="medium">Balanced (Medium Risk)</SelectItem>
              <SelectItem value="high">Aggressive (High Risk)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Time Constraints */}
        <div className="space-y-2">
          <Label>Time Constraints</Label>
          <Select 
            value={preferences.timeConstraints} 
            onValueChange={(value: OptimizationParameters['timeConstraints']) => updatePreference('timeConstraints', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select time requirements" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="urgent">Urgent (ASAP)</SelectItem>
              <SelectItem value="normal">Normal Timeline</SelectItem>
              <SelectItem value="flexible">Flexible (No Rush)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Budget Constraints */}
        <div className="space-y-2">
          <Label>Budget Constraints</Label>
          <Select 
            value={preferences.budgetConstraints} 
            onValueChange={(value: OptimizationParameters['budgetConstraints']) => updatePreference('budgetConstraints', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select budget flexibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tight">Cost-Sensitive</SelectItem>
              <SelectItem value="moderate">Moderate Budget</SelectItem>
              <SelectItem value="flexible">Budget Flexible</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Market Conditions */}
        <div className="space-y-2">
          <Label>Current Market Assessment</Label>
          <Select 
            value={preferences.marketConditions || 'neutral'} 
            onValueChange={(value: OptimizationParameters['marketConditions']) => updatePreference('marketConditions', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Assess market conditions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="favorable">Favorable Markets</SelectItem>
              <SelectItem value="neutral">Neutral Markets</SelectItem>
              <SelectItem value="challenging">Challenging Markets</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Strategic Objectives */}
        <div className="space-y-3">
          <Label>Strategic Objectives (Select all that apply)</Label>
          <div className="grid grid-cols-2 gap-3">
            {availableObjectives.map((objective) => (
              <div key={objective} className="flex items-center space-x-2">
                <Checkbox
                  id={objective}
                  checked={preferences.strategicObjectives.includes(objective)}
                  onCheckedChange={(checked) => handleObjectiveToggle(objective, checked as boolean)}
                />
                <Label 
                  htmlFor={objective} 
                  className="text-sm font-normal capitalize cursor-pointer"
                >
                  {objective}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

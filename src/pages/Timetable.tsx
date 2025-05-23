
import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import TimetableViewer from '@/components/timetable/TimetableViewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import TimetableVettingCheck from '@/components/timetable/TimetableVettingCheck';
import { useVettingRequirements } from '@/hooks/useVettingRequirements';
import { Info } from 'lucide-react';

const TimetablePage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<string>('');
  const { requirements, isLoading } = useVettingRequirements();
  
  // The headline category to check - either selected from dropdown or entered manually
  const headlineCategory = selectedCategory || customCategory;

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-finance-dark-blue dark:text-white">Transaction Timetable</h1>
        <p className="text-gray-600 dark:text-gray-300">
          View and manage transaction timetables for regulatory compliance
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <TimetableViewer />
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-500" />
                Vetting Requirements Check
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="headline-category">Headline Category</Label>
                <Select value={selectedCategory} onValueChange={(value) => {
                  setSelectedCategory(value);
                  setCustomCategory('');
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a headline category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Custom category</SelectItem>
                    {requirements?.map((req) => (
                      <SelectItem key={req.headlineCategory} value={req.headlineCategory}>
                        {req.headlineCategory}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {!selectedCategory && (
                <div>
                  <Label htmlFor="custom-category">Custom Headline Category</Label>
                  <Input
                    id="custom-category"
                    placeholder="Enter headline category"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                  />
                </div>
              )}
              
              {headlineCategory && (
                <div className="pt-2">
                  <TimetableVettingCheck headlineCategory={headlineCategory} />
                </div>
              )}
              
              {!headlineCategory && (
                <div className="rounded-md p-4 bg-gray-50 text-gray-600 text-center">
                  Please select or enter a headline category to check vetting requirements
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default TimetablePage;

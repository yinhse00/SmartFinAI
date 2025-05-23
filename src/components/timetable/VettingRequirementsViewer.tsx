
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useVettingRequirements } from '@/hooks/useVettingRequirements';
import { CheckCircle, XCircle, AlertTriangle, InfoIcon, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

const VettingRequirementsViewer: React.FC = () => {
  const { requirements, isLoading } = useVettingRequirements();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'vetting' | 'no-vetting'>('all');
  
  const filteredRequirements = requirements?.filter(req => {
    // Filter by search term
    const matchesSearch = !searchTerm || 
      req.headlineCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.ruleReference?.toLowerCase().includes(searchTerm.toLowerCase());
      
    // Filter by vetting requirement
    const matchesFilter = 
      filterType === 'all' || 
      (filterType === 'vetting' && req.isVettingRequired) ||
      (filterType === 'no-vetting' && !req.isVettingRequired);
      
    return matchesSearch && matchesFilter;
  });
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <InfoIcon className="h-5 w-5 text-blue-600" />
          Announcement Vetting Requirements
        </CardTitle>
        <div className="flex flex-col sm:flex-row gap-4 mt-2">
          <div className="flex-1">
            <Label htmlFor="search" className="sr-only">Search</Label>
            <div className="relative">
              <Input
                id="search"
                placeholder="Search headline categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <span className="absolute left-3 top-2.5 text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </svg>
              </span>
            </div>
          </div>
          <div className="w-full sm:w-48">
            <Label htmlFor="filter" className="sr-only">Filter by</Label>
            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <SelectTrigger id="filter" className="w-full">
                <SelectValue placeholder="Filter by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="vetting">Requires Vetting</SelectItem>
                <SelectItem value="no-vetting">No Vetting Required</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ) : requirements && requirements.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Headline Category</TableHead>
                  <TableHead className="w-[120px]">Vetting Required</TableHead>
                  <TableHead className="hidden md:table-cell">Rule Reference</TableHead>
                  <TableHead className="hidden lg:table-cell">Exemptions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequirements && filteredRequirements.length > 0 ? (
                  filteredRequirements.map((req) => (
                    <TableRow key={req.headlineCategory}>
                      <TableCell className="font-medium">{req.headlineCategory}</TableCell>
                      <TableCell>
                        {req.isVettingRequired ? (
                          <Badge variant="default" className="bg-yellow-500">
                            <CheckCircle className="h-3 w-3 mr-1" /> Required
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-green-500 text-green-700">
                            <XCircle className="h-3 w-3 mr-1" /> Not Required
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {req.ruleReference || '–'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {req.exemptions || '–'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No matching requirements found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40">
            <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />
            <p className="text-muted-foreground text-center">
              No vetting requirements data found. Please upload and process the vetting guide document.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VettingRequirementsViewer;

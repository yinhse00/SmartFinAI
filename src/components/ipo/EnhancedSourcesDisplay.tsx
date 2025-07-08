import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  FileText, 
  ExternalLink, 
  Search, 
  Filter,
  BookOpen,
  AlertTriangle,
  HelpCircle,
  Gavel,
  ChevronDown,
  ChevronUp,
  Star
} from 'lucide-react';

interface SourceReference {
  source_type: string;
  content_snippet: string;
  source_reference?: string;
  confidence_score: number;
}

interface EnhancedSourcesDisplayProps {
  sources: SourceReference[];
}

export const EnhancedSourcesDisplay: React.FC<EnhancedSourcesDisplayProps> = ({ sources }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [minConfidence, setMinConfidence] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['regulation', 'template']);

  // Group sources by type
  const groupedSources = sources.reduce((acc, source) => {
    const type = source.source_type.toLowerCase();
    if (!acc[type]) acc[type] = [];
    acc[type].push(source);
    return acc;
  }, {} as Record<string, SourceReference[]>);

  // Filter sources based on search and filters
  const filteredSources = Object.entries(groupedSources).reduce((acc, [type, typeSources]) => {
    const filtered = typeSources.filter(source => {
      const matchesSearch = !searchTerm || 
        source.content_snippet.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (source.source_reference && source.source_reference.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = selectedTypes.length === 0 || selectedTypes.includes(type);
      const matchesConfidence = source.confidence_score >= minConfidence;
      
      return matchesSearch && matchesType && matchesConfidence;
    });
    
    if (filtered.length > 0) {
      acc[type] = filtered;
    }
    return acc;
  }, {} as Record<string, SourceReference[]>);

  const getSourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'regulation': return Gavel;
      case 'template': return FileText;
      case 'guidance': return BookOpen;
      case 'faq': return HelpCircle;
      default: return FileText;
    }
  };

  const getSourceColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'regulation': return 'bg-red-50 border-red-200 text-red-800';
      case 'template': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'guidance': return 'bg-green-50 border-green-200 text-green-800';
      case 'faq': return 'bg-purple-50 border-purple-200 text-purple-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const toggleGroupExpansion = (type: string) => {
    setExpandedGroups(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const availableTypes = Object.keys(groupedSources);

  if (sources.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Sources Available</h3>
          <p className="text-sm">Generate content to see source attribution and regulatory references</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Enhanced Header with Search and Filters */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Source Attribution</h3>
            <Badge variant="secondary">{sources.length} sources</Badge>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filter by type:</span>
            {availableTypes.map(type => (
              <Button
                key={type}
                variant={selectedTypes.includes(type) ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedTypes(prev =>
                    prev.includes(type)
                      ? prev.filter(t => t !== type)
                      : [...prev, type]
                  );
                }}
                className="h-7 text-xs"
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Min confidence:</span>
            <select
              value={minConfidence}
              onChange={(e) => setMinConfidence(Number(e.target.value))}
              className="text-sm border rounded px-2 py-1"
            >
              <option value={0}>All</option>
              <option value={0.5}>50%+</option>
              <option value={0.7}>70%+</option>
              <option value={0.8}>80%+</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sources Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {Object.entries(filteredSources).map(([type, typeSources]) => {
            const Icon = getSourceIcon(type);
            const isExpanded = expandedGroups.includes(type);
            
            return (
              <Card key={type} className="overflow-hidden">
                <Collapsible open={isExpanded} onOpenChange={() => toggleGroupExpansion(type)}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5" />
                          <div>
                            <CardTitle className="text-base">
                              {type.charAt(0).toUpperCase() + type.slice(1)} Sources
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {typeSources.length} reference{typeSources.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getSourceColor(type)}>
                            {typeSources.length}
                          </Badge>
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {typeSources.map((source, index) => (
                          <div 
                            key={index} 
                            className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <Badge 
                                variant="outline" 
                                className={`${getSourceColor(type)} text-xs`}
                              >
                                {type.toUpperCase()}
                              </Badge>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <Star className={`h-3 w-3 ${getConfidenceColor(source.confidence_score)}`} />
                                  <span className={`text-xs font-medium ${getConfidenceColor(source.confidence_score)}`}>
                                    {(source.confidence_score * 100).toFixed(0)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <p className="text-sm leading-relaxed mb-3">
                              {source.content_snippet}
                            </p>
                            
                            {source.source_reference && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <ExternalLink className="h-3 w-3" />
                                <span className="font-medium">Source:</span>
                                <span>{source.source_reference}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}

          {Object.keys(filteredSources).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">No sources match your current filters</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedTypes([]);
                  setMinConfidence(0);
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
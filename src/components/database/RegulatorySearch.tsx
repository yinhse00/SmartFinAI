
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search, FileText } from 'lucide-react';
import { regulatoryDatabaseService } from '@/services/database/regulatoryDatabaseService';
import { toast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface RegulationProvision {
  id: string;
  rule_number: string;
  title: string;
  content: string;
  chapter?: string;
  section?: string;
}

const RegulatorySearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<RegulationProvision[]>([]);
  const [viewingProvision, setViewingProvision] = useState<RegulationProvision | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search query required",
        description: "Please enter a search term.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setSearchResults([]);

    try {
      const results = await regulatoryDatabaseService.searchProvisions(searchQuery);
      setSearchResults(results);
      
      if (results.length === 0) {
        toast({
          title: "No results found",
          description: `No regulatory provisions match '${searchQuery}'`,
        });
      }
    } catch (error) {
      console.error('Error searching provisions:', error);
      toast({
        title: "Search failed",
        description: "An error occurred while searching the database.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleViewProvision = (provision: RegulationProvision) => {
    setViewingProvision(provision);
  };

  const highlightMatches = (text: string, query: string): JSX.Element => {
    if (!query) return <>{text}</>;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? 
            <mark key={i} className="bg-yellow-200 dark:bg-yellow-900">{part}</mark> : 
            part
        )}
      </>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Search Regulatory Database</CardTitle>
          <CardDescription>
            Search for specific rules, terms, or content across all regulatory provisions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for rules, terms, or concepts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button 
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="bg-finance-medium-blue hover:bg-finance-dark-blue"
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </Button>
          </div>

          {isSearching ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-finance-medium-blue" />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">
                {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'} found
              </h3>
              <div className="space-y-4">
                {searchResults.map((provision) => (
                  <Card key={provision.id} className="overflow-hidden">
                    <div className="p-4 flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-semibold flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-finance-medium-blue" />
                          {provision.rule_number} - {highlightMatches(provision.title, searchQuery)}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {provision.chapter ? `Chapter ${provision.chapter}` : 'Unknown Chapter'}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewProvision(provision)}
                      >
                        View
                      </Button>
                    </div>
                    <div className="px-4 pb-4">
                      <p className="text-sm line-clamp-2">
                        {highlightMatches(provision.content.substring(0, 200) + '...', searchQuery)}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Enter a search term and click search to find regulatory provisions
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!viewingProvision} onOpenChange={(open) => !open && setViewingProvision(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {viewingProvision?.rule_number} - {viewingProvision?.title}
            </DialogTitle>
            <DialogDescription>
              Regulatory Provision
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 p-2">
              <div className="prose dark:prose-invert max-w-none">
                {viewingProvision?.content.split('\n').map((paragraph, i) => (
                  <p key={i}>
                    {searchQuery ? 
                      highlightMatches(paragraph, searchQuery) : 
                      paragraph}
                  </p>
                ))}
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RegulatorySearch;

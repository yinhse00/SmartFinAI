
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Info, File, Link as LinkIcon, User, Bot, Loader2, ExternalLink, AlertTriangle, Key } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { perplexityService } from '@/services/perplexityService';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  references?: string[];
  isUsingFallback?: boolean;
}

const ChatInterface = () => {
  const [input, setInput] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your Hong Kong regulatory assistant. How can I help you today?',
      sender: 'bot',
      timestamp: new Date(),
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const { toast } = useToast();

  // Check if API key is set on component mount
  useEffect(() => {
    const hasKey = perplexityService.hasApiKey();
    setIsApiKeySet(hasKey);
    if (!hasKey) {
      setApiKeyDialogOpen(true);
    }
  }, []);

  const handleSaveApiKey = () => {
    if (apiKeyInput.trim()) {
      perplexityService.setApiKey(apiKeyInput.trim());
      setIsApiKeySet(true);
      setApiKeyDialogOpen(false);
      toast({
        title: "API Key Saved",
        description: "Your API key has been saved in the browser's local storage.",
      });
    } else {
      toast({
        title: "Error",
        description: "Please enter a valid API key.",
        variant: "destructive"
      });
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    if (!isApiKeySet) {
      setApiKeyDialogOpen(true);
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Get regulatory context for the query
      const regulatoryContext = await perplexityService.getRegulatoryContext(input);
      
      try {
        // Generate response from Perplexity
        const response = await perplexityService.generateResponse({
          prompt: input,
          regulatoryContext: regulatoryContext,
          temperature: 0.7,
          maxTokens: 500
        });
        
        // Check if we're using a fallback response (API call failed)
        const isUsingFallback = response.text.includes("Based on your query about") || 
                                response.text.includes("Regarding your query about") ||
                                response.text.includes("In response to your query");
        
        // Find references from the regulatory context
        const references = extractReferences(regulatoryContext);
        
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: response.text,
          sender: 'bot',
          timestamp: new Date(),
          references: references,
          isUsingFallback: isUsingFallback
        };
        
        setMessages(prev => [...prev, botMessage]);
      } catch (error) {
        console.error("Error generating response:", error);
        toast({
          title: "Error",
          description: "Failed to generate a response. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error in chat process:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  // Helper function to extract references from the regulatory context
  const extractReferences = (context: string): string[] => {
    if (!context) return [];
    
    const references: string[] = [];
    const lines = context.split('\n');
    
    for (const line of lines) {
      // Look for lines that start with "--- " which indicates a reference title
      if (line.startsWith('--- ')) {
        // Extract the reference name between "--- " and " ---"
        const match = line.match(/--- (.*?) \(.*?\) ---/);
        if (match && match[1]) {
          references.push(match[1]);
        }
      }
    }
    
    // Return unique references
    return [...new Set(references)];
  };

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)]">
      <div className="flex-1 flex gap-4">
        {/* Chat Window */}
        <div className="flex-1 flex flex-col">
          <Card className="finance-card h-full flex flex-col">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Bot size={18} /> 
                Regulatory Assistant
                <div className="ml-auto flex items-center gap-2">
                  {!isApiKeySet && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setApiKeyDialogOpen(true)}
                      className="text-xs flex items-center gap-1 border-amber-500 text-amber-600 hover:text-amber-700"
                    >
                      <Key size={14} /> Set API Key
                    </Button>
                  )}
                  <a 
                    href="https://www.perplexity.ai/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-finance-medium-blue dark:text-finance-accent-blue flex items-center gap-0.5 hover:underline"
                  >
                    About Perplexity AI <ExternalLink size={10} />
                  </a>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto py-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.sender === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg p-3",
                      message.sender === "user"
                        ? "bg-finance-medium-blue text-white"
                        : "bg-gray-100 dark:bg-finance-dark-blue/50 text-finance-dark-blue dark:text-white"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {message.sender === "user" ? (
                        <User size={16} />
                      ) : (
                        <Bot size={16} />
                      )}
                      <span className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      
                      {message.isUsingFallback && (
                        <Badge 
                          variant="outline" 
                          className="ml-auto text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 flex items-center gap-1"
                        >
                          <AlertTriangle size={10} /> Simulated Response
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.references && message.references.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-finance-medium-blue/30">
                        <div className="text-xs opacity-70 mb-1">References:</div>
                        <div className="flex flex-wrap gap-1">
                          {message.references.map((ref, i) => (
                            <Badge 
                              key={i} 
                              variant="outline" 
                              className="text-xs bg-finance-highlight/50 dark:bg-finance-medium-blue/20"
                            >
                              {ref}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg p-4 bg-gray-100 dark:bg-finance-dark-blue/50">
                    <div className="flex items-center space-x-2">
                      <Loader2 size={18} className="animate-spin text-finance-medium-blue" />
                      <span className="text-sm">Generating response...</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  className="flex-1"
                  placeholder="Ask about HK listing rules, takeovers, or regulatory requirements..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                />
                <Button 
                  onClick={handleSend} 
                  className="bg-finance-medium-blue hover:bg-finance-dark-blue"
                  disabled={!input.trim() || isLoading}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send size={18} />}
                </Button>
              </div>
              <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                <Info size={12} />
                <span>
                  Using Perplexity AI for accurate regulatory assistance. Responses include context from our database.
                  {!isApiKeySet && (
                    <Badge 
                      variant="outline" 
                      className="ml-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                    >
                      API Key Required
                    </Badge>
                  )}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Reference Panel */}
        <div className="w-80 hidden lg:block">
          <Card className="finance-card h-full">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg font-medium">Knowledge Base</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="related">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="related">Related</TabsTrigger>
                  <TabsTrigger value="recent">Recent</TabsTrigger>
                </TabsList>
                
                <TabsContent value="related" className="p-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      Listing Rules
                      <Badge variant="outline" className="ml-auto text-xs font-normal">AI Analysis</Badge>
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs p-2 rounded-md bg-gray-50 dark:bg-finance-medium-blue/10">
                        <File size={14} className="text-finance-medium-blue dark:text-finance-accent-blue" />
                        <span>HKEx Listing Rules Chapter 14A</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs p-2 rounded-md bg-gray-50 dark:bg-finance-medium-blue/10">
                        <File size={14} className="text-finance-medium-blue dark:text-finance-accent-blue" />
                        <span>SFC Guidance Note on Directors' Duties</span>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      Takeovers Code
                      <Badge variant="outline" className="ml-auto text-xs font-normal">AI Analysis</Badge>
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs p-2 rounded-md bg-gray-50 dark:bg-finance-medium-blue/10">
                        <File size={14} className="text-finance-medium-blue dark:text-finance-accent-blue" />
                        <span>SFC Takeovers Code Rule 26</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs p-2 rounded-md bg-gray-50 dark:bg-finance-medium-blue/10">
                        <LinkIcon size={14} className="text-finance-medium-blue dark:text-finance-accent-blue" />
                        <span>Executive Decisions 2022-04</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="recent" className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs p-2 rounded-md hover:bg-gray-50 dark:hover:bg-finance-medium-blue/10 cursor-pointer">
                    <File size={14} className="text-finance-medium-blue dark:text-finance-accent-blue" />
                    <div>
                      <div className="font-medium">IPO Due Diligence Guide</div>
                      <div className="text-gray-500">Viewed yesterday</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs p-2 rounded-md hover:bg-gray-50 dark:hover:bg-finance-medium-blue/10 cursor-pointer">
                    <File size={14} className="text-finance-medium-blue dark:text-finance-accent-blue" />
                    <div>
                      <div className="font-medium">Profit Forecast Requirements</div>
                      <div className="text-gray-500">Viewed 3 days ago</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs p-2 rounded-md hover:bg-gray-50 dark:hover:bg-finance-medium-blue/10 cursor-pointer">
                    <File size={14} className="text-finance-medium-blue dark:text-finance-accent-blue" />
                    <div>
                      <div className="font-medium">Whitewash Waiver Practice Note</div>
                      <div className="text-gray-500">Viewed 1 week ago</div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* API Key Dialog */}
      <Dialog open={apiKeyDialogOpen} onOpenChange={setApiKeyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Perplexity API Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="apikey">
                API Key
                <span className="text-xs text-gray-500 ml-2">
                  (Stored in your browser)
                </span>
              </Label>
              <Input
                id="apikey"
                type="password"
                placeholder="Enter your Perplexity API key"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Your API key is stored only in your browser's local storage. We do not store it on our servers.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApiKeyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveApiKey}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatInterface;

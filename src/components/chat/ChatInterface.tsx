
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Info, File, Link as LinkIcon, User, Bot } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  references?: string[];
}

const ChatInterface = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m FinanceGrok, your Hong Kong regulatory assistant. How can I help you today?',
      sender: 'bot',
      timestamp: new Date(),
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;

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

    // Simulate AI response
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Based on the Hong Kong Listing Rules Chapter 14A, related party transactions require disclosure in annual reports and may require shareholder approval depending on the size of the transaction. The key thresholds are 0.1%, 1%, and 5% of various financial ratios.',
        sender: 'bot',
        timestamp: new Date(),
        references: ['HKEx Listing Rules Ch. 14A', 'SFC Takeovers Code Rule 26']
      };
      
      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
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
                FinanceGrok Assistant
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
                    <div className="flex space-x-2">
                      <div className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse"></div>
                      <div className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse delay-150"></div>
                      <div className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse delay-300"></div>
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
                />
                <Button 
                  onClick={handleSend} 
                  className="bg-finance-medium-blue hover:bg-finance-dark-blue"
                  disabled={!input.trim() || isLoading}
                >
                  <Send size={18} />
                </Button>
              </div>
              <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                <Info size={12} />
                <span>Your queries are securely processed using our Grok-powered regulatory engine</span>
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
                    <h4 className="text-sm font-medium mb-2">Listing Rules</h4>
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
                    <h4 className="text-sm font-medium mb-2">Takeovers Code</h4>
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
    </div>
  );
};

export default ChatInterface;

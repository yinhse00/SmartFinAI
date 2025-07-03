import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Mail, 
  Send, 
  Bot, 
  Users, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Settings,
  Zap,
  MessageSquare
} from 'lucide-react';
import { 
  emailIntegrationService, 
  EmailMessage, 
  EmailIntegrationConfig 
} from '@/services/ai/emailIntegrationService';
import { executionAIService } from '@/services/ai/executionAIService';
import { useToast } from '@/hooks/use-toast';

interface AIEmailInterfaceProps {
  projectId: string;
  onTasksCreated?: (tasks: any[]) => void;
  onDocumentGenerated?: (document: any) => void;
}

export const AIEmailInterface = ({ 
  projectId, 
  onTasksCreated, 
  onDocumentGenerated 
}: AIEmailInterfaceProps) => {
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [aiResponse, setAiResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [config, setConfig] = useState<EmailIntegrationConfig>({
    projectId,
    autoReply: true,
    stakeholderRules: [],
    escalationRules: []
  });
  const [activeTab, setActiveTab] = useState('inbox');
  const { toast } = useToast();

  useEffect(() => {
    loadEmails();
    loadConfiguration();
  }, [projectId]);

  const loadEmails = async () => {
    try {
      // In a real implementation, this would fetch from the database
      // For now, we'll show a placeholder
      setEmails([]);
    } catch (error) {
      console.error('Error loading emails:', error);
    }
  };

  const loadConfiguration = async () => {
    try {
      // Load email integration configuration
      // For now, use default config
    } catch (error) {
      console.error('Error loading configuration:', error);
    }
  };

  const processEmail = async (email: EmailMessage) => {
    setIsProcessing(true);
    try {
      const result = await emailIntegrationService.processIncomingEmail(email, projectId);
      
      setSelectedEmail({ ...email, analysis: result.analysis });
      setAiResponse(result.response || '');
      
      if (result.actions.length > 0) {
        toast({
          title: "Email Processed",
          description: `${result.actions.length} actions suggested based on email analysis`
        });
      }
    } catch (error) {
      console.error('Error processing email:', error);
      toast({
        title: "Processing Failed",
        description: "Could not process email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const sendAIResponse = async () => {
    if (!selectedEmail || !aiResponse) return;

    setIsProcessing(true);
    try {
      await emailIntegrationService.sendAIResponse(selectedEmail, aiResponse, projectId);
      
      toast({
        title: "Response Sent",
        description: "AI-generated response has been sent successfully"
      });
      
      // Update email status
      setSelectedEmail({ ...selectedEmail, status: 'responded' });
    } catch (error) {
      console.error('Error sending response:', error);
      toast({
        title: "Send Failed",
        description: "Could not send response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const parseEmailForTasks = async () => {
    if (!selectedEmail) return;

    setIsProcessing(true);
    try {
      const tasks = await emailIntegrationService.parseEmailForTasks(selectedEmail, projectId);
      
      if (tasks.length > 0) {
        onTasksCreated?.(tasks);
        toast({
          title: "Tasks Created",
          description: `${tasks.length} tasks extracted from email`
        });
      } else {
        toast({
          title: "No Tasks Found",
          description: "No actionable tasks detected in this email"
        });
      }
    } catch (error) {
      console.error('Error parsing tasks:', error);
      toast({
        title: "Parsing Failed",
        description: "Could not extract tasks from email",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const generateDocument = async () => {
    if (!selectedEmail) return;

    setIsProcessing(true);
    try {
      const result = await emailIntegrationService.generateDocumentFromEmail(selectedEmail, projectId);
      
      onDocumentGenerated?.(result.document);
      toast({
        title: "Document Generated",
        description: "AI has created a document based on the email request"
      });
    } catch (error) {
      console.error('Error generating document:', error);
      toast({
        title: "Generation Failed",
        description: "Could not generate document from email",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getAnalysisBadge = (analysis: any) => {
    if (!analysis) return null;
    
    const priorityColors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800', 
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={priorityColors[analysis.priority as keyof typeof priorityColors]}>
        {analysis.priority} • {analysis.intent}
      </Badge>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          AI Email Communication Hub
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="inbox" className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              Inbox
            </TabsTrigger>
            <TabsTrigger value="compose" className="flex items-center gap-1">
              <Send className="h-4 w-4" />
              Compose
            </TabsTrigger>
            <TabsTrigger value="ai-actions" className="flex items-center gap-1">
              <Zap className="h-4 w-4" />
              AI Actions
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inbox" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-96">
              {/* Email List */}
              <div>
                <h4 className="font-medium mb-3">Project Emails</h4>
                <ScrollArea className="h-80">
                  {emails.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No emails found for this project</p>
                      <p className="text-sm">Set up email integration to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {emails.map((email) => (
                        <div
                          key={email.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedEmail?.id === email.id 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => setSelectedEmail(email)}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <span className="font-medium text-sm truncate">{email.from}</span>
                            {getAnalysisBadge(email.analysis)}
                          </div>
                          <p className="text-sm font-medium truncate">{email.subject}</p>
                          <p className="text-xs text-muted-foreground truncate">{email.body}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              {email.timestamp.toLocaleDateString()}
                            </span>
                            <Badge 
                              variant={email.status === 'responded' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {email.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Email Detail */}
              <div>
                {selectedEmail ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">Email Details</h4>
                      <div className="mt-2 p-3 border rounded-lg bg-muted/50">
                        <div className="text-sm space-y-1">
                          <p><strong>From:</strong> {selectedEmail.from}</p>
                          <p><strong>Subject:</strong> {selectedEmail.subject}</p>
                          <p><strong>Status:</strong> {selectedEmail.status}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium mb-2">Email Content</h5>
                      <ScrollArea className="h-32 p-3 border rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{selectedEmail.body}</p>
                      </ScrollArea>
                    </div>

                    {selectedEmail.analysis && (
                      <div>
                        <h5 className="font-medium mb-2">AI Analysis</h5>
                        <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                          <div className="text-sm space-y-1">
                            <p><strong>Intent:</strong> {selectedEmail.analysis.intent}</p>
                            <p><strong>Priority:</strong> {selectedEmail.analysis.priority}</p>
                            <p><strong>Stakeholder:</strong> {selectedEmail.analysis.stakeholder_type}</p>
                            <p><strong>Requires Response:</strong> {selectedEmail.analysis.requires_response ? 'Yes' : 'No'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => processEmail(selectedEmail)} disabled={isProcessing}>
                        <Bot className="h-3 w-3 mr-1" />
                        Analyze
                      </Button>
                      <Button size="sm" variant="outline" onClick={parseEmailForTasks} disabled={isProcessing}>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Extract Tasks
                      </Button>
                      <Button size="sm" variant="outline" onClick={generateDocument} disabled={isProcessing}>
                        <FileText className="h-3 w-3 mr-1" />
                        Generate Doc
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select an email to view details</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="compose" className="mt-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">AI-Assisted Email Composition</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">To:</label>
                      <Input placeholder="recipient@example.com" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Subject:</label>
                      <Input placeholder="Email subject" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Message:</label>
                    <Textarea 
                      placeholder="Type your message or let AI help compose it..."
                      rows={8}
                      value={aiResponse}
                      onChange={(e) => setAiResponse(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <Button variant="outline">
                      <Bot className="h-4 w-4 mr-2" />
                      AI Compose
                    </Button>
                    <Button onClick={sendAIResponse} disabled={isProcessing}>
                      <Send className="h-4 w-4 mr-2" />
                      Send Email
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ai-actions" className="mt-4">
            <div className="space-y-4">
              <h4 className="font-medium">AI-Powered Actions</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Task Automation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      AI automatically creates tasks from email requests and action items.
                    </p>
                    <Button size="sm" variant="outline" className="w-full">
                      Configure Task Rules
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      Document Generation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Generate regulatory documents, reports, and responses automatically.
                    </p>
                    <Button size="sm" variant="outline" className="w-full">
                      Manage Templates
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      Smart Escalation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Automatically escalate critical emails to the right team members.
                    </p>
                    <Button size="sm" variant="outline" className="w-full">
                      Setup Escalation Rules
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-600" />
                      Stakeholder Intelligence
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      AI adapts communication style based on stakeholder profiles.
                    </p>
                    <Button size="sm" variant="outline" className="w-full">
                      Manage Stakeholders
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <div className="space-y-4">
              <h4 className="font-medium">Email Integration Settings</h4>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h5 className="font-medium">Auto-Reply</h5>
                    <p className="text-sm text-muted-foreground">
                      Automatically generate and send AI responses to emails
                    </p>
                  </div>
                  <Button 
                    variant={config.autoReply ? "default" : "outline"}
                    size="sm"
                    onClick={() => setConfig(prev => ({ ...prev, autoReply: !prev.autoReply }))}
                  >
                    {config.autoReply ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>

                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium mb-3">Email Integration Status</h5>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">AI Analysis Engine</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm">Email Webhook Setup (Pending)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm">Gmail Integration (Not Connected)</span>
                    </div>
                  </div>
                  
                  <Button className="mt-3 w-full">
                    Setup Email Integration
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
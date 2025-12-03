import { ArrowLeft, CheckCircle, AlertCircle, HelpCircle, Mail, FileText, Settings, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const WordAddinSupport = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <h1 className="text-4xl font-bold text-foreground mb-4">IPO AI Assistant Support</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Get help with the Microsoft Word Add-in for IPO prospectus compliance
        </p>

        {/* Quick Start Guide */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Quick Start Guide
            </CardTitle>
            <CardDescription>Get up and running in minutes</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">1</span>
                <div>
                  <p className="font-medium text-foreground">Install the Add-in</p>
                  <p className="text-muted-foreground">Open Word → Insert → Get Add-ins → Search "IPO AI Assistant" → Add</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">2</span>
                <div>
                  <p className="font-medium text-foreground">Sign In</p>
                  <p className="text-muted-foreground">Click the IPO AI Assistant button in the Home ribbon and sign in with your account</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">3</span>
                <div>
                  <p className="font-medium text-foreground">Analyze Your Document</p>
                  <p className="text-muted-foreground">Open your IPO prospectus draft and click "Analyze Document" for AI-powered compliance checking</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">4</span>
                <div>
                  <p className="font-medium text-foreground">Review & Apply</p>
                  <p className="text-muted-foreground">Review each suggestion, then Accept or Reject to update your document</p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Features */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Key Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium text-foreground mb-2">HKEX Compliance Analysis</h4>
                <p className="text-sm text-muted-foreground">
                  AI-powered analysis against Hong Kong Stock Exchange listing rules and regulations
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium text-foreground mb-2">Track Changes Integration</h4>
                <p className="text-sm text-muted-foreground">
                  Suggested amendments apply directly as Word track changes for easy review
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium text-foreground mb-2">Regulatory Citations</h4>
                <p className="text-sm text-muted-foreground">
                  Every suggestion includes specific rule references (e.g., HKEX Main Board Rule 11.07)
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium text-foreground mb-2">Bilingual Support</h4>
                <p className="text-sm text-muted-foreground">
                  Full support for English and Traditional Chinese prospectus documents
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Which versions of Word are supported?</AccordionTrigger>
                <AccordionContent>
                  IPO AI Assistant supports Microsoft Word 2016 and later, Microsoft 365 (desktop and web), 
                  and Word for Mac 2019 and later. The add-in requires an internet connection for AI analysis.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2">
                <AccordionTrigger>Is my document content secure?</AccordionTrigger>
                <AccordionContent>
                  Yes. Your document content is transmitted over encrypted connections (TLS 1.3) and processed 
                  in secure environments. We do not store your full document content - only session metadata 
                  and anonymized usage statistics. See our Privacy Policy for details.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3">
                <AccordionTrigger>What regulatory frameworks are covered?</AccordionTrigger>
                <AccordionContent>
                  Currently, we focus on Hong Kong Stock Exchange (HKEX) Main Board and GEM listing rules, 
                  including the Securities and Futures Ordinance (SFO), Companies Ordinance, and related 
                  HKEX guidance letters and FAQs. Support for other jurisdictions is planned.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-4">
                <AccordionTrigger>Can I use this for documents in Chinese?</AccordionTrigger>
                <AccordionContent>
                  Yes! The AI Assistant fully supports Traditional Chinese (繁體中文) documents. 
                  The system automatically detects the document language and provides analysis 
                  and suggestions in the same language.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-5">
                <AccordionTrigger>Why was a suggestion rejected by the AI?</AccordionTrigger>
                <AccordionContent>
                  Sometimes the AI may not flag certain passages. This can happen because: 
                  (1) the text is compliant as written, (2) the issue is context-dependent and requires 
                  human judgment, or (3) the specific rule isn't in our current database. Always consult 
                  with legal professionals for final compliance verification.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-6">
                <AccordionTrigger>How do I undo applied changes?</AccordionTrigger>
                <AccordionContent>
                  All changes are applied using Word's Track Changes feature. You can accept or reject 
                  individual changes using Word's Review tab, or use Ctrl+Z (Cmd+Z on Mac) to undo 
                  recent changes. You can also use Word's version history to restore previous versions.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Troubleshooting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-foreground mb-2">Add-in doesn't appear in Word</h4>
              <p className="text-sm text-muted-foreground mb-2">Try these steps:</p>
              <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1">
                <li>Restart Microsoft Word</li>
                <li>Check that you're signed into Microsoft 365</li>
                <li>Go to Insert → Get Add-ins → My Add-ins to verify installation</li>
                <li>Clear the Office cache: File → Options → Trust Center → Clear</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-foreground mb-2">Analysis is taking too long</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Large documents may take 30-60 seconds to analyze. If analysis exceeds 2 minutes:
              </p>
              <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1">
                <li>Check your internet connection</li>
                <li>Try analyzing a smaller section of the document</li>
                <li>Contact support if the issue persists</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-foreground mb-2">Sign-in issues</h4>
              <p className="text-sm text-muted-foreground mb-2">If you can't sign in:</p>
              <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1">
                <li>Verify your email and password are correct</li>
                <li>Check if your account is active at the web portal</li>
                <li>Try signing out and back in</li>
                <li>Clear browser cookies if using Word Online</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Contact Support
            </CardTitle>
            <CardDescription>Need more help? We're here for you.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Email Support</p>
                  <a href="mailto:support@ipo-ai-assistant.com" className="text-primary hover:underline">
                    support@ipo-ai-assistant.com
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Documentation</p>
                  <Link to="/privacy-policy" className="text-primary hover:underline mr-4">
                    Privacy Policy
                  </Link>
                  <Link to="/terms-of-use" className="text-primary hover:underline">
                    Terms of Use
                  </Link>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Response time: We aim to respond to all support requests within 24 business hours.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WordAddinSupport;

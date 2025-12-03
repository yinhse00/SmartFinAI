import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Download, 
  CheckCircle2, 
  ArrowRight,
  Monitor,
  Sparkles,
  Shield,
  MessageSquare
} from 'lucide-react';

interface AddinInstallGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddinInstallGuide: React.FC<AddinInstallGuideProps> = ({
  open,
  onOpenChange,
}) => {
  const handleDownloadManifest = () => {
    // Download the manifest file for sideloading
    window.open('/word-addin/manifest-production.xml', '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            IPO AI Assistant for Word
          </DialogTitle>
          <DialogDescription className="text-base">
            Get AI-powered HKEX compliance checking directly in Microsoft Word
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Features Banner */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-medium">AI Analysis</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Shield className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium">Track Changes</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium">Smart Comments</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Monitor className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium">Auto-Open Panel</span>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-5 border border-primary/20">
            <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              How It Works
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium text-sm">Download & Open Document</p>
                  <p className="text-sm text-muted-foreground">Download your prospectus from the web app and open it in Word Desktop</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium text-sm">AI Panel Opens Automatically</p>
                  <p className="text-sm text-muted-foreground">The IPO AI Assistant panel auto-opens in the sidebar (after first setup)</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium text-sm">Click "Analyze" for Compliance Check</p>
                  <p className="text-sm text-muted-foreground">AI reviews your document and suggests amendments with regulatory citations</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                  4
                </div>
                <div>
                  <p className="font-medium text-sm">Apply as Track Changes</p>
                  <p className="text-sm text-muted-foreground">Accept or reject amendments — all changes appear as Track Changes with comments</p>
                </div>
              </div>
            </div>
          </div>

          {/* Installation Steps */}
          <div className="border rounded-xl p-5">
            <h3 className="font-semibold text-base mb-4">First-Time Setup (2 minutes)</h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold">1</div>
                <span className="text-sm flex-1">Open any document in <strong>Word Desktop</strong></span>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold">2</div>
                <span className="text-sm flex-1">Go to <strong>Insert → Get Add-ins → My Add-ins</strong></span>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold">3</div>
                <div className="flex-1">
                  <span className="text-sm">Click <strong>"Upload My Add-in"</strong> and select the manifest file</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={handleDownloadManifest}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download manifest.xml
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold">4</div>
                <span className="text-sm flex-1">Click <strong>"IPO AI Assistant"</strong> in the Home ribbon to open the panel</span>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm flex-1 text-green-700 dark:text-green-400">
                  <strong>Done!</strong> The panel will auto-open for all future documents
                </span>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-4">
            <p className="font-medium mb-2">Requirements:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Microsoft Word 2016 or later (Windows or Mac)</li>
              <li>Microsoft 365 subscription (for best experience)</li>
              <li>Internet connection for AI analysis</li>
            </ul>
          </div>

          {/* CTA */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={handleDownloadManifest} className="gap-2">
              <Download className="h-4 w-4" />
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
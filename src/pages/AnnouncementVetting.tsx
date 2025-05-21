
import MainLayout from "@/components/layout/MainLayout";
import VettingRequirementsDisplay from "@/components/references/VettingRequirementsDisplay";
import VettingChecker from "@/components/references/VettingChecker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, CheckSquare } from "lucide-react";
import { Link } from "react-router-dom";

export default function AnnouncementVetting() {
  return (
    <MainLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-finance-dark-blue dark:text-white">
            Announcement Pre-Vetting
          </h1>
          <Button variant="outline" asChild className="gap-1">
            <Link to="/references">
              <ArrowLeft className="h-4 w-4" /> Back to References
            </Link>
          </Button>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Check pre-vetting requirements for different headline categories
        </p>
      </div>

      <Tabs defaultValue="requirements">
        <TabsList className="mb-4">
          <TabsTrigger value="requirements" className="gap-2">
            <BookOpen className="h-4 w-4" />
            <span>Requirements</span>
          </TabsTrigger>
          <TabsTrigger value="checker" className="gap-2">
            <CheckSquare className="h-4 w-4" />
            <span>Vetting Checker</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="requirements" className="space-y-4">
          <VettingRequirementsDisplay />
        </TabsContent>
        
        <TabsContent value="checker">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1">
              <VettingChecker />
            </div>
            
            <div className="col-span-1 md:col-span-2">
              <div className="border rounded-md p-6 space-y-4 bg-slate-50 dark:bg-slate-900">
                <h3 className="text-lg font-medium">Pre-Vetting Process Guide</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">1. Determine if Pre-Vetting is Required</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Use the checker to determine if your announcement requires pre-vetting based on its headline category.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">2. Submit for Pre-Vetting</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      If pre-vetting is required, submit your draft announcement at least 2 business days before the intended publication date.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">3. Review Process</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      The regulatory department will review your announcement and provide feedback or approval, typically within 1-2 business days.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">4. Publication</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Once approved, your announcement can be published through the regular channels.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}

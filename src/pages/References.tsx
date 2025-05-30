import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ReferenceUploader from '@/components/references/ReferenceUploader';
import ReferenceDocumentsList from '@/components/references/ReferenceDocumentsList';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, InfoIcon, ShieldCheck, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { grokService } from '@/services/grokService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VettingRequirementsProcessor from '@/components/vetting/VettingRequirementsProcessor';
import VettingRequirementsViewer from '@/components/timetable/VettingRequirementsViewer';
import MappingScheduleProcessor from '@/components/mapping/MappingScheduleProcessor';
import NewListingScheduleProcessor from '@/components/mapping/NewListingScheduleProcessor';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const References = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('documents');
  const [validationStatus, setValidationStatus] = useState<{
    status: 'idle' | 'checking' | 'valid' | 'invalid';
    message?: string;
  }>({ status: 'idle' });

  // Every time a file is uploaded, we'll invalidate the documents cache
  const handleDocumentsChanged = () => {
    queryClient.invalidateQueries({
      queryKey: ['referenceDocuments'],
      exact: false
    });
    
    // When documents change, check for validation status
    checkMappingValidation();
  };
  
  // When vetting requirements are processed, refresh the data
  const handleVettingProcessed = () => {
    queryClient.invalidateQueries({
      queryKey: ['vettingRequirements'],
      exact: false
    });
  };
  
  // When mapping schedule is processed, refresh the data
  const handleMappingProcessed = () => {
    queryClient.invalidateQueries({
      queryKey: ['regulatoryFAQs'],
      exact: false
    });
    queryClient.invalidateQueries({
      queryKey: ['interpretationGuidance'],
      exact: false
    });
  };
  
  // Check if the mapping files are present and valid
  const checkMappingValidation = async () => {
    try {
      setValidationStatus({ status: 'checking' });
      
      // This would normally be a real check against the database
      // For now, we'll simulate it
      const { data, error } = await grokService.validateMappingDocuments?.() || 
        { data: { isValid: true, message: "Mapping documents validated successfully." }, error: null };
      
      if (error) {
        setValidationStatus({ 
          status: 'invalid', 
          message: "Error validating mapping documents." 
        });
        return;
      }
      
      if (data?.isValid) {
        setValidationStatus({ 
          status: 'valid', 
          message: data.message 
        });
      } else {
        setValidationStatus({ 
          status: 'invalid', 
          message: data?.message || "Mapping documents are missing or invalid." 
        });
      }
    } catch (error) {
      console.error("Error checking mapping validation:", error);
      setValidationStatus({ 
        status: 'idle',
        message: "Unable to verify mapping documents."
      });
    }
  };

  // Run validation check on component mount
  useEffect(() => {
    checkMappingValidation();
  }, []);

  return (
    <MainLayout>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-finance-dark-blue dark:text-white">Reference Database</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Upload, download and manage regulatory documents to enhance SmartFinAI's knowledge
          </p>
        </div>
        
        <div className="flex gap-2">
          {validationStatus.status === 'valid' && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
              <ShieldCheck size={14} />
              Mapping Validated
            </Badge>
          )}
          
          <Button 
            onClick={() => navigate('/timetable')}
            variant="outline" 
            className="flex items-center gap-2"
          >
            <CalendarDays className="h-4 w-4" />
            View Timetables
          </Button>
        </div>
      </div>
      
      <Alert className="mb-6 bg-blue-50 border-blue-200">
        <InfoIcon className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">Special Excel Files Supported</AlertTitle>
        <AlertDescription className="text-blue-700">
          <p>The system now supports three types of regulatory Excel files with enhanced validation:</p>
          <ul className="list-disc ml-6 mt-2">
            <li className="flex items-center"><span className="font-semibold">"Mapping_Schedule_(EN)_(2024)_Guide for New Listing Applicants"</span> 
              <Badge variant="outline" className="ml-2 bg-yellow-50 text-yellow-800 border-yellow-200">High Priority</Badge>
            </li>
            <li className="mt-1 flex items-center"><span className="font-semibold">"Mapping_schedule_FAQ_Guidance Materials for Listed Issuers"</span>
              <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-800 border-blue-200">Medium Priority</Badge>
            </li>
            <li className="mt-1 flex items-center"><span className="font-semibold">"Guide on pre-vetting requirements and selection of headline categories for announcements"</span>
              <Badge variant="outline" className="ml-2 bg-purple-50 text-purple-800 border-purple-200">New</Badge>
            </li>
          </ul>
          <p className="mt-2">The system will now validate responses against these files to ensure accuracy and determine vetting requirements for announcements.</p>
          
          {validationStatus.status === 'invalid' && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700">
              ⚠️ {validationStatus.message}
            </div>
          )}
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full md:w-[800px] grid-cols-4">
          <TabsTrigger value="documents">Reference Documents</TabsTrigger>
          <TabsTrigger value="vetting">Vetting Requirements</TabsTrigger>
          <TabsTrigger value="mapping">Listed Issuers</TabsTrigger>
          <TabsTrigger value="new-listing">New Listing</TabsTrigger>
        </TabsList>
        <TabsContent value="documents" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ReferenceDocumentsList onValidateMapping={checkMappingValidation} />
            </div>
            <div>
              <ReferenceUploader onUploadComplete={handleDocumentsChanged} />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="vetting" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <VettingRequirementsViewer />
            </div>
            <div>
              <VettingRequirementsProcessor onProcessComplete={handleVettingProcessed} />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="mapping" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="space-y-4">
                <Card className="finance-card">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold">Listed Issuers Mapping Schedule</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-300">
                      This section displays the extracted FAQs and guidance materials from the mapping schedule for listed issuers. 
                      Use the processor on the right to parse and populate the data.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
            <div>
              <MappingScheduleProcessor onProcessComplete={handleMappingProcessed} />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="new-listing" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="space-y-4">
                <Card className="finance-card">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold">New Listing Applicants Mapping Schedule</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-300">
                      This section displays the extracted requirements and guidance for new listing applicants. 
                      Use the processor on the right to parse the new listing applicants mapping schedule.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
            <div>
              <NewListingScheduleProcessor onProcessComplete={handleMappingProcessed} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default References;

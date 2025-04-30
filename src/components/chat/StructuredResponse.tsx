
import React from 'react';
import { File, FileCheck, CheckSquare, Calendar } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface StructuredResponseProps {
  rulesAnalysis?: string;
  documentsChecklist?: string;
  executionPlan?: string;
  executionTimetable?: string;
}

const StructuredResponse: React.FC<StructuredResponseProps> = ({
  rulesAnalysis,
  documentsChecklist,
  executionPlan,
  executionTimetable
}) => {
  // Only show sections that have content
  const hasSections = rulesAnalysis || documentsChecklist || executionPlan || executionTimetable;
  
  if (!hasSections) {
    return null;
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden my-4">
      <Accordion type="multiple" defaultValue={['rules-analysis']}>
        {rulesAnalysis && (
          <AccordionItem value="rules-analysis">
            <AccordionTrigger className="px-4 py-2 hover:no-underline hover:bg-gray-50 dark:hover:bg-gray-900">
              <div className="flex items-center gap-2">
                <File className="h-4 w-4" />
                <span>Rules Analysis</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 py-2 text-sm whitespace-pre-wrap">
              {rulesAnalysis}
            </AccordionContent>
          </AccordionItem>
        )}
        
        {documentsChecklist && (
          <AccordionItem value="documents-checklist">
            <AccordionTrigger className="px-4 py-2 hover:no-underline hover:bg-gray-50 dark:hover:bg-gray-900">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                <span>Documents to be Prepared</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 py-2 text-sm whitespace-pre-wrap">
              {documentsChecklist}
            </AccordionContent>
          </AccordionItem>
        )}
        
        {executionPlan && (
          <AccordionItem value="execution-plan">
            <AccordionTrigger className="px-4 py-2 hover:no-underline hover:bg-gray-50 dark:hover:bg-gray-900">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                <span>Execution Plan</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 py-2 text-sm whitespace-pre-wrap">
              {executionPlan}
            </AccordionContent>
          </AccordionItem>
        )}
        
        {executionTimetable && (
          <AccordionItem value="execution-timetable">
            <AccordionTrigger className="px-4 py-2 hover:no-underline hover:bg-gray-50 dark:hover:bg-gray-900">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Execution Timetable</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 py-2 text-sm whitespace-pre-wrap">
              {executionTimetable}
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
};

export default StructuredResponse;

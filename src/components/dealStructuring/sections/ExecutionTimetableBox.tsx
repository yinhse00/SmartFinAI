
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Calendar, CheckCircle } from 'lucide-react';
import { AnalysisResults } from '../AIAnalysisResults';
import { EnlargedContentDialog } from '../dialogs/EnlargedContentDialog';

interface ExecutionTimetableBoxProps {
  results: AnalysisResults;
}

const EnlargedTimetableContent = ({ results }: { results: AnalysisResults }) => (
  <div className="space-y-8 p-6">
    <div className="text-center p-8 bg-orange-50 rounded-lg">
      <Clock className="h-12 w-12 mx-auto mb-4 text-orange-600" />
      <p className="text-3xl font-bold text-orange-700 mb-2">{results.timetable.totalDuration}</p>
      <p className="text-lg text-orange-600">Total Project Duration</p>
      <p className="text-sm text-gray-600 mt-2">From initiation to completion</p>
    </div>
    
    <div>
      <h4 className="text-xl font-semibold mb-6">Detailed Timeline & Milestones</h4>
      <div className="space-y-6">
        {results.timetable.keyMilestones.map((milestone, index) => (
          <div key={index} className="relative">
            <div className="flex items-start space-x-6 pb-6">
              <div className="flex-shrink-0 w-24 text-center">
                <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm font-medium">
                  {milestone.date}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center mb-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <h5 className="text-lg font-semibold">{milestone.event}</h5>
                </div>
                <p className="text-gray-600 leading-relaxed mb-3">{milestone.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Dependencies:</span>
                    <span className="text-gray-600 ml-2">Previous milestone completion</span>
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span>
                    <span className="text-gray-600 ml-2">2-3 weeks</span>
                  </div>
                </div>
              </div>
            </div>
            {index < results.timetable.keyMilestones.length - 1 && (
              <div className="absolute left-12 top-16 w-0.5 h-6 bg-gray-300"></div>
            )}
          </div>
        ))}
      </div>
    </div>
    
    <div>
      <h4 className="text-xl font-semibold mb-4">Critical Path Analysis</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 border rounded-lg">
          <h5 className="font-medium mb-2 text-red-600">Critical Activities</h5>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Regulatory approval submissions</li>
            <li>• Due diligence completion</li>
            <li>• Shareholder approval process</li>
            <li>• Documentation finalization</li>
          </ul>
        </div>
        <div className="p-4 border rounded-lg">
          <h5 className="font-medium mb-2 text-blue-600">Parallel Activities</h5>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Marketing material preparation</li>
            <li>• Legal documentation drafting</li>
            <li>• Financial modeling updates</li>
            <li>• Stakeholder communications</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);

export const ExecutionTimetableBox = ({ results }: ExecutionTimetableBoxProps) => {
  return (
    <Card className="h-[350px] flex flex-col min-h-0">
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-orange-500" />
            Execution Timetable
          </CardTitle>
          <EnlargedContentDialog
            title="Detailed Execution Timetable"
            enlargedContent={<EnlargedTimetableContent results={results} />}
            size="large"
          >
            <div />
          </EnlargedContentDialog>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 min-h-0">
        <ScrollArea className="h-full px-6 pb-6" type="always">
          <div className="mb-6 text-center p-4 bg-orange-50 rounded-lg">
            <p className="font-semibold text-orange-700 text-lg">{results.timetable.totalDuration}</p>
            <p className="text-sm text-orange-600 mt-1">Total Duration</p>
          </div>
          
          <div className="space-y-4">
            {results.timetable.keyMilestones.map((milestone, index) => (
              <div key={index} className="flex items-start space-x-4 pb-4 border-b last:border-b-0">
                <div className="flex-shrink-0 w-20 text-sm font-medium text-gray-500">
                  {milestone.date}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-base mb-2">{milestone.event}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

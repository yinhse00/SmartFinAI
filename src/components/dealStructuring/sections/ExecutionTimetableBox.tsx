
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock } from 'lucide-react';
import { AnalysisResults } from '../AIAnalysisResults';

interface ExecutionTimetableBoxProps {
  results: AnalysisResults;
}

export const ExecutionTimetableBox = ({ results }: ExecutionTimetableBoxProps) => {
  return (
    <Card className="h-full flex flex-col min-h-0">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4 text-orange-500" />
          Execution Timetable
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 min-h-0">
        <ScrollArea className="h-full px-4 pb-4" type="always">
          <div className="mb-4 text-center p-3 bg-orange-50 rounded-lg">
            <p className="font-medium text-orange-700 text-sm">{results.timetable.totalDuration}</p>
            <p className="text-xs text-orange-600">Total Duration</p>
          </div>
          
          <div className="space-y-3">
            {results.timetable.keyMilestones.map((milestone, index) => (
              <div key={index} className="flex items-start space-x-3 pb-3 border-b last:border-b-0">
                <div className="flex-shrink-0 w-16 text-xs font-medium text-gray-500">
                  {milestone.date}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm mb-1">{milestone.event}</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

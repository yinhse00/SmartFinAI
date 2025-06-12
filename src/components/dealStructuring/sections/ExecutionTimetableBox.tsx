
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock } from 'lucide-react';
import { AnalysisResults } from '../AIAnalysisResults';

interface ExecutionTimetableBoxProps {
  results: AnalysisResults;
}

export const ExecutionTimetableBox = ({ results }: ExecutionTimetableBoxProps) => {
  return (
    <Card className="h-[350px] flex flex-col min-h-0">
      <CardHeader className="pb-4 flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-orange-500" />
          Execution Timetable
        </CardTitle>
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

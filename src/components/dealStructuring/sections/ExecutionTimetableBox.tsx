
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, CheckCircle, ArrowRight, Maximize2 } from 'lucide-react';
import { AnalysisResults } from '../AIAnalysisResults';
import { EnlargedContentDialog } from '../dialogs/EnlargedContentDialog';

interface ExecutionTimetableBoxProps {
  results: AnalysisResults;
}

export const ExecutionTimetableBox = ({ results }: ExecutionTimetableBoxProps) => {
  // Prioritize critical path milestones if available
  const displayMilestones = results.timetable.criticalPath && results.timetable.criticalPath.length > 0 
    ? results.timetable.criticalPath 
    : results.timetable.keyMilestones.map(m => ({ ...m, milestone: m.event }));

  const timetableContent = (
    <div className="h-full overflow-y-auto space-y-3">
      {/* Key Dependencies */}
      {results.timetable.keyDependencies && results.timetable.keyDependencies.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <h5 className="font-medium text-sm text-blue-800 mb-2 flex items-center gap-1">
            <ArrowRight className="h-3 w-3" />
            Key Dependencies
          </h5>
          <div className="space-y-1">
            {results.timetable.keyDependencies.slice(0, 2).map((dependency, index) => (
              <div key={index} className="text-xs text-blue-700">• {dependency}</div>
            ))}
            {results.timetable.keyDependencies.length > 2 && (
              <div className="text-xs text-blue-600 italic">
                +{results.timetable.keyDependencies.length - 2} more dependencies
              </div>
            )}
          </div>
        </div>
      )}

      {/* Critical Path Milestones */}
      <div className="space-y-3">
        <h5 className="font-medium text-sm flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          Critical Path Milestones
        </h5>
        
        {displayMilestones.map((milestone, index) => (
          <div key={index} className="relative">
            {/* Timeline connector */}
            {index < displayMilestones.length - 1 && (
              <div className="absolute left-3 top-8 w-px h-6 bg-gray-300" />
            )}
            
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs font-medium text-orange-600">
                    {milestone.date}
                  </div>
                  {'impact' in milestone && milestone.impact && (
                    <Badge 
                      variant={
                        milestone.impact === 'high' ? 'destructive' : 
                        milestone.impact === 'medium' ? 'default' : 'secondary'
                      }
                      className="text-xs px-1 py-0"
                    >
                      {milestone.impact}
                    </Badge>
                  )}
                </div>
                
                <p className="font-medium text-sm text-gray-900 mb-1">
                  {'milestone' in milestone ? milestone.milestone : milestone.event}
                </p>
                
                <p className="text-xs text-gray-600 leading-relaxed">
                  {milestone.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Timing Risks */}
      {results.timetable.timingRisks && results.timetable.timingRisks.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-4">
          <h5 className="font-medium text-sm text-orange-800 mb-2 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Timing Risks
          </h5>
          <div className="space-y-1">
            {results.timetable.timingRisks.slice(0, 3).map((risk, index) => (
              <div key={index} className="text-xs text-orange-700">• {risk}</div>
            ))}
            {results.timetable.timingRisks.length > 3 && (
              <div className="text-xs text-orange-600 italic">
                +{results.timetable.timingRisks.length - 3} more risks identified
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="bg-gray-100 rounded-lg p-3 mt-4">
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <div className="text-lg font-bold text-gray-900">
              {displayMilestones.length}
            </div>
            <div className="text-xs text-gray-600">Critical Milestones</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">
              {results.timetable.keyDependencies?.length || 0}
            </div>
            <div className="text-xs text-gray-600">Dependencies</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="h-[500px]">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Critical Path Execution
            </CardTitle>
            <div className="text-sm text-gray-600 mt-1">
              Duration: <span className="font-medium">{results.timetable.totalDuration}</span>
            </div>
          </div>
          <EnlargedContentDialog
            title="Critical Path Execution Timeline"
            size="large"
            enlargedContent={
              <div className="h-[70vh] w-full">
                {timetableContent}
              </div>
            }
          >
            <button
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Expand timeline"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </EnlargedContentDialog>
        </div>
      </CardHeader>
      <CardContent className="h-[400px] overflow-y-auto space-y-3">
        {timetableContent}
      </CardContent>
    </Card>
  );
};

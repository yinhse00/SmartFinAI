
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TimelineEvent {
  date: string;
  title: string;
  description: string;
  type: 'deadline' | 'milestone' | 'submission' | 'approval';
  status?: 'completed' | 'pending' | 'upcoming';
}

interface TimelineChartProps {
  events: TimelineEvent[];
  title?: string;
  className?: string;
}

const TimelineChart: React.FC<TimelineChartProps> = ({ 
  events, 
  title, 
  className = "" 
}) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'deadline': return 'bg-red-500';
      case 'milestone': return 'bg-blue-500';
      case 'submission': return 'bg-yellow-500';
      case 'approval': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'completed': return <Badge variant="outline" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'pending': return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'upcoming': return <Badge variant="outline" className="bg-blue-100 text-blue-800">Upcoming</Badge>;
      default: return null;
    }
  };

  return (
    <Card className={`w-full ${className}`}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-300"></div>
          
          {/* Timeline events */}
          <div className="space-y-6">
            {events.map((event, index) => (
              <div key={index} className="relative flex items-start">
                {/* Timeline dot */}
                <div className={`absolute left-4 w-4 h-4 rounded-full border-2 border-white ${getTypeColor(event.type)} z-10`}></div>
                
                {/* Event content */}
                <div className="ml-12 pb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-gray-600">{event.date}</span>
                    {getStatusBadge(event.status)}
                  </div>
                  <h4 className="font-semibold text-base mb-1">{event.title}</h4>
                  <p className="text-sm text-gray-600">{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimelineChart;

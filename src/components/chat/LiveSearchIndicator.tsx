
import { Badge } from '@/components/ui/badge';
import { Globe, Database, Zap } from 'lucide-react';

interface LiveSearchIndicatorProps {
  searchStrategy?: 'local_only' | 'live_only' | 'hybrid' | 'failed';
  liveResultsCount?: number;
  localResultsCount?: number;
  className?: string;
}

const LiveSearchIndicator = ({ 
  searchStrategy, 
  liveResultsCount = 0, 
  localResultsCount = 0,
  className = "" 
}: LiveSearchIndicatorProps) => {
  if (!searchStrategy || searchStrategy === 'failed') {
    return null;
  }

  const getIndicatorConfig = () => {
    switch (searchStrategy) {
      case 'live_only':
        return {
          icon: <Globe className="w-3 h-3" />,
          text: `Live Search (${liveResultsCount} results)`,
          variant: 'secondary' as const,
          description: 'Real-time web search results'
        };
      case 'hybrid':
        return {
          icon: <Zap className="w-3 h-3" />,
          text: `Hybrid Search (${localResultsCount + liveResultsCount} results)`,
          variant: 'default' as const,
          description: 'Combined database and live search results'
        };
      case 'local_only':
        return {
          icon: <Database className="w-3 h-3" />,
          text: `Database Search (${localResultsCount} results)`,
          variant: 'outline' as const,
          description: 'Local regulatory database results'
        };
      default:
        return null;
    }
  };

  const config = getIndicatorConfig();
  if (!config) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        <span className="text-xs">{config.text}</span>
      </Badge>
      <span className="text-xs text-muted-foreground">
        {config.description}
      </span>
    </div>
  );
};

export default LiveSearchIndicator;

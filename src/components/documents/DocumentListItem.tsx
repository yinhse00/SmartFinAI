
import { FileText, Calendar, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DocumentListItemProps {
  title: string;
  type: string;
  date: Date;
  datePrefix: string;
  isHighlighted?: boolean;
  onClick?: () => void;
}

const DocumentListItem = ({ 
  title, 
  type, 
  date, 
  datePrefix,
  isHighlighted = false,
  onClick
}: DocumentListItemProps) => {
  return (
    <div 
      className={cn(
        "flex space-x-4 p-4 rounded-lg border transition-colors mb-4 cursor-pointer",
        isHighlighted 
          ? "border-finance-accent-blue/50 dark:border-finance-accent-blue/30 bg-finance-accent-blue/5" 
          : "border-gray-100 dark:border-finance-medium-blue/20 hover:bg-gray-50 dark:hover:bg-finance-medium-blue/10",
      )}
      onClick={onClick}
    >
      <div className={cn(
        "rounded-md p-3",
        isHighlighted 
          ? "bg-finance-accent-blue/20 dark:bg-finance-accent-blue/20" 
          : "bg-finance-highlight dark:bg-finance-medium-blue/30"
      )}>
        <FileText className={cn(
          "h-6 w-6", 
          isHighlighted 
            ? "text-finance-accent-blue" 
            : "text-finance-medium-blue dark:text-finance-accent-blue"
        )} />
      </div>
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <h3 className="font-medium text-finance-dark-blue dark:text-white flex items-center">
            {title}
            {onClick && <ExternalLink className="h-3.5 w-3.5 ml-2 text-gray-400" />}
          </h3>
          <Badge variant={type.includes("Generated") ? "default" : "outline"} className="text-xs">
            {type.includes("Generated") ? "AI Generated" : "Uploaded"}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
          {type}
        </p>
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-4">
          <div className="flex items-center">
            <Calendar className="h-3.5 w-3.5 mr-1" />
            <span>{datePrefix} {date.toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentListItem;


import { FileText, Calendar } from 'lucide-react';

interface DocumentListItemProps {
  title: string;
  type: string;
  date: Date;
  datePrefix: string;
}

const DocumentListItem = ({ title, type, date, datePrefix }: DocumentListItemProps) => {
  return (
    <div className="flex space-x-4 p-4 rounded-lg border border-gray-100 dark:border-finance-medium-blue/20 hover:bg-gray-50 dark:hover:bg-finance-medium-blue/10 transition-colors mb-4">
      <div className="rounded-md bg-finance-highlight dark:bg-finance-medium-blue/30 p-3">
        <FileText className="h-6 w-6 text-finance-medium-blue dark:text-finance-accent-blue" />
      </div>
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <h3 className="font-medium text-finance-dark-blue dark:text-white">
            {title}
          </h3>
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

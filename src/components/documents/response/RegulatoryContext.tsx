
import { Badge } from '@/components/ui/badge';

interface RegulatoryContextProps {
  context: string | null;
}

const RegulatoryContext = ({ context }: RegulatoryContextProps) => {
  if (!context) return null;
  
  // Check if context includes database entries and reference documents
  const hasDbEntries = context.includes("DATABASE ENTRIES");
  const hasReferenceDocuments = context.includes("REFERENCE DOCUMENTS");
  
  return (
    <div className="space-y-2 mt-4">
      <h4 className="text-sm font-medium flex items-center gap-2">
        Relevant Regulatory Context
        {(hasDbEntries || hasReferenceDocuments) && (
          <div className="flex items-center gap-1 ml-2">
            {hasDbEntries && (
              <Badge variant="outline" className="text-xs bg-finance-light-blue/10 text-finance-dark-blue">Database</Badge>
            )}
            {hasReferenceDocuments && (
              <Badge variant="outline" className="text-xs bg-finance-medium-blue/10 text-finance-dark-blue">References</Badge>
            )}
          </div>
        )}
      </h4>
      <div className="p-3 rounded-md text-xs bg-gray-50 dark:bg-finance-dark-blue/20 max-h-32 overflow-y-auto">
        <pre className="whitespace-pre-wrap font-mono">{context}</pre>
      </div>
    </div>
  );
};

export default RegulatoryContext;

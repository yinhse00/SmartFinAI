
interface RegulatoryContextProps {
  context: string | null;
}

const RegulatoryContext = ({ context }: RegulatoryContextProps) => {
  if (!context) return null;
  
  return (
    <div className="space-y-2 mt-4">
      <h4 className="text-sm font-medium">Relevant Regulatory Context</h4>
      <div className="p-3 rounded-md text-xs bg-gray-50 dark:bg-finance-dark-blue/20 max-h-32 overflow-y-auto">
        <pre className="whitespace-pre-wrap font-mono">{context}</pre>
      </div>
    </div>
  );
};

export default RegulatoryContext;


import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DecisionNode {
  id: string;
  question: string;
  type: 'decision' | 'outcome';
  children?: {
    yes?: DecisionNode;
    no?: DecisionNode;
  };
  outcome?: {
    result: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  };
}

interface DecisionTreeProps {
  data: DecisionNode;
  title?: string;
  className?: string;
}

const DecisionTree: React.FC<DecisionTreeProps> = ({ 
  data, 
  title, 
  className = "" 
}) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderNode = (node: DecisionNode, level = 0) => {
    if (node.type === 'outcome') {
      return (
        <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
          <Badge className={getSeverityColor(node.outcome!.severity)}>
            {node.outcome!.result}
          </Badge>
          <p className="text-sm mt-2">{node.outcome!.description}</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <h4 className="font-medium mb-3">{node.question}</h4>
          
          {node.children && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {node.children.yes && (
                <div>
                  <div className="text-xs font-medium text-green-600 mb-2">YES</div>
                  {renderNode(node.children.yes, level + 1)}
                </div>
              )}
              {node.children.no && (
                <div>
                  <div className="text-xs font-medium text-red-600 mb-2">NO</div>
                  {renderNode(node.children.no, level + 1)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className={`w-full ${className}`}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        {renderNode(data)}
      </CardContent>
    </Card>
  );
};

export default DecisionTree;

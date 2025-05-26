
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, Shield, FileText } from 'lucide-react';

interface ValidationStatusProps {
  validation?: {
    isValid: boolean;
    vettingConsistency: boolean;
    guidanceConsistency: boolean;
    validationNotes: string[];
    confidence: number;
  };
  vettingRequired?: boolean;
  vettingCategory?: string;
  relevantGuidance?: number;
  guidanceTypes?: string[];
}

const ValidationStatusIndicator: React.FC<ValidationStatusProps> = ({
  validation,
  vettingRequired,
  vettingCategory,
  relevantGuidance,
  guidanceTypes
}) => {
  if (!validation && !vettingRequired && !relevantGuidance) {
    return null;
  }

  return (
    <div className="mt-3 space-y-2">
      {/* Validation Status */}
      {validation && (
        <Alert className={validation.isValid ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
          {validation.isValid ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          )}
          <AlertTitle className={validation.isValid ? "text-green-800" : "text-yellow-800"}>
            Response Validation
          </AlertTitle>
          <AlertDescription className={validation.isValid ? "text-green-700" : "text-yellow-700"}>
            <div className="flex items-center gap-2 mb-2">
              <span>Status: {validation.isValid ? 'Validated' : 'Requires Review'}</span>
              <Badge variant="outline" className="text-xs">
                {Math.round(validation.confidence * 100)}% confidence
              </Badge>
            </div>
            
            {validation.validationNotes.length > 0 && (
              <ul className="list-disc list-inside text-sm mt-1">
                {validation.validationNotes.map((note, index) => (
                  <li key={index}>{note}</li>
                ))}
              </ul>
            )}
            
            <div className="flex gap-4 mt-2 text-xs">
              <span className={validation.vettingConsistency ? "text-green-600" : "text-red-600"}>
                Vetting: {validation.vettingConsistency ? '✓' : '✗'}
              </span>
              <span className={validation.guidanceConsistency ? "text-green-600" : "text-red-600"}>
                Guidance: {validation.guidanceConsistency ? '✓' : '✗'}
              </span>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Vetting Requirements */}
      {vettingRequired && (
        <Alert className="border-purple-200 bg-purple-50">
          <Shield className="h-4 w-4 text-purple-600" />
          <AlertTitle className="text-purple-800">Pre-Vetting Required</AlertTitle>
          <AlertDescription className="text-purple-700">
            This announcement requires pre-vetting by the Exchange.
            {vettingCategory && (
              <div className="mt-1">
                <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                  {vettingCategory}
                </Badge>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Guidance References */}
      {relevantGuidance && relevantGuidance > 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <FileText className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Relevant Guidance Found</AlertTitle>
          <AlertDescription className="text-blue-700">
            <div className="flex items-center gap-2">
              <span>{relevantGuidance} relevant guidance document(s) referenced</span>
              {guidanceTypes && guidanceTypes.length > 0 && (
                <div className="flex gap-1">
                  {guidanceTypes.map((type, index) => (
                    <Badge key={index} variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                      {type.toUpperCase()}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ValidationStatusIndicator;


import { useState, useEffect } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useVettingRequirements } from '@/hooks/useVettingRequirements';

interface TimetableVettingCheckProps {
  headlineCategory: string;
}

const TimetableVettingCheck: React.FC<TimetableVettingCheckProps> = ({
  headlineCategory
}) => {
  const [isVettingRequired, setIsVettingRequired] = useState<boolean | null>(null);
  const [exemptions, setExemptions] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const { requirements, checkVettingRequired, getVettingExemptions } = useVettingRequirements();
  
  useEffect(() => {
    const checkVetting = async () => {
      setIsLoading(true);
      try {
        const required = await checkVettingRequired(headlineCategory);
        setIsVettingRequired(required);
        
        if (required) {
          const exemptionResult = await getVettingExemptions(headlineCategory);
          // Handle both string and array cases
          if (Array.isArray(exemptionResult)) {
            setExemptions(exemptionResult.join(', '));
          } else {
            setExemptions(exemptionResult);
          }
        }
      } catch (error) {
        console.error("Error checking vetting requirements:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (headlineCategory) {
      checkVetting();
    }
  }, [headlineCategory, requirements]);
  
  if (isLoading) {
    return (
      <Alert className="bg-gray-50">
        <Clock className="h-4 w-4 animate-pulse text-gray-600" />
        <AlertTitle>Checking vetting requirements...</AlertTitle>
        <AlertDescription>
          Determining if this announcement requires pre-vetting.
        </AlertDescription>
      </Alert>
    );
  }
  
  if (isVettingRequired === null) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Unknown vetting status</AlertTitle>
        <AlertDescription>
          Could not determine if this announcement category requires pre-vetting. 
          Please check the vetting requirements manually.
        </AlertDescription>
      </Alert>
    );
  }
  
  return isVettingRequired ? (
    <Alert className="bg-amber-50 border-amber-200">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800 flex items-center gap-2">
        Pre-vetting Required 
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
          PRE-VETTING
        </Badge>
      </AlertTitle>
      <AlertDescription className="text-amber-700">
        This announcement with headline category <span className="font-semibold">{headlineCategory}</span> requires pre-vetting by the Exchange.
        {exemptions && (
          <div className="mt-2">
            <span className="font-semibold">Exemptions may apply: </span>
            {exemptions}
          </div>
        )}
      </AlertDescription>
    </Alert>
  ) : (
    <Alert className="bg-green-50 border-green-200">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertTitle className="text-green-800 flex items-center gap-2">
        No Pre-vetting Required
        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
          POST-VETTING
        </Badge>
      </AlertTitle>
      <AlertDescription className="text-green-700">
        This announcement with headline category <span className="font-semibold">{headlineCategory}</span> does not require pre-vetting.
        It can be published directly and will be subject to post-vetting by the Exchange.
      </AlertDescription>
    </Alert>
  );
};

export default TimetableVettingCheck;

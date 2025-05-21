
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useVettingRequirements, announcementVettingService } from "@/services/vetting/announcementVettingService";
import { toast } from "@/components/ui/use-toast";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

export default function VettingChecker() {
  const { requirements, loading: requirementsLoading } = useVettingRequirements();
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    vettingRequired?: boolean;
    rule?: string;
    exemptions?: string;
    error?: string;
  } | null>(null);
  
  const checkVettingRequirement = async () => {
    if (!selectedCategory) {
      toast({
        title: "Selection required",
        description: "Please select a headline category",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      const { required, requirement, error } = await announcementVettingService.checkVettingRequired(selectedCategory);
      
      setResult({
        vettingRequired: required,
        rule: requirement?.rule_reference || undefined,
        exemptions: requirement?.exemptions || undefined,
        error
      });
      
      if (announcementTitle) {
        // Record the check in the database
        await announcementVettingService.submitForVetting({
          title: announcementTitle,
          headlineCategory: selectedCategory
        });
      }
    } catch (err) {
      console.error("Error checking vetting requirements:", err);
      setResult({
        error: "An unexpected error occurred while checking vetting requirements"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const clearForm = () => {
    setAnnouncementTitle("");
    setSelectedCategory("");
    setResult(null);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pre-Vetting Requirement Checker</CardTitle>
        <CardDescription>
          Check if your announcement requires pre-vetting based on its headline category
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="announcement-title" className="text-sm font-medium">
            Announcement Title
          </label>
          <Input
            id="announcement-title"
            placeholder="Enter announcement title (optional)"
            value={announcementTitle}
            onChange={(e) => setAnnouncementTitle(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="headline-category" className="text-sm font-medium">
            Headline Category
          </label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger id="headline-category" disabled={requirementsLoading}>
              <SelectValue placeholder="Select headline category" />
            </SelectTrigger>
            <SelectContent>
              {requirements.map((req) => (
                <SelectItem key={req.id} value={req.headline_category}>
                  {req.headline_category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {result && (
          <Alert className={result.vettingRequired 
            ? "bg-red-50 border-red-200 text-red-800" 
            : "bg-green-50 border-green-200 text-green-800"
          }>
            {result.vettingRequired 
              ? <AlertTriangle className="h-4 w-4 text-red-600" />
              : <CheckCircle2 className="h-4 w-4 text-green-600" />
            }
            <AlertTitle>
              {result.vettingRequired 
                ? "Pre-vetting is required" 
                : "Pre-vetting is not required"
              }
            </AlertTitle>
            <AlertDescription className="space-y-1">
              <p>{result.rule && `Based on ${result.rule}`}</p>
              {result.exemptions && (
                <p className="text-sm font-medium mt-1">
                  Exemptions: {result.exemptions}
                </p>
              )}
              {result.error && (
                <p className="text-amber-700 text-sm mt-1">
                  Note: {result.error}
                </p>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={clearForm}>Clear</Button>
        <Button 
          onClick={checkVettingRequirement} 
          disabled={loading || !selectedCategory}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Check Requirement
        </Button>
      </CardFooter>
    </Card>
  );
}

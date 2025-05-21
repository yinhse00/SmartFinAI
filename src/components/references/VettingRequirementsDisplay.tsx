
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVettingRequirements } from "@/services/vetting/announcementVettingService";
import { Search, AlertTriangle, CheckCircle, HelpCircle, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Component to display pre-vetting requirements for announcements
 */
export default function VettingRequirementsDisplay() {
  const { requirements, loading, error } = useVettingRequirements();
  const [search, setSearch] = useState("");
  
  const filteredRequirements = requirements.filter(req => 
    req.headline_category.toLowerCase().includes(search.toLowerCase()) ||
    (req.description && req.description.toLowerCase().includes(search.toLowerCase())) ||
    (req.rule_reference && req.rule_reference.toLowerCase().includes(search.toLowerCase()))
  );
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Announcement Pre-Vetting Requirements</h2>
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search headline categories..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded flex items-center gap-2">
          <AlertTriangle size={16} />
          <span>Error loading vetting requirements: {error}</span>
        </div>
      )}
      
      <div className="border rounded-md">
        {loading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Headline Category</TableHead>
                <TableHead>Vetting Required</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Rule Reference</TableHead>
                <TableHead>Exemptions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequirements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    {search ? (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Search className="h-6 w-6" />
                        <p>No matching headline categories found. Try different search terms.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <HelpCircle className="h-6 w-6" />
                        <p>No vetting requirements available. Contact your administrator.</p>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequirements.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.headline_category}</TableCell>
                    <TableCell>
                      {req.is_vetting_required ? (
                        <Badge variant="default" className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200">
                          <AlertTriangle className="h-3 w-3 mr-1" /> Required
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" /> Not Required
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{req.description || '-'}</TableCell>
                    <TableCell>
                      {req.rule_reference && (
                        <Badge variant="secondary" className="font-mono">
                          {req.rule_reference}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {req.exemptions ? (
                        <div className="flex items-center gap-1">
                          <Info className="h-3 w-3 text-blue-500" />
                          <span className="text-sm">{req.exemptions}</span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

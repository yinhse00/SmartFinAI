import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, Download, MessageSquare, FileText, History, ZoomIn, ZoomOut, Eye, Layout, Users, Undo, Redo, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Table, Image, Loader2, Building2, Award, Target, Package, Briefcase, Factory, Truck, Calendar, DollarSign, Lightbulb, Shield, FileCheck, Leaf, Copyright, Home, Scale, Settings, AlertTriangle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
const ENHANCED_DOCUMENT_SECTIONS = [
// Core Business Sections
{
  id: 'overview',
  name: 'Business Overview',
  icon: Building2,
  category: 'Business'
}, {
  id: 'competitive_strengths',
  name: 'Competitive Strengths',
  icon: Award,
  category: 'Business'
}, {
  id: 'business_model',
  name: 'Business Model',
  icon: Target,
  category: 'Business'
}, {
  id: 'products_services',
  name: 'Products & Services',
  icon: Package,
  category: 'Business'
}, {
  id: 'projects',
  name: 'Projects',
  icon: Briefcase,
  category: 'Business'
}, {
  id: 'production',
  name: 'Production',
  icon: Factory,
  category: 'Operations'
},
// Customer & Supplier Sections
{
  id: 'major_customers',
  name: 'Major Customers',
  icon: Users,
  category: 'Stakeholders'
}, {
  id: 'sales_marketing',
  name: 'Sales & Marketing',
  icon: Package,
  category: 'Operations'
}, {
  id: 'major_suppliers',
  name: 'Major Suppliers',
  icon: Truck,
  category: 'Stakeholders'
}, {
  id: 'seasonality',
  name: 'Seasonality',
  icon: Calendar,
  category: 'Operations'
}, {
  id: 'pricing_policy',
  name: 'Pricing Policy',
  icon: DollarSign,
  category: 'Operations'
},
// Technical & Compliance Sections
{
  id: 'research_development',
  name: 'Research & Development',
  icon: Lightbulb,
  category: 'Technical'
}, {
  id: 'cybersecurity_data_privacy',
  name: 'Cybersecurity & Data Privacy',
  icon: Shield,
  category: 'Compliance'
}, {
  id: 'licences_permits',
  name: 'Licences & Permits',
  icon: FileCheck,
  category: 'Compliance'
}, {
  id: 'recognitions_awards',
  name: 'Recognitions & Awards',
  icon: Award,
  category: 'Recognition'
}, {
  id: 'insurance',
  name: 'Insurance',
  icon: Shield,
  category: 'Risk Management'
},
// Governance & Risk Sections
{
  id: 'esg',
  name: 'Environmental, Social & Governance',
  icon: Leaf,
  category: 'Governance'
}, {
  id: 'employees',
  name: 'Employees',
  icon: Users,
  category: 'Human Resources'
}, {
  id: 'intellectual_property',
  name: 'Intellectual Property',
  icon: Copyright,
  category: 'Legal'
}, {
  id: 'properties',
  name: 'Properties',
  icon: Home,
  category: 'Assets'
}, {
  id: 'non_compliance',
  name: 'Non-Compliance',
  icon: AlertTriangle,
  category: 'Legal'
}, {
  id: 'legal_proceedings',
  name: 'Legal Proceedings',
  icon: Scale,
  category: 'Legal'
}, {
  id: 'internal_control',
  name: 'Internal Control & Risk Management',
  icon: Settings,
  category: 'Risk Management'
}];
interface EnhancedDocumentToolbarProps {
  selectedSection: string;
  onSectionSelect: (section: string) => void;
  onSave?: () => void;
  onExport?: (format: 'word' | 'pdf' | 'excel' | 'powerpoint') => void;
  showTrackChanges: boolean;
  onToggleTrackChanges: () => void;
  documentZoom: number;
  onZoomChange: (zoom: number) => void;
  viewMode: 'print' | 'web' | 'outline';
  onViewModeChange: (mode: 'print' | 'web' | 'outline') => void;
  isAIPanelOpen: boolean;
  onToggleAIPanel: () => void;
  isCommentsSidebarOpen: boolean;
  onToggleCommentsSidebar: () => void;
  isVersionHistoryOpen: boolean;
  onToggleVersionHistory: () => void;
  isGuidancePanelOpen: boolean;
  onToggleGuidancePanel: () => void;
  isExporting?: boolean;
  isSaving?: boolean;
}
export const EnhancedDocumentToolbar: React.FC<EnhancedDocumentToolbarProps> = ({
  selectedSection,
  onSectionSelect,
  onSave,
  onExport,
  showTrackChanges,
  onToggleTrackChanges,
  documentZoom,
  onZoomChange,
  viewMode,
  onViewModeChange,
  isAIPanelOpen,
  onToggleAIPanel,
  isCommentsSidebarOpen,
  onToggleCommentsSidebar,
  isVersionHistoryOpen,
  onToggleVersionHistory,
  isGuidancePanelOpen,
  onToggleGuidancePanel,
  isExporting = false,
  isSaving = false
}) => {
  const handleExport = (format: 'word' | 'pdf' | 'excel' | 'powerpoint') => {
    if (onExport) {
      onExport(format);
    }
  };
  const zoomOptions = [50, 75, 100, 125, 150, 200];
  const getCurrentSection = () => {
    return ENHANCED_DOCUMENT_SECTIONS.find(section => section.id === selectedSection);
  };
  const currentSection = getCurrentSection();
  return <div className="border-b bg-background">
      {/* Main toolbar */}
      <div className="px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Left section - Document info and enhanced section selector */}
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="justify-start gap-2 min-w-[200px]">
                  {currentSection ? <>
                      <currentSection.icon className="h-4 w-4" />
                      <span className="truncate">{currentSection.name}</span>
                    </> : <>
                      <Building2 className="h-4 w-4" />
                      <span>Select Section</span>
                    </>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto">
                {(() => {
                const categories = [...new Set(ENHANCED_DOCUMENT_SECTIONS.map(s => s.category))];
                return categories.map(category => <div key={category}>
                      <DropdownMenuSeparator />
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {category}
                      </div>
                      {ENHANCED_DOCUMENT_SECTIONS.filter(section => section.category === category).map(section => <DropdownMenuItem key={section.id} onClick={() => onSectionSelect(section.id)} className="flex items-center gap-2 p-2 mx-1">
                            <section.icon className="h-4 w-4" />
                            <span className="text-sm">{section.name}</span>
                          </DropdownMenuItem>)}
                    </div>);
              })()}
              </DropdownMenuContent>
            </DropdownMenu>
            
            
          </div>

          {/* Right section - Actions */}
          <div className="flex items-center gap-2">
            {/* Save */}
            <Button variant="outline" size="sm" onClick={onSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {isSaving ? 'Saving...' : 'Save'}
            </Button>

            {/* Export */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isExporting}>
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? 'Exporting...' : 'Export'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport('word')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as Word (.docx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('excel')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('powerpoint')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as PowerPoint (.pptx)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Separator orientation="vertical" className="h-6" />

            {/* View controls */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onViewModeChange('print')} className={viewMode === 'print' ? 'bg-accent' : ''}>
                  <Layout className="h-4 w-4 mr-2" />
                  Print Layout
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewModeChange('web')} className={viewMode === 'web' ? 'bg-accent' : ''}>
                  <Layout className="h-4 w-4 mr-2" />
                  Web Layout
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewModeChange('outline')} className={viewMode === 'outline' ? 'bg-accent' : ''}>
                  <Layout className="h-4 w-4 mr-2" />
                  Outline
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Zoom controls */}
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => onZoomChange(Math.max(50, documentZoom - 25))} disabled={documentZoom <= 50}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="min-w-[70px]">
                    {documentZoom}%
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {zoomOptions.map(zoom => <DropdownMenuItem key={zoom} onClick={() => onZoomChange(zoom)} className={documentZoom === zoom ? 'bg-accent' : ''}>
                      {zoom}%
                    </DropdownMenuItem>)}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" size="sm" onClick={() => onZoomChange(Math.min(200, documentZoom + 25))} disabled={documentZoom >= 200}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Collaboration features */}
            <Button variant={showTrackChanges ? "default" : "outline"} size="sm" onClick={onToggleTrackChanges}>
              <Users className="h-4 w-4 mr-2" />
              Track Changes
            </Button>

            <Button variant={isCommentsSidebarOpen ? "default" : "outline"} size="sm" onClick={onToggleCommentsSidebar}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Comments
            </Button>

            <Button variant={isGuidancePanelOpen ? "default" : "outline"} size="sm" onClick={onToggleGuidancePanel}>
              <FileCheck className="h-4 w-4 mr-2" />
              Guidance
            </Button>

            <Button variant={isVersionHistoryOpen ? "default" : "outline"} size="sm" onClick={onToggleVersionHistory}>
              <History className="h-4 w-4 mr-2" />
              History
            </Button>

            <Button variant={isAIPanelOpen ? "default" : "outline"} size="sm" onClick={onToggleAIPanel}>
              <MessageSquare className="h-4 w-4 mr-2" />
              AI Assistant
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced formatting toolbar with section-aware features */}
      <div className="px-4 py-1 border-t bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <Redo className="h-4 w-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-4 mx-1" />
            
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <Bold className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <Italic className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <Underline className="h-4 w-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-4 mx-1" />
            
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <AlignRight className="h-4 w-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-4 mx-1" />
            
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <List className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <ListOrdered className="h-4 w-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-4 mx-1" />
            
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <Table className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <Image className="h-4 w-4" />
            </Button>
          </div>

          {/* Section-specific quick actions */}
          {currentSection && <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {currentSection.category}
              </Badge>
              {currentSection.category === 'Stakeholders' && <Button variant="ghost" size="sm" className="text-xs">
                  Insert Table
                </Button>}
              {currentSection.category === 'Compliance' && <Button variant="ghost" size="sm" className="text-xs">
                  Check Requirements
                </Button>}
            </div>}
        </div>
      </div>
    </div>;
};
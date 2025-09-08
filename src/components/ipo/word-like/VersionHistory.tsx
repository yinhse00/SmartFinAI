import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  History, 
  X, 
  Clock, 
  User, 
  GitBranch,
  RotateCcw,
  Eye,
  Download,
  FileText,
  Edit,
  Save
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface DocumentVersion {
  id: string;
  version: string;
  title: string;
  author: string;
  authorEmail: string;
  createdAt: Date;
  changes: string[];
  wordCount: number;
  status: 'draft' | 'review' | 'approved';
  comment?: string;
}

interface VersionHistoryProps {
  projectId: string;
  sectionType: string;
  onClose: () => void;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  projectId,
  sectionType,
  onClose
}) => {
  const [versions, setVersions] = useState<DocumentVersion[]>([
    // Mock data for demonstration
    {
      id: '5',
      version: '1.4',
      title: 'Current Version',
      author: 'Current User',
      authorEmail: 'user@company.com',
      createdAt: new Date(),
      changes: ['AI-enhanced clarity improvements', 'Compliance checks applied'],
      wordCount: 1247,
      status: 'draft'
    },
    {
      id: '4',
      version: '1.3',
      title: 'Review Updates',
      author: 'Sarah Johnson',
      authorEmail: 'sarah.johnson@company.com',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      changes: ['Updated financial projections', 'Added regulatory references'],
      wordCount: 1189,
      status: 'review',
      comment: 'Incorporated feedback from legal team'
    },
    {
      id: '3',
      version: '1.2',
      title: 'Major Revision',
      author: 'Mike Chen',
      authorEmail: 'mike.chen@company.com',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      changes: ['Restructured business model section', 'Enhanced risk factors'],
      wordCount: 1056,
      status: 'approved'
    },
    {
      id: '2',
      version: '1.1',
      title: 'First Review',
      author: 'Sarah Johnson',
      authorEmail: 'sarah.johnson@company.com',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      changes: ['Minor formatting updates', 'Grammar corrections'],
      wordCount: 967,
      status: 'approved'
    },
    {
      id: '1',
      version: '1.0',
      title: 'Initial Draft',
      author: 'AI Assistant',
      authorEmail: 'ai@system.com',
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      changes: ['Initial content generation'],
      wordCount: 892,
      status: 'draft'
    }
  ]);

  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersions, setCompareVersions] = useState<string[]>([]);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'review':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleVersionSelect = (versionId: string) => {
    if (compareMode) {
      if (compareVersions.includes(versionId)) {
        setCompareVersions(compareVersions.filter(id => id !== versionId));
      } else if (compareVersions.length < 2) {
        setCompareVersions([...compareVersions, versionId]);
      }
    } else {
      setSelectedVersion(versionId);
    }
  };

  const handleRevertToVersion = (versionId: string) => {
    // Implementation would depend on your backend
    console.log('Reverting to version:', versionId);
  };

  const currentVersion = versions[0];

  return (
    <div className="h-full flex flex-col border-l bg-background">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Version History</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Controls */}
        <div className="flex gap-2 mt-3">
          <Button 
            variant={compareMode ? 'default' : 'outline'} 
            size="sm"
            onClick={() => {
              setCompareMode(!compareMode);
              setCompareVersions([]);
              setSelectedVersion(null);
            }}
          >
            <GitBranch className="h-4 w-4 mr-2" />
            Compare
          </Button>
          
          {compareMode && compareVersions.length === 2 && (
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View Diff
            </Button>
          )}
        </div>
        
        {compareMode && (
          <p className="text-xs text-muted-foreground mt-2">
            Select {2 - compareVersions.length} version{2 - compareVersions.length !== 1 ? 's' : ''} to compare
          </p>
        )}
      </div>

      {/* Current version info */}
      <div className="p-4 bg-muted/30 border-b">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Current Version</span>
          <Badge className={getStatusColor(currentVersion.status)}>
            {currentVersion.status}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          <p>Version {currentVersion.version} • {currentVersion.wordCount} words</p>
          <p>Last modified {formatTimeAgo(currentVersion.createdAt)}</p>
        </div>
      </div>

      {/* Version list */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {versions.map((version, index) => (
            <Card 
              key={version.id} 
              className={`cursor-pointer transition-all ${
                selectedVersion === version.id ? 'ring-2 ring-primary' : ''
              } ${
                compareMode && compareVersions.includes(version.id) ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => handleVersionSelect(version.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {getInitials(version.author)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">
                        Version {version.version}
                        {index === 0 && <span className="text-primary ml-2">(Current)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{version.title}</p>
                    </div>
                  </div>
                  
                  <Badge className={getStatusColor(version.status)}>
                    {version.status}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {version.author}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(version.createdAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {version.wordCount} words
                    </div>
                  </div>
                  
                  {version.changes.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Changes:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {version.changes.map((change, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0" />
                            {change}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {version.comment && (
                    <div className="bg-muted/50 rounded p-2">
                      <p className="text-xs">{version.comment}</p>
                    </div>
                  )}
                </div>
                
                {/* Version actions */}
                {selectedVersion === version.id && !compareMode && index !== 0 && (
                  <div className="flex gap-2 mt-3 pt-2 border-t">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRevertToVersion(version.id);
                      }}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Restore
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Export
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
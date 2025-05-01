
import React from 'react';
import { FileText, Target, BookOpen, File, FileCheck, FileCog } from 'lucide-react';
import { DocumentCategory } from '@/types/references';

interface DocumentCategoryIconProps {
  category: DocumentCategory;
  className?: string;
}

const DocumentCategoryIcon: React.FC<DocumentCategoryIconProps> = ({ category, className = "h-6 w-6 text-finance-medium-blue dark:text-finance-accent-blue" }) => {
  switch (category) {
    case 'listing_rules':
      return <FileText className={className} />;
    case 'takeovers':
      return <Target className={className} />;
    case 'guidance':
      return <BookOpen className={className} />;
    case 'decisions':
      return <FileCog className={className} />;
    case 'checklists':
      return <FileCheck className={className} />;
    default:
      return <File className={className} />;
  }
};

export default DocumentCategoryIcon;

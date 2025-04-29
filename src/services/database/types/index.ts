
import { DocumentCategory } from '@/types/references';

export interface RegulationProvision {
  id: string;
  rule_number: string;
  title: string;
  content: string;
  category_id?: string;
  chapter?: string;
  section?: string;
  subsection?: string;
  version?: string;
  path_reference?: string;
  parent_id?: string;
  source_document_id?: string;
}

export interface RegulationCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  priority?: number;
}

export interface RegulationDefinition {
  id?: string;
  term: string;
  definition: string;
  category_id?: string;
  source_provision_id?: string;
}

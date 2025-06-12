
export interface TransactionData {
  type: string;
  subtype: string;
  amount: number;
  currency: string;
  currentShares: number;
  marketCap: number;
  objectives: string[];
  timeline: string;
  shareholderStructure: Array<{
    name: string;
    percentage: number;
    type: 'individual' | 'institutional' | 'connected';
  }>;
  regulatoryConstraints: string[];
  jurisdiction: string;
}

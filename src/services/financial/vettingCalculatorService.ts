import { supabase } from '@/integrations/supabase/client';

export interface VettingTimeframes {
  announcementPreparation: number;
  announcementVetting: number;
  circularPreparation: number;
  circularVetting: number;
  listingDocumentPreparation: number;
  listingDocumentVetting: number;
  vettingAuthority: string;
}

export interface VettingCalculatorService {
  getVettingTimeframes(transactionType: string): Promise<VettingTimeframes>;
}

class VettingCalculatorServiceImpl implements VettingCalculatorService {
  private parseBusinessDays(duration: string | null): number {
    if (!duration) return 7; // Default fallback
    
    // Parse patterns like "5-10 business days" -> use midpoint (7.5 -> 8)
    // Parse patterns like "3-5 bussiness days" -> use midpoint (4)
    const match = duration.match(/(\d+)-(\d+)/);
    if (match) {
      const min = parseInt(match[1]);
      const max = parseInt(match[2]);
      return Math.ceil((min + max) / 2);
    }
    
    // Parse single numbers like "5 business days"
    const singleMatch = duration.match(/(\d+)/);
    if (singleMatch) {
      return parseInt(singleMatch[1]);
    }
    
    return 7; // Default fallback
  }

  private normalizeTransactionType(transactionType: string): string {
    const normalized = transactionType.toLowerCase().trim();
    
    // Map common variations to database entries
    if (normalized.includes('rights issue') || normalized === 'rights') {
      return 'rights issue';
    }
    if (normalized.includes('open offer') || normalized === 'open') {
      return 'open offer';
    }
    if (normalized.includes('major transaction') || normalized === 'major') {
      return 'major transaction';
    }
    if (normalized.includes('very substantial acquisition') || normalized === 'vsa') {
      return 'very substantial acquisition';
    }
    if (normalized.includes('very substantial disposal') || normalized === 'vsd') {
      return 'very substantial disposal';
    }
    if (normalized.includes('reverse takeover') || normalized === 'rto') {
      return 'reverse takeovers';
    }
    if (normalized.includes('connected transaction') || normalized === 'connected') {
      return 'connected transaction';
    }
    if (normalized.includes('whitewash')) {
      return 'whitewash waiver';
    }
    if (normalized.includes('special deal')) {
      return 'special deal';
    }
    if (normalized.includes('partial offer')) {
      return 'partial offer';
    }
    if (normalized.includes('off market')) {
      return 'off market purchase';
    }
    
    return normalized;
  }

  async getVettingTimeframes(transactionType: string): Promise<VettingTimeframes> {
    try {
      const normalizedType = this.normalizeTransactionType(transactionType);
      
      // Query the database for matching transaction type
      const { data, error } = await supabase
        .from('listingrules_listed_timetable')
        .select('*')
        .ilike('particulars', `%${normalizedType}%`)
        .limit(1);

      if (error) {
        console.warn('Error fetching vetting timeframes:', error);
        return this.getDefaultTimeframes();
      }

      if (!data || data.length === 0) {
        // Try broader search for equity fundraising transactions
        if (normalizedType.includes('rights') || normalizedType.includes('open')) {
          const { data: equityData, error: equityError } = await supabase
            .from('listingrules_listed_timetable')
            .select('*')
            .or('particulars.ilike.%rights%,particulars.ilike.%open%')
            .limit(1);
          
          if (!equityError && equityData && equityData.length > 0) {
            return this.parseTimeframes(equityData[0]);
          }
        }
        
        console.warn(`No vetting data found for transaction type: ${transactionType}`);
        return this.getDefaultTimeframes();
      }

      return this.parseTimeframes(data[0]);
    } catch (error) {
      console.error('Error in getVettingTimeframes:', error);
      return this.getDefaultTimeframes();
    }
  }

  private parseTimeframes(dbRecord: any): VettingTimeframes {
    return {
      announcementPreparation: this.parseBusinessDays(dbRecord['no of day for preparing the announcement']),
      announcementVetting: this.parseBusinessDays(dbRecord['no of days of vetting the annoucement']),
      circularPreparation: this.parseBusinessDays(dbRecord['no of day for preparing circular']),
      circularVetting: this.parseBusinessDays(dbRecord['no of day for vetting circular']),
      listingDocumentPreparation: this.parseBusinessDays(dbRecord['no of day for preparing listing document or prospectus or offer']),
      listingDocumentVetting: this.parseBusinessDays(dbRecord['no of day for vetting listing document or prospectus or offer d']),
      vettingAuthority: dbRecord['vetting authority'] || 'HK Stock Exchange'
    };
  }

  private getDefaultTimeframes(): VettingTimeframes {
    return {
      announcementPreparation: 3,      // 2-5 business days -> midpoint 3.5 -> 4, conservative 3
      announcementVetting: 4,          // 3-5 business days -> midpoint 4
      circularPreparation: 7,          // 5-10 business days -> midpoint 7.5 -> 8, conservative 7
      circularVetting: 7,              // 5-10 business days -> midpoint 7.5 -> 8, conservative 7
      listingDocumentPreparation: 7,   // 5-10 business days -> midpoint 7.5 -> 8, conservative 7
      listingDocumentVetting: 7,       // 5-10 business days -> midpoint 7.5 -> 8, conservative 7
      vettingAuthority: 'HK Stock Exchange'
    };
  }
}

export const vettingCalculatorService: VettingCalculatorService = new VettingCalculatorServiceImpl();
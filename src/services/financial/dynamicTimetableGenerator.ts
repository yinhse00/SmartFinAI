import { BusinessDayCalculator } from '../calendar/businessDayCalculator';
import { HongKongHolidays } from '../calendar/hongKongHolidays';
import { supabase } from '@/integrations/supabase/client';
import { timetableParallelSearchService } from '../timetable/timetableParallelSearchService';
import { getCurrentDate } from '../calendar/currentDateService';

interface TimetableEvent {
  day: number;
  date: Date;
  event: string;
  description?: string;
  isKeyEvent?: boolean;
  vettingRequired?: boolean;
  ruleReference?: string;
}

interface TimetableOptions {
  startDate: Date;
  transactionType: string;
  includeWeekends?: boolean;
  adjustForHolidays?: boolean;
  customEvents?: TimetableEvent[];
}

enum TimetablePhase {
  ANNOUNCEMENT = 'announcement',
  CIRCULAR_PREPARATION = 'circular_preparation',
  REGULATORY_REVIEW = 'regulatory_review',
  SHAREHOLDER_APPROVAL = 'shareholder_approval',
  COMPLETION = 'completion'
}

export class DynamicTimetableGenerator {
  private businessDayCalculator: BusinessDayCalculator;

  constructor() {
    this.businessDayCalculator = new BusinessDayCalculator(new HongKongHolidays());
  }

  /**
   * Generate a timetable for a financial transaction
   */
  public async generateTimetable(options: TimetableOptions): Promise<TimetableEvent[]> {
    try {
      if (!options.startDate || isNaN(options.startDate.getTime())) {
        options.startDate = new Date(); // Fallback to current date
      }
      
      if (!options.transactionType || options.transactionType.trim() === '') {
        options.transactionType = 'generic transaction';
      }
      
      const events: TimetableEvent[] = [];
      const { startDate, transactionType, includeWeekends = false, adjustForHolidays = true } = options;

      // Execute parallel search for timetable data, rules, and vetting requirements
      const searchResults = await timetableParallelSearchService.searchTimetableDataParallel(transactionType);
      const { timetableData, rulesData, vettingInfo } = searchResults;
    
    // Add announcement day (Day 0) with vetting information
    events.push({
      day: 0,
      date: new Date(startDate),
      event: 'Board Meeting and Announcement',
      description: vettingInfo.isRequired 
        ? `Board approves the transaction and issues announcement (Vetting required: ${vettingInfo.vettingDays} business days)`
        : 'Board approves the transaction and issues announcement (No vetting required)',
      isKeyEvent: true,
      vettingRequired: vettingInfo.isRequired,
      ruleReference: vettingInfo.ruleReference
    });

    // Add vetting-specific events if required
    if (vettingInfo.isRequired && vettingInfo.vettingDays > 0) {
      events.push({
        day: -vettingInfo.vettingDays,
        date: this.calculateBusinessDay(startDate, -vettingInfo.vettingDays, adjustForHolidays),
        event: 'Submit Announcement for Pre-Vetting',
        description: `Submit announcement to HKEX for pre-vetting (${vettingInfo.headlineCategory})`,
        isKeyEvent: true,
        vettingRequired: true,
        ruleReference: vettingInfo.ruleReference
      });
      
      events.push({
        day: -1,
        date: this.calculateBusinessDay(startDate, -1, adjustForHolidays),
        event: 'Receive Vetting Clearance',
        description: 'Receive HKEX vetting clearance for announcement',
        isKeyEvent: true,
        vettingRequired: true,
        ruleReference: vettingInfo.ruleReference
      });
    }
    
      // Add standard events based on transaction type with better matching
      const normalizedType = transactionType.toLowerCase().trim();
      
      try {
        if (normalizedType.includes('major transaction') || normalizedType === 'major') {
          this.addMajorTransactionEvents(events, startDate, adjustForHolidays);
        } else if (normalizedType.includes('very substantial acquisition') || normalizedType === 'vsa') {
          this.addVerySubstantialAcquisitionEvents(events, startDate, adjustForHolidays);
        } else if (normalizedType.includes('very substantial disposal') || normalizedType === 'vsd') {
          this.addVerySubstantialDisposalEvents(events, startDate, adjustForHolidays);
        } else if (normalizedType.includes('connected transaction') || normalizedType === 'connected') {
          this.addConnectedTransactionEvents(events, startDate, adjustForHolidays);
        } else if (normalizedType.includes('reverse takeover') || normalizedType === 'rto') {
          this.addReverseTransactionEvents(events, startDate, adjustForHolidays);
        } else if (normalizedType.includes('rights issue') || normalizedType === 'rights') {
          this.addRightsIssueEvents(events, startDate, adjustForHolidays);
        } else if (normalizedType.includes('open offer') || normalizedType === 'open') {
          this.addOpenOfferEvents(events, startDate, adjustForHolidays);
        } else {
          this.addGenericTransactionEvents(events, startDate, adjustForHolidays);
        }
      } catch (eventError) {
        this.addGenericTransactionEvents(events, startDate, adjustForHolidays);
      }
    
    // Add custom events if provided
    if (options.customEvents && options.customEvents.length > 0) {
      events.push(...options.customEvents);
    }
    
    // Sort events by day
    events.sort((a, b) => a.day - b.day);
    
    // Try to find reference timetables for this transaction type
    const referenceTimetables = await this.searchReferenceTimetables(transactionType);
    
      // Validate that events have valid dates
      const validEvents = events.filter(event => {
        if (!event.date || isNaN(event.date.getTime())) {
          return false;
        }
        return true;
      });
      
      return validEvents;
    } catch (error) {
      // Return minimal fallback timetable
      return [{
        day: 0,
        date: new Date(options.startDate.getTime()),
        event: 'Transaction Announcement',
        description: 'Initial announcement of the transaction',
        isKeyEvent: true
      }];
    }
  }
  
  /**
   * Add events for a Major Transaction
   */
  private addMajorTransactionEvents(events: TimetableEvent[], startDate: Date, adjustForHolidays: boolean): void {
    // Day 1: Submit draft circular
    events.push({
      day: 1,
      date: this.calculateBusinessDay(startDate, 1, adjustForHolidays),
      event: 'Submit Draft Circular to HKEX',
      description: 'First draft circular submitted for regulatory review'
    });
    
    // Day 14: Expected regulatory feedback
    events.push({
      day: 14,
      date: this.calculateBusinessDay(startDate, 14, adjustForHolidays),
      event: 'Expected Regulatory Feedback',
      description: 'First round of comments from HKEX expected'
    });
    
    // Day 28: Despatch circular
    events.push({
      day: 28,
      date: this.calculateBusinessDay(startDate, 28, adjustForHolidays),
      event: 'EGM Notice & Despatch Circular',
      description: 'Circular finalized and sent to shareholders',
      isKeyEvent: true
    });
    
    // Day 42: EGM
    events.push({
      day: 42,
      date: this.calculateBusinessDay(startDate, 42, adjustForHolidays),
      event: 'Extraordinary General Meeting',
      description: 'Shareholders vote on the proposed transaction',
      isKeyEvent: true
    });
    
    // Day 44: Results announcement
    events.push({
      day: 44,
      date: this.calculateBusinessDay(startDate, 44, adjustForHolidays),
      event: 'Results Announcement',
      description: 'Publication of EGM results and next steps'
    });
  }
  
  /**
   * Add events for a Very Substantial Acquisition
   */
  private addVerySubstantialAcquisitionEvents(events: TimetableEvent[], startDate: Date, adjustForHolidays: boolean): void {
    // VSA follows similar timeline to Major Transaction but with longer review period
    
    // Day 1: Submit draft circular
    events.push({
      day: 1,
      date: this.calculateBusinessDay(startDate, 1, adjustForHolidays),
      event: 'Submit Draft Circular to HKEX',
      description: 'First draft circular submitted for regulatory review'
    });
    
    // Day 21: Expected regulatory feedback (longer for VSA)
    events.push({
      day: 21,
      date: this.calculateBusinessDay(startDate, 21, adjustForHolidays),
      event: 'Expected Regulatory Feedback',
      description: 'First round of comments from HKEX expected'
    });
    
    // Day 35: Despatch circular (longer for VSA)
    events.push({
      day: 35,
      date: this.calculateBusinessDay(startDate, 35, adjustForHolidays),
      event: 'EGM Notice & Despatch Circular',
      description: 'Circular finalized and sent to shareholders',
      isKeyEvent: true
    });
    
    // Day 49: EGM
    events.push({
      day: 49,
      date: this.calculateBusinessDay(startDate, 49, adjustForHolidays),
      event: 'Extraordinary General Meeting',
      description: 'Shareholders vote on the proposed transaction',
      isKeyEvent: true
    });
    
    // Day 51: Results announcement
    events.push({
      day: 51,
      date: this.calculateBusinessDay(startDate, 51, adjustForHolidays),
      event: 'Results Announcement',
      description: 'Publication of EGM results and next steps'
    });
    
    // Day 65: Long stop date for completion
    events.push({
      day: 65,
      date: this.calculateBusinessDay(startDate, 65, adjustForHolidays),
      event: 'Long Stop Date for Completion',
      description: 'Target date for completing the acquisition',
      isKeyEvent: true
    });
  }
  
  /**
   * Add events for a Very Substantial Disposal
   */
  private addVerySubstantialDisposalEvents(events: TimetableEvent[], startDate: Date, adjustForHolidays: boolean): void {
    // VSD follows similar timeline to VSA
    this.addVerySubstantialAcquisitionEvents(events, startDate, adjustForHolidays);
    
    // Update the last event description
    const lastEvent = events[events.length - 1];
    if (lastEvent && lastEvent.event.includes('Long Stop Date')) {
      lastEvent.description = 'Target date for completing the disposal';
    }
  }
  
  /**
   * Add events for a Connected Transaction
   */
  private addConnectedTransactionEvents(events: TimetableEvent[], startDate: Date, adjustForHolidays: boolean): void {
    // Connected transactions require independent shareholder approval
    
    // Day 1: Submit draft circular
    events.push({
      day: 1,
      date: this.calculateBusinessDay(startDate, 1, adjustForHolidays),
      event: 'Submit Draft Circular to HKEX',
      description: 'First draft circular submitted for regulatory review'
    });
    
    // Day 5: Appoint Independent Financial Adviser
    events.push({
      day: 5,
      date: this.calculateBusinessDay(startDate, 5, adjustForHolidays),
      event: 'Appoint Independent Financial Adviser',
      description: 'IFA appointed to advise independent board committee'
    });
    
    // Day 14: Expected regulatory feedback
    events.push({
      day: 14,
      date: this.calculateBusinessDay(startDate, 14, adjustForHolidays),
      event: 'Expected Regulatory Feedback',
      description: 'First round of comments from HKEX expected'
    });
    
    // Day 21: IFA opinion finalized
    events.push({
      day: 21,
      date: this.calculateBusinessDay(startDate, 21, adjustForHolidays),
      event: 'IFA Opinion Finalized',
      description: 'Independent Financial Adviser finalizes opinion letter'
    });
    
    // Day 28: Despatch circular
    events.push({
      day: 28,
      date: this.calculateBusinessDay(startDate, 28, adjustForHolidays),
      event: 'EGM Notice & Despatch Circular',
      description: 'Circular with IFA opinion sent to shareholders',
      isKeyEvent: true
    });
    
    // Day 42: EGM
    events.push({
      day: 42,
      date: this.calculateBusinessDay(startDate, 42, adjustForHolidays),
      event: 'Extraordinary General Meeting',
      description: 'Independent shareholders vote on the connected transaction',
      isKeyEvent: true
    });
    
    // Day 44: Results announcement
    events.push({
      day: 44,
      date: this.calculateBusinessDay(startDate, 44, adjustForHolidays),
      event: 'Results Announcement',
      description: 'Publication of EGM results and next steps'
    });
  }
  
  /**
   * Add events for a Reverse Takeover
   */
  private addReverseTransactionEvents(events: TimetableEvent[], startDate: Date, adjustForHolidays: boolean): void {
    // RTO has a much longer timeline due to enhanced scrutiny
    
    // Day 1: Submit draft circular
    events.push({
      day: 1,
      date: this.calculateBusinessDay(startDate, 1, adjustForHolidays),
      event: 'Submit Draft Circular to HKEX',
      description: 'First draft circular submitted for regulatory review'
    });
    
    // Day 28: Expected first round of regulatory feedback
    events.push({
      day: 28,
      date: this.calculateBusinessDay(startDate, 28, adjustForHolidays),
      event: 'First Round Regulatory Feedback',
      description: 'Initial comments from HKEX expected'
    });
    
    // Day 60: Submit revised circular
    events.push({
      day: 60,
      date: this.calculateBusinessDay(startDate, 60, adjustForHolidays),
      event: 'Submit Revised Circular',
      description: 'Revised circular addressing HKEX comments'
    });
    
    // Day 90: Expected second round of regulatory feedback
    events.push({
      day: 90,
      date: this.calculateBusinessDay(startDate, 90, adjustForHolidays),
      event: 'Second Round Regulatory Feedback',
      description: 'Follow-up comments from HKEX expected'
    });
    
    // Day 120: Despatch circular
    events.push({
      day: 120,
      date: this.calculateBusinessDay(startDate, 120, adjustForHolidays),
      event: 'EGM Notice & Despatch Circular',
      description: 'Final circular sent to shareholders',
      isKeyEvent: true
    });
    
    // Day 135: EGM
    events.push({
      day: 135,
      date: this.calculateBusinessDay(startDate, 135, adjustForHolidays),
      event: 'Extraordinary General Meeting',
      description: 'Shareholders vote on the reverse takeover',
      isKeyEvent: true
    });
    
    // Day 137: Results announcement
    events.push({
      day: 137,
      date: this.calculateBusinessDay(startDate, 137, adjustForHolidays),
      event: 'Results Announcement',
      description: 'Publication of EGM results'
    });
    
    // Day 150: Completion
    events.push({
      day: 150,
      date: this.calculateBusinessDay(startDate, 150, adjustForHolidays),
      event: 'Expected Completion',
      description: 'Target date for completing the reverse takeover',
      isKeyEvent: true
    });
    
    // Day 165: Resumption of trading
    events.push({
      day: 165,
      date: this.calculateBusinessDay(startDate, 165, adjustForHolidays),
      event: 'Resumption of Trading',
      description: 'Trading of shares resumes after completion',
      isKeyEvent: true
    });
  }
  
  /**
   * Add events for Rights Issue
   */
  private addRightsIssueEvents(events: TimetableEvent[], startDate: Date, adjustForHolidays: boolean): void {
    // Rights Issue follows: Announcement → Circular (if needed) → EGM (if needed) → Listing Documents → Trading
    
    // Default to approval required scenario for comprehensive guidance
    const requiresApproval = true; // Show approval process by default for complete guidance
    
    if (requiresApproval) {
      // Scenario B: Shareholder approval required
      this.addRightsIssueWithApproval(events, startDate, adjustForHolidays);
    } else {
      // Scenario A: No shareholder approval required
      this.addRightsIssueStandard(events, startDate, adjustForHolidays);
    }
  }
  
  private addRightsIssueStandard(events: TimetableEvent[], startDate: Date, adjustForHolidays: boolean): void {
    // Day 1: Publication of Announcement
    events.push({
      day: 1,
      date: this.calculateBusinessDay(startDate, 1, adjustForHolidays),
      event: 'Publication of Announcement',
      description: 'Initial announcement of the rights issue',
      isKeyEvent: true
    });
    
    // Day 3: Listing Documents Preparation (after announcement publication)
    events.push({
      day: 3,
      date: this.calculateBusinessDay(startDate, 3, adjustForHolidays),
      event: 'Listing Documents Preparation',
      description: 'Preparation of listing documents (5 business days)'
    });
    
    // Day 8: Stock Exchange Vetting
    events.push({
      day: 8,
      date: this.calculateBusinessDay(startDate, 8, adjustForHolidays),
      event: 'Stock Exchange Vetting',
      description: 'Vetting by the Stock Exchange (10 business days)'
    });
    
    // Day 18: Publication of Prospectus
    events.push({
      day: 18,
      date: this.calculateBusinessDay(startDate, 18, adjustForHolidays),
      event: 'Publication of Prospectus',
      description: 'Publication of listing document/prospectus after vetting completion',
      isKeyEvent: true
    });
    
    // Trading Events (T-based)
    const recordDate = this.calculateBusinessDay(startDate, 22, adjustForHolidays);
    
    // T-2: Last Cum-Rights Trading Day
    events.push({
      day: 20,
      date: this.calculateBusinessDay(recordDate, -2, adjustForHolidays),
      event: 'Last Cum-Rights Trading Day',
      description: 'Last day for trading in shares with rights entitlement',
      isKeyEvent: true
    });
    
    // T-1: Ex-Rights Date
    events.push({
      day: 21,
      date: this.calculateBusinessDay(recordDate, -1, adjustForHolidays),
      event: 'Ex-Rights Date',
      description: 'Shares begin trading ex-rights',
      isKeyEvent: true
    });
    
    // T: Record Date
    events.push({
      day: 22,
      date: recordDate,
      event: 'Record Date',
      description: 'Shareholder register closed to establish entitlements',
      isKeyEvent: true
    });
    
    // T+5: PAL Dispatch
    events.push({
      day: 25,
      date: this.calculateBusinessDay(recordDate, 5, adjustForHolidays),
      event: 'PAL Dispatch',
      description: 'Provisional Allotment Letters sent to shareholders'
    });
    
    // T+6: Nil-Paid Rights Trading Start
    events.push({
      day: 26,
      date: this.calculateBusinessDay(recordDate, 6, adjustForHolidays),
      event: 'Nil-Paid Rights Trading Start',
      description: 'First day of dealing in nil-paid rights',
      isKeyEvent: true
    });
    
    // T+16: Nil-Paid Rights Trading End
    events.push({
      day: 36,
      date: this.calculateBusinessDay(recordDate, 16, adjustForHolidays),
      event: 'Nil-Paid Rights Trading End',
      description: 'Last day of dealing in nil-paid rights',
      isKeyEvent: true
    });
    
    // T+20: Latest Acceptance Date
    events.push({
      day: 40,
      date: this.calculateBusinessDay(recordDate, 20, adjustForHolidays),
      event: 'Latest Acceptance Date',
      description: 'Final date for acceptance and payment',
      isKeyEvent: true
    });
    
    // T+27: New Shares Listing
    events.push({
      day: 47,
      date: this.calculateBusinessDay(recordDate, 27, adjustForHolidays),
      event: 'New Shares Listing',
      description: 'Dealing in fully-paid new shares commences',
      isKeyEvent: true
    });
  }
  
  private addRightsIssueWithApproval(events: TimetableEvent[], startDate: Date, adjustForHolidays: boolean): void {
    // Day 1: Publication of Announcement
    events.push({
      day: 1,
      date: this.calculateBusinessDay(startDate, 1, adjustForHolidays),
      event: 'Publication of Announcement',
      description: 'Initial announcement of the rights issue',
      isKeyEvent: true
    });

    // Phase 1: Circular process for shareholder approval
    // Day 3: Circular Preparation
    events.push({
      day: 3,
      date: this.calculateBusinessDay(startDate, 3, adjustForHolidays),
      event: 'Circular Preparation',
      description: 'Drafting of circular with details of rights issue'
    });
    
    // Day 8: Circular Vetting
    events.push({
      day: 8,
      date: this.calculateBusinessDay(startDate, 8, adjustForHolidays),
      event: 'Circular Vetting',
      description: 'Stock Exchange review of circular'
    });
    
    // Day 23: Circular Dispatch
    events.push({
      day: 23,
      date: this.calculateBusinessDay(startDate, 23, adjustForHolidays),
      event: 'Circular Dispatch',
      description: 'Dispatch of circular to shareholders'
    });
    
    // Day 44: EGM
    events.push({
      day: 44,
      date: this.calculateBusinessDay(startDate, 44, adjustForHolidays),
      event: 'EGM',
      description: 'Extraordinary General Meeting for shareholders approval',
      isKeyEvent: true
    });
    
    // Day 45: Listing Documents Preparation (AFTER approval)
    events.push({
      day: 45,
      date: this.calculateBusinessDay(startDate, 45, adjustForHolidays),
      event: 'Listing Documents Preparation',
      description: 'Preparation of listing documents (5 business days)'
    });
    
    // Day 50: Stock Exchange Vetting
    events.push({
      day: 50,
      date: this.calculateBusinessDay(startDate, 50, adjustForHolidays),
      event: 'Stock Exchange Vetting',
      description: 'Vetting by the Stock Exchange (10 business days)'
    });
    
    // Day 60: Publication of Prospectus
    events.push({
      day: 60,
      date: this.calculateBusinessDay(startDate, 60, adjustForHolidays),
      event: 'Publication of Prospectus',
      description: 'Publication of listing document/prospectus after vetting completion',
      isKeyEvent: true
    });
    
    // Then add trading events starting from Day 61
    const recordDate = this.calculateBusinessDay(startDate, 66, adjustForHolidays);
    this.addRightsIssueStandard(events, this.calculateBusinessDay(startDate, 61, adjustForHolidays), adjustForHolidays);
  }
  
  /**
   * Add events for Open Offer
   */
  private addOpenOfferEvents(events: TimetableEvent[], startDate: Date, adjustForHolidays: boolean): void {
    // Open Offer follows same sequence as Rights Issue but NO nil-paid rights trading
    
    // Default to approval required scenario for comprehensive guidance
    const requiresApproval = true; // Show approval process by default for complete guidance
    
    if (requiresApproval) {
      // Scenario B: Shareholder approval required
      this.addOpenOfferWithApproval(events, startDate, adjustForHolidays);
    } else {
      // Scenario A: No shareholder approval required
      this.addOpenOfferStandard(events, startDate, adjustForHolidays);
    }
  }
  
  private addOpenOfferStandard(events: TimetableEvent[], startDate: Date, adjustForHolidays: boolean): void {
    // Day 1: Publication of Announcement
    events.push({
      day: 1,
      date: this.calculateBusinessDay(startDate, 1, adjustForHolidays),
      event: 'Publication of Announcement',
      description: 'Initial announcement of the open offer',
      isKeyEvent: true
    });
    
    // Day 3: Listing Documents Preparation (after announcement publication)
    events.push({
      day: 3,
      date: this.calculateBusinessDay(startDate, 3, adjustForHolidays),
      event: 'Listing Documents Preparation',
      description: 'Preparation of listing documents (5 business days)'
    });
    
    // Day 8: Stock Exchange Vetting
    events.push({
      day: 8,
      date: this.calculateBusinessDay(startDate, 8, adjustForHolidays),
      event: 'Stock Exchange Vetting',
      description: 'Vetting by the Stock Exchange (10 business days)'
    });
    
    // Day 18: Publication of Prospectus
    events.push({
      day: 18,
      date: this.calculateBusinessDay(startDate, 18, adjustForHolidays),
      event: 'Publication of Prospectus',
      description: 'Publication of listing document/prospectus after vetting completion',
      isKeyEvent: true
    });
    
    // Trading Events (T-based) - NO nil-paid rights trading
    const recordDate = this.calculateBusinessDay(startDate, 22, adjustForHolidays);
    
    // T-2: Last Cum-Entitlement Trading Day
    events.push({
      day: 20,
      date: this.calculateBusinessDay(recordDate, -2, adjustForHolidays),
      event: 'Last Cum-Entitlement Trading Day',
      description: 'Last day for trading in shares with entitlement',
      isKeyEvent: true
    });
    
    // T-1: Ex-Entitlement Date
    events.push({
      day: 21,
      date: this.calculateBusinessDay(recordDate, -1, adjustForHolidays),
      event: 'Ex-Entitlement Date',
      description: 'Shares trade ex-entitlement from this date',
      isKeyEvent: true
    });
    
    // T: Record Date
    events.push({
      day: 22,
      date: recordDate,
      event: 'Record Date',
      description: 'Shareholder register closed to establish entitlements',
      isKeyEvent: true
    });
    
    // T+5: Application Form Dispatch
    events.push({
      day: 25,
      date: this.calculateBusinessDay(recordDate, 5, adjustForHolidays),
      event: 'Application Form Dispatch',
      description: 'Application forms sent to qualifying shareholders'
    });
    
    // T+19: Latest Acceptance Date
    events.push({
      day: 39,
      date: this.calculateBusinessDay(recordDate, 19, adjustForHolidays),
      event: 'Latest Acceptance Date',
      description: 'Final date for acceptance and payment',
      isKeyEvent: true
    });
    
    // T+26: New Shares Listing
    events.push({
      day: 46,
      date: this.calculateBusinessDay(recordDate, 26, adjustForHolidays),
      event: 'New Shares Listing',
      description: 'Dealing in new shares commences',
      isKeyEvent: true
    });
  }
  
  private addOpenOfferWithApproval(events: TimetableEvent[], startDate: Date, adjustForHolidays: boolean): void {
    // Day 1: Publication of Announcement
    events.push({
      day: 1,
      date: this.calculateBusinessDay(startDate, 1, adjustForHolidays),
      event: 'Publication of Announcement',
      description: 'Initial announcement of the open offer',
      isKeyEvent: true
    });

    // Same approval sequence as rights issue (but starting from day 3)
    this.addRightsIssueWithApproval(events, startDate, adjustForHolidays);
    
    // Then add open offer trading events (without nil-paid rights)
    const recordDate = this.calculateBusinessDay(startDate, 66, adjustForHolidays);
    this.addOpenOfferStandard(events, this.calculateBusinessDay(startDate, 61, adjustForHolidays), adjustForHolidays);
  }
  
  /**
   * Add generic transaction events
   */
  private addGenericTransactionEvents(events: TimetableEvent[], startDate: Date, adjustForHolidays: boolean): void {
    // Generic timeline for unspecified transaction types
    
    // Day 7: Due diligence completion
    events.push({
      day: 7,
      date: this.calculateBusinessDay(startDate, 7, adjustForHolidays),
      event: 'Due Diligence Completion',
      description: 'Complete due diligence process'
    });
    
    // Day 14: Draft documentation
    events.push({
      day: 14,
      date: this.calculateBusinessDay(startDate, 14, adjustForHolidays),
      event: 'Draft Documentation',
      description: 'Prepare transaction documentation'
    });
    
    // Day 21: Regulatory submission
    events.push({
      day: 21,
      date: this.calculateBusinessDay(startDate, 21, adjustForHolidays),
      event: 'Regulatory Submission',
      description: 'Submit required documentation to regulators',
      isKeyEvent: true
    });
    
    // Day 35: Expected regulatory approval
    events.push({
      day: 35,
      date: this.calculateBusinessDay(startDate, 35, adjustForHolidays),
      event: 'Expected Regulatory Approval',
      description: 'Anticipated receipt of regulatory approvals',
      isKeyEvent: true
    });
    
    // Day 42: Completion
    events.push({
      day: 42,
      date: this.calculateBusinessDay(startDate, 42, adjustForHolidays),
      event: 'Transaction Completion',
      description: 'Complete the transaction',
      isKeyEvent: true
    });
  }
  
  /**
   * Calculate business day from a start date
   */
  private calculateBusinessDay(startDate: Date, days: number, adjustForHolidays: boolean): Date {
    try {
      if (!startDate || isNaN(startDate.getTime())) {
        return new Date(); // Fallback to current date
      }
      
      if (days < 0) {
        return new Date(startDate.getTime()); // Return copy of start date
      }
      
      if (adjustForHolidays) {
        return this.businessDayCalculator.addBusinessDays(startDate, days);
      } else {
        // Create copy to avoid mutation and use proper date arithmetic
        return new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
      }
    } catch (error) {
      // Fallback: simple calendar day addition
      return new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
    }
  }
  
  /**
   * Search for reference timetables in the database
   */
  private async searchReferenceTimetables(transactionType: string): Promise<any[]> {
    try {
      // Search for timetable documents using the correct table name
      const { data, error } = await supabase
        .from('mb_listingrule_documents')
        .select('*')
        .or('title.ilike.%timetable%,description.ilike.%timetable%,file_path.ilike.%timetable%')
        .order('created_at', { ascending: false });
        
      if (error) {
        return [];
      }
      
      return data || [];
    } catch (err) {
      return [];
    }
  }
  
  /**
   * Get a phase for a specific day in the timetable
   */
  public getPhaseForDay(day: number): TimetablePhase {
    if (day === 0) {
      return TimetablePhase.ANNOUNCEMENT;
    } else if (day <= 14) {
      return TimetablePhase.CIRCULAR_PREPARATION;
    } else if (day <= 28) {
      return TimetablePhase.REGULATORY_REVIEW;
    } else if (day <= 42) {
      return TimetablePhase.SHAREHOLDER_APPROVAL;
    } else {
      return TimetablePhase.COMPLETION;
    }
  }
  
  /**
   * Format a date as a string
   */
  public formatDate(date: Date): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }
}

/**
 * Simplified function for generating dynamic timetables
 * This is the main export that other services use
 */
export async function generateDynamicTimetable(transactionType: string): Promise<string> {
  try {
    const generator = new DynamicTimetableGenerator();
    
    // Use current date from calendar service as reference
    const startDate = getCurrentDate();
    startDate.setHours(0, 0, 0, 0); // Normalize to start of day for consistent calculations
    
    const events = await generator.generateTimetable({
      startDate,
      transactionType: transactionType || 'generic transaction',
      adjustForHolidays: true
    });
    
    if (!events || events.length === 0) {
      return `# Error: No timetable events could be generated for "${transactionType}"`;
    }
  
  // Format events into a markdown table
  let timetable = `# ${transactionType.replace(/_/g, ' ').toUpperCase()} Execution Timetable\n\n`;
  timetable += `*Generated on ${generator.formatDate(startDate)} with Hong Kong business day calculations*\n\n`;
  timetable += `| Business Day | Date | Event | Description |\n`;
  timetable += `|--------------|------|-------|-------------|\n`;
  
    events.forEach(event => {
      try {
        const dayLabel = event.day === 0 ? 'T+0' : `T+${event.day}`;
        const isKeyEvent = event.isKeyEvent ? '**' : '';
        const formattedDate = generator.formatDate(event.date);
        const description = event.description || '-';
        
        timetable += `| ${dayLabel} | ${formattedDate} | ${isKeyEvent}${event.event}${isKeyEvent} | ${description} |\n`;
      } catch (formatError) {
        // Skip malformed events
      }
    });
    
    timetable += `\n**Note:** All dates calculated using Hong Kong business days (excludes weekends and public holidays)\n`;
    
    return timetable;
  } catch (error) {
    return `# Error: Failed to generate timetable for "${transactionType}"\n\nPlease check the transaction type and try again.`;
  }
}

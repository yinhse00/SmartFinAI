
import { addBusinessDays, isBusinessDay } from '@/services/calendar/businessDayCalculator';
import { formatHongKongDate, generateBusinessDayTimetable } from '@/services/calendar/dateUtils';
import { TimetableEntry } from '@/types/calendar';

/**
 * Generate dynamic rights issue timetable using business day calculations
 */
export const generateRightsIssueTimetable = (recordDate: Date): string => {
  const entries = generateBusinessDayTimetable(recordDate, [
    { businessDays: -10, event: 'HKEX Vetting Start', description: 'Earliest start of vetting process (up to 10 business days)' },
    { businessDays: -2, event: 'Last Cum-Rights Trading Day', description: 'Last day for trading with rights entitlement' },
    { businessDays: -1, event: 'Ex-Rights Date', description: 'Shares begin trading ex-rights' },
    { businessDays: 0, event: 'Record Date', description: 'Shareholder register closed to establish entitlements' },
    { businessDays: 5, event: 'PAL Dispatch', description: 'Provisional Allotment Letters sent to shareholders' },
    { businessDays: 6, event: 'Nil-Paid Rights Trading Start', description: 'First day of dealing in nil-paid rights' },
    { businessDays: 15, event: 'Nil-Paid Rights Trading End', description: 'Last day of dealing in nil-paid rights (min 10 business days)' },
    { businessDays: 17, event: 'Latest Acceptance Date', description: 'Final date for acceptance and payment' },
    { businessDays: 25, event: 'New Shares Listing', description: 'Dealing in fully-paid new shares commences' }
  ]);

  return formatTimetableAsMarkdown(entries, 'Rights Issue (Business Day Calculation)');
};

/**
 * Generate dynamic open offer timetable using business day calculations
 */
export const generateOpenOfferTimetable = (recordDate: Date): string => {
  const entries = generateBusinessDayTimetable(recordDate, [
    { businessDays: -10, event: 'HKEX Vetting Start', description: 'Earliest start of vetting process (up to 10 business days)' },
    { businessDays: -2, event: 'Last Cum-Entitlement Trading Day', description: 'Last day for trading with entitlement' },
    { businessDays: -1, event: 'Ex-Entitlement Date', description: 'Shares trade ex-entitlement from this date' },
    { businessDays: 0, event: 'Record Date', description: 'Shareholder register closed to establish entitlements' },
    { businessDays: 5, event: 'Application Form Dispatch', description: 'Application forms sent to qualifying shareholders' },
    { businessDays: 17, event: 'Latest Acceptance Date', description: 'Final date for acceptance and payment' },
    { businessDays: 25, event: 'New Shares Listing', description: 'Dealing in new shares commences' }
  ]);

  return formatTimetableAsMarkdown(entries, 'Open Offer (Business Day Calculation)');
};

/**
 * Generate dynamic takeover offer timetable using business day calculations
 */
export const generateTakeoverOfferTimetable = (offerDocumentDate: Date): string => {
  const entries = generateBusinessDayTimetable(offerDocumentDate, [
    { businessDays: -10, event: 'SFC Vetting Start', description: 'Earliest start of SFC vetting process (up to 20 business days)' },
    { businessDays: 0, event: 'Offer Document Dispatch', description: 'Posting of offer document' },
    { businessDays: 14, event: 'Offeree Board Circular', description: 'Offeree company board issues response circular' },
    { businessDays: 21, event: 'First Closing Date', description: 'Minimum offer period (Rule 15.1)' },
    { businessDays: 39, event: 'No Material New Information', description: 'Deadline for material new information (Rule 31.5)' },
    { businessDays: 46, event: 'Last Date for Revisions', description: 'Final deadline for offer revisions (Rule 16)' },
    { businessDays: 60, event: 'Final Unconditional Date', description: 'Latest date for offer to become unconditional (Rule 15.5)' },
    { businessDays: 81, event: 'Latest Final Closing Date', description: 'Absolute final closing date (Rule 15.3)' },
    { businessDays: 91, event: 'Payment Deadline', description: 'Payment due within 10 business days of acceptance' }
  ]);

  return formatTimetableAsMarkdown(entries, 'Takeover Offer (Business Day Calculation)');
};

/**
 * Format timetable entries as markdown table
 */
const formatTimetableAsMarkdown = (entries: TimetableEntry[], title: string): string => {
  let markdown = `# ${title}\n\n`;
  markdown += `| Business Day | Date | Event | Description |\n`;
  markdown += `|--------------|------|-------|-------------|\n`;

  entries.forEach(entry => {
    const businessDayLabel = entry.businessDayOffset === 0 ? 'T' : 
                            entry.businessDayOffset > 0 ? `T+${entry.businessDayOffset}` : 
                            `T${entry.businessDayOffset}`;
    
    const formattedDate = formatHongKongDate(entry.date);
    const businessDayIndicator = entry.isBusinessDay ? '' : ' ⚠️';
    
    markdown += `| ${businessDayLabel} | ${formattedDate}${businessDayIndicator} | ${entry.event} | ${entry.description} |\n`;
  });

  markdown += `\n**Notes:**\n`;
  markdown += `- All calculations use Hong Kong business days (excludes weekends and public holidays)\n`;
  markdown += `- ⚠️ indicates dates that fall on non-business days\n`;
  markdown += `- Minimum business day requirements per regulatory framework are enforced\n`;
  markdown += `- Final timetables must be approved by relevant regulator before announcement\n`;

  return markdown;
};

/**
 * Get appropriate timetable generator based on query type
 */
export const generateDynamicTimetable = (queryType: string, baseDate: Date = new Date()): string => {
  // Ensure baseDate is a business day for record date
  const recordDate = isBusinessDay(baseDate) ? baseDate : addBusinessDays(baseDate, 1);

  switch (queryType) {
    case 'rights_issue':
      return generateRightsIssueTimetable(recordDate);
    case 'open_offer':
      return generateOpenOfferTimetable(recordDate);
    case 'takeovers_code':
    case 'takeover_offer':
      return generateTakeoverOfferTimetable(recordDate);
    case 'share_consolidation':
      return generateShareConsolidationTimetable(recordDate);
    case 'board_lot_change':
      return generateBoardLotChangeTimetable(recordDate);
    case 'company_name_change':
      return generateCompanyNameChangeTimetable(recordDate);
    default:
      return generateRightsIssueTimetable(recordDate);
  }
};

/**
 * Generate other corporate action timetables
 */
const generateShareConsolidationTimetable = (effectiveDate: Date): string => {
  const entries = generateBusinessDayTimetable(effectiveDate, [
    { businessDays: -45, event: 'EGM Notice', description: 'Shareholders meeting notice (minimum 21 clear days)' },
    { businessDays: -25, event: 'Circular Dispatch', description: 'Circular with consolidation details' },
    { businessDays: -1, event: 'Last Trading Day (Old Shares)', description: 'Final day for trading existing shares' },
    { businessDays: 0, event: 'Effective Date', description: 'Share consolidation takes effect' },
    { businessDays: 1, event: 'First Trading Day (New Shares)', description: 'Trading in consolidated shares begins' },
    { businessDays: 3, event: 'Free Exchange Period Start', description: 'Certificate exchange period begins' },
    { businessDays: 22, event: 'Free Exchange Period End', description: 'Deadline for free certificate exchange' }
  ]);

  return formatTimetableAsMarkdown(entries, 'Share Consolidation (Business Day Calculation)');
};

const generateBoardLotChangeTimetable = (effectiveDate: Date): string => {
  const entries = generateBusinessDayTimetable(effectiveDate, [
    { businessDays: -5, event: 'Announcement', description: 'Board lot change announcement' },
    { businessDays: 0, event: 'Effective Date', description: 'New board lot size takes effect' },
    { businessDays: 1, event: 'Parallel Trading Start', description: 'Trading in both old and new board lots' },
    { businessDays: 21, event: 'Parallel Trading End', description: 'End of parallel trading arrangements' },
    { businessDays: 22, event: 'Certificate Exchange Deadline', description: 'Final day for free certificate exchange' }
  ]);

  return formatTimetableAsMarkdown(entries, 'Board Lot Change (Business Day Calculation)');
};

const generateCompanyNameChangeTimetable = (effectiveDate: Date): string => {
  const entries = generateBusinessDayTimetable(effectiveDate, [
    { businessDays: -45, event: 'EGM Notice', description: 'Shareholders meeting notice for name change' },
    { businessDays: -25, event: 'Circular Dispatch', description: 'Circular with name change details' },
    { businessDays: 0, event: 'EGM Approval', description: 'Shareholders approve name change' },
    { businessDays: 10, event: 'Certificate of Incorporation', description: 'New certificate issued' },
    { businessDays: 14, event: 'Stock Short Name Change', description: 'Trading under new name begins' },
    { businessDays: 15, event: 'Free Exchange Period Start', description: 'Certificate exchange begins' },
    { businessDays: 45, event: 'Free Exchange Period End', description: 'Certificate exchange deadline' }
  ]);

  return formatTimetableAsMarkdown(entries, 'Company Name Change (Business Day Calculation)');
};

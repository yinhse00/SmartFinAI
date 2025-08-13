// Centralized IPO Prospectus sections list
// Keep titles exactly as provided by stakeholder, with stable slug ids.

export interface IPOSectionDef {
  id: string;
  title: string;
}

export const IPO_SECTIONS: IPOSectionDef[] = [
  { id: 'expected-timetable', title: 'EXPECTED TIMETABLE' },
  { id: 'contents', title: 'CONTENTS' },
  { id: 'summary', title: 'SUMMARY' },
  { id: 'definitions', title: 'DEFINITIONS' },
  { id: 'glossary-of-technical-terms', title: 'GLOSSARY OF TECHNICAL TERMS' },
  // Duplicate provided in spec; keep with unique id
  { id: 'contents-2', title: 'CONTENTS' },
  { id: 'forward-looking-statements', title: 'FORWARD-LOOKING STATEMENTS' },
  { id: 'risk-factors', title: 'RISK FACTORS' },
  { id: 'waivers-from-strict-compliance', title: 'WAIVERS FROM STRICT COMPLIANCE WITH THE LISTING RULES' },
  { id: 'info-about-prospectus-and-global-offering', title: 'INFORMATION ABOUT THIS PROSPECTUS AND THE GLOBAL OFFERING' },
  { id: 'directors-and-parties-involved', title: 'DIRECTORS, SUPERVISORS AND PARTIES INVOLVED IN THE GLOBAL OFFERING' },
  { id: 'corporate-information', title: 'CORPORATE INFORMATION' },
  { id: 'industry-overview', title: 'INDUSTRY OVERVIEW' },
  { id: 'regulatory-overview', title: 'REGULATORY OVERVIEW' },
  { id: 'history-development-corporate-structure-business', title: 'HISTORY, DEVELOPMENT AND CORPORATE STRUCTURE BUSINESS' },
  { id: 'directors-supervisors-and-senior-management', title: 'DIRECTORS, SUPERVISORS AND SENIOR MANAGEMENT' },
  { id: 'relationship-with-controlling-shareholders', title: 'RELATIONSHIP WITH OUR CONTROLLING SHAREHOLDERS' },
  { id: 'connected-transactions', title: 'CONNECTED TRANSACTIONS' },
  { id: 'substantial-shareholders', title: 'SUBSTANTIAL SHAREHOLDERS' },
  { id: 'share-capital', title: 'SHARE CAPITAL' },
  { id: 'cornerstone-investors', title: 'CORNERSTONE INVESTORS' },
  { id: 'financial-information', title: 'FINANCIAL INFORMATION' },
  { id: 'future-plans-and-use-of-proceeds', title: 'FUTURE PLANS AND USE OF PROCEEDS' },
  { id: 'underwriting', title: 'UNDERWRITING' },
  { id: 'structure-of-global-offering', title: 'STRUCTURE OF THE GLOBAL OFFERING' },
  { id: 'how-to-apply-for-hk-offer-shares', title: 'HOW TO APPLY FOR HONG KONG OFFER SHARES' }
];

export const IPO_SECTION_TITLE_MAP: Record<string, string> = IPO_SECTIONS.reduce((acc, s) => {
  acc[s.id] = s.title;
  return acc;
}, {} as Record<string, string>);

export function getIPOSectionTitle(id: string, fallback = 'Prospectus Section'): string {
  return IPO_SECTION_TITLE_MAP[id] || fallback;
}

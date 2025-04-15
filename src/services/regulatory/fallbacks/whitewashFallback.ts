
import { RegulatoryEntry } from '../../databaseService';

/**
 * Fix the issue with the whitewash waiver information by providing all required properties
 */
export function getWhitewashWaiverFallbackEntry(): RegulatoryEntry {
  return {
    id: `whitewash-waiver-${Date.now()}`,
    title: "Whitewash Waiver Dealing Requirements",
    source: "Takeovers Code Note 1 to Rule 32",
    content: "When a waiver from a mandatory general offer obligation under Rule 26 is granted (whitewash waiver), neither the potential controlling shareholders nor any person acting in concert with them may deal in the securities of the company during the period between the announcement of the proposals and the completion of the subscription. The Executive will not normally waive an obligation under Rule 26 if the potential controlling shareholders or their concert parties have acquired voting rights in the company in the 6 months prior to the announcement of the proposals but subsequent to negotiations with the directors of the company.",
    category: "takeovers" as const,
    lastUpdated: new Date(),
    status: "active" as const
  };
}

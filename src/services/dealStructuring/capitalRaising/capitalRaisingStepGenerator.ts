
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { CapitalRaisingContext } from '@/types/capitalRaising';
import { CapitalRaisingClassifier } from './capitalRaisingClassifier';

export class CapitalRaisingStepGenerator {
  static generateCapitalRaisingSteps(
    results: AnalysisResults,
    description: string
  ) {
    const context = CapitalRaisingClassifier.extractCapitalRaisingContext(description, results);
    
    switch (context.type) {
      case 'rights_issue':
        return this.generateRightsIssueSteps(context);
      case 'open_offer':
        return this.generateOpenOfferSteps(context);
      case 'placement':
        return this.generatePlacementSteps(context);
      case 'subscription':
        return this.generateSubscriptionSteps(context);
      default:
        return this.generateGenericCapitalRaisingSteps(context);
    }
  }
  
  private static generateRightsIssueSteps(context: CapitalRaisingContext) {
    const proceedsText = context.proceedsAmount > 0 ? 
      `${context.currency} ${(context.proceedsAmount / 1000000).toFixed(0)}M` : 'capital';
    
    return [
      {
        id: 'step-1',
        title: 'Board Resolution & Announcement',
        description: `${context.issuingCompany} board approves rights issue${context.offerRatio ? ` on ${context.offerRatio} basis` : ''} to raise ${proceedsText}. Public announcement made to market.`,
        entities: [context.issuingCompany],
        type: 'regulatory',
        criticalPath: true
      },
      {
        id: 'step-2',
        title: 'Record Date & Prospectus',
        description: `Record date set for determining shareholders' entitlements. Rights issue prospectus filed with regulators and distributed to qualifying shareholders.`,
        entities: [context.issuingCompany, 'Qualifying Shareholders'],
        type: 'regulatory',
        criticalPath: true
      },
      {
        id: 'step-3',
        title: 'Rights Trading Period',
        description: `Rights commence trading in the market. Shareholders can exercise rights, sell rights, or let them lapse. Application forms submitted during subscription period.`,
        entities: [context.issuingCompany, 'Rights Holders', 'Rights Purchasers'],
        type: 'operational',
        criticalPath: true
      },
      {
        id: 'step-4',
        title: 'Allotment & Settlement',
        description: `Rights exercise period closes. New shares allotted to subscribing shareholders. Settlement of ${proceedsText} proceeds to ${context.issuingCompany}. New shares commence trading.`,
        entities: [context.issuingCompany, 'Subscribing Shareholders'],
        type: 'financial',
        criticalPath: true
      }
    ];
  }
  
  private static generateOpenOfferSteps(context: CapitalRaisingContext) {
    const proceedsText = context.proceedsAmount > 0 ? 
      `${context.currency} ${(context.proceedsAmount / 1000000).toFixed(0)}M` : 'capital';
    
    return [
      {
        id: 'step-1',
        title: 'Board Approval & Announcement',
        description: `${context.issuingCompany} announces open offer${context.offerRatio ? ` on ${context.offerRatio} basis` : ''} to existing shareholders to raise ${proceedsText}.`,
        entities: [context.issuingCompany],
        type: 'regulatory',
        criticalPath: true
      },
      {
        id: 'step-2',
        title: 'Prospectus & Record Date',
        description: `Open offer prospectus prepared and filed. Record date established for determining qualifying shareholders. No rights trading (non-renounceable).`,
        entities: [context.issuingCompany, 'Qualifying Shareholders'],
        type: 'regulatory',
        criticalPath: true
      },
      {
        id: 'step-3',
        title: 'Application Period',
        description: `Qualifying shareholders submit applications during offer period. Excess applications may be accepted subject to scaling back arrangements.`,
        entities: [context.issuingCompany, 'Applying Shareholders'],
        type: 'operational',
        criticalPath: true
      },
      {
        id: 'step-4',
        title: 'Allotment & Proceeds',
        description: `New shares allotted to successful applicants. ${proceedsText} proceeds received by ${context.issuingCompany}. New shares commence trading.`,
        entities: [context.issuingCompany, 'New Shareholders'],
        type: 'financial',
        criticalPath: true
      }
    ];
  }
  
  private static generatePlacementSteps(context: CapitalRaisingContext) {
    const proceedsText = context.proceedsAmount > 0 ? 
      `${context.currency} ${(context.proceedsAmount / 1000000).toFixed(0)}M` : 'capital';
    
    return [
      {
        id: 'step-1',
        title: 'Placement Mandate',
        description: `${context.issuingCompany} engages placement agents and obtains necessary approvals for placing new shares to raise ${proceedsText}.`,
        entities: [context.issuingCompany, 'Placement Agents'],
        type: 'regulatory',
        criticalPath: true
      },
      {
        id: 'step-2',
        title: 'Investor Identification',
        description: `Placement agents identify and approach potential institutional and professional investors. Terms negotiated and commitments secured.`,
        entities: [context.issuingCompany, 'Placement Agents', 'Institutional Investors'],
        type: 'operational',
        criticalPath: true
      },
      {
        id: 'step-3',
        title: 'Completion & Settlement',
        description: `Placement completed with new shares issued to placing shareholders. ${proceedsText} proceeds received by ${context.issuingCompany}.`,
        entities: [context.issuingCompany, 'New Placing Shareholders'],
        type: 'financial',
        criticalPath: true
      }
    ];
  }
  
  private static generateSubscriptionSteps(context: CapitalRaisingContext) {
    const proceedsText = context.proceedsAmount > 0 ? 
      `${context.currency} ${(context.proceedsAmount / 1000000).toFixed(0)}M` : 'capital';
    
    return [
      {
        id: 'step-1',
        title: 'Subscription Agreement',
        description: `${context.issuingCompany} enters into subscription agreement with investor(s) for new share issuance to raise ${proceedsText}.`,
        entities: [context.issuingCompany, 'Subscribing Investors'],
        type: 'operational',
        criticalPath: true
      },
      {
        id: 'step-2',
        title: 'Regulatory Approvals',
        description: `Obtain necessary regulatory approvals and shareholder approvals (if required) for the subscription arrangement.`,
        entities: [context.issuingCompany],
        type: 'regulatory',
        criticalPath: true
      },
      {
        id: 'step-3',
        title: 'Completion',
        description: `Subscription completed with new shares issued to subscribers. ${proceedsText} proceeds received by ${context.issuingCompany}.`,
        entities: [context.issuingCompany, 'New Subscribers'],
        type: 'financial',
        criticalPath: true
      }
    ];
  }
  
  private static generateGenericCapitalRaisingSteps(context: CapitalRaisingContext) {
    const proceedsText = context.proceedsAmount > 0 ? 
      `${context.currency} ${(context.proceedsAmount / 1000000).toFixed(0)}M` : 'capital';
    
    return [
      {
        id: 'step-1',
        title: 'Capital Raising Announcement',
        description: `${context.issuingCompany} announces capital raising exercise to raise ${proceedsText} through equity issuance.`,
        entities: [context.issuingCompany],
        type: 'regulatory',
        criticalPath: true
      },
      {
        id: 'step-2',
        title: 'Implementation',
        description: `Capital raising implemented according to the chosen structure and regulatory requirements.`,
        entities: [context.issuingCompany, 'Investors'],
        type: 'operational',
        criticalPath: true
      },
      {
        id: 'step-3',
        title: 'Completion',
        description: `New equity issued and ${proceedsText} proceeds received by ${context.issuingCompany}.`,
        entities: [context.issuingCompany, 'New Shareholders'],
        type: 'financial',
        criticalPath: true
      }
    ];
  }
}

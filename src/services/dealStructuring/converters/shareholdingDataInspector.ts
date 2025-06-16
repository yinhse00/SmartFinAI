
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';

export class ShareholdingDataInspector {
  static inspectShareholdingData(results: AnalysisResults): void {
    console.log('🔍 SHAREHOLDING DATA INSPECTION');
    console.log('================================');
    
    const shareholding = results.shareholding;
    if (!shareholding) {
      console.log('❌ No shareholding data found in results');
      return;
    }
    
    console.log('📋 Shareholding object structure:', Object.keys(shareholding));
    console.log('📊 Full shareholding data:', JSON.stringify(shareholding, null, 2));
    
    // Check before data
    if (shareholding.before) {
      console.log('✅ Before shareholders found:', shareholding.before.length);
      shareholding.before.forEach((sh, idx) => {
        console.log(`  ${idx + 1}. ${sh.name}: ${sh.percentage}%`);
      });
    }
    
    // Check after data
    if (shareholding.after) {
      if (Array.isArray(shareholding.after)) {
        console.log('✅ After shareholders (array):', shareholding.after.length);
        shareholding.after.forEach((sh, idx) => {
          console.log(`  ${idx + 1}. ${sh.name}: ${sh.percentage}%`);
        });
      } else {
        console.log('✅ After shareholders (object):', Object.keys(shareholding.after));
      }
    }
    
    // Look for scenario-specific data
    const possibleScenarioKeys = [
      'fullTakeup', 'full_takeup', 'noOtherTakeup', 'no_other_takeup',
      'scenarios', 'scenario1', 'scenario2', 'takeupScenarios'
    ];
    
    possibleScenarioKeys.forEach(key => {
      if ((shareholding as any)[key]) {
        console.log(`🎯 Found scenario data at key '${key}':`, (shareholding as any)[key]);
      }
    });
    
    // Check deal economics for additional context
    if (results.dealEconomics) {
      console.log('💰 Deal economics available:', Object.keys(results.dealEconomics));
    }
    
    console.log('================================');
  }
  
  static identifyControllingShareholderForCapitalRaising(results: AnalysisResults): string | null {
    const beforeShareholders = results.shareholding?.before || [];
    
    // Find the shareholder with the highest percentage (likely the controlling shareholder/underwriter)
    let controllingShareholder = null;
    let highestPercentage = 0;
    
    beforeShareholders.forEach(shareholder => {
      if (shareholder.percentage > highestPercentage) {
        highestPercentage = shareholder.percentage;
        controllingShareholder = shareholder.name;
      }
    });
    
    console.log('🎯 Identified controlling shareholder for capital raising:', controllingShareholder);
    return controllingShareholder;
  }
  
  static calculateCapitalRaisingScenarios(results: AnalysisResults): {
    fullTakeup: any[] | null;
    noOtherTakeup: any[] | null;
  } {
    this.inspectShareholdingData(results);
    
    const shareholding = results.shareholding;
    if (!shareholding || !shareholding.before) {
      console.log('❌ Missing shareholding data for calculation');
      return { fullTakeup: null, noOtherTakeup: null };
    }
    
    // Full Take-up scenario: Use BEFORE shareholding (no dilution)
    const fullTakeup = shareholding.before.map(sh => ({
      name: sh.name,
      percentage: sh.percentage
    }));
    
    // No Other Take-up scenario: Calculate dilution based on controlling shareholder participation
    const controllingShareholder = this.identifyControllingShareholderForCapitalRaising(results);
    
    let noOtherTakeup = null;
    
    if (controllingShareholder) {
      // Check if we have specific scenario data from AI analysis
      const afterData = shareholding.after;
      
      if (Array.isArray(afterData)) {
        // afterData is an array of shareholders, use as diluted scenario
        noOtherTakeup = afterData.map(sh => ({
          name: sh.name,
          percentage: sh.percentage
        }));
        console.log('📊 Using after shareholding data for no other take-up scenario');
      } else if (afterData && !Array.isArray(afterData)) {
        // Single after scenario object - convert to array format
        noOtherTakeup = Object.entries(afterData).map(([name, percentage]) => ({
          name,
          percentage: Number(percentage)
        }));
        console.log('📊 Converting single after scenario object to array format');
      } else {
        // Fallback: Calculate dilution manually
        console.log('📊 Calculating dilution manually - no specific after data found');
        noOtherTakeup = this.calculateDilutedShareholders(shareholding.before, controllingShareholder);
      }
    }
    
    // Final fallback: if no controlling shareholder identified, use after data or before data
    if (!noOtherTakeup) {
      if (shareholding.after && Array.isArray(shareholding.after)) {
        noOtherTakeup = shareholding.after;
        console.log('📊 Fallback: Using after data for no other take-up');
      } else {
        noOtherTakeup = fullTakeup;
        console.log('📊 Fallback: Using before data for no other take-up (no dilution data available)');
      }
    }
    
    console.log('🎯 Final calculated scenarios:');
    console.log('  Full takeup (no dilution):', fullTakeup);
    console.log('  No other takeup (diluted):', noOtherTakeup);
    
    return { fullTakeup, noOtherTakeup };
  }
  
  private static calculateDilutedShareholders(beforeShareholders: any[], controllingShareholder: string): any[] {
    // Simple dilution calculation assuming 20% new shares issued to controlling shareholder
    const dilutionFactor = 0.8; // 80% of original percentage after 20% dilution
    const controllingShareholderBonus = 20; // Additional 20% for controlling shareholder
    
    return beforeShareholders.map(sh => {
      if (sh.name === controllingShareholder) {
        return {
          name: sh.name,
          percentage: Math.round((sh.percentage * dilutionFactor + controllingShareholderBonus) * 100) / 100
        };
      } else {
        return {
          name: sh.name,
          percentage: Math.round(sh.percentage * dilutionFactor * 100) / 100
        };
      }
    });
  }
}


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
      
      if (Array.isArray(afterData) && afterData.length >= 2) {
        // Use AI-provided scenario data if available
        // The AI might have calculated the dilution scenarios
        const scenario1 = afterData[0];
        const scenario2 = afterData[1];
        
        // Determine which scenario represents "no other take-up" (higher controlling shareholder percentage)
        const scenario1ControllingPercentage = scenario1.find((sh: any) => sh.name === controllingShareholder)?.percentage || 0;
        const scenario2ControllingPercentage = scenario2.find((sh: any) => sh.name === controllingShareholder)?.percentage || 0;
        
        if (scenario1ControllingPercentage > scenario2ControllingPercentage) {
          noOtherTakeup = scenario1;
          console.log('📊 Using scenario 1 for no other take-up (higher controlling percentage)');
        } else {
          noOtherTakeup = scenario2;
          console.log('📊 Using scenario 2 for no other take-up (higher controlling percentage)');
        }
      } else if (afterData && !Array.isArray(afterData)) {
        // Single after scenario - use as no other take-up scenario
        noOtherTakeup = afterData;
        console.log('📊 Using single after scenario for no other take-up');
      }
    }
    
    // Fallback: if no specific scenario data, use the single after data or before data
    if (!noOtherTakeup && shareholding.after && !Array.isArray(shareholding.after)) {
      noOtherTakeup = shareholding.after;
      console.log('📊 Fallback: Using single after data for no other take-up');
    }
    
    console.log('🎯 Final calculated scenarios:');
    console.log('  Full takeup (no dilution):', fullTakeup);
    console.log('  No other takeup (diluted):', noOtherTakeup);
    
    return { fullTakeup, noOtherTakeup };
  }
}

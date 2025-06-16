
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
  
  static extractCorrectScenarioData(results: AnalysisResults): {
    fullTakeup: any[] | null;
    noOtherTakeup: any[] | null;
  } {
    this.inspectShareholdingData(results);
    
    const shareholding = results.shareholding;
    if (!shareholding) {
      return { fullTakeup: null, noOtherTakeup: null };
    }
    
    // Strategy 1: Look for explicit scenario fields
    let fullTakeup = (shareholding as any).fullTakeup || (shareholding as any).full_takeup;
    let noOtherTakeup = (shareholding as any).noOtherTakeup || (shareholding as any).no_other_takeup;
    
    // Strategy 2: Check if 'after' is an array with multiple scenarios
    if (!fullTakeup && !noOtherTakeup && Array.isArray((shareholding as any).after)) {
      const afterArray = (shareholding as any).after;
      if (afterArray.length >= 2) {
        fullTakeup = afterArray[0];
        noOtherTakeup = afterArray[1];
        console.log('📊 Using array-based scenario detection');
      }
    }
    
    // Strategy 3: Check for scenarios object
    if (!fullTakeup && !noOtherTakeup && (shareholding as any).scenarios) {
      const scenarios = (shareholding as any).scenarios;
      if (Array.isArray(scenarios) && scenarios.length >= 2) {
        fullTakeup = scenarios[0];
        noOtherTakeup = scenarios[1];
        console.log('📊 Using scenarios array');
      }
    }
    
    console.log('🎯 Final extracted data:');
    console.log('  Full takeup:', fullTakeup);
    console.log('  No other takeup:', noOtherTakeup);
    
    return { fullTakeup, noOtherTakeup };
  }
}

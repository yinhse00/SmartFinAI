import { ShareholderData } from '@/types/dealStructuring';

const COLORS: Record<string, string> = {
  individual: '#8884d8',
  institutional: '#82ca9d',
  connected: '#ffc658',
  public: '#ff7300',
  fund: '#00c49f',
  new_equity_recipient: '#facc15',
};

function titleCase(label: string) {
  return label.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

function aggregateByType(data: ShareholderData[]) {
  const map = new Map<string, number>();
  for (const d of data) {
    const t = (d.type || 'institutional').toLowerCase();
    map.set(t, (map.get(t) || 0) + (d.percentage || 0));
  }
  return map;
}

function buildThemeVariablesForTypes(types: string[], colorMap: Record<string, string>) {
  const vars: Record<string, string> = {};
  types.forEach((t, i) => {
    vars[`pie${i + 1}`] = colorMap[t] || '#8884d8';
  });
  return vars;
}

function buildPieDiagram(title: string, orderedTypes: string[], sums: Map<string, number>, themeVars: Record<string, string>) {
  const init = `%%{init: {"theme": "base", "logLevel": "fatal", "pie": {"showData": true, "textPosition": 0.6}, "themeVariables": ${JSON.stringify(themeVars)} }}%%`;
  const lines: string[] = [];
  lines.push(init);
  lines.push(`pie showData title ${title.replace(/"/g, '\\"')}`);
  for (const t of orderedTypes) {
    const v = sums.get(t) || 0;
    if (v > 0) {
      lines.push(`  "${titleCase(t)}" : ${Number(v.toFixed(4))}`);
    }
  }
  return lines.join('\n');
}

export function buildMermaidShareholdingPies(
  beforeData: ShareholderData[],
  afterData: ShareholderData[],
  opts?: { beforeTitle?: string; afterTitle?: string }
): { beforeChart: string; afterChart: string } {
  const sumsBefore = aggregateByType(beforeData);
  const sumsAfter = aggregateByType(afterData);

  // Determine unified ordered list of types for consistent colors
  const preferredOrder = ['individual', 'institutional', 'connected', 'public', 'fund', 'new_equity_recipient'];
  const presentTypes = new Set<string>([...sumsBefore.keys(), ...sumsAfter.keys()]);
  const unknownTypes: string[] = [];
  for (const t of presentTypes) {
    if (!preferredOrder.includes(t)) unknownTypes.push(t);
  }
  unknownTypes.sort();
  const orderedTypes = preferredOrder.filter((t) => presentTypes.has(t)).concat(unknownTypes);

  const themeVars = buildThemeVariablesForTypes(orderedTypes, COLORS);

  const beforeTitle = opts?.beforeTitle || 'Before Shareholding';
  const afterTitle = opts?.afterTitle || 'After Shareholding';

  const beforeChart = buildPieDiagram(beforeTitle, orderedTypes, sumsBefore, themeVars);
  const afterChart = buildPieDiagram(afterTitle, orderedTypes, sumsAfter, themeVars);

  return { beforeChart, afterChart };
}

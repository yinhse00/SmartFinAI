import { TransactionFlow, AnyTransactionRelationship, OwnershipRelationship, ConsiderationRelationship } from '@/types/transactionFlow';

const sanitizeId = (id: string) => {
  const cleaned = id.replace(/[^a-zA-Z0-9_]/g, '_');
  return /^[a-zA-Z]/.test(cleaned) ? cleaned : `n_${cleaned}`;
};

const escapeLabel = (text?: string | number) => {
  if (text === undefined || text === null) return '';
  return String(text).replace(/"/g, '\\"');
};

const nodeFor = (prefix: 'b' | 'a', type: string, id: string, label: string) => {
  const safeId = `${prefix}_${sanitizeId(id)}`;
  const shape = '"' + label + '"';
  // rounded box for entities
  return `${safeId}(${shape}):::${type}`;
};

const findEntityIdByName = (names: string[], section: TransactionFlow['before'] | TransactionFlow['after']) => {
  const lower = names.map((n) => n.toLowerCase());
  const e = section.entities.find((en) => lower.includes(en.name.toLowerCase()));
  return e?.id;
};

export function buildMermaidTransactionFlowVertical(flow: TransactionFlow): string {
  const lines: string[] = [];
  lines.push('%% Auto-generated vertical transaction flow');
  lines.push('flowchart TD');

  // Subgraph: Before
  lines.push('  subgraph Before[Before Structure]');
  lines.push('    direction TB');
  for (const e of flow.before.entities) {
    const labelParts = [e.name];
    if (e.percentage !== undefined) labelParts.push(`${e.percentage}%`);
    if (e.value !== undefined && e.currency) labelParts.push(`${e.value} ${e.currency}`);
    const label = labelParts.join(' | ');
    lines.push('    ' + nodeFor('b', e.type, e.id, label));
  }
  lines.push('  end');

  // Subgraph: Transaction
  lines.push('  subgraph Transaction[Transaction]');
  lines.push('    direction TB');
  const amount = flow.transactionContext.amount;
  const currency = flow.transactionContext.currency;
  const tLabel = `${escapeLabel(flow.transactionContext.type)} | ${escapeLabel(flow.transactionContext.description || '')} | ${amount} ${currency}`;
  lines.push(`    txn([\"${tLabel}\"]):::txn`);
  lines.push('  end');

  // Subgraph: After
  lines.push('  subgraph After[After Structure]');
  lines.push('    direction TB');
  for (const e of flow.after.entities) {
    const labelParts = [e.name];
    if (e.percentage !== undefined) labelParts.push(`${e.percentage}%`);
    if (e.value !== undefined && e.currency) labelParts.push(`${e.value} ${e.currency}`);
    const label = labelParts.join(' | ');
    lines.push('    ' + nodeFor('a', e.type, e.id, label));
  }
  lines.push('  end');

  // Relationships - Before
  const relToEdge = (rel: AnyTransactionRelationship, prefix: 'b' | 'a') => {
    const s = `${prefix}_${sanitizeId(rel.source)}`;
    const t = `${prefix}_${sanitizeId(rel.target)}`;
    let label = rel.label || rel.type;
    if ((rel as OwnershipRelationship).percentage != null && (rel.type === 'ownership' || rel.type === 'control')) {
      label = `${rel.type} ${(rel as OwnershipRelationship).percentage}%`;
    }
    if ((rel as ConsiderationRelationship).value != null && 'value' in rel) {
      const cr = rel as ConsiderationRelationship;
      label = `${rel.type} ${cr.value}${cr.currency ? ' ' + cr.currency : ''}`;
    }
    return `  ${s} -- \"${escapeLabel(label)}\" --> ${t}`;
  };

  for (const rel of flow.before.relationships) {
    lines.push(relToEdge(rel, 'b'));
  }

  // Relationships - After
  for (const rel of flow.after.relationships) {
    lines.push(relToEdge(rel, 'a'));
  }

  // Special transaction flow edges (dashed)
  const buyerNames = [flow.transactionContext.buyerName];
  const targetNames = [flow.transactionContext.targetName];
  const beforeBuyerId = findEntityIdByName(buyerNames, flow.before);
  const afterTargetId = findEntityIdByName(targetNames, flow.after);

  if (beforeBuyerId) {
    lines.push(`  b_${sanitizeId(beforeBuyerId)} -.->|executes| txn`);
  }
  if (afterTargetId) {
    lines.push(`  txn -.->|closes into| a_${sanitizeId(afterTargetId)}`);
  }

  // Styling
  lines.push('  classDef buyer fill:#DBEAFE,stroke:#3B82F6,stroke-width:1px;');
  lines.push('  classDef target fill:#FEE2E2,stroke:#EF4444,stroke-width:1px;');
  lines.push('  classDef shareholder fill:#DCFCE7,stroke:#10B981,stroke-width:1px;');
  lines.push('  classDef stockholder fill:#DCFCE7,stroke:#10B981,stroke-width:1px;');
  lines.push('  classDef parent fill:#EDE9FE,stroke:#8B5CF6,stroke-width:1px;');
  lines.push('  classDef subsidiary fill:#EDE9FE,stroke:#8B5CF6,stroke-width:1px;');
  lines.push('  classDef intermediary fill:#F5F5F5,stroke:#6B7280,stroke-width:1px;');
  lines.push('  classDef investor fill:#FFF7ED,stroke:#F59E0B,stroke-width:1px;');
  lines.push('  classDef lender fill:#ECFEFF,stroke:#06B6D4,stroke-width:1px;');
  lines.push('  classDef spv fill:#FAE8FF,stroke:#A855F7,stroke-width:1px;');
  lines.push('  classDef jv fill:#FAE8FF,stroke:#A855F7,stroke-width:1px;');
  lines.push('  classDef escrow fill:#FEF3C7,stroke:#D97706,stroke-width:1px;');
  lines.push('  classDef consideration fill:#FEF3C7,stroke:#EAB308,stroke-width:1px;');
  lines.push('  classDef debt fill:#F3F4F6,stroke:#374151,stroke-width:1px;');
  lines.push('  classDef equity_instrument fill:#E0F2FE,stroke:#0284C7,stroke-width:1px;');
  lines.push('  classDef other_stakeholder fill:#F3F4F6,stroke:#6B7280,stroke-width:1px;');
  lines.push('  classDef newco fill:#E0E7FF,stroke:#6366F1,stroke-width:1px;');
  lines.push('  classDef txn fill:#FFFFFF,stroke:#111827,stroke-dasharray: 4 2,stroke-width:1px;');

  return lines.join('\n');
}

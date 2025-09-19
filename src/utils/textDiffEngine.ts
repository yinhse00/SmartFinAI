/**
 * Text Diff Engine - Advanced text comparison and markup generation
 */

export interface DiffChange {
  type: 'addition' | 'deletion' | 'modification' | 'unchanged';
  content: string;
  originalContent?: string;
  position: number;
  length: number;
}

export interface DiffResult {
  changes: DiffChange[];
  stats: {
    additions: number;
    deletions: number;
    modifications: number;
    totalChanges: number;
  };
  markedUpText: string;
}

export class TextDiffEngine {
  /**
   * Generate comprehensive diff between two texts
   */
  generateDiff(originalText: string, modifiedText: string): DiffResult {
    const changes: DiffChange[] = [];
    const originalWords = this.tokenizeText(originalText);
    const modifiedWords = this.tokenizeText(modifiedText);

    // Use a simplified LCS algorithm for word-level diffing
    const lcs = this.longestCommonSubsequence(originalWords, modifiedWords);
    const diffOps = this.generateDiffOps(originalWords, modifiedWords, lcs);

    let position = 0;
    let originalIndex = 0;
    let modifiedIndex = 0;

    for (const op of diffOps) {
      switch (op.type) {
        case 'unchanged':
          changes.push({
            type: 'unchanged',
            content: op.content,
            position,
            length: op.content.length
          });
          position += op.content.length;
          originalIndex += op.count;
          modifiedIndex += op.count;
          break;

        case 'deletion':
          changes.push({
            type: 'deletion',
            content: '',
            originalContent: op.content,
            position,
            length: 0
          });
          originalIndex += op.count;
          break;

        case 'addition':
          changes.push({
            type: 'addition',
            content: op.content,
            position,
            length: op.content.length
          });
          position += op.content.length;
          modifiedIndex += op.count;
          break;

        case 'modification':
          changes.push({
            type: 'modification',
            content: op.content,
            originalContent: op.originalContent,
            position,
            length: op.content.length
          });
          position += op.content.length;
          originalIndex += op.originalCount || 1;
          modifiedIndex += op.count;
          break;
      }
    }

    const stats = this.calculateStats(changes);
    const markedUpText = this.generateMarkup(modifiedText, changes);

    return {
      changes,
      stats,
      markedUpText
    };
  }

  /**
   * Generate HTML markup showing changes
   */
  generateMarkup(text: string, changes: DiffChange[]): string {
    let markup = '';
    let lastPosition = 0;

    changes.forEach(change => {
      // Add unchanged text before this change
      if (change.position > lastPosition) {
        markup += text.substring(lastPosition, change.position);
      }

      switch (change.type) {
        case 'addition':
          markup += `<span class="diff-addition" data-diff="added">${this.escapeHtml(change.content)}</span>`;
          break;

        case 'deletion':
          // Deletions are shown as strikethrough in the original context
          if (change.originalContent) {
            markup += `<span class="diff-deletion" data-diff="deleted">${this.escapeHtml(change.originalContent)}</span>`;
          }
          break;

        case 'modification':
          markup += `<span class="diff-modification" data-diff="modified" title="Original: ${this.escapeHtml(change.originalContent || '')}">${this.escapeHtml(change.content)}</span>`;
          break;

        case 'unchanged':
          markup += this.escapeHtml(change.content);
          break;
      }

      lastPosition = change.position + change.length;
    });

    // Add remaining unchanged text
    if (lastPosition < text.length) {
      markup += text.substring(lastPosition);
    }

    return markup;
  }

  /**
   * Generate simple character-level diff for inline display
   */
  generateInlineDiff(originalText: string, modifiedText: string): {
    originalMarked: string;
    modifiedMarked: string;
  } {
    const originalChars = originalText.split('');
    const modifiedChars = modifiedText.split('');
    const lcs = this.longestCommonSubsequence(originalChars, modifiedChars);
    
    let originalMarked = '';
    let modifiedMarked = '';
    let origIndex = 0;
    let modIndex = 0;
    let lcsIndex = 0;

    while (origIndex < originalChars.length || modIndex < modifiedChars.length) {
      if (lcsIndex < lcs.length && 
          origIndex < originalChars.length && 
          modIndex < modifiedChars.length &&
          originalChars[origIndex] === lcs[lcsIndex] && 
          modifiedChars[modIndex] === lcs[lcsIndex]) {
        // Characters match
        originalMarked += originalChars[origIndex];
        modifiedMarked += modifiedChars[modIndex];
        origIndex++;
        modIndex++;
        lcsIndex++;
      } else if (origIndex < originalChars.length && 
                 (modIndex >= modifiedChars.length || 
                  (lcsIndex < lcs.length && originalChars[origIndex] !== lcs[lcsIndex]))) {
        // Character deleted
        originalMarked += `<span class="diff-deletion">${this.escapeHtml(originalChars[origIndex])}</span>`;
        origIndex++;
      } else if (modIndex < modifiedChars.length) {
        // Character added
        modifiedMarked += `<span class="diff-addition">${this.escapeHtml(modifiedChars[modIndex])}</span>`;
        modIndex++;
      }
    }

    return {
      originalMarked,
      modifiedMarked
    };
  }

  /**
   * Get summary of changes
   */
  getChangeSummary(changes: DiffChange[]): string {
    const stats = this.calculateStats(changes);
    
    if (stats.totalChanges === 0) {
      return 'No changes detected';
    }

    const parts = [];
    if (stats.additions > 0) parts.push(`${stats.additions} addition${stats.additions > 1 ? 's' : ''}`);
    if (stats.deletions > 0) parts.push(`${stats.deletions} deletion${stats.deletions > 1 ? 's' : ''}`);
    if (stats.modifications > 0) parts.push(`${stats.modifications} modification${stats.modifications > 1 ? 's' : ''}`);

    return parts.join(', ');
  }

  private tokenizeText(text: string): string[] {
    // Split by words while preserving whitespace and punctuation
    return text.split(/(\s+|[^\w\s])/).filter(token => token.length > 0);
  }

  private longestCommonSubsequence<T>(arr1: T[], arr2: T[]): T[] {
    const m = arr1.length;
    const n = arr2.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    // Build LCS table
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (arr1[i - 1] === arr2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    // Reconstruct LCS
    const lcs: T[] = [];
    let i = m, j = n;
    while (i > 0 && j > 0) {
      if (arr1[i - 1] === arr2[j - 1]) {
        lcs.unshift(arr1[i - 1]);
        i--;
        j--;
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }

    return lcs;
  }

  private generateDiffOps(original: string[], modified: string[], lcs: string[]): any[] {
    const ops = [];
    let origIndex = 0;
    let modIndex = 0;
    let lcsIndex = 0;

    while (origIndex < original.length || modIndex < modified.length) {
      if (lcsIndex < lcs.length && 
          origIndex < original.length && 
          modIndex < modified.length &&
          original[origIndex] === lcs[lcsIndex] && 
          modified[modIndex] === lcs[lcsIndex]) {
        // Unchanged sequence
        let unchangedContent = '';
        let count = 0;
        while (lcsIndex < lcs.length && 
               origIndex < original.length && 
               modIndex < modified.length &&
               original[origIndex] === lcs[lcsIndex] && 
               modified[modIndex] === lcs[lcsIndex]) {
          unchangedContent += original[origIndex];
          origIndex++;
          modIndex++;
          lcsIndex++;
          count++;
        }
        ops.push({ type: 'unchanged', content: unchangedContent, count });
      } else {
        // Handle insertions, deletions, and modifications
        const origSegment = [];
        const modSegment = [];

        // Collect different segments
        while ((origIndex < original.length || modIndex < modified.length) &&
               (lcsIndex >= lcs.length || 
                origIndex >= original.length ||
                modIndex >= modified.length ||
                original[origIndex] !== lcs[lcsIndex] || 
                modified[modIndex] !== lcs[lcsIndex])) {
          
          if (origIndex < original.length) {
            origSegment.push(original[origIndex]);
            origIndex++;
          }
          if (modIndex < modified.length) {
            modSegment.push(modified[modIndex]);
            modIndex++;
          }

          // Break if we've reached a common element
          if (lcsIndex < lcs.length && 
              origIndex < original.length && 
              modIndex < modified.length &&
              original[origIndex] === lcs[lcsIndex] && 
              modified[modIndex] === lcs[lcsIndex]) {
            break;
          }
        }

        // Determine operation type
        if (origSegment.length === 0) {
          ops.push({ type: 'addition', content: modSegment.join(''), count: modSegment.length });
        } else if (modSegment.length === 0) {
          ops.push({ type: 'deletion', content: origSegment.join(''), count: origSegment.length });
        } else {
          ops.push({ 
            type: 'modification', 
            content: modSegment.join(''), 
            originalContent: origSegment.join(''),
            count: modSegment.length,
            originalCount: origSegment.length
          });
        }
      }
    }

    return ops;
  }

  private calculateStats(changes: DiffChange[]): DiffResult['stats'] {
    const stats = {
      additions: 0,
      deletions: 0,
      modifications: 0,
      totalChanges: 0
    };

    changes.forEach(change => {
      switch (change.type) {
        case 'addition':
          stats.additions++;
          break;
        case 'deletion':
          stats.deletions++;
          break;
        case 'modification':
          stats.modifications++;
          break;
      }
    });

    stats.totalChanges = stats.additions + stats.deletions + stats.modifications;
    return stats;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

export const textDiffEngine = new TextDiffEngine();

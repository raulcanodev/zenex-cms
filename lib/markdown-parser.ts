/**
 * Parse markdown content with frontmatter
 * 
 * Example markdown:
 * ---
 * title: "My Post"
 * publishedAt: 2025-01-21
 * ---
 * 
 * Post content here...
 */

export interface ParsedMarkdown {
  frontmatter: Record<string, string | boolean | number>;
  content: string;
}

export function parseMarkdownWithFrontmatter(markdown: string): ParsedMarkdown {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = markdown.match(frontmatterRegex);

  if (!match) {
    return {
      frontmatter: {},
      content: markdown,
    };
  }

  const [, frontmatterText, content] = match;
  const frontmatter: Record<string, string | boolean | number> = {};

  // Parse YAML-like frontmatter
  frontmatterText.split('\n').forEach((line) => {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) return;

    const key = line.slice(0, colonIndex).trim();
    let value: string | boolean | number = line.slice(colonIndex + 1).trim();

    // Remove quotes
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    // Parse boolean
    if (value === 'true') {
      value = true;
    } else if (value === 'false') {
      value = false;
    }

    frontmatter[key] = value;
  });

  return {
    frontmatter,
    content: content.trim(),
  };
}

/**
 * Parse a markdown table to EditorJS table format
 */
function parseMarkdownTable(rows: string[]): { content: string[][] } | null {
  if (rows.length < 2) return null;

  const content: string[][] = [];
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    
    // Skip separator row (contains ---, :-:, etc.)
    if (row.includes('---') || row.includes(':-:') || row.includes(':--')) {
      continue;
    }

    // Parse cells
    const cells = row
      .split('|')
      .map(cell => cell.trim())
      .filter(cell => cell !== ''); // Remove empty cells from start/end

    if (cells.length > 0) {
      content.push(cells);
    }
  }

  return content.length > 0 ? { content } : null;
}

/**
 * Convert markdown content to EditorJS format (simplified)
 */
export function markdownToEditorJS(markdown: string): { 
  time: number; 
  blocks: Array<{ 
    type: string; 
    data: Record<string, string | number | string[][]> 
  }>; 
  version: string 
} {
  const blocks = [];
  const lines = markdown.split('\n');
  let currentParagraph = '';
  let inCodeBlock = false;
  let codeContent = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        // Start code block
        if (currentParagraph) {
          blocks.push({
            type: 'paragraph',
            data: { text: currentParagraph.trim() },
          });
          currentParagraph = '';
        }
        inCodeBlock = true;
        codeContent = '';
        continue;
      } else {
        // End code block
        blocks.push({
          type: 'code',
          data: { code: codeContent.trim() },
        });
        inCodeBlock = false;
        codeContent = '';
        continue;
      }
    }

    // If inside code block, accumulate content
    if (inCodeBlock) {
      codeContent += (codeContent ? '\n' : '') + line;
      continue;
    }

    // Tables (basic detection)
    // Format: | col1 | col2 | col3 |
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      // Check if it's a table
      const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
      const isTableHeader = nextLine.includes('---') || nextLine.includes(':-:') || nextLine.includes(':--');
      
      if (isTableHeader || currentParagraph === '') {
        // Start accumulating table
        if (currentParagraph) {
          blocks.push({
            type: 'paragraph',
            data: { text: currentParagraph.trim() },
          });
          currentParagraph = '';
        }

        const tableRows = [];
        tableRows.push(line);
        
        // Get table rows
        let j = i + 1;
        while (j < lines.length && lines[j].trim().startsWith('|') && lines[j].trim().endsWith('|')) {
          tableRows.push(lines[j]);
          j++;
        }

        // Parse table
        const parsedTable = parseMarkdownTable(tableRows);
        if (parsedTable) {
          blocks.push({
            type: 'table',
            data: parsedTable,
          });
        }

        i = j - 1; // Skip processed lines
        continue;
      }
    }
    // Headers
    if (line.startsWith('# ')) {
      if (currentParagraph) {
        blocks.push({
          type: 'paragraph',
          data: { text: currentParagraph.trim() },
        });
        currentParagraph = '';
      }
      blocks.push({
        type: 'header',
        data: { text: line.slice(2), level: 1 },
      });
      continue;
    }
    if (line.startsWith('## ')) {
      if (currentParagraph) {
        blocks.push({
          type: 'paragraph',
          data: { text: currentParagraph.trim() },
        });
        currentParagraph = '';
      }
      blocks.push({
        type: 'header',
        data: { text: line.slice(3), level: 2 },
      });
      continue;
    }
    if (line.startsWith('### ')) {
      if (currentParagraph) {
        blocks.push({
          type: 'paragraph',
          data: { text: currentParagraph.trim() },
        });
        currentParagraph = '';
      }
      blocks.push({
        type: 'header',
        data: { text: line.slice(4), level: 3 },
      });
      continue;
    }

    // Empty line = new paragraph
    if (line.trim() === '') {
      if (currentParagraph) {
        blocks.push({
          type: 'paragraph',
          data: { text: currentParagraph.trim() },
        });
        currentParagraph = '';
      }
      continue;
    }

    // Regular text
    currentParagraph += (currentParagraph ? ' ' : '') + line;
  }

  // Add last paragraph
  if (currentParagraph) {
    blocks.push({
      type: 'paragraph',
      data: { text: currentParagraph.trim() },
    });
  }

  return {
    time: Date.now(),
    blocks,
    version: '2.28.0',
  };
}

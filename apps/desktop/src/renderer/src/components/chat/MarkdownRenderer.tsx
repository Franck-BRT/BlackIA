import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const parseMarkdown = (text: string): string => {
    let html = text;

    // Sauvegarder les blocs de code pour les protéger (avec ou sans retour à la ligne après ```)
    const codeBlocks: string[] = [];
    html = html.replace(/```(\w+)?[\r\n]?([\s\S]*?)```/g, (match, lang, code) => {
      const placeholder = `§§§CODE_BLOCK_${codeBlocks.length}§§§`;
      const language = lang || 'plaintext';
      const escapedCode = code
        .trim()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      codeBlocks.push(`<pre class="markdown-code-block"><code class="language-${language}">${escapedCode}</code></pre>`);
      return placeholder;
    });

    // Sauvegarder le code inline
    const inlineCode: string[] = [];
    html = html.replace(/`([^`]+)`/g, (match, code) => {
      const placeholder = `§§§INLINE_CODE_${inlineCode.length}§§§`;
      const escapedCode = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      inlineCode.push(`<code class="markdown-inline-code">${escapedCode}</code>`);
      return placeholder;
    });

    // Échapper les caractères HTML restants
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Tableaux Markdown
    // Détecter les lignes de tableau (| col1 | col2 |)
    const tableRegex = /^(\|.+\|)$/gm;
    const tables: string[] = [];
    html = html.replace(/^(\|.+\|)\n(\|[\s\-:|]+\|)\n((?:\|.+\|\n?)+)/gm, (match, header, separator, rows) => {
      const placeholder = `§§§TABLE_${tables.length}§§§`;

      // Parser header
      const headerCells = header.split('|').filter((cell: string) => cell.trim()).map((cell: string) =>
        `<th class="markdown-table-header">${cell.trim()}</th>`
      ).join('');

      // Parser rows
      const rowsHtml = rows.trim().split('\n').map((row: string) => {
        const cells = row.split('|').filter((cell: string) => cell.trim()).map((cell: string) =>
          `<td class="markdown-table-cell">${cell.trim()}</td>`
        ).join('');
        return `<tr class="markdown-table-row">${cells}</tr>`;
      }).join('');

      tables.push(`<table class="markdown-table"><thead><tr>${headerCells}</tr></thead><tbody>${rowsHtml}</tbody></table>`);
      return placeholder;
    });

    // Headers (du plus spécifique au plus général)
    html = html.replace(/^######\s+(.+)$/gm, '<h6 class="markdown-h6">$1</h6>');
    html = html.replace(/^#####\s+(.+)$/gm, '<h5 class="markdown-h5">$1</h5>');
    html = html.replace(/^####\s+(.+)$/gm, '<h4 class="markdown-h4">$1</h4>');
    html = html.replace(/^###\s+(.+)$/gm, '<h3 class="markdown-h3">$1</h3>');
    html = html.replace(/^##\s+(.+)$/gm, '<h2 class="markdown-h2">$1</h2>');
    html = html.replace(/^#\s+(.+)$/gm, '<h1 class="markdown-h1">$1</h1>');

    // Gras (**text** ou __text__)
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="markdown-bold">$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong class="markdown-bold">$1</strong>');

    // Italique (*text* ou _text_) - attention à ne pas matcher les **
    html = html.replace(/\*([^\*]+?)\*/g, '<em class="markdown-italic">$1</em>');
    html = html.replace(/_([^_]+?)_/g, '<em class="markdown-italic">$1</em>');

    // Liens [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" class="markdown-link" target="_blank" rel="noopener noreferrer">$1</a>');

    // Listes non ordonnées (- item ou * item)
    html = html.replace(/^[\*\-]\s+(.+)$/gm, '<li class="markdown-list-item">$1</li>');

    // Listes ordonnées (1. item)
    html = html.replace(/^\d+\.\s+(.+)$/gm, '<li class="markdown-ordered-list-item">$1</li>');

    // Grouper les items de liste consécutifs
    html = html.replace(/(<li class="markdown-list-item">[\s\S]+?<\/li>\n?)+/g, (match) => {
      return `<ul class="markdown-list">${match}</ul>`;
    });

    html = html.replace(/(<li class="markdown-ordered-list-item">[\s\S]+?<\/li>\n?)+/g, (match) => {
      return `<ol class="markdown-ordered-list">${match}</ol>`;
    });

    // Citations (> text)
    html = html.replace(/^&gt;\s+(.+)$/gm, '<blockquote class="markdown-blockquote">$1</blockquote>');

    // Ligne horizontale (--- ou ***)
    html = html.replace(/^[\-\*]{3,}$/gm, '<hr class="markdown-hr" />');

    // Restaurer les tables AVANT les retours à la ligne
    tables.forEach((table, index) => {
      html = html.replace(`§§§TABLE_${index}§§§`, table);
    });

    // Restaurer les blocs de code AVANT les retours à la ligne
    codeBlocks.forEach((block, index) => {
      html = html.replace(`§§§CODE_BLOCK_${index}§§§`, block);
    });

    // Restaurer le code inline AVANT les retours à la ligne
    inlineCode.forEach((code, index) => {
      html = html.replace(`§§§INLINE_CODE_${index}§§§`, code);
    });

    // Retours à la ligne (deux espaces en fin de ligne = br)
    html = html.replace(/\n/g, '<br />');

    return html;
  };

  return (
    <div
      className="markdown-content"
      dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
    />
  );
}

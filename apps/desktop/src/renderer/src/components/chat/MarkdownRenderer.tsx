import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const parseMarkdown = (text: string): string => {
    let html = text;

    // 1. SAUVEGARDER les blocs de code (priorité maximale)
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

    // 2. SAUVEGARDER le code inline
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

    // 3. Échapper les caractères HTML restants
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 4. FORMATAGE INLINE (AVANT les listes pour que ça fonctionne dans les listes)
    // Ordre critique: du plus spécifique au plus général

    // Barré (~~text~~)
    html = html.replace(/~~([^~\n]+?)~~/g, '<del class="markdown-strikethrough">$1</del>');

    // Gras + Italique (***text*** ou ___text___)
    html = html.replace(/\*\*\*([^\*\n]+?)\*\*\*/g, '<strong><em class="markdown-bold-italic">$1</em></strong>');
    html = html.replace(/___([^_\n]+?)___/g, '<strong><em class="markdown-bold-italic">$1</em></strong>');

    // Gras (**text** ou __text__)
    html = html.replace(/\*\*([^\*\n]+?)\*\*/g, '<strong class="markdown-bold">$1</strong>');
    html = html.replace(/__([^_\n]+?)__/g, '<strong class="markdown-bold">$1</strong>');

    // Italique (*text* ou _text_) - NE PAS capturer si en début de ligne (liste)
    html = html.replace(/(?<!^|\n)\*([^\*\n]+?)\*/g, '<em class="markdown-italic">$1</em>');
    html = html.replace(/\b_([^_\n]+?)_\b/g, '<em class="markdown-italic">$1</em>');

    // Surlignage (==text==)
    html = html.replace(/==([^=\n]+?)==/g, '<mark class="markdown-highlight">$1</mark>');

    // 5. TABLEAUX (après formatage inline pour que le gras fonctionne dans les tableaux)
    const tables: string[] = [];
    html = html.replace(/^(\|.+\|)\n(\|[\s\-:|]+\|)\n((?:\|.+\|\n?)+)/gm, (match, header, separator, rows) => {
      const placeholder = `§§§TABLE_${tables.length}§§§`;

      const headerCells = header.split('|').filter((cell: string) => cell.trim()).map((cell: string) =>
        `<th class="markdown-table-header">${cell.trim()}</th>`
      ).join('');

      const rowsHtml = rows.trim().split('\n').map((row: string) => {
        const cells = row.split('|').filter((cell: string) => cell.trim()).map((cell: string) =>
          `<td class="markdown-table-cell">${cell.trim()}</td>`
        ).join('');
        return `<tr class="markdown-table-row">${cells}</tr>`;
      }).join('');

      tables.push(`<table class="markdown-table"><thead><tr>${headerCells}</tr></thead><tbody>${rowsHtml}</tbody></table>`);
      return placeholder;
    });

    // 6. HEADERS (avant les listes)
    html = html.replace(/^######\s+(.+)$/gm, '<h6 class="markdown-h6">$1</h6>');
    html = html.replace(/^#####\s+(.+)$/gm, '<h5 class="markdown-h5">$1</h5>');
    html = html.replace(/^####\s+(.+)$/gm, '<h4 class="markdown-h4">$1</h4>');
    html = html.replace(/^###\s+(.+)$/gm, '<h3 class="markdown-h3">$1</h3>');
    html = html.replace(/^##\s+(.+)$/gm, '<h2 class="markdown-h2">$1</h2>');
    html = html.replace(/^#\s+(.+)$/gm, '<h1 class="markdown-h1">$1</h1>');

    // 7. LIGNE HORIZONTALE
    html = html.replace(/^[\-\*]{3,}$/gm, '<hr class="markdown-hr" />');

    // 8. LISTES (après le formatage inline pour que gras/italique fonctionnent dans les listes)
    // Listes avec cases à cocher
    html = html.replace(/^[\*\-]\s+\[([ xX])\]\s+(.+)$/gm, (match, checked, text) => {
      const isChecked = checked.toLowerCase() === 'x';
      return `<li class="markdown-checkbox-item"><input type="checkbox" ${isChecked ? 'checked' : ''} disabled> ${text}</li>`;
    });

    // Listes non ordonnées standard (le formatage inline est déjà appliqué au contenu)
    html = html.replace(/^[\*\-]\s+(.+)$/gm, '<li class="markdown-list-item">$1</li>');

    // Listes ordonnées
    html = html.replace(/^\d+\.\s+(.+)$/gm, '<li class="markdown-ordered-list-item">$1</li>');

    // Grouper les items consécutifs
    html = html.replace(/(<li class="markdown-(?:list|checkbox)-item">[\s\S]+?<\/li>(?:<br \/>)?)+/g, (match) => {
      return `<ul class="markdown-list">${match.replace(/<br \/>/g, '')}</ul>`;
    });
    html = html.replace(/(<li class="markdown-ordered-list-item">[\s\S]+?<\/li>(?:<br \/>)?)+/g, (match) => {
      return `<ol class="markdown-ordered-list">${match.replace(/<br \/>/g, '')}</ol>`;
    });

    // 9. CITATIONS
    html = html.replace(/^&gt;\s+(.+)$/gm, '<blockquote class="markdown-blockquote">$1</blockquote>');

    // 10. LIENS et IMAGES
    // Images ![alt](url)
    html = html.replace(/!\[([^\]]*)\]\(([^\)]+)\)/g, '<img src="$2" alt="$1" class="markdown-image" />');

    // Liens [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" class="markdown-link" target="_blank" rel="noopener noreferrer">$1</a>');

    // URLs automatiques
    html = html.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" class="markdown-link" target="_blank" rel="noopener noreferrer">$1</a>');

    // 11. RESTAURER
    tables.forEach((table, index) => {
      html = html.replace(`§§§TABLE_${index}§§§`, table);
    });

    codeBlocks.forEach((block, index) => {
      html = html.replace(`§§§CODE_BLOCK_${index}§§§`, block);
    });

    inlineCode.forEach((code, index) => {
      html = html.replace(`§§§INLINE_CODE_${index}§§§`, code);
    });

    // 12. RETOURS À LA LIGNE (à la fin)
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

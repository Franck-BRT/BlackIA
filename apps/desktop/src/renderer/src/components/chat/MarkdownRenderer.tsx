import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { highlightCode } from '../../utils/syntaxHighlighter';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MarkdownRendererProps {
  content: string;
  searchQuery?: string;
  searchStartIndex?: number; // Index de début pour ce message dans la recherche globale
  activeGlobalIndex?: number; // Index global du résultat actif
  syntaxTheme?: string; // Thème de coloration syntaxique
  showLineNumbers?: boolean; // Afficher la numérotation des lignes
}

interface CodeBlock {
  language: string;
  code: string;
  rawCode: string; // Code non échappé pour la copie
}

// Composant pour afficher un bloc de code avec bouton copier
function CodeBlockWithCopy({ language, code, rawCode, syntaxTheme = 'vscode-dark', showLineNumbers = false }: CodeBlock & { syntaxTheme?: string; showLineNumbers?: boolean }) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
    }
  };

  // Appliquer la coloration syntaxique
  const highlightedCode = highlightCode(rawCode, language);

  // Diviser en lignes pour la numérotation
  const lines = highlightedCode.split('\n');

  return (
    <div className="markdown-code-block-container">
      <div className="markdown-code-block-header">
        <span className="markdown-code-language">{language}</span>
        <button
          onClick={handleCopy}
          className="markdown-code-copy-button"
          title="Copier le code"
        >
          {isCopied ? (
            <>
              <Check size={16} />
              <span>Copié!</span>
            </>
          ) : (
            <>
              <Copy size={16} />
              <span>Copier</span>
            </>
          )}
        </button>
      </div>
      <pre className={`markdown-code-block syntax-theme-${syntaxTheme}`}>
        {showLineNumbers ? (
          <code className={`language-${language} code-with-line-numbers`}>
            <span className="line-numbers">
              {lines.map((_, index) => (
                <span key={index} className="line-numbers-line">
                  {index + 1}
                </span>
              ))}
            </span>
            <span className="code-lines">
              {lines.map((line, index) => (
                <span key={index} className="code-lines-line" dangerouslySetInnerHTML={{ __html: line }} />
              ))}
            </span>
          </code>
        ) : (
          <code className={`language-${language}`} dangerouslySetInnerHTML={{ __html: highlightedCode }} />
        )}
      </pre>
    </div>
  );
}

export function MarkdownRenderer({
  content,
  searchQuery,
  searchStartIndex = 0,
  activeGlobalIndex = -1,
  syntaxTheme = 'vscode-dark',
  showLineNumbers = false,
}: MarkdownRendererProps) {
  const parseMarkdown = (text: string): { html: string; codeBlocks: CodeBlock[] } => {
    let html = text;

    // 0. SAUVEGARDER les occurrences de recherche AVANT tout traitement
    const searchHighlights: string[] = [];
    if (searchQuery && searchQuery.trim()) {
      const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedQuery, 'gi');
      let matchIndex = 0;

      html = html.replace(regex, (match) => {
        const globalIndex = searchStartIndex + matchIndex;
        const isActive = globalIndex === activeGlobalIndex;
        const placeholder = `§§§SEARCH_HIGHLIGHT_${matchIndex}§§§`;

        // Créer le span de highlight
        const highlightClass = isActive
          ? 'search-highlight-active'
          : 'search-highlight';
        const highlightId = isActive ? 'id="active-search-result"' : '';

        searchHighlights.push(
          `<mark class="${highlightClass}" ${highlightId} data-search-index="${globalIndex}">${match}</mark>`
        );

        matchIndex++;
        return placeholder;
      });
    }

    // 1. SAUVEGARDER les blocs de code (priorité maximale)
    const codeBlocks: CodeBlock[] = [];
    html = html.replace(/```(\w+)?[\r\n]?([\s\S]*?)```/g, (match, lang, code) => {
      const placeholder = `§§§CODE_BLOCK_${codeBlocks.length}§§§`;
      const language = lang || 'plaintext';
      const rawCode = code.trim();
      const escapedCode = rawCode
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      codeBlocks.push({
        language,
        code: escapedCode,
        rawCode
      });
      return placeholder;
    });

    // 1.5. SAUVEGARDER les formules LaTeX (avant le code inline)
    const mathBlocks: string[] = [];

    // Display math: \[...\] ou $$...$$
    html = html.replace(/\\\[([\s\S]*?)\\\]/g, (match, formula) => {
      const placeholder = `§§§MATH_DISPLAY_${mathBlocks.length}§§§`;
      try {
        const rendered = katex.renderToString(formula.trim(), {
          displayMode: true,
          throwOnError: false,
          strict: false,
        });
        mathBlocks.push(`<div class="katex-display-wrapper">${rendered}</div>`);
      } catch (e) {
        console.error('[Markdown] KaTeX render error:', e);
        mathBlocks.push(`<div class="katex-error">\\[${formula}\\]</div>`);
      }
      return placeholder;
    });

    html = html.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
      const placeholder = `§§§MATH_DISPLAY_${mathBlocks.length}§§§`;
      try {
        const rendered = katex.renderToString(formula.trim(), {
          displayMode: true,
          throwOnError: false,
          strict: false,
        });
        mathBlocks.push(`<div class="katex-display-wrapper">${rendered}</div>`);
      } catch (e) {
        console.error('[Markdown] KaTeX render error:', e);
        mathBlocks.push(`<div class="katex-error">$$${formula}$$</div>`);
      }
      return placeholder;
    });

    // Inline math: $...$
    html = html.replace(/\$([^\$\n]+?)\$/g, (match, formula) => {
      const placeholder = `§§§MATH_INLINE_${mathBlocks.length}§§§`;
      try {
        const rendered = katex.renderToString(formula.trim(), {
          displayMode: false,
          throwOnError: false,
          strict: false,
        });
        mathBlocks.push(`<span class="katex-inline-wrapper">${rendered}</span>`);
      } catch (e) {
        console.error('[Markdown] KaTeX render error:', e);
        mathBlocks.push(`<span class="katex-error">$${formula}$</span>`);
      }
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

    // 11. RESTAURER (sauf les code blocks qui seront rendus séparément)
    tables.forEach((table, index) => {
      html = html.replace(`§§§TABLE_${index}§§§`, table);
    });

    inlineCode.forEach((code, index) => {
      html = html.replace(`§§§INLINE_CODE_${index}§§§`, code);
    });

    mathBlocks.forEach((math, index) => {
      html = html.replace(`§§§MATH_DISPLAY_${index}§§§`, math);
      html = html.replace(`§§§MATH_INLINE_${index}§§§`, math);
    });

    // 12. RESTAURER les search highlights
    searchHighlights.forEach((highlight, index) => {
      html = html.replace(`§§§SEARCH_HIGHLIGHT_${index}§§§`, highlight);
    });

    // 13. RETOURS À LA LIGNE (à la fin)
    html = html.replace(/\n/g, '<br />');

    return { html, codeBlocks };
  };

  // Parser le contenu
  const { html, codeBlocks } = parseMarkdown(content);

  // Diviser le HTML en parties et insérer les composants CodeBlock
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  // Trouver tous les placeholders de code blocks
  const codeBlockRegex = /§§§CODE_BLOCK_(\d+)§§§/g;
  let match;

  while ((match = codeBlockRegex.exec(html)) !== null) {
    const index = parseInt(match[1], 10);
    const matchStart = match.index;

    // Ajouter le HTML avant ce code block
    if (matchStart > lastIndex) {
      const htmlPart = html.substring(lastIndex, matchStart);
      parts.push(
        <span
          key={`html-${lastIndex}`}
          dangerouslySetInnerHTML={{ __html: htmlPart }}
        />
      );
    }

    // Ajouter le composant CodeBlock
    parts.push(
      <CodeBlockWithCopy
        key={`code-${index}`}
        language={codeBlocks[index].language}
        code={codeBlocks[index].code}
        rawCode={codeBlocks[index].rawCode}
        syntaxTheme={syntaxTheme}
        showLineNumbers={showLineNumbers}
      />
    );

    lastIndex = matchStart + match[0].length;
  }

  // Ajouter le HTML restant
  if (lastIndex < html.length) {
    const htmlPart = html.substring(lastIndex);
    parts.push(
      <span
        key={`html-${lastIndex}`}
        dangerouslySetInnerHTML={{ __html: htmlPart }}
      />
    );
  }

  return <div className="markdown-content">{parts}</div>;
}

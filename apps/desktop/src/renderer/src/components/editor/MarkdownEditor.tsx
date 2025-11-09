import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link,
  Code,
  Heading,
  Quote,
  Eye,
  Edit3,
  Save,
  FileDown,
  FileUp,
} from 'lucide-react';
import { cn } from '@blackia/ui';

interface MarkdownEditorProps {
  initialContent?: string;
  onSave?: (content: string) => void;
}

type ViewMode = 'edit' | 'preview' | 'split';

export function MarkdownEditor({ initialContent = '', onSave }: MarkdownEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fonction pour insérer du texte à la position du curseur
  const insertText = (before: string, after: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const textToInsert = selectedText || placeholder;

    const newContent =
      content.substring(0, start) +
      before +
      textToInsert +
      after +
      content.substring(end);

    setContent(newContent);

    // Remettre le focus et sélectionner le texte inséré
    setTimeout(() => {
      textarea.focus();
      const newStart = start + before.length;
      const newEnd = newStart + textToInsert.length;
      textarea.setSelectionRange(newStart, newEnd);
    }, 0);
  };

  // Actions de formatage
  const formatBold = () => insertText('**', '**', 'texte en gras');
  const formatItalic = () => insertText('_', '_', 'texte en italique');
  const formatCode = () => insertText('`', '`', 'code');
  const formatLink = () => insertText('[', '](https://)', 'texte du lien');
  const formatHeading = () => insertText('## ', '', 'Titre');
  const formatQuote = () => insertText('> ', '', 'citation');
  const formatList = () => insertText('- ', '', 'élément de liste');
  const formatOrderedList = () => insertText('1. ', '', 'élément de liste');

  const handleSave = () => {
    if (onSave) {
      onSave(content);
    }
  };

  const handleExport = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.txt';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          setContent(text);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="glass-card p-4 border-b border-white/10 flex items-center gap-2 flex-wrap">
        {/* Formatting buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={formatBold}
            className="p-2 rounded hover:bg-white/10 transition-colors"
            title="Gras (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={formatItalic}
            className="p-2 rounded hover:bg-white/10 transition-colors"
            title="Italique (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={formatCode}
            className="p-2 rounded hover:bg-white/10 transition-colors"
            title="Code inline"
          >
            <Code className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-6 bg-white/10" />

        <div className="flex items-center gap-1">
          <button
            onClick={formatHeading}
            className="p-2 rounded hover:bg-white/10 transition-colors"
            title="Titre"
          >
            <Heading className="w-4 h-4" />
          </button>
          <button
            onClick={formatQuote}
            className="p-2 rounded hover:bg-white/10 transition-colors"
            title="Citation"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            onClick={formatList}
            className="p-2 rounded hover:bg-white/10 transition-colors"
            title="Liste"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={formatOrderedList}
            className="p-2 rounded hover:bg-white/10 transition-colors"
            title="Liste numérotée"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            onClick={formatLink}
            className="p-2 rounded hover:bg-white/10 transition-colors"
            title="Lien"
          >
            <Link className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-6 bg-white/10" />

        {/* View mode buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('edit')}
            className={cn(
              'p-2 rounded transition-colors',
              viewMode === 'edit' ? 'bg-white/20' : 'hover:bg-white/10'
            )}
            title="Mode édition"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={cn(
              'p-2 rounded transition-colors',
              viewMode === 'split' ? 'bg-white/20' : 'hover:bg-white/10'
            )}
            title="Mode split"
          >
            <div className="flex gap-0.5">
              <div className="w-1.5 h-4 bg-current" />
              <div className="w-1.5 h-4 bg-current" />
            </div>
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={cn(
              'p-2 rounded transition-colors',
              viewMode === 'preview' ? 'bg-white/20' : 'hover:bg-white/10'
            )}
            title="Mode aperçu"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1" />

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleImport}
            className="p-2 rounded hover:bg-white/10 transition-colors"
            title="Importer un fichier"
          >
            <FileUp className="w-4 h-4" />
          </button>
          <button
            onClick={handleExport}
            className="p-2 rounded hover:bg-white/10 transition-colors"
            title="Exporter en markdown"
          >
            <FileDown className="w-4 h-4" />
          </button>
          {onSave && (
            <button
              onClick={handleSave}
              className="px-3 py-2 rounded bg-purple-500/20 hover:bg-purple-500/30 transition-colors flex items-center gap-2"
              title="Sauvegarder"
            >
              <Save className="w-4 h-4" />
              <span className="text-sm">Sauvegarder</span>
            </button>
          )}
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor panel */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div
            className={cn(
              'flex flex-col',
              viewMode === 'split' ? 'w-1/2 border-r border-white/10' : 'w-full'
            )}
          >
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 w-full p-6 bg-transparent resize-none focus:outline-none font-mono text-sm"
              placeholder="Commencez à écrire en markdown..."
            />
          </div>
        )}

        {/* Preview panel */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div
            className={cn(
              'flex-1 overflow-auto p-6',
              viewMode === 'split' ? 'w-1/2' : 'w-full'
            )}
          >
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const language = match ? match[1] : '';

                    return !inline && language ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={language}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {content || '*Aucun contenu à afficher*'}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

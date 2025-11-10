import React, { useState, useRef, useEffect } from 'react';
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
  FileUp,
  Image,
  Table,
  Minus,
  Code2,
  Bot,
  FilePlus,
  X,
} from 'lucide-react';
import { cn } from '@blackia/ui';
import { ChatInterface } from '../chat/ChatInterface';
import { usePersonas } from '../../hooks/usePersonas';
import { usePrompts } from '../../hooks/usePrompts';
import { replaceVariables } from '../../types/prompt';

interface MarkdownEditorProps {
  initialContent?: string;
  onSave?: (content: string) => void;
}

type ViewMode = 'edit' | 'preview' | 'split' | 'ai-assist';

type ConfirmAction = 'new' | 'close' | null;

export function MarkdownEditor({ initialContent = '', onSave }: MarkdownEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [selectedText, setSelectedText] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [promptToApply, setPromptToApply] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<ConfirmAction>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const initialContentRef = useRef(initialContent);
  const { personas } = usePersonas();
  const { prompts } = usePrompts();

  // Synchroniser le contenu quand initialContent change
  useEffect(() => {
    setContent(initialContent);
    initialContentRef.current = initialContent;
    setIsDirty(false);
  }, [initialContent]);

  // Suivre les modifications du contenu
  useEffect(() => {
    setIsDirty(content !== initialContentRef.current);
  }, [content]);

  // Fermer le menu contextuel quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };

    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [contextMenu]);

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

  // Fonction pour insérer au début de la ligne
  const insertAtLineStart = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const beforeCursor = content.substring(0, start);
    const afterCursor = content.substring(start);

    // Trouver le début de la ligne actuelle
    const lineStart = beforeCursor.lastIndexOf('\n') + 1;
    const lineEnd = afterCursor.indexOf('\n');
    const currentLine = content.substring(
      lineStart,
      lineEnd === -1 ? content.length : start + lineEnd
    );

    // Vérifier si la ligne commence déjà par le préfixe
    const trimmedLine = currentLine.trimStart();
    if (trimmedLine.startsWith(prefix)) {
      // Retirer le préfixe
      const newLine = currentLine.replace(prefix, '');
      const newContent =
        content.substring(0, lineStart) +
        newLine +
        content.substring(lineEnd === -1 ? content.length : start + lineEnd);
      setContent(newContent);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(lineStart + newLine.length - currentLine.length + start - lineStart, lineStart + newLine.length - currentLine.length + start - lineStart);
      }, 0);
    } else {
      // Ajouter le préfixe
      const newContent =
        content.substring(0, lineStart) +
        prefix +
        content.substring(lineStart);
      setContent(newContent);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, start + prefix.length);
      }, 0);
    }
  };

  // Actions de formatage
  const formatBold = () => insertText('**', '**', 'texte en gras');
  const formatItalic = () => insertText('_', '_', 'texte en italique');
  const formatCode = () => insertText('`', '`', 'code');
  const formatLink = () => insertText('[', '](https://)', 'texte du lien');
  const formatImage = () => insertText('![', '](https://)', 'description de l\'image');
  const formatHeading = () => insertAtLineStart('## ');
  const formatQuote = () => insertAtLineStart('> ');
  const formatList = () => insertAtLineStart('- ');
  const formatOrderedList = () => insertAtLineStart('1. ');
  const formatHr = () => insertText('\n---\n', '', '');

  const formatCodeBlock = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    const codeBlock = '```\n' + (selectedText || 'code here') + '\n```\n';
    const newContent = content.substring(0, start) + codeBlock + content.substring(end);

    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      const newStart = start + 4; // Position après ```\n
      const newEnd = newStart + (selectedText || 'code here').length;
      textarea.setSelectionRange(newStart, newEnd);
    }, 0);
  };

  const formatTable = () => {
    const table = '\n| Colonne 1 | Colonne 2 | Colonne 3 |\n|-----------|-----------|-----------|-------| Cellule 1 | Cellule 2 | Cellule 3 |\n| Cellule 4 | Cellule 5 | Cellule 6 |\n';
    insertText(table, '', '');
  };

  // Fonction pour insérer du texte depuis l'assistant IA
  const insertTextFromAI = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      // Si pas de textarea (mode preview uniquement), ajouter à la fin
      setContent(content + '\n\n' + text);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Insérer à la position du curseur
    const newContent =
      content.substring(0, start) +
      '\n\n' + text + '\n\n' +
      content.substring(end);

    setContent(newContent);

    // Remettre le focus
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + text.length + 4; // +4 pour les \n\n avant et après
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  // Gestion du menu contextuel
  const handleContextMenu = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    e.preventDefault();

    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);

    // N'afficher le menu que si du texte est sélectionné
    if (selected && selected.trim()) {
      setSelectedText(selected);
      setContextMenu({ x: e.clientX, y: e.clientY });
    }
  };

  // Appliquer un prompt depuis le menu contextuel
  const handleApplyPromptFromContextMenu = (promptId: string) => {
    if (!selectedText) return;

    // Fermer le menu contextuel
    setContextMenu(null);

    // Basculer vers le mode AI assist si nécessaire
    if (viewMode !== 'ai-assist') {
      setViewMode('ai-assist');
    }

    // Déclencher l'application du prompt dans ChatInterface
    // On utilise setTimeout pour s'assurer que ChatInterface est monté
    setTimeout(() => {
      setPromptToApply(promptId);
      // Reset après un court délai pour permettre un nouveau déclenchement
      setTimeout(() => setPromptToApply(null), 100);
    }, 100);
  };

  // Filtrer les prompts disponibles pour l'éditeur
  const editorPrompts = prompts.filter(p => p.availableInEditor);

  // Gestion des raccourcis clavier
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          formatBold();
          break;
        case 'i':
          e.preventDefault();
          formatItalic();
          break;
        case 'k':
          e.preventDefault();
          formatLink();
          break;
        case '`':
          e.preventDefault();
          formatCode();
          break;
        case 's':
          e.preventDefault();
          handleSave();
          break;
      }
    }

    // Tab pour indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      insertText('  ', '', '');
    }
  };

  const handleSave = async () => {
    // Si callback onSave fourni, l'utiliser
    if (onSave) {
      onSave(content);
      initialContentRef.current = content;
      setIsDirty(false);
      return;
    }

    // Sinon, ouvrir la boîte de dialogue de sauvegarde native
    await handleExport();
  };

  const handleExport = async () => {
    try {
      // Ouvrir la fenêtre de dialogue pour choisir où sauvegarder
      const result = await window.electronAPI.file.saveDialog({
        title: 'Sauvegarder le document',
        defaultPath: 'document.md',
        filters: [
          { name: 'Markdown', extensions: ['md'] },
          { name: 'Texte', extensions: ['txt'] },
          { name: 'Tous les fichiers', extensions: ['*'] }
        ]
      });

      // Si l'utilisateur a annulé
      if (result.canceled || !result.filePath) {
        return;
      }

      // Écrire le fichier
      const writeResult = await window.electronAPI.file.writeFile(result.filePath, content);

      if (writeResult.success) {
        // Mettre à jour l'état après la sauvegarde réussie
        initialContentRef.current = content;
        setIsDirty(false);
      } else {
        console.error('[MarkdownEditor] Erreur lors de la sauvegarde:', writeResult.error);
        alert(`Erreur lors de la sauvegarde: ${writeResult.error}`);
      }
    } catch (error) {
      console.error('[MarkdownEditor] Exception lors de la sauvegarde:', error);
      alert(`Exception lors de la sauvegarde: ${error}`);
    }
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
          initialContentRef.current = text;
          setIsDirty(false);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Gestion du nouveau fichier
  const handleNewFile = () => {
    if (isDirty) {
      setPendingAction('new');
      setShowConfirmModal(true);
    } else {
      confirmNewFile();
    }
  };

  const confirmNewFile = () => {
    setContent('');
    initialContentRef.current = '';
    setIsDirty(false);
    setShowConfirmModal(false);
    setPendingAction(null);
  };

  // Gestion de la fermeture
  const handleClose = () => {
    if (isDirty) {
      setPendingAction('close');
      setShowConfirmModal(true);
    } else {
      confirmClose();
    }
  };

  const confirmClose = () => {
    setContent('');
    initialContentRef.current = '';
    setIsDirty(false);
    setShowConfirmModal(false);
    setPendingAction(null);
  };

  // Gestion de la confirmation (enregistrer + action)
  const handleSaveAndContinue = async () => {
    if (onSave) {
      onSave(content);
      initialContentRef.current = content;
      setIsDirty(false);
    } else {
      await handleExport();
    }

    // Exécuter l'action après la sauvegarde
    setTimeout(() => {
      if (pendingAction === 'new') {
        confirmNewFile();
      } else if (pendingAction === 'close') {
        confirmClose();
      }
    }, 100);
  };

  // Gestion de la confirmation (continuer sans enregistrer)
  const handleContinueWithoutSaving = () => {
    if (pendingAction === 'new') {
      confirmNewFile();
    } else if (pendingAction === 'close') {
      confirmClose();
    }
  };

  // Annuler l'action
  const handleCancelAction = () => {
    setShowConfirmModal(false);
    setPendingAction(null);
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
            title="Code inline (Ctrl+`)"
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
        </div>

        <div className="w-px h-6 bg-white/10" />

        <div className="flex items-center gap-1">
          <button
            onClick={formatLink}
            className="p-2 rounded hover:bg-white/10 transition-colors"
            title="Lien (Ctrl+K)"
          >
            <Link className="w-4 h-4" />
          </button>
          <button
            onClick={formatImage}
            className="p-2 rounded hover:bg-white/10 transition-colors"
            title="Image"
          >
            <Image className="w-4 h-4" />
          </button>
          <button
            onClick={formatCodeBlock}
            className="p-2 rounded hover:bg-white/10 transition-colors"
            title="Bloc de code"
          >
            <Code2 className="w-4 h-4" />
          </button>
          <button
            onClick={formatTable}
            className="p-2 rounded hover:bg-white/10 transition-colors"
            title="Tableau"
          >
            <Table className="w-4 h-4" />
          </button>
          <button
            onClick={formatHr}
            className="p-2 rounded hover:bg-white/10 transition-colors"
            title="Ligne horizontale"
          >
            <Minus className="w-4 h-4" />
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
          <button
            onClick={() => setViewMode('ai-assist')}
            className={cn(
              'p-2 rounded transition-colors',
              viewMode === 'ai-assist' ? 'bg-white/20' : 'hover:bg-white/10'
            )}
            title="Assistant IA"
          >
            <Bot className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1" />

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleNewFile}
            className="p-2 rounded hover:bg-white/10 transition-colors"
            title="Nouveau fichier"
          >
            <FilePlus className="w-4 h-4" />
          </button>
          <button
            onClick={handleClose}
            className="p-2 rounded hover:bg-white/10 transition-colors"
            title="Fermer le fichier"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-white/10 mx-1" />

          <button
            onClick={handleImport}
            className="p-2 rounded hover:bg-white/10 transition-colors"
            title="Importer un fichier"
          >
            <FileUp className="w-4 h-4" />
          </button>
          <button
            onClick={handleSave}
            className={cn(
              "px-3 py-2 rounded transition-colors flex items-center gap-2",
              isDirty
                ? "bg-purple-500/30 hover:bg-purple-500/40"
                : "bg-purple-500/20 hover:bg-purple-500/30"
            )}
            title="Sauvegarder sous... (Ctrl+S)"
          >
            <Save className="w-4 h-4" />
            <span className="text-sm">Sauvegarder{isDirty ? ' *' : ''}</span>
          </button>
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor panel */}
        {(viewMode === 'edit' || viewMode === 'split' || viewMode === 'ai-assist') && (
          <div
            className={cn(
              'flex flex-col',
              viewMode === 'split' || viewMode === 'ai-assist' ? 'w-1/2 border-r border-white/10' : 'w-full'
            )}
          >
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              onContextMenu={handleContextMenu}
              className="flex-1 w-full p-6 bg-transparent resize-none focus:outline-none font-mono text-sm leading-relaxed"
              placeholder="Commencez à écrire en markdown..."
              spellCheck={false}
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
            <div className="prose prose-invert max-w-none
              prose-headings:text-white prose-headings:font-bold
              prose-h1:text-3xl prose-h1:mt-8 prose-h1:mb-4
              prose-h2:text-2xl prose-h2:mt-6 prose-h2:mb-3 prose-h2:border-b prose-h2:border-white/10 prose-h2:pb-2
              prose-h3:text-xl prose-h3:mt-4 prose-h3:mb-2
              prose-p:text-gray-300 prose-p:leading-7
              prose-a:text-purple-400 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-white prose-strong:font-semibold
              prose-code:text-pink-400 prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-gray-900 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-lg
              prose-ul:text-gray-300 prose-ol:text-gray-300
              prose-li:marker:text-purple-400
              prose-blockquote:border-l-purple-500 prose-blockquote:text-gray-400 prose-blockquote:italic
              prose-table:border prose-table:border-white/10
              prose-th:bg-white/5 prose-th:text-white prose-th:font-semibold prose-th:border prose-th:border-white/10
              prose-td:border prose-td:border-white/10 prose-td:text-gray-300
              prose-img:rounded-lg prose-img:border prose-img:border-white/10
              prose-hr:border-white/10
            ">
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
                        customStyle={{
                          margin: 0,
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                        }}
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

        {/* AI Assistant panel */}
        {viewMode === 'ai-assist' && (
          <div className="w-1/2">
            <ChatInterface
              title="Assistant de rédaction"
              hideImportExport={true}
              documentContext={content}
              selectedText={selectedText}
              promptToApply={promptToApply}
              onInsertText={insertTextFromAI}
              personas={personas}
            />
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && editorPrompts.length > 0 && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 min-w-[220px] glass-card border border-white/10 rounded-lg shadow-xl py-1"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
        >
          <div className="px-3 py-2 text-xs font-semibold text-gray-400 border-b border-white/10">
            Actions sur le texte sélectionné
          </div>
          {editorPrompts.map((prompt) => (
            <button
              key={prompt.id}
              onClick={() => handleApplyPromptFromContextMenu(prompt.id)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-2"
            >
              <span className="text-lg">{prompt.icon}</span>
              <span>{prompt.editorTitle || prompt.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-card border border-white/10 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-2">
              {pendingAction === 'new' ? 'Nouveau fichier' : 'Fermer le fichier'}
            </h3>
            <p className="text-muted-foreground mb-6">
              Vous avez des modifications non enregistrées. Que souhaitez-vous faire ?
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleSaveAndContinue}
                className="w-full px-4 py-3 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <Save className="w-4 h-4" />
                <span>{onSave ? 'Enregistrer et continuer' : 'Sauvegarder et continuer'}</span>
              </button>

              <button
                onClick={handleContinueWithoutSaving}
                className="w-full px-4 py-3 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 transition-colors font-medium text-orange-300"
              >
                Continuer sans enregistrer
              </button>

              <button
                onClick={handleCancelAction}
                className="w-full px-4 py-3 rounded-lg glass-hover transition-colors font-medium"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, Code, Copy, Check } from 'lucide-react';
import type { OllamaMessage } from '@blackia/ollama';

interface ExportMenuProps {
  messages: OllamaMessage[];
  conversationTitle?: string;
}

export function ExportMenu({ messages, conversationTitle = 'Conversation' }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fermer le menu si on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Export en Markdown
  const exportMarkdown = () => {
    const markdown = generateMarkdown(messages, conversationTitle);
    downloadFile(
      markdown,
      `${conversationTitle.replace(/[^a-z0-9]/gi, '_')}.md`,
      'text/markdown'
    );
    setIsOpen(false);
  };

  // Export en JSON
  const exportJSON = () => {
    const json = JSON.stringify(
      {
        title: conversationTitle,
        exportedAt: new Date().toISOString(),
        messages,
      },
      null,
      2
    );
    downloadFile(
      json,
      `${conversationTitle.replace(/[^a-z0-9]/gi, '_')}.json`,
      'application/json'
    );
    setIsOpen(false);
  };

  // Copier dans le clipboard
  const copyToClipboard = async () => {
    const markdown = generateMarkdown(messages, conversationTitle);
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setIsOpen(false);
      }, 1500);
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
    }
  };

  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl glass-hover hover:bg-white/10 transition-colors"
        title="Exporter la conversation"
      >
        <Download className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 glass-card rounded-xl overflow-hidden shadow-xl border border-white/10 z-[9999]">
          <div className="p-2 space-y-1">
            <button
              onClick={exportMarkdown}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left"
            >
              <FileText className="w-4 h-4 text-blue-400" />
              <div className="flex-1">
                <div className="text-sm font-medium">Exporter en Markdown</div>
                <div className="text-xs text-muted-foreground">Fichier .md</div>
              </div>
            </button>

            <button
              onClick={exportJSON}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left"
            >
              <Code className="w-4 h-4 text-green-400" />
              <div className="flex-1">
                <div className="text-sm font-medium">Exporter en JSON</div>
                <div className="text-xs text-muted-foreground">Fichier .json</div>
              </div>
            </button>

            <button
              onClick={copyToClipboard}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-purple-400" />
              )}
              <div className="flex-1">
                <div className="text-sm font-medium">
                  {copied ? 'Copié !' : 'Copier dans le presse-papier'}
                </div>
                <div className="text-xs text-muted-foreground">Format Markdown</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Générer le markdown de la conversation
function generateMarkdown(messages: OllamaMessage[], title: string): string {
  const date = new Date().toLocaleString('fr-FR');
  let markdown = `# ${title}\n\n`;
  markdown += `*Exporté le ${date}*\n\n`;
  markdown += `---\n\n`;

  for (const message of messages) {
    const role = message.role === 'user' ? '👤 Utilisateur' : '🤖 Assistant';
    markdown += `## ${role}\n\n`;
    markdown += `${message.content}\n\n`;
  }

  return markdown;
}

// Télécharger un fichier
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, Code, Copy, Check, FileOutput } from 'lucide-react';
import type { OllamaMessage } from '@blackia/ollama';

interface ExportMenuProps {
  messages: OllamaMessage[];
  conversationTitle?: string;
  // Pour l'export complet (optionnel)
  onExportAll?: () => void;
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

  // Export en PDF
  const exportPDF = async () => {
    try {
      const htmlContent = generateHTML(messages, conversationTitle);
      const result = await window.electronAPI.file.exportPDF({
        title: conversationTitle,
        content: htmlContent,
      });

      if (result.success) {
        console.log('PDF exporté avec succès:', result.filePath);
      } else if (!result.canceled) {
        console.error('Erreur lors de l\'export PDF:', result.error);
      }
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
    }
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
        <div className="absolute right-0 top-full mt-2 w-56 glass-card bg-gray-900/95 rounded-xl overflow-hidden shadow-xl border border-white/10 z-[9999]">
          <div className="p-2 space-y-1">
            <button
              onClick={exportPDF}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left"
            >
              <FileOutput className="w-4 h-4 text-red-400" />
              <div className="flex-1">
                <div className="text-sm font-medium">Exporter en PDF</div>
                <div className="text-xs text-muted-foreground">Fichier .pdf</div>
              </div>
            </button>

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

// Générer le HTML de la conversation pour le PDF
function generateHTML(messages: OllamaMessage[], title: string): string {
  const date = new Date().toLocaleString('fr-FR');

  const messagesHTML = messages
    .map((message) => {
      const role = message.role === 'user' ? '👤 Utilisateur' : '🤖 Assistant';
      const bgColor = message.role === 'user' ? '#1e3a5f' : '#1e293b';
      const content = escapeHTML(message.content)
        .replace(/\n/g, '<br>')
        .replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
          return `<pre style="background: #0f172a; padding: 12px; border-radius: 8px; overflow-x: auto; margin: 8px 0;"><code>${escapeHTML(code.trim())}</code></pre>`;
        })
        .replace(/`([^`]+)`/g, '<code style="background: #0f172a; padding: 2px 6px; border-radius: 4px;">$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>');

      return `
        <div style="margin-bottom: 24px; padding: 16px; background: ${bgColor}; border-radius: 12px;">
          <div style="font-weight: 600; margin-bottom: 8px; color: #e2e8f0;">${role}</div>
          <div style="color: #cbd5e1; line-height: 1.6;">${content}</div>
        </div>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${escapeHTML(title)}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
          background: #0f172a;
          color: #e2e8f0;
        }
        h1 {
          font-size: 32px;
          margin-bottom: 8px;
          color: #f1f5f9;
        }
        .meta {
          color: #94a3b8;
          font-size: 14px;
          margin-bottom: 32px;
          padding-bottom: 16px;
          border-bottom: 2px solid #1e293b;
        }
        code {
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 14px;
        }
        pre {
          white-space: pre-wrap;
          word-wrap: break-word;
        }
      </style>
    </head>
    <body>
      <h1>${escapeHTML(title)}</h1>
      <div class="meta">Exporté le ${date}</div>
      ${messagesHTML}
    </body>
    </html>
  `;
}

// Échapper le HTML
function escapeHTML(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

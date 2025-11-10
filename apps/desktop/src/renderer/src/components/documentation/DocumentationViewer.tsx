import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useNavigate } from 'react-router-dom';
import { Edit3 } from 'lucide-react';
import type { Documentation } from '../../../../main/database/schema';

interface DocumentationViewerProps {
  doc: Documentation;
}

/**
 * Viewer de documentation avec rendu Markdown
 * Utilise react-markdown avec support GFM et syntax highlighting
 */
export function DocumentationViewer({ doc }: DocumentationViewerProps) {
  const navigate = useNavigate();

  const handleEdit = () => {
    navigate('/editor', {
      state: {
        documentId: doc.id,
        documentSlug: doc.slug,
        documentTitle: doc.title,
        documentContent: doc.content,
        isDocumentation: true,
      },
    });
  };

  return (
    <article className="max-w-4xl mx-auto px-8 py-8">
      {/* Header */}
      <header className="mb-8 border-b border-white/10 pb-6">
        <div className="flex items-start gap-4">
          {doc.icon && <span className="text-4xl">{doc.icon}</span>}
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-white mb-2">{doc.title}</h1>
            {doc.description && (
              <p className="text-lg text-muted-foreground">{doc.description}</p>
            )}
          </div>

          {/* Edit button */}
          <button
            onClick={handleEdit}
            className="px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 transition-colors flex items-center gap-2 text-sm"
            title="Éditer ce document"
          >
            <Edit3 className="w-4 h-4" />
            <span>Éditer</span>
          </button>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
          {doc.version && (
            <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-400">
              v{doc.version}
            </span>
          )}
          <span>
            Mis à jour le {new Date(doc.updatedAt).toLocaleDateString('fr-FR')}
          </span>
        </div>
      </header>

      {/* Content - Markdown */}
      <div
        className="
          prose prose-invert prose-purple max-w-none
          prose-headings:text-white prose-headings:font-bold
          prose-h1:text-3xl prose-h1:mt-8 prose-h1:mb-4
          prose-h2:text-2xl prose-h2:mt-6 prose-h2:mb-3 prose-h2:border-b prose-h2:border-white/10 prose-h2:pb-2
          prose-h3:text-xl prose-h3:mt-4 prose-h3:mb-2
          prose-p:text-gray-300 prose-p:leading-7
          prose-a:text-purple-400 prose-a:no-underline hover:prose-a:underline
          prose-strong:text-white prose-strong:font-semibold
          prose-code:text-pink-400 prose-code:bg-white/5 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
          prose-pre:bg-gray-900 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-lg
          prose-ul:text-gray-300 prose-ol:text-gray-300
          prose-li:marker:text-purple-400
          prose-blockquote:border-l-purple-500 prose-blockquote:text-gray-400 prose-blockquote:italic
          prose-table:border prose-table:border-white/10
          prose-th:bg-white/5 prose-th:text-white prose-th:font-semibold
          prose-td:border prose-td:border-white/10 prose-td:text-gray-300
          prose-img:rounded-lg prose-img:border prose-img:border-white/10
        "
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Custom code block renderer avec syntax highlighting
            code({ node, inline, className, children, ...props }) {
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
            // Ajouter des IDs aux headings pour les ancres
            h1: ({ children, ...props }) => {
              const id = String(children).toLowerCase().replace(/\s+/g, '-');
              return <h1 id={id} {...props}>{children}</h1>;
            },
            h2: ({ children, ...props }) => {
              const id = String(children).toLowerCase().replace(/\s+/g, '-');
              return <h2 id={id} {...props}>{children}</h2>;
            },
            h3: ({ children, ...props }) => {
              const id = String(children).toLowerCase().replace(/\s+/g, '-');
              return <h3 id={id} {...props}>{children}</h3>;
            },
            // Task list support
            input: ({ type, checked, ...props }) => {
              if (type === 'checkbox') {
                return (
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled
                    className="mr-2 accent-purple-500"
                    {...props}
                  />
                );
              }
              return <input type={type} {...props} />;
            },
          }}
        >
          {doc.content}
        </ReactMarkdown>
      </div>
    </article>
  );
}

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MarkdownEditor } from '../components/editor/MarkdownEditor';
import { ArrowLeft, Check } from 'lucide-react';

interface EditorState {
  documentId?: string;
  documentSlug?: string;
  documentTitle?: string;
  documentContent?: string;
  isDocumentation?: boolean;
}

export function EditorPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as EditorState) || {};

  const [initialContent, setInitialContent] = useState(state.documentContent || '');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    if (state.documentContent) {
      setInitialContent(state.documentContent);
    }
  }, [state.documentContent]);

  const handleSave = async (content: string) => {
    if (state.isDocumentation && state.documentId) {
      // Sauvegarder dans la documentation
      setSaveStatus('saving');
      try {
        const result = await window.electron.documentation.update(state.documentId, {
          content,
          // updatedAt est géré automatiquement par le service
        });

        if (result.success) {
          setSaveStatus('saved');
          // Reset le status après 2 secondes
          setTimeout(() => setSaveStatus('idle'), 2000);
        } else {
          console.error('Erreur lors de la sauvegarde:', result.error);
          setSaveStatus('error');
          setTimeout(() => setSaveStatus('idle'), 3000);
        }
      } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } else {
      // Pour les autres documents (non-documentation)
      console.log('Saving content:', content);
      // TODO: Implement save to database or file system
    }
  };

  const handleBack = () => {
    if (state.isDocumentation) {
      navigate('/documentation');
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-4">
          {/* Back button */}
          {state.isDocumentation && (
            <button
              onClick={handleBack}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title="Retour à la documentation"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="flex-1">
            <h1 className="text-2xl font-bold">
              {state.documentTitle || 'Éditeur Markdown'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {state.isDocumentation
                ? 'Éditez la documentation avec aperçu en temps réel'
                : 'Créez et éditez vos documents en markdown avec aperçu en temps réel'}
            </p>
          </div>

          {/* Save status indicator */}
          {saveStatus !== 'idle' && (
            <div className="flex items-center gap-2 text-sm">
              {saveStatus === 'saving' && (
                <span className="text-muted-foreground">Enregistrement...</span>
              )}
              {saveStatus === 'saved' && (
                <span className="text-green-400 flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Enregistré
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="text-red-400">Erreur lors de la sauvegarde</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <MarkdownEditor
          key={state.documentId || 'new'}
          initialContent={initialContent}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}

import React from 'react';
import { MarkdownEditor } from '../components/editor/MarkdownEditor';

export function EditorPage() {
  const handleSave = (content: string) => {
    console.log('Saving content:', content);
    // TODO: Implement save to database or file system
    // For now, just log to console
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-2xl font-bold">Éditeur Markdown</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Créez et éditez vos documents en markdown avec aperçu en temps réel
        </p>
      </div>

      <div className="flex-1 overflow-hidden">
        <MarkdownEditor onSave={handleSave} />
      </div>
    </div>
  );
}

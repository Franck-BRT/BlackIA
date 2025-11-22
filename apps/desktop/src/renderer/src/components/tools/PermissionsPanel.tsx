/**
 * Permissions Panel
 * Gestion des permissions macOS pour les outils MCP
 */

import React, { useState } from 'react';
import {
  Shield,
  Check,
  X,
  ExternalLink,
  AlertTriangle,
  Info,
  RefreshCw,
} from 'lucide-react';
import type { MCPPermissionState } from '../../hooks/useMCPTools';

interface PermissionsPanelProps {
  permissions: MCPPermissionState[];
  onTogglePermission: (permission: string, enabled: boolean) => Promise<void>;
  onRequestPermission: (permission: string) => Promise<boolean>;
}

// Metadata des permissions
const PERMISSION_INFO: Record<string, {
  name: string;
  description: string;
  icon: string;
  systemPanel: string;
}> = {
  accessibility: {
    name: 'Accessibilité',
    description: 'Contrôle des applications, automation des fenêtres',
    icon: '♿',
    systemPanel: 'Accessibilité',
  },
  files: {
    name: 'Accès fichiers',
    description: 'Lecture et écriture de fichiers (géré par les répertoires autorisés)',
    icon: '📁',
    systemPanel: 'Fichiers et dossiers',
  },
  screen_capture: {
    name: 'Capture d\'écran',
    description: 'Screenshots et enregistrement d\'écran',
    icon: '📸',
    systemPanel: 'Enregistrement de l\'écran',
  },
  notifications: {
    name: 'Notifications',
    description: 'Envoi de notifications système',
    icon: '🔔',
    systemPanel: 'Notifications',
  },
  microphone: {
    name: 'Microphone',
    description: 'Accès au microphone pour enregistrement audio',
    icon: '🎤',
    systemPanel: 'Microphone',
  },
  location: {
    name: 'Localisation',
    description: 'Accès à la position géographique',
    icon: '📍',
    systemPanel: 'Services de localisation',
  },
  calendar: {
    name: 'Calendrier',
    description: 'Lecture et création d\'événements',
    icon: '📅',
    systemPanel: 'Calendriers',
  },
  reminders: {
    name: 'Rappels',
    description: 'Lecture et création de rappels',
    icon: '⏰',
    systemPanel: 'Rappels',
  },
  contacts: {
    name: 'Contacts',
    description: 'Accès au carnet d\'adresses',
    icon: '📇',
    systemPanel: 'Contacts',
  },
  bluetooth: {
    name: 'Bluetooth',
    description: 'Accès aux appareils Bluetooth',
    icon: '📡',
    systemPanel: 'Bluetooth',
  },
  automation: {
    name: 'Automation',
    description: 'AppleScript et JavaScript for Automation',
    icon: '🤖',
    systemPanel: 'Automatisation',
  },
};

export function PermissionsPanel({
  permissions,
  onTogglePermission,
  onRequestPermission,
}: PermissionsPanelProps) {
  const [loadingPermission, setLoadingPermission] = useState<string | null>(null);

  const handleRequestPermission = async (permission: string) => {
    setLoadingPermission(permission);
    try {
      await onRequestPermission(permission);
    } finally {
      setLoadingPermission(null);
    }
  };

  const handleToggle = async (permission: string, currentEnabled: boolean) => {
    await onTogglePermission(permission, !currentEnabled);
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Header info */}
      <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-400">À propos des permissions</h3>
            <p className="text-sm text-white/60 mt-1">
              Certains outils nécessitent des permissions macOS spécifiques. Activez les permissions
              dont vous avez besoin, puis accordez-les dans les Préférences Système si demandé.
            </p>
          </div>
        </div>
      </div>

      {/* Permissions grid */}
      <div className="grid gap-4">
        {permissions.map(perm => {
          const info = PERMISSION_INFO[perm.permission] || {
            name: perm.permission,
            description: '',
            icon: '🔒',
            systemPanel: 'Confidentialité',
          };
          const isLoading = loadingPermission === perm.permission;

          return (
            <div
              key={perm.permission}
              className={`p-4 rounded-xl border transition-colors ${
                perm.enabled && perm.granted
                  ? 'bg-green-500/5 border-green-500/20'
                  : perm.enabled && !perm.granted
                  ? 'bg-orange-500/5 border-orange-500/20'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-xl">
                    {info.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{info.name}</h3>
                    <p className="text-sm text-white/60 mt-0.5">{info.description}</p>

                    {/* Status badges */}
                    <div className="flex items-center gap-2 mt-2">
                      {perm.granted ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                          <Check className="w-3 h-3" />
                          Accordée
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded text-xs">
                          <AlertTriangle className="w-3 h-3" />
                          Non accordée
                        </span>
                      )}

                      {perm.enabled ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">
                          Activée
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 text-white/40 rounded text-xs">
                          Désactivée
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Request permission button */}
                  {!perm.granted && perm.enabled && (
                    <button
                      onClick={() => handleRequestPermission(perm.permission)}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 rounded-lg text-sm text-white transition-colors"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <ExternalLink className="w-4 h-4" />
                      )}
                      <span>Autoriser</span>
                    </button>
                  )}

                  {/* Toggle switch */}
                  <button
                    onClick={() => handleToggle(perm.permission, perm.enabled)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      perm.enabled ? 'bg-purple-600' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        perm.enabled ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Help text when not granted but enabled */}
              {perm.enabled && !perm.granted && (
                <div className="mt-3 p-3 bg-orange-500/10 rounded-lg">
                  <p className="text-sm text-orange-400">
                    Cette permission doit être accordée dans{' '}
                    <strong>Préférences Système → Confidentialité et sécurité → {info.systemPanel}</strong>.
                    Cliquez sur "Autoriser" pour ouvrir les préférences.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

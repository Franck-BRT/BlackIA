/**
 * Permissions Panel
 * Affiche le statut des permissions macOS (lecture seule)
 * Les outils sont activés/désactivés via les cartes d'outils dans l'onglet "Outils"
 */

import React, { useState } from 'react';
import {
  Shield,
  Check,
  ExternalLink,
  AlertTriangle,
  Info,
  RefreshCw,
  Settings,
} from 'lucide-react';
import type { MCPPermissionState } from '../../hooks/useMCPTools';

interface PermissionsPanelProps {
  permissions: MCPPermissionState[];
  onRequestPermission: (permission: string) => Promise<boolean>;
  onRefreshPermissions?: () => Promise<void>;
}

// Metadata des permissions macOS
const PERMISSION_INFO: Record<string, {
  name: string;
  description: string;
  icon: string;
  systemPanel: string;
  requiredFor: string[];
}> = {
  accessibility: {
    name: 'Accessibilite',
    description: 'Permet de controler d\'autres applications et d\'automatiser les fenetres',
    icon: '♿',
    systemPanel: 'Accessibilite',
    requiredFor: ['Controle des fenetres', 'Automation des apps', 'Raccourcis clavier'],
  },
  files: {
    name: 'Fichiers et dossiers',
    description: 'Gere automatiquement par les repertoires autorises dans l\'onglet "Repertoires"',
    icon: '📁',
    systemPanel: 'Fichiers et dossiers',
    requiredFor: ['Lecture de fichiers', 'Ecriture de fichiers', 'Suppression'],
  },
  screen_capture: {
    name: 'Enregistrement d\'ecran',
    description: 'Permet de capturer des screenshots et d\'enregistrer l\'ecran',
    icon: '📸',
    systemPanel: 'Enregistrement de l\'ecran',
    requiredFor: ['Screenshots', 'Capture de fenetre', 'Enregistrement video'],
  },
  notifications: {
    name: 'Notifications',
    description: 'Permet d\'envoyer des notifications systeme',
    icon: '🔔',
    systemPanel: 'Notifications',
    requiredFor: ['Alertes', 'Rappels', 'Messages systeme'],
  },
  microphone: {
    name: 'Microphone',
    description: 'Permet d\'acceder au microphone pour l\'enregistrement audio',
    icon: '🎤',
    systemPanel: 'Microphone',
    requiredFor: ['Enregistrement audio', 'Dictee vocale'],
  },
  location: {
    name: 'Localisation',
    description: 'Permet d\'acceder a la position geographique',
    icon: '📍',
    systemPanel: 'Services de localisation',
    requiredFor: ['Position GPS', 'Fuseau horaire', 'Meteo locale'],
  },
  calendar: {
    name: 'Calendrier',
    description: 'Permet de lire et creer des evenements dans le calendrier',
    icon: '📅',
    systemPanel: 'Calendriers',
    requiredFor: ['Lecture evenements', 'Creation evenements', 'Rappels'],
  },
  reminders: {
    name: 'Rappels',
    description: 'Permet de lire et creer des rappels',
    icon: '⏰',
    systemPanel: 'Rappels',
    requiredFor: ['Liste de taches', 'Rappels', 'Echeances'],
  },
  contacts: {
    name: 'Contacts',
    description: 'Permet d\'acceder au carnet d\'adresses',
    icon: '📇',
    systemPanel: 'Contacts',
    requiredFor: ['Recherche contacts', 'Creation contacts', 'Informations'],
  },
  bluetooth: {
    name: 'Bluetooth',
    description: 'Permet d\'acceder aux appareils Bluetooth',
    icon: '📡',
    systemPanel: 'Bluetooth',
    requiredFor: ['Appareils connectes', 'AirDrop', 'Transfert'],
  },
  automation: {
    name: 'Automation',
    description: 'Permet d\'executer AppleScript et JavaScript for Automation',
    icon: '🤖',
    systemPanel: 'Automatisation',
    requiredFor: ['AppleScript', 'JXA', 'Controle apps tierces'],
  },
};

export function PermissionsPanel({
  permissions,
  onRequestPermission,
  onRefreshPermissions,
}: PermissionsPanelProps) {
  const [loadingPermission, setLoadingPermission] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRequestPermission = async (permission: string) => {
    setLoadingPermission(permission);
    try {
      await onRequestPermission(permission);
    } finally {
      setLoadingPermission(null);
    }
  };

  const handleRefresh = async () => {
    if (onRefreshPermissions) {
      setIsRefreshing(true);
      try {
        await onRefreshPermissions();
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  // Compter les permissions accordees
  const grantedCount = permissions.filter(p => p.granted).length;

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Header info */}
      <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-blue-400">Permissions macOS</h3>
            <p className="text-sm text-white/60 mt-1">
              Cette page affiche le statut des permissions accordees a BlackIA par macOS.
              Pour activer ou desactiver un <strong>outil</strong>, utilisez l'onglet "Outils"
              et cliquez sur le bouton "Actif/Inactif" de chaque outil.
            </p>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm text-white/60">
              {grantedCount} permission{grantedCount > 1 ? 's' : ''} accordee{grantedCount > 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-sm text-white/60">
              {permissions.length - grantedCount} en attente
            </span>
          </div>
        </div>

        {onRefreshPermissions && (
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white/70 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        )}
      </div>

      {/* Permissions grid */}
      <div className="grid gap-4">
        {permissions.map(perm => {
          const info = PERMISSION_INFO[perm.permission] || {
            name: perm.permission,
            description: '',
            icon: '🔒',
            systemPanel: 'Confidentialite',
            requiredFor: [],
          };
          const isLoading = loadingPermission === perm.permission;

          return (
            <div
              key={perm.permission}
              className={`p-4 rounded-xl border transition-colors ${
                perm.granted
                  ? 'bg-green-500/5 border-green-500/20'
                  : 'bg-orange-500/5 border-orange-500/20'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl">
                    {info.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{info.name}</h3>
                      {perm.granted ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                          <Check className="w-3 h-3" />
                          Accordee
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full text-xs font-medium">
                          <AlertTriangle className="w-3 h-3" />
                          Non accordee
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/60 mt-1">{info.description}</p>

                    {/* Required for */}
                    {info.requiredFor.length > 0 && (
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-xs text-white/40">Utilise par :</span>
                        {info.requiredFor.map(feature => (
                          <span
                            key={feature}
                            className="px-2 py-0.5 bg-white/5 rounded text-xs text-white/50"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action button */}
                <div className="ml-4">
                  {!perm.granted ? (
                    <button
                      onClick={() => handleRequestPermission(perm.permission)}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 rounded-lg text-sm text-white font-medium transition-colors whitespace-nowrap"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <ExternalLink className="w-4 h-4" />
                      )}
                      <span>Ouvrir Preferences</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-lg text-sm text-green-400 font-medium">
                      <Check className="w-4 h-4" />
                      <span>Configuree</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Help text when not granted */}
              {!perm.granted && (
                <div className="mt-4 p-3 bg-orange-500/10 rounded-lg flex items-start gap-2">
                  <Settings className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-orange-300">
                    Cliquez sur "Ouvrir Preferences" puis accordez l'acces a BlackIA dans{' '}
                    <strong>Confidentialite et securite - {info.systemPanel}</strong>.
                    Vous devrez peut-etre redemarrer l'application apres avoir accorde la permission.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-xl">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-white/40 mt-0.5" />
          <div>
            <h4 className="font-medium text-white/70">Note importante</h4>
            <p className="text-sm text-white/50 mt-1">
              Ces permissions sont gerees par macOS. BlackIA ne peut pas les modifier directement.
              Si vous avez accorde une permission mais qu'elle apparait toujours comme "Non accordee",
              essayez de redemarrer BlackIA ou cliquez sur "Actualiser".
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

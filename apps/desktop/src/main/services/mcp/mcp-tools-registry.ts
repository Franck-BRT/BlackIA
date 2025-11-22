/**
 * MCP Tools Registry
 * Registre central de tous les outils MCP disponibles
 */

import {
  MCPTool,
  MCPToolCategory,
  MCPToolFilter,
  ChatToolDefinition,
  toolToChatDefinition,
} from './mcp-protocol';

// ============================================================================
// REGISTRY CLASS
// ============================================================================

class MCPToolsRegistry {
  private tools: Map<string, MCPTool> = new Map();
  private toolsByCategory: Map<MCPToolCategory, MCPTool[]> = new Map();

  constructor() {
    this.initializeTools();
  }

  /**
   * Initialise tous les outils du registre
   */
  private initializeTools(): void {
    // Enregistrer toutes les catégories d'outils
    this.registerFilesTools();
    this.registerAppsTools();
    this.registerClipboardTools();
    this.registerNotificationTools();
    this.registerTerminalTools();
    this.registerSystemTools();
    this.registerCaptureTools();
    this.registerControlsTools();
    this.registerNetworkTools();
    this.registerCalendarTools();
    this.registerContactsTools();
    this.registerMultimediaTools();
  }

  /**
   * Enregistre un outil dans le registre
   */
  public registerTool(tool: MCPTool): void {
    this.tools.set(tool.name, tool);

    // Ajouter à la catégorie
    const categoryTools = this.toolsByCategory.get(tool.category) || [];
    categoryTools.push(tool);
    this.toolsByCategory.set(tool.category, categoryTools);
  }

  /**
   * Récupère un outil par son nom
   */
  public getTool(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Récupère tous les outils
   */
  public getAllTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Récupère les outils par catégorie
   */
  public getToolsByCategory(category: MCPToolCategory): MCPTool[] {
    return this.toolsByCategory.get(category) || [];
  }

  /**
   * Récupère toutes les catégories avec leurs outils
   */
  public getAllCategories(): { category: MCPToolCategory; tools: MCPTool[]; icon: string; name: string }[] {
    const categories: { category: MCPToolCategory; tools: MCPTool[]; icon: string; name: string }[] = [
      { category: 'files', tools: [], icon: '📁', name: 'Fichiers' },
      { category: 'apps', tools: [], icon: '🖥️', name: 'Applications' },
      { category: 'clipboard', tools: [], icon: '📋', name: 'Presse-papiers' },
      { category: 'notifications', tools: [], icon: '🔔', name: 'Notifications' },
      { category: 'terminal', tools: [], icon: '⚡', name: 'Terminal' },
      { category: 'system', tools: [], icon: 'ℹ️', name: 'Système' },
      { category: 'capture', tools: [], icon: '📸', name: 'Capture' },
      { category: 'controls', tools: [], icon: '🔊', name: 'Contrôles' },
      { category: 'network', tools: [], icon: '🌐', name: 'Réseau' },
      { category: 'calendar', tools: [], icon: '📅', name: 'Calendrier' },
      { category: 'contacts', tools: [], icon: '📇', name: 'Contacts' },
      { category: 'multimedia', tools: [], icon: '🎵', name: 'Multimédia' },
    ];

    for (const cat of categories) {
      cat.tools = this.toolsByCategory.get(cat.category) || [];
    }

    return categories;
  }

  /**
   * Filtre les outils selon des critères
   */
  public filterTools(filter: MCPToolFilter): MCPTool[] {
    let tools = this.getAllTools();

    if (filter.category) {
      tools = tools.filter(t => t.category === filter.category);
    }

    if (filter.enabledOnly) {
      tools = tools.filter(t => t.enabled !== false);
    }

    if (filter.permission) {
      tools = tools.filter(t => t.permissions.includes(filter.permission!));
    }

    if (filter.search) {
      const search = filter.search.toLowerCase();
      tools = tools.filter(t =>
        t.name.toLowerCase().includes(search) ||
        t.description.toLowerCase().includes(search) ||
        t.category.toLowerCase().includes(search)
      );
    }

    return tools;
  }

  /**
   * Convertit les outils en définitions pour le chat LLM
   */
  public getToolsForChat(enabledOnly = true): ChatToolDefinition[] {
    const tools = enabledOnly
      ? this.getAllTools().filter(t => t.enabled !== false)
      : this.getAllTools();

    return tools.map(toolToChatDefinition);
  }

  // ============================================================================
  // FILES TOOLS
  // ============================================================================

  private registerFilesTools(): void {
    this.registerTool({
      name: 'read_file',
      category: 'files',
      description: 'Lire le contenu d\'un fichier',
      longDescription: 'Lit et retourne le contenu complet d\'un fichier texte ou binaire (encodé en base64).',
      icon: '📄',
      parameters: [
        { name: 'path', type: 'string', description: 'Chemin du fichier à lire', required: true },
        { name: 'encoding', type: 'string', description: 'Encodage (utf8, base64, binary)', required: false, default: 'utf8', enum: ['utf8', 'base64', 'binary'] },
        { name: 'maxSize', type: 'number', description: 'Taille maximum en octets (défaut: 10MB)', required: false, default: 10485760 },
      ],
      permissions: ['files'],
      examples: [
        { title: 'Lire un fichier texte', description: 'Lire le contenu d\'un README', parameters: { path: '~/Documents/README.md' } },
        { title: 'Lire une image en base64', description: 'Lire une image pour l\'envoyer', parameters: { path: '~/Pictures/photo.png', encoding: 'base64' } },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'write_file',
      category: 'files',
      description: 'Écrire du contenu dans un fichier',
      longDescription: 'Crée ou écrase un fichier avec le contenu spécifié.',
      icon: '✏️',
      parameters: [
        { name: 'path', type: 'string', description: 'Chemin du fichier à créer/modifier', required: true },
        { name: 'content', type: 'string', description: 'Contenu à écrire', required: true },
        { name: 'encoding', type: 'string', description: 'Encodage (utf8, base64)', required: false, default: 'utf8', enum: ['utf8', 'base64'] },
        { name: 'createDirectories', type: 'boolean', description: 'Créer les dossiers parents si nécessaire', required: false, default: true },
      ],
      permissions: ['files'],
      examples: [
        { title: 'Créer un fichier texte', description: 'Créer un nouveau fichier', parameters: { path: '~/Documents/notes.txt', content: 'Mes notes...' } },
      ],
      dangerous: true,
      requiresConfirmation: false,
      enabled: true,
    });

    this.registerTool({
      name: 'append_file',
      category: 'files',
      description: 'Ajouter du contenu à la fin d\'un fichier',
      icon: '➕',
      parameters: [
        { name: 'path', type: 'string', description: 'Chemin du fichier', required: true },
        { name: 'content', type: 'string', description: 'Contenu à ajouter', required: true },
        { name: 'newline', type: 'boolean', description: 'Ajouter un saut de ligne avant', required: false, default: true },
      ],
      permissions: ['files'],
      examples: [
        { title: 'Ajouter à un log', description: 'Ajouter une entrée dans un fichier log', parameters: { path: '~/logs/app.log', content: '[INFO] Événement' } },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'list_directory',
      category: 'files',
      description: 'Lister le contenu d\'un dossier',
      icon: '📂',
      parameters: [
        { name: 'path', type: 'string', description: 'Chemin du dossier', required: true },
        { name: 'recursive', type: 'boolean', description: 'Inclure les sous-dossiers', required: false, default: false },
        { name: 'includeHidden', type: 'boolean', description: 'Inclure les fichiers cachés', required: false, default: false },
        { name: 'maxDepth', type: 'number', description: 'Profondeur max pour récursif', required: false, default: 3 },
      ],
      permissions: ['files'],
      examples: [
        { title: 'Lister le Bureau', description: 'Afficher les fichiers sur le Bureau', parameters: { path: '~/Desktop' } },
        { title: 'Lister récursivement', description: 'Voir toute l\'arborescence', parameters: { path: '~/Documents', recursive: true, maxDepth: 2 } },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'search_files',
      category: 'files',
      description: 'Rechercher des fichiers par nom ou contenu',
      icon: '🔍',
      parameters: [
        { name: 'path', type: 'string', description: 'Dossier de recherche', required: true },
        { name: 'pattern', type: 'string', description: 'Pattern de recherche (glob ou regex)', required: true },
        { name: 'type', type: 'string', description: 'Type de recherche', required: false, default: 'glob', enum: ['glob', 'regex', 'contains'] },
        { name: 'searchContent', type: 'boolean', description: 'Rechercher dans le contenu', required: false, default: false },
        { name: 'caseSensitive', type: 'boolean', description: 'Sensible à la casse', required: false, default: false },
        { name: 'maxResults', type: 'number', description: 'Nombre max de résultats', required: false, default: 100 },
      ],
      permissions: ['files'],
      examples: [
        { title: 'Trouver les PDF', description: 'Rechercher tous les PDF', parameters: { path: '~/Documents', pattern: '*.pdf' } },
        { title: 'Rechercher dans le contenu', description: 'Trouver un texte', parameters: { path: '~/Code', pattern: 'TODO:', searchContent: true } },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'get_file_info',
      category: 'files',
      description: 'Obtenir les informations d\'un fichier',
      icon: 'ℹ️',
      parameters: [
        { name: 'path', type: 'string', description: 'Chemin du fichier', required: true },
      ],
      permissions: ['files'],
      examples: [
        { title: 'Info fichier', description: 'Voir taille, date, permissions', parameters: { path: '~/Documents/rapport.pdf' } },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'move_file',
      category: 'files',
      description: 'Déplacer ou renommer un fichier',
      icon: '📦',
      parameters: [
        { name: 'source', type: 'string', description: 'Chemin source', required: true },
        { name: 'destination', type: 'string', description: 'Chemin destination', required: true },
        { name: 'overwrite', type: 'boolean', description: 'Écraser si existe', required: false, default: false },
      ],
      permissions: ['files'],
      examples: [
        { title: 'Déplacer un fichier', description: 'Déplacer vers un autre dossier', parameters: { source: '~/Downloads/doc.pdf', destination: '~/Documents/doc.pdf' } },
        { title: 'Renommer', description: 'Renommer un fichier', parameters: { source: '~/old.txt', destination: '~/new.txt' } },
      ],
      dangerous: true,
      enabled: true,
    });

    this.registerTool({
      name: 'copy_file',
      category: 'files',
      description: 'Copier un fichier',
      icon: '📋',
      parameters: [
        { name: 'source', type: 'string', description: 'Chemin source', required: true },
        { name: 'destination', type: 'string', description: 'Chemin destination', required: true },
        { name: 'overwrite', type: 'boolean', description: 'Écraser si existe', required: false, default: false },
      ],
      permissions: ['files'],
      examples: [
        { title: 'Copier un fichier', description: 'Faire une copie de sauvegarde', parameters: { source: '~/config.json', destination: '~/config.backup.json' } },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'delete_file',
      category: 'files',
      description: 'Supprimer un fichier ou dossier',
      icon: '🗑️',
      parameters: [
        { name: 'path', type: 'string', description: 'Chemin à supprimer', required: true },
        { name: 'recursive', type: 'boolean', description: 'Supprimer récursivement (pour dossiers)', required: false, default: false },
        { name: 'moveToTrash', type: 'boolean', description: 'Déplacer vers la corbeille au lieu de supprimer', required: false, default: true },
      ],
      permissions: ['files'],
      examples: [
        { title: 'Mettre à la corbeille', description: 'Supprimer un fichier (corbeille)', parameters: { path: '~/temp.txt' } },
        { title: 'Supprimer définitivement', description: 'Suppression permanente', parameters: { path: '~/temp.txt', moveToTrash: false } },
      ],
      dangerous: true,
      requiresConfirmation: true,
      enabled: true,
    });

    this.registerTool({
      name: 'create_directory',
      category: 'files',
      description: 'Créer un nouveau dossier',
      icon: '📁',
      parameters: [
        { name: 'path', type: 'string', description: 'Chemin du dossier à créer', required: true },
        { name: 'recursive', type: 'boolean', description: 'Créer les dossiers parents', required: false, default: true },
      ],
      permissions: ['files'],
      examples: [
        { title: 'Créer un dossier', description: 'Nouveau dossier projet', parameters: { path: '~/Documents/MonProjet' } },
      ],
      enabled: true,
    });
  }

  // ============================================================================
  // APPS TOOLS
  // ============================================================================

  private registerAppsTools(): void {
    this.registerTool({
      name: 'open_app',
      category: 'apps',
      description: 'Ouvrir une application',
      icon: '▶️',
      parameters: [
        { name: 'name', type: 'string', description: 'Nom de l\'application', required: true },
        { name: 'args', type: 'array', description: 'Arguments de lancement', required: false },
        { name: 'background', type: 'boolean', description: 'Ouvrir en arrière-plan', required: false, default: false },
      ],
      permissions: ['accessibility'],
      examples: [
        { title: 'Ouvrir Safari', description: 'Lancer Safari', parameters: { name: 'Safari' } },
        { title: 'Ouvrir Finder', description: 'Lancer le Finder', parameters: { name: 'Finder' } },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'quit_app',
      category: 'apps',
      description: 'Fermer une application',
      icon: '⏹️',
      parameters: [
        { name: 'name', type: 'string', description: 'Nom de l\'application', required: true },
        { name: 'saveChanges', type: 'boolean', description: 'Sauvegarder les modifications', required: false, default: true },
      ],
      permissions: ['accessibility'],
      examples: [
        { title: 'Fermer Safari', description: 'Quitter Safari proprement', parameters: { name: 'Safari' } },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'force_quit_app',
      category: 'apps',
      description: 'Forcer la fermeture d\'une application',
      icon: '❌',
      parameters: [
        { name: 'name', type: 'string', description: 'Nom de l\'application', required: true },
      ],
      permissions: ['accessibility'],
      examples: [
        { title: 'Forcer fermeture', description: 'Forcer la fermeture d\'une app bloquée', parameters: { name: 'Safari' } },
      ],
      dangerous: true,
      requiresConfirmation: true,
      enabled: true,
    });

    this.registerTool({
      name: 'list_running_apps',
      category: 'apps',
      description: 'Lister les applications en cours d\'exécution',
      icon: '📋',
      parameters: [
        { name: 'includeBackground', type: 'boolean', description: 'Inclure les apps en arrière-plan', required: false, default: false },
      ],
      permissions: ['accessibility'],
      examples: [
        { title: 'Apps actives', description: 'Voir les apps en cours', parameters: {} },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'get_frontmost_app',
      category: 'apps',
      description: 'Obtenir l\'application au premier plan',
      icon: '🔝',
      parameters: [],
      permissions: ['accessibility'],
      examples: [
        { title: 'App active', description: 'Quelle app est au premier plan', parameters: {} },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'activate_app',
      category: 'apps',
      description: 'Mettre une application au premier plan',
      icon: '⬆️',
      parameters: [
        { name: 'name', type: 'string', description: 'Nom de l\'application', required: true },
      ],
      permissions: ['accessibility'],
      examples: [
        { title: 'Activer Finder', description: 'Mettre Finder au premier plan', parameters: { name: 'Finder' } },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'hide_app',
      category: 'apps',
      description: 'Masquer une application',
      icon: '👁️‍🗨️',
      parameters: [
        { name: 'name', type: 'string', description: 'Nom de l\'application', required: true },
      ],
      permissions: ['accessibility'],
      examples: [
        { title: 'Masquer Safari', description: 'Cacher Safari', parameters: { name: 'Safari' } },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'list_installed_apps',
      category: 'apps',
      description: 'Lister les applications installées',
      icon: '📦',
      parameters: [
        { name: 'searchPath', type: 'string', description: 'Dossier de recherche', required: false, default: '/Applications' },
      ],
      permissions: ['files'],
      examples: [
        { title: 'Apps installées', description: 'Voir toutes les apps', parameters: {} },
      ],
      enabled: true,
    });
  }

  // ============================================================================
  // CLIPBOARD TOOLS
  // ============================================================================

  private registerClipboardTools(): void {
    this.registerTool({
      name: 'read_clipboard',
      category: 'clipboard',
      description: 'Lire le contenu du presse-papiers',
      icon: '📋',
      parameters: [
        { name: 'format', type: 'string', description: 'Format à lire', required: false, default: 'text', enum: ['text', 'html', 'image', 'files', 'all'] },
      ],
      permissions: [],
      examples: [
        { title: 'Lire le texte', description: 'Obtenir le texte copié', parameters: {} },
        { title: 'Lire une image', description: 'Obtenir l\'image copiée', parameters: { format: 'image' } },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'write_clipboard',
      category: 'clipboard',
      description: 'Écrire dans le presse-papiers',
      icon: '✏️',
      parameters: [
        { name: 'content', type: 'string', description: 'Contenu à copier', required: true },
        { name: 'format', type: 'string', description: 'Format du contenu', required: false, default: 'text', enum: ['text', 'html'] },
      ],
      permissions: [],
      examples: [
        { title: 'Copier du texte', description: 'Mettre du texte dans le presse-papiers', parameters: { content: 'Texte copié' } },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'clear_clipboard',
      category: 'clipboard',
      description: 'Vider le presse-papiers',
      icon: '🗑️',
      parameters: [],
      permissions: [],
      examples: [
        { title: 'Vider', description: 'Effacer le presse-papiers', parameters: {} },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'get_clipboard_types',
      category: 'clipboard',
      description: 'Obtenir les types de données disponibles',
      icon: 'ℹ️',
      parameters: [],
      permissions: [],
      examples: [
        { title: 'Types disponibles', description: 'Voir ce qui est dans le presse-papiers', parameters: {} },
      ],
      enabled: true,
    });
  }

  // ============================================================================
  // NOTIFICATION TOOLS
  // ============================================================================

  private registerNotificationTools(): void {
    this.registerTool({
      name: 'send_notification',
      category: 'notifications',
      description: 'Envoyer une notification système',
      icon: '🔔',
      parameters: [
        { name: 'title', type: 'string', description: 'Titre de la notification', required: true },
        { name: 'message', type: 'string', description: 'Contenu du message', required: true },
        { name: 'subtitle', type: 'string', description: 'Sous-titre', required: false },
        { name: 'sound', type: 'boolean', description: 'Jouer un son', required: false, default: true },
      ],
      permissions: ['notifications'],
      examples: [
        { title: 'Notification simple', description: 'Afficher une notification', parameters: { title: 'BlackIA', message: 'Tâche terminée !' } },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'send_notification_with_actions',
      category: 'notifications',
      description: 'Notification avec boutons d\'action',
      icon: '🔔',
      parameters: [
        { name: 'title', type: 'string', description: 'Titre', required: true },
        { name: 'message', type: 'string', description: 'Message', required: true },
        { name: 'actions', type: 'array', description: 'Boutons d\'action', required: true },
      ],
      permissions: ['notifications'],
      examples: [
        { title: 'Avec actions', description: 'Notification interactive', parameters: { title: 'Rappel', message: 'Réunion dans 5 min', actions: ['Reporter', 'OK'] } },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'schedule_notification',
      category: 'notifications',
      description: 'Programmer une notification',
      icon: '⏰',
      parameters: [
        { name: 'title', type: 'string', description: 'Titre', required: true },
        { name: 'message', type: 'string', description: 'Message', required: true },
        { name: 'delay', type: 'number', description: 'Délai en secondes', required: true, min: 1 },
      ],
      permissions: ['notifications'],
      examples: [
        { title: 'Rappel dans 1h', description: 'Programmer un rappel', parameters: { title: 'Rappel', message: 'Pause !', delay: 3600 } },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'clear_notifications',
      category: 'notifications',
      description: 'Effacer les notifications de l\'app',
      icon: '🗑️',
      parameters: [],
      permissions: ['notifications'],
      examples: [
        { title: 'Effacer', description: 'Supprimer les notifications', parameters: {} },
      ],
      enabled: true,
    });
  }

  // ============================================================================
  // TERMINAL TOOLS
  // ============================================================================

  private registerTerminalTools(): void {
    this.registerTool({
      name: 'run_shell_command',
      category: 'terminal',
      description: 'Exécuter une commande shell',
      icon: '⚡',
      parameters: [
        { name: 'command', type: 'string', description: 'Commande à exécuter', required: true },
        { name: 'cwd', type: 'string', description: 'Répertoire de travail', required: false },
        { name: 'timeout', type: 'number', description: 'Timeout en ms', required: false, default: 30000 },
        { name: 'shell', type: 'string', description: 'Shell à utiliser', required: false, default: '/bin/zsh', enum: ['/bin/zsh', '/bin/bash', '/bin/sh'] },
      ],
      permissions: ['files'],
      examples: [
        { title: 'Lister fichiers', description: 'ls -la', parameters: { command: 'ls -la' } },
        { title: 'Git status', description: 'Voir le statut git', parameters: { command: 'git status', cwd: '~/Code/MonProjet' } },
      ],
      dangerous: true,
      requiresConfirmation: true,
      timeout: 60000,
      enabled: true,
    });

    this.registerTool({
      name: 'run_applescript',
      category: 'terminal',
      description: 'Exécuter un script AppleScript',
      icon: '🍎',
      parameters: [
        { name: 'script', type: 'string', description: 'Code AppleScript', required: true },
      ],
      permissions: ['automation', 'accessibility'],
      examples: [
        { title: 'Dialog', description: 'Afficher une boîte de dialogue', parameters: { script: 'display dialog "Hello from BlackIA!"' } },
        { title: 'Ouvrir URL', description: 'Ouvrir dans Safari', parameters: { script: 'tell application "Safari" to open location "https://example.com"' } },
      ],
      dangerous: true,
      requiresConfirmation: true,
      enabled: true,
    });

    this.registerTool({
      name: 'run_javascript_automation',
      category: 'terminal',
      description: 'Exécuter un script JXA (JavaScript for Automation)',
      icon: '📜',
      parameters: [
        { name: 'script', type: 'string', description: 'Code JavaScript', required: true },
      ],
      permissions: ['automation', 'accessibility'],
      examples: [
        { title: 'Alert', description: 'Afficher une alerte', parameters: { script: 'const app = Application.currentApplication(); app.includeStandardAdditions = true; app.displayAlert("Hello!");' } },
      ],
      dangerous: true,
      requiresConfirmation: true,
      enabled: true,
    });

    this.registerTool({
      name: 'get_environment_variable',
      category: 'terminal',
      description: 'Lire une variable d\'environnement',
      icon: '📋',
      parameters: [
        { name: 'name', type: 'string', description: 'Nom de la variable', required: true },
      ],
      permissions: [],
      examples: [
        { title: 'Lire PATH', description: 'Obtenir le PATH', parameters: { name: 'PATH' } },
        { title: 'Lire HOME', description: 'Obtenir le HOME', parameters: { name: 'HOME' } },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'run_shortcut',
      category: 'terminal',
      description: 'Exécuter un Raccourci macOS (Shortcuts)',
      icon: '⌨️',
      parameters: [
        { name: 'name', type: 'string', description: 'Nom du raccourci', required: true },
        { name: 'input', type: 'string', description: 'Entrée optionnelle', required: false },
      ],
      permissions: ['automation'],
      examples: [
        { title: 'Mon Raccourci', description: 'Exécuter un raccourci', parameters: { name: 'Mon Raccourci' } },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'open_terminal',
      category: 'terminal',
      description: 'Ouvrir Terminal avec une commande',
      icon: '🖥️',
      parameters: [
        { name: 'command', type: 'string', description: 'Commande à exécuter', required: false },
        { name: 'cwd', type: 'string', description: 'Répertoire de travail', required: false },
        { name: 'app', type: 'string', description: 'Application terminal', required: false, default: 'Terminal', enum: ['Terminal', 'iTerm', 'Warp'] },
      ],
      permissions: ['accessibility'],
      examples: [
        { title: 'Ouvrir Terminal', description: 'Nouveau terminal', parameters: {} },
        { title: 'Terminal dans dossier', description: 'Ouvrir dans un dossier', parameters: { cwd: '~/Code' } },
      ],
      enabled: true,
    });
  }

  // ============================================================================
  // SYSTEM TOOLS
  // ============================================================================

  private registerSystemTools(): void {
    this.registerTool({
      name: 'get_system_info',
      category: 'system',
      description: 'Obtenir les informations système',
      icon: 'ℹ️',
      parameters: [],
      permissions: [],
      examples: [
        { title: 'Info système', description: 'OS, version, hostname, etc.', parameters: {} },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'get_cpu_usage',
      category: 'system',
      description: 'Obtenir l\'utilisation CPU',
      icon: '🔲',
      parameters: [
        { name: 'perCore', type: 'boolean', description: 'Détail par cœur', required: false, default: false },
      ],
      permissions: [],
      examples: [
        { title: 'Usage CPU', description: 'Voir l\'utilisation CPU', parameters: {} },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'get_memory_usage',
      category: 'system',
      description: 'Obtenir l\'utilisation mémoire',
      icon: '🧠',
      parameters: [],
      permissions: [],
      examples: [
        { title: 'Usage RAM', description: 'Voir l\'utilisation mémoire', parameters: {} },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'get_disk_usage',
      category: 'system',
      description: 'Obtenir l\'utilisation disque',
      icon: '💾',
      parameters: [
        { name: 'path', type: 'string', description: 'Chemin du volume', required: false, default: '/' },
      ],
      permissions: [],
      examples: [
        { title: 'Espace disque', description: 'Voir l\'espace disponible', parameters: {} },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'get_battery_status',
      category: 'system',
      description: 'Obtenir l\'état de la batterie',
      icon: '🔋',
      parameters: [],
      permissions: [],
      examples: [
        { title: 'Batterie', description: 'Niveau et état de charge', parameters: {} },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'get_network_info',
      category: 'system',
      description: 'Obtenir les informations réseau',
      icon: '🌐',
      parameters: [],
      permissions: [],
      examples: [
        { title: 'Info réseau', description: 'IP, interfaces, etc.', parameters: {} },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'get_wifi_info',
      category: 'system',
      description: 'Obtenir les informations WiFi',
      icon: '📶',
      parameters: [],
      permissions: [],
      examples: [
        { title: 'Info WiFi', description: 'SSID, signal, etc.', parameters: {} },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'get_bluetooth_devices',
      category: 'system',
      description: 'Lister les appareils Bluetooth',
      icon: '📡',
      parameters: [
        { name: 'connectedOnly', type: 'boolean', description: 'Uniquement les appareils connectés', required: false, default: false },
      ],
      permissions: ['bluetooth'],
      examples: [
        { title: 'Appareils BT', description: 'Voir les appareils Bluetooth', parameters: {} },
      ],
      enabled: true,
    });
  }

  // ============================================================================
  // CAPTURE TOOLS
  // ============================================================================

  private registerCaptureTools(): void {
    this.registerTool({
      name: 'take_screenshot',
      category: 'capture',
      description: 'Prendre une capture d\'écran complète',
      icon: '📸',
      parameters: [
        { name: 'path', type: 'string', description: 'Chemin de sauvegarde', required: false },
        { name: 'format', type: 'string', description: 'Format de l\'image', required: false, default: 'png', enum: ['png', 'jpg', 'tiff', 'pdf'] },
        { name: 'display', type: 'number', description: 'Numéro d\'écran (multi-écran)', required: false, default: 0 },
      ],
      permissions: ['screen_capture'],
      examples: [
        { title: 'Screenshot', description: 'Capturer l\'écran', parameters: {} },
        { title: 'Sauvegarder', description: 'Capturer et sauvegarder', parameters: { path: '~/Desktop/capture.png' } },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'take_screenshot_area',
      category: 'capture',
      description: 'Capturer une zone de l\'écran',
      icon: '✂️',
      parameters: [
        { name: 'x', type: 'number', description: 'Position X', required: true },
        { name: 'y', type: 'number', description: 'Position Y', required: true },
        { name: 'width', type: 'number', description: 'Largeur', required: true },
        { name: 'height', type: 'number', description: 'Hauteur', required: true },
        { name: 'path', type: 'string', description: 'Chemin de sauvegarde', required: false },
        { name: 'format', type: 'string', description: 'Format', required: false, default: 'png', enum: ['png', 'jpg', 'tiff'] },
      ],
      permissions: ['screen_capture'],
      examples: [
        { title: 'Zone spécifique', description: 'Capturer une zone', parameters: { x: 0, y: 0, width: 500, height: 500 } },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'take_screenshot_window',
      category: 'capture',
      description: 'Capturer une fenêtre spécifique',
      icon: '🪟',
      parameters: [
        { name: 'windowName', type: 'string', description: 'Nom de la fenêtre (optionnel, interactive sinon)', required: false },
        { name: 'path', type: 'string', description: 'Chemin de sauvegarde', required: false },
        { name: 'includeShadow', type: 'boolean', description: 'Inclure l\'ombre', required: false, default: true },
      ],
      permissions: ['screen_capture'],
      examples: [
        { title: 'Fenêtre interactive', description: 'Sélectionner une fenêtre', parameters: {} },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'start_screen_recording',
      category: 'capture',
      description: 'Démarrer un enregistrement d\'écran',
      icon: '🔴',
      parameters: [
        { name: 'path', type: 'string', description: 'Chemin de sauvegarde', required: true },
        { name: 'audio', type: 'boolean', description: 'Enregistrer l\'audio', required: false, default: false },
        { name: 'microphone', type: 'boolean', description: 'Inclure le microphone', required: false, default: false },
        { name: 'display', type: 'number', description: 'Numéro d\'écran', required: false, default: 0 },
      ],
      permissions: ['screen_capture', 'microphone'],
      examples: [
        { title: 'Enregistrer', description: 'Démarrer l\'enregistrement', parameters: { path: '~/Desktop/recording.mov' } },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'stop_screen_recording',
      category: 'capture',
      description: 'Arrêter l\'enregistrement d\'écran',
      icon: '⏹️',
      parameters: [],
      permissions: ['screen_capture'],
      examples: [
        { title: 'Arrêter', description: 'Stopper l\'enregistrement', parameters: {} },
      ],
      enabled: true,
    });
  }

  // ============================================================================
  // CONTROLS TOOLS
  // ============================================================================

  private registerControlsTools(): void {
    this.registerTool({
      name: 'get_volume',
      category: 'controls',
      description: 'Obtenir le niveau de volume',
      icon: '🔊',
      parameters: [],
      permissions: [],
      examples: [
        { title: 'Volume actuel', description: 'Voir le volume', parameters: {} },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'set_volume',
      category: 'controls',
      description: 'Définir le niveau de volume',
      icon: '🔊',
      parameters: [
        { name: 'level', type: 'number', description: 'Niveau (0-100)', required: true, min: 0, max: 100 },
      ],
      permissions: [],
      examples: [
        { title: 'Volume à 50%', description: 'Mettre le volume à 50', parameters: { level: 50 } },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'mute_volume',
      category: 'controls',
      description: 'Couper/réactiver le son',
      icon: '🔇',
      parameters: [
        { name: 'mute', type: 'boolean', description: 'Couper le son', required: false },
      ],
      permissions: [],
      examples: [
        { title: 'Muter', description: 'Couper le son', parameters: { mute: true } },
        { title: 'Toggle', description: 'Basculer le mute', parameters: {} },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'get_brightness',
      category: 'controls',
      description: 'Obtenir la luminosité de l\'écran',
      icon: '☀️',
      parameters: [],
      permissions: [],
      examples: [
        { title: 'Luminosité', description: 'Voir la luminosité', parameters: {} },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'set_brightness',
      category: 'controls',
      description: 'Définir la luminosité de l\'écran',
      icon: '☀️',
      parameters: [
        { name: 'level', type: 'number', description: 'Niveau (0-100)', required: true, min: 0, max: 100 },
      ],
      permissions: [],
      examples: [
        { title: 'Luminosité 80%', description: 'Mettre à 80%', parameters: { level: 80 } },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'get_dark_mode',
      category: 'controls',
      description: 'Vérifier si le mode sombre est activé',
      icon: '🌙',
      parameters: [],
      permissions: [],
      examples: [
        { title: 'Mode sombre?', description: 'Vérifier le mode', parameters: {} },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'toggle_dark_mode',
      category: 'controls',
      description: 'Basculer le mode sombre',
      icon: '🌙',
      parameters: [
        { name: 'enable', type: 'boolean', description: 'Activer le mode sombre', required: false },
      ],
      permissions: [],
      examples: [
        { title: 'Toggle', description: 'Basculer le mode', parameters: {} },
        { title: 'Activer', description: 'Activer le mode sombre', parameters: { enable: true } },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'lock_screen',
      category: 'controls',
      description: 'Verrouiller l\'écran',
      icon: '🔒',
      parameters: [],
      permissions: [],
      examples: [
        { title: 'Verrouiller', description: 'Verrouiller l\'écran', parameters: {} },
      ],
      enabled: true,
    });
  }

  // ============================================================================
  // NETWORK TOOLS
  // ============================================================================

  private registerNetworkTools(): void {
    this.registerTool({
      name: 'ping_host',
      category: 'network',
      description: 'Ping une adresse',
      icon: '📡',
      parameters: [
        { name: 'host', type: 'string', description: 'Adresse à ping', required: true },
        { name: 'count', type: 'number', description: 'Nombre de pings', required: false, default: 4, min: 1, max: 20 },
        { name: 'timeout', type: 'number', description: 'Timeout en secondes', required: false, default: 5 },
      ],
      permissions: [],
      examples: [
        { title: 'Ping Google', description: 'Tester la connexion', parameters: { host: 'google.com' } },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'get_public_ip',
      category: 'network',
      description: 'Obtenir l\'adresse IP publique',
      icon: '🌍',
      parameters: [],
      permissions: [],
      examples: [
        { title: 'IP publique', description: 'Mon IP externe', parameters: {} },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'check_internet_connection',
      category: 'network',
      description: 'Vérifier la connexion Internet',
      icon: '🌐',
      parameters: [],
      permissions: [],
      examples: [
        { title: 'Test connexion', description: 'Internet disponible?', parameters: {} },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'get_active_connections',
      category: 'network',
      description: 'Lister les connexions réseau actives',
      icon: '📊',
      parameters: [
        { name: 'type', type: 'string', description: 'Type de connexion', required: false, default: 'all', enum: ['all', 'tcp', 'udp'] },
      ],
      permissions: [],
      examples: [
        { title: 'Connexions', description: 'Voir les connexions actives', parameters: {} },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'wake_on_lan',
      category: 'network',
      description: 'Réveiller un appareil via Wake-on-LAN',
      icon: '⏰',
      parameters: [
        { name: 'macAddress', type: 'string', description: 'Adresse MAC', required: true, pattern: '^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$' },
        { name: 'broadcast', type: 'string', description: 'Adresse de broadcast', required: false, default: '255.255.255.255' },
      ],
      permissions: [],
      examples: [
        { title: 'Réveiller PC', description: 'WoL sur un PC', parameters: { macAddress: 'AA:BB:CC:DD:EE:FF' } },
      ],
      enabled: true,
    });
  }

  // ============================================================================
  // CALENDAR TOOLS
  // ============================================================================

  private registerCalendarTools(): void {
    this.registerTool({
      name: 'list_calendars',
      category: 'calendar',
      description: 'Lister les calendriers disponibles',
      icon: '📅',
      parameters: [],
      permissions: ['calendar'],
      examples: [
        { title: 'Mes calendriers', description: 'Voir tous les calendriers', parameters: {} },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'get_events',
      category: 'calendar',
      description: 'Obtenir les événements d\'une période',
      icon: '📆',
      parameters: [
        { name: 'calendar', type: 'string', description: 'Nom du calendrier (optionnel, tous si vide)', required: false },
        { name: 'startDate', type: 'string', description: 'Date de début (ISO)', required: false },
        { name: 'endDate', type: 'string', description: 'Date de fin (ISO)', required: false },
        { name: 'limit', type: 'number', description: 'Nombre max d\'événements', required: false, default: 50 },
      ],
      permissions: ['calendar'],
      examples: [
        { title: 'Événements du jour', description: 'Voir les événements aujourd\'hui', parameters: {} },
        { title: 'Cette semaine', description: 'Événements de la semaine', parameters: { startDate: '2024-01-01', endDate: '2024-01-07' } },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'create_event',
      category: 'calendar',
      description: 'Créer un événement dans le calendrier',
      icon: '➕',
      parameters: [
        { name: 'calendar', type: 'string', description: 'Nom du calendrier', required: true },
        { name: 'title', type: 'string', description: 'Titre de l\'événement', required: true },
        { name: 'startDate', type: 'string', description: 'Date de début (ISO)', required: true },
        { name: 'endDate', type: 'string', description: 'Date de fin (ISO)', required: true },
        { name: 'location', type: 'string', description: 'Lieu', required: false },
        { name: 'notes', type: 'string', description: 'Notes', required: false },
        { name: 'allDay', type: 'boolean', description: 'Événement sur toute la journée', required: false, default: false },
      ],
      permissions: ['calendar'],
      examples: [
        { title: 'Nouveau RDV', description: 'Créer un rendez-vous', parameters: { calendar: 'Travail', title: 'Réunion', startDate: '2024-01-15T10:00:00', endDate: '2024-01-15T11:00:00' } },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'list_reminders',
      category: 'calendar',
      description: 'Lister les rappels',
      icon: '⏰',
      parameters: [
        { name: 'list', type: 'string', description: 'Nom de la liste (optionnel)', required: false },
        { name: 'completed', type: 'boolean', description: 'Inclure les rappels complétés', required: false, default: false },
      ],
      permissions: ['reminders'],
      examples: [
        { title: 'Mes rappels', description: 'Voir les rappels en cours', parameters: {} },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'create_reminder',
      category: 'calendar',
      description: 'Créer un rappel',
      icon: '➕',
      parameters: [
        { name: 'list', type: 'string', description: 'Nom de la liste', required: true },
        { name: 'title', type: 'string', description: 'Titre du rappel', required: true },
        { name: 'dueDate', type: 'string', description: 'Date d\'échéance (ISO)', required: false },
        { name: 'notes', type: 'string', description: 'Notes', required: false },
        { name: 'priority', type: 'number', description: 'Priorité (1-3)', required: false, min: 1, max: 3 },
      ],
      permissions: ['reminders'],
      examples: [
        { title: 'Nouveau rappel', description: 'Créer un rappel', parameters: { list: 'Rappels', title: 'Appeler Jean' } },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'complete_reminder',
      category: 'calendar',
      description: 'Marquer un rappel comme complété',
      icon: '✅',
      parameters: [
        { name: 'id', type: 'string', description: 'ID du rappel', required: true },
      ],
      permissions: ['reminders'],
      examples: [
        { title: 'Compléter', description: 'Marquer comme fait', parameters: { id: 'reminder-123' } },
      ],
      enabled: true,
    });
  }

  // ============================================================================
  // CONTACTS TOOLS
  // ============================================================================

  private registerContactsTools(): void {
    this.registerTool({
      name: 'search_contacts',
      category: 'contacts',
      description: 'Rechercher des contacts',
      icon: '🔍',
      parameters: [
        { name: 'query', type: 'string', description: 'Terme de recherche', required: true },
        { name: 'limit', type: 'number', description: 'Nombre max de résultats', required: false, default: 20 },
      ],
      permissions: ['contacts'],
      examples: [
        { title: 'Chercher Jean', description: 'Trouver un contact', parameters: { query: 'Jean' } },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'get_contact',
      category: 'contacts',
      description: 'Obtenir les détails d\'un contact',
      icon: '👤',
      parameters: [
        { name: 'id', type: 'string', description: 'ID du contact', required: true },
      ],
      permissions: ['contacts'],
      examples: [
        { title: 'Détails', description: 'Voir un contact', parameters: { id: 'contact-123' } },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'create_contact',
      category: 'contacts',
      description: 'Créer un nouveau contact',
      icon: '➕',
      parameters: [
        { name: 'firstName', type: 'string', description: 'Prénom', required: true },
        { name: 'lastName', type: 'string', description: 'Nom', required: false },
        { name: 'email', type: 'string', description: 'Email', required: false },
        { name: 'phone', type: 'string', description: 'Téléphone', required: false },
        { name: 'company', type: 'string', description: 'Entreprise', required: false },
        { name: 'notes', type: 'string', description: 'Notes', required: false },
      ],
      permissions: ['contacts'],
      examples: [
        { title: 'Nouveau contact', description: 'Ajouter un contact', parameters: { firstName: 'Jean', lastName: 'Dupont', email: 'jean@example.com' } },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'get_contact_groups',
      category: 'contacts',
      description: 'Lister les groupes de contacts',
      icon: '👥',
      parameters: [],
      permissions: ['contacts'],
      examples: [
        { title: 'Groupes', description: 'Voir les groupes', parameters: {} },
      ],
      enabled: true,
    });
  }

  // ============================================================================
  // MULTIMEDIA TOOLS
  // ============================================================================

  private registerMultimediaTools(): void {
    this.registerTool({
      name: 'play_sound',
      category: 'multimedia',
      description: 'Jouer un son système',
      icon: '🔊',
      parameters: [
        { name: 'sound', type: 'string', description: 'Nom du son ou chemin', required: true },
        { name: 'volume', type: 'number', description: 'Volume (0-100)', required: false, default: 100, min: 0, max: 100 },
      ],
      permissions: [],
      examples: [
        { title: 'Son système', description: 'Jouer Basso', parameters: { sound: 'Basso' } },
        { title: 'Fichier audio', description: 'Jouer un fichier', parameters: { sound: '~/Music/ding.mp3' } },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'speak_text',
      category: 'multimedia',
      description: 'Lire du texte à voix haute (synthèse vocale)',
      icon: '🗣️',
      parameters: [
        { name: 'text', type: 'string', description: 'Texte à lire', required: true },
        { name: 'voice', type: 'string', description: 'Voix à utiliser', required: false },
        { name: 'rate', type: 'number', description: 'Vitesse (100-300)', required: false, default: 175, min: 100, max: 300 },
      ],
      permissions: [],
      examples: [
        { title: 'Lire texte', description: 'Synthèse vocale', parameters: { text: 'Bonjour, je suis BlackIA' } },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'get_now_playing',
      category: 'multimedia',
      description: 'Obtenir le média en cours de lecture',
      icon: '🎵',
      parameters: [],
      permissions: [],
      examples: [
        { title: 'En cours', description: 'Quel média joue?', parameters: {} },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'media_play_pause',
      category: 'multimedia',
      description: 'Lecture/Pause du média',
      icon: '⏯️',
      parameters: [],
      permissions: [],
      examples: [
        { title: 'Play/Pause', description: 'Basculer lecture', parameters: {} },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'media_next',
      category: 'multimedia',
      description: 'Piste suivante',
      icon: '⏭️',
      parameters: [],
      permissions: [],
      examples: [
        { title: 'Suivant', description: 'Piste suivante', parameters: {} },
      ],
      enabled: true,
    });

    this.registerTool({
      name: 'media_previous',
      category: 'multimedia',
      description: 'Piste précédente',
      icon: '⏮️',
      parameters: [],
      permissions: [],
      examples: [
        { title: 'Précédent', description: 'Piste précédente', parameters: {} },
      ],
      enabled: true,
    });
  }
}

// Export singleton instance
export const mcpToolsRegistry = new MCPToolsRegistry();

// Export class for testing
export { MCPToolsRegistry };

/**
 * Utility functions for handling model aliases
 */

/**
 * Get the display name for a model
 * Returns the alias if available, otherwise returns the original model name
 */
export function getModelDisplayName(
  modelName: string,
  modelAliases: Record<string, string>
): string {
  return modelAliases[modelName] || modelName;
}

/**
 * Format model display with optional technical name
 * Returns "Alias (technical-name)" if alias exists, otherwise just the name
 */
export function formatModelDisplay(
  modelName: string,
  modelAliases: Record<string, string>,
  showTechnicalName: boolean = false
): string {
  const alias = modelAliases[modelName];
  if (alias && showTechnicalName) {
    return `${alias} (${modelName})`;
  }
  return alias || modelName;
}

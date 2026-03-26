export interface AppConfig {
  global: {
    downloadDir: string
    namingSchema: string
    pinnedSites: string[] // Stores the order of plugins
  }
  sites: Record<string, unknown> // Stores credentials per site ID
}

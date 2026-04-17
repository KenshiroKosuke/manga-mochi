export interface AppConfig {
  global: {
    downloadDir: string
    namingSchema: string
    pinnedSites: string[] // Stores the order of plugins
    /**
     * If true, do not warn user when directory already exists
     */
    downloadForceWhenDirExisted?: boolean
  }
  sites: { [siteId: string]: unknown } // Stores configs per site ID
}

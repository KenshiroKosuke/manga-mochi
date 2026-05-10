import { useState } from 'react'
import ConfigPopup from './ConfigPopup'
import { AppConfig } from 'src/types/appConfig'
import { MangaPlugin } from 'src/types/plugin'

interface ConfigsTabProps {
  config: AppConfig
  plugins: MangaPlugin[]
  onConfigUpdate: (newConfig: AppConfig) => void
}

export default function ConfigsTab({
  config,
  plugins,
  onConfigUpdate
}: ConfigsTabProps): React.JSX.Element {
  const [searchTerm, setSearchTerm] = useState('')
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null)

  // Toggle Pin Logic
  const togglePin = (siteId: string): void => {
    let newPinned = [...(config.global.pinnedSites || [])]
    if (newPinned.includes(siteId)) {
      newPinned = newPinned.filter((id) => id !== siteId)
    } else {
      newPinned.unshift(siteId)
    }
    onConfigUpdate({
      ...config,
      global: { ...config.global, pinnedSites: newPinned }
    })
  }

  const pinnedIds = config.global.pinnedSites || []

  const pinnedPlugins = pinnedIds
    .map((id) => plugins.find((p) => p.id === id))
    .filter((p): p is MangaPlugin => !!p)

  const unpinnedPlugins = plugins.filter((p) => !pinnedIds.includes(p.id))

  const filterFn = (p: MangaPlugin): boolean =>
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  const visiblePinned = pinnedPlugins.filter(filterFn)
  const visibleUnpinned = unpinnedPlugins.filter(filterFn)

  // --- Sub Component for Items ---
  const SiteItem = ({
    plugin,
    isPinned
  }: {
    plugin: MangaPlugin
    isPinned: boolean
  }): React.JSX.Element => (
    <div className={`site-item ${isPinned ? 'pinned' : ''}`}>
      <span className="site-name">{plugin.id}</span>
      <div className="item-actions">
        <button className="btn-config" onClick={() => setEditingSiteId(plugin.id)}>
          Config
        </button>
        <button
          className={`btn-pin ${isPinned ? 'active' : ''}`}
          onClick={() => togglePin(plugin.id)}
          title={isPinned ? 'Unpin' : 'Pin to top'}
        >
          {/* Simple Pin Icon */}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>
      </div>
    </div>
  )

  return (
    <div className="configs-tab">
      <div className="configs-tab-header">
        <button className="btn-global" onClick={() => setEditingSiteId('GLOBAL_SETTINGS')}>
          <span>⚙ Global Settings</span>
        </button>
        <input
          type="text"
          className="search-input"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="configs-tab-list">
        {visiblePinned.length > 0 && (
          <div className="list-section">
            <div className="section-label">Pinned</div>
            {visiblePinned.map((p) => (
              <SiteItem key={p.id} plugin={p} isPinned={true} />
            ))}
          </div>
        )}

        {visibleUnpinned.length > 0 && (
          <div className="list-section">
            <div className="section-label">All Sites</div>
            {visibleUnpinned.map((p) => (
              <SiteItem key={p.id} plugin={p} isPinned={false} />
            ))}
          </div>
        )}
      </div>

      {editingSiteId && (
        <ConfigPopup
          siteId={editingSiteId}
          config={config}
          plugins={plugins}
          onClose={() => setEditingSiteId(null)}
          onSave={(newConf) => {
            onConfigUpdate(newConf)
            setEditingSiteId(null)
          }}
        />
      )}
    </div>
  )
}

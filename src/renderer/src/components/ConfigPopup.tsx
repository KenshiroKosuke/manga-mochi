import { useState } from 'react'
import { AppConfig } from 'src/types/appConfig'
import { MangaPlugin } from 'src/types/plugin'

interface ConfigPopupProps {
  siteId: string
  config: AppConfig
  plugins: MangaPlugin[]
  onClose: () => void
  onSave: (newConfig: AppConfig) => void
}

export default function ConfigPopup({
  siteId,
  config,
  plugins,
  onClose,
  onSave
}: ConfigPopupProps): React.JSX.Element {
  const [localConfig, setLocalConfig] = useState<AppConfig>(JSON.parse(JSON.stringify(config)))

  const isGlobal = siteId === 'GLOBAL_SETTINGS'
  const targetPlugin = plugins.find((p) => p.id === siteId)

  const handleSiteChange = (field: string, value: string): void => {
    setLocalConfig((prev) => ({
      ...prev,
      sites: {
        ...prev.sites,
        [siteId]: {
          ...(prev.sites[siteId] || {}),
          [field]: value
        }
      }
    }))
  }

  const handleSelectDir = async (): Promise<void> => {
    const result = await window.backendAPI.selectDir()
    if (result.success) {
      const { data } = result
      if (data !== null) {
        setLocalConfig((prev) => ({
          ...prev,
          global: { ...prev.global, downloadDir: data }
        }))
      }
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {/* Header */}
        <div className="modal-header">
          <h3>{isGlobal ? 'Global Settings' : `Config: ${targetPlugin?.id}`}</h3>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {isGlobal ? (
            <>
              <div className="form-group">
                <label>Download Directory</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    readOnly
                    value={localConfig.global.downloadDir}
                    className="form-input"
                    placeholder="No directory selected"
                  />
                  <button className="btn-secondary" onClick={handleSelectDir}>
                    Browse
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Naming Schema (e.g. p00X)</label>
                <input
                  type="text"
                  value={localConfig.global.namingSchema}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      global: { ...localConfig.global, namingSchema: e.target.value }
                    })
                  }
                  className="form-input"
                />
              </div>

              <div
                className="form-group"
                style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '24px' }}
              >
                <input
                  type="checkbox"
                  id="downloadForceWhenDirExisted"
                  checked={!!localConfig.global.downloadForceWhenDirExisted}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      global: {
                        ...localConfig.global,
                        downloadForceWhenDirExisted: e.target.checked
                      }
                    })
                  }
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label
                  htmlFor="forceDownload"
                  style={{ margin: 0, cursor: 'pointer', color: 'var(--text-primary)' }}
                >
                  Always overwrite existing folders without warning
                </label>
              </div>
            </>
          ) : (
            <>
              {targetPlugin?.uiConfigFields.map((field) => (
                <div key={field.fieldName} className="form-group">
                  <label title={field.description}>{field.fieldName}</label>
                  <input
                    type={field.isSensitive ? 'password' : 'text'}
                    value={localConfig.sites[siteId]?.[field.fieldName] || ''}
                    onChange={(e) => handleSiteChange(field.fieldName, e.target.value)}
                    className="form-input"
                  />
                </div>
              ))}

              {(!targetPlugin?.uiConfigFields || targetPlugin.uiConfigFields.length === 0) && (
                <p style={{ color: '#94a3b8', textAlign: 'center' }}>No configuration needed.</p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-save" onClick={() => onSave(localConfig)}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

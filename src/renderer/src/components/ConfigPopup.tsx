import { useState, useEffect } from 'react'
import { AppConfig } from 'src/types/appConfig'
import { MangaPlugin } from 'src/types/plugin'

interface ConfigPopupProps {
  siteId: string
  config: AppConfig
  plugins: MangaPlugin[]
  onSave: (newConfig: AppConfig) => void
}

function GlobalCheckbox({
  id,
  label,
  checked,
  onChange
}: {
  id: string
  label: string
  checked: boolean
  onChange: (val: boolean) => void
}): React.JSX.Element {
  return (
    <div className="form-group checkbox-group">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <label htmlFor={id}>{label}</label>
    </div>
  )
}

export default function ConfigPopup({
  siteId,
  config,
  plugins,
  onSave
}: ConfigPopupProps): React.JSX.Element {
  const [localConfig, setLocalConfig] = useState<AppConfig>(JSON.parse(JSON.stringify(config)))
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle')

  // Keep localConfig synchronized if the parent updates the config (e.g. pinning a site)
  useEffect(() => {
    setLocalConfig(JSON.parse(JSON.stringify(config)))
  }, [config])

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

  const handleSave = (): void => {
    onSave(localConfig)
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('idle'), 2000)
  }

  const handleReset = (): void => {
    setLocalConfig(JSON.parse(JSON.stringify(config)))
  }

  return (
    <div className="config-panel" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        className="config-header"
        style={{
          marginBottom: '24px',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '16px'
        }}
      >
        <h2 style={{ margin: 0 }}>
          {isGlobal ? 'Global Settings' : `Config: ${targetPlugin?.id}`}
        </h2>
      </div>

      {/* Body */}
      <div className="config-body" style={{ flex: 1 }}>
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
                  style={{ flex: 1, minWidth: 0, width: 'auto' }}
                />
                <button
                  className="btn-secondary"
                  onClick={handleSelectDir}
                  style={{ flexShrink: 0 }}
                >
                  Browse
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Naming Schema (e.g. p_XXX ={'>'} p_023.png)</label>
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

            <GlobalCheckbox
              id="enableNotifications"
              label="Enable OS Notifications"
              // Defaults to false if undefined
              checked={localConfig.global.enableNotifications ?? false}
              onChange={(val) =>
                setLocalConfig({
                  ...localConfig,
                  global: { ...localConfig.global, enableNotifications: val }
                })
              }
            />
            <GlobalCheckbox
              id="downloadForceWhenDirExisted"
              label="Always overwrite existing folders without warning"
              checked={localConfig.global.downloadForceWhenDirExisted ?? false}
              onChange={(val) =>
                setLocalConfig({
                  ...localConfig,
                  global: { ...localConfig.global, downloadForceWhenDirExisted: val }
                })
              }
            />
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
      <div
        className="config-footer"
        style={{
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          flexWrap: 'wrap'
        }}
      >
        <button className="btn-secondary" onClick={handleReset}>
          Reset
        </button>
        <button
          className="btn-primary"
          onClick={handleSave}
          style={{
            backgroundColor: saveStatus === 'saved' ? 'var(--accent-green, #22c55e)' : undefined,
            borderColor: saveStatus === 'saved' ? 'var(--accent-green, #22c55e)' : undefined,
            transition: 'background-color 0.3s, border-color 0.3s',
            minWidth: '130px'
          }}
        >
          {saveStatus === 'saved' ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

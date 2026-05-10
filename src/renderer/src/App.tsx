import { useState, useEffect } from 'react'
import ConfigsTab from './components/ConfigsTab'
import DownloadsTab from './components/DownloadsTab'
import { AppConfig } from 'src/types/appConfig'
import { MangaPlugin } from 'src/types/plugin'
import daiChan from '../src/assets/dai-chan.svg'

type TabID = 'downloads' | 'configs' | '???'

interface TabButtonProps {
  id: TabID
  label: string
  activeTab: TabID
  onClick: (id: TabID) => void
}

function TabButton({ id, label, activeTab, onClick }: TabButtonProps): React.JSX.Element {
  return (
    <button
      className={`tab-button ${activeTab === id ? 'active' : ''}`}
      onClick={() => onClick(id)}
    >
      {label}
    </button>
  )
}

export default function App(): React.JSX.Element {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [plugins, setPlugins] = useState<MangaPlugin[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabID>('downloads')

  useEffect(() => {
    window.backendAPI.getAppData().then((result) => {
      console.log(result)
      if (result.success) {
        const { data } = result
        setConfig(data.config)
        setPlugins(data.plugins)
        setLoading(false)
      } else {
        throw result.error
      }
    })
  }, [])

  const handleConfigUpdate = async (newConfig: AppConfig): Promise<void> => {
    setConfig(newConfig)
    const result = await window.backendAPI.saveConfig(newConfig)
    if (result.success == false) {
      throw result.error
    }
  }

  if (loading || !config) return <div className="modal-overlay">Loading...</div>

  return (
    <div className="app-container">
      <nav className="tab-navigation">
        <TabButton id="downloads" label="Downloads" activeTab={activeTab} onClick={setActiveTab} />
        <TabButton id="configs" label="Configs" activeTab={activeTab} onClick={setActiveTab} />
        <TabButton id="???" label="???" activeTab={activeTab} onClick={setActiveTab} />
      </nav>

      {/**
       * Use undefined when the tab is active so that the display: flex from .tab-pane CSS class
       * takes effect naturally
       */}
      <div className="tab-content">
        <div
          className="tab-pane"
          style={{ display: activeTab === 'downloads' ? undefined : 'none' }}
        >
          <DownloadsTab config={config} plugins={plugins} />
        </div>

        <div className="tab-pane" style={{ display: activeTab === 'configs' ? undefined : 'none' }}>
          <ConfigsTab config={config} plugins={plugins} onConfigUpdate={handleConfigUpdate} />
        </div>
        <div className="tab-pane" style={{ display: activeTab === '???' ? undefined : 'none' }}>
          <div className="todo-tab" style={{ backgroundColor: 'antiquewhite' }}>
            <div
              style={{ flex: 1, flexDirection: 'row', display: 'flex', justifyContent: 'center' }}
            >
              <img src={daiChan} height={160}></img>
              <h1 style={{ fontFamily: 'cursive', color: 'black' }}> Pi...</h1>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

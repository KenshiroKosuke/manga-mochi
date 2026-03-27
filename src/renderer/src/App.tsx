// import Versions from './components/Versions'
// import electronLogo from './assets/electron.svg'

// function App(): React.JSX.Element {
//   // const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

//   return (
//     <>
//       <img alt="logo" className="logo" src={electronLogo} />
//       <div className="creator">Powered by electron-vite</div>
//       <div className="text">
//         Build an Electron app with <span className="react">React</span>
//         &nbsp;and <span className="ts">TypeScript</span>
//       </div>
//       <p className="tip">
//         Please try pressing <code>F12</code> to open the devTool
//       </p>
//       <div className="actions">
//         <div className="action">
//           <a href="https://electron-vite.org/" target="_blank" rel="noreferrer">
//             Documentation
//           </a>
//         </div>
//         <div className="action">
//           <a target="_blank" rel="noreferrer" onClick={window.backendAPI.getAppData}>
//             Send IPC
//           </a>
//         </div>
//       </div>
//       <Versions></Versions>
//     </>
//   )
// }

// export default App

import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import MainTab from './components/MainTab'
import { AppConfig } from '../../types/appConfig'

import { MangaPlugin } from 'src/types/plugin'

export default function App(): React.JSX.Element {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [plugins, setPlugins] = useState<MangaPlugin[]>([])
  const [loading, setLoading] = useState(true)

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
      <Sidebar config={config} plugins={plugins} onConfigUpdate={handleConfigUpdate} />
      <div className="main-tab">
        <MainTab config={config} plugins={plugins} />
      </div>
    </div>
  )
}

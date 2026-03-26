import { useState } from 'react'

function Versions(): React.JSX.Element {
  // Prefer explicit source: `window.versions` or `window.electron.process.versions`
  const initial = window.versions ?? { electron: '', chrome: '', node: '' }
  console.log(initial)
  const [versions] = useState(initial)

  return (
    <ul className="versions">
      <li className="electron-version">Electron v{versions.electron}</li>
      <li className="chrome-version">Chromium v{versions.chrome}</li>
      <li className="node-version">Node v{versions.node}</li>
    </ul>
  )
}

export default Versions

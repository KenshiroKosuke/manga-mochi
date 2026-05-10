import { useState } from 'react'
import { AppConfig } from 'src/types/appConfig'
import { MangaPlugin } from 'src/types/plugin'
import DownloadQueue from './DownloadQueue'

export default function DownloadsTab({
  config,
  plugins
}: {
  config: AppConfig
  plugins: MangaPlugin[]
}): React.JSX.Element {
  const [url, setUrl] = useState('')
  const [matchedPlugin, setMatchedPlugin] = useState<MangaPlugin | null>(null)
  const [status, setStatus] = useState<{
    type: 'idle' | 'loading' | 'success' | 'error'
    msg: string
  }>({
    type: 'idle',
    msg: ''
  })

  /**
   * Reset match state if user edits the URL
   */
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setUrl(e.target.value)
    setMatchedPlugin(null)
    if (status.type !== 'idle') {
      setStatus({ type: 'idle', msg: '' })
    }
  }

  /**
   * New Check Function
   */
  const handleCheck = (): void => {
    if (!url) return

    // Loop through plugins and test the URL against their regex list
    const matched = plugins.find((plugin) => {
      if (!plugin.chapterRegexList) {
        return false
      }
      return plugin.chapterRegexList.some((regex) => {
        // Note: Electron IPC usually preserves RegExp objects via Structured Clone,
        // but it's safe to wrap it just in case it arrived as a string.
        const rx = regex instanceof RegExp ? regex : new RegExp(regex)
        return rx.test(url)
      })
    })

    if (matched) {
      setMatchedPlugin(matched)
      setStatus({ type: 'success', msg: `Plugin Matched: ${matched.id}. Ready to download.` })
    } else {
      setMatchedPlugin(null)
      setStatus({ type: 'error', msg: 'Unsupported URL. No matching plugin found.' })
    }
  }

  // Fire and Forget!
  const handleStart = async (): Promise<void> => {
    if (!url) return
    setStatus({ type: 'loading', msg: 'Adding to queue...' })

    // Send it to the main process queue
    const result = await window.backendAPI.addToQueue(url)
    if (result.success) {
      // Instantly reset the UI so the user can paste another link!
      setUrl('')
      setMatchedPlugin(null)
      setStatus({ type: 'idle', msg: '' })
    } else {
      setStatus({ type: 'error', msg: `Error: ${result.error?.message || 'Unknown'}` })
    }
  }

  return (
    <>
      <div className="downloads-tab-header">
        <h1 className="downloads-tab-title">New Download</h1>
        <p className="downloads-tab-subtitle">
          Paste the URL of the chapter or series you want to download.
        </p>
      </div>

      <div className="input-group">
        <input
          type="text"
          className="url-input"
          placeholder="https://mangaone.com/..."
          value={url}
          onChange={handleUrlChange} // change not only url state but also matched plugin state
          disabled={status.type === 'loading'} // locked while loading
        />
        {/* Dynamic Button based on matched state */}
        {!matchedPlugin ? (
          <button className="btn-primary" onClick={handleCheck} disabled={!url}>
            Check URL
          </button>
        ) : (
          <button
            className="btn-primary btn-success"
            onClick={handleStart}
            disabled={status.type === 'loading'}
          >
            {status.type === 'loading' ? 'Processing...' : 'Start Download'}
          </button>
        )}
      </div>

      {status.type !== 'idle' && (
        <div className={`status-box ${status.type}`}>
          <strong>{status.type.toUpperCase()}: </strong>
          {status.msg}
        </div>
      )}

      <DownloadQueue />

      <div className="config-footer">
        <div className="footer-info">
          <div className="info-item">
            <label>Save Location</label>
            <div>{config.global.downloadDir || 'Not set'}</div>
          </div>
          <div className="info-item">
            <label>Naming Schema</label>
            <div>{config.global.namingSchema}</div>
          </div>
        </div>
      </div>
    </>
  )
}

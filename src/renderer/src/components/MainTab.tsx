import { useState } from 'react'
import { AppConfig } from 'src/types/appConfig'
import { MangaPlugin } from 'src/types/plugin'
import DownloadQueue from './DownloadQueue'

export default function MainTab({
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
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value)
    setMatchedPlugin(null)
    if (status.type !== 'idle') {
      setStatus({ type: 'idle', msg: '' })
    }
  }

  /**
   * New Check Function
   */
  const handleCheck = () => {
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

    try {
      // Send it to the main process queue
      await window.backendAPI.startDownload(url)

      // Instantly reset the UI so the user can paste another link!
      setUrl('')
      setMatchedPlugin(null)
      setStatus({ type: 'idle', msg: '' })
    } catch (error: any) {
      setStatus({ type: 'error', msg: error.message || 'Failed to add to queue' })
    }
  }

  // const handleStart = async (): Promise<void> => {
  //   if (!url) return
  //   setStatus({ type: 'loading', msg: 'Downloading...' })
  //   try {
  //     const result = await window.backendAPI.startDownload(url)
  //     console.log(JSON.stringify(result))
  //     if (result.success) {
  //       setStatus({ type: 'success', msg: result.data })
  //       // Optional: Reset URL after successful download
  //       // setUrl(''); setMatchedPlugin(null);
  //     } else {
  //       const error = result.error
  //       let code = `[${result.error.errorCode}]`
  //       if (error.errorCode === 'INVALID_CHAPTER_URL_ERROR') {
  //         setStatus({ type: 'error', msg: `${code} ${error.message}` })
  //       } else if (error.errorCode === 'NO_PAGE_ERROR') {
  //         setStatus({
  //           type: 'error',
  //           msg: `${code} ${error.message} Hint: ${error.hint}`
  //         })
  //       } else if (error.errorCode === 'INVALID_CONFIG_ERROR') {
  //         setStatus({
  //           type: 'error',
  //           msg: `${code} ${error.message}`
  //         })
  //       } else if (error.errorCode === 'EXTRACTION_FAILED_ERROR') {
  //         setStatus({
  //           type: 'error',
  //           msg: `${code} ${error.message}`
  //         })
  //       } else {
  //         setStatus({
  //           type: 'error',
  //           msg: `[UnknownError] ${JSON.stringify(error)}`
  //         })
  //       }
  //     }
  //   } catch (error: unknown) {
  //     let message = 'Error occurred'
  //     if (error instanceof Error) {
  //       message = error.message
  //     }
  //     setStatus({ type: 'error', msg: message })
  //   }
  // }

  return (
    <>
      <div className="main-header">
        <h1 className="main-title">New Download</h1>
        <p className="main-subtitle">
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
          <button
            className="btn-primary"
            onClick={handleCheck}
            disabled={!url}
            style={{ backgroundColor: !url ? '#4b5563' : undefined }}
          >
            Check URL
          </button>
        ) : (
          <button
            className="btn-primary"
            onClick={handleStart}
            disabled={status.type === 'loading'}
            style={{ backgroundColor: '#22c55e' }}
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

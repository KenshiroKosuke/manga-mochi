import { useEffect, useState } from 'react'
import React from 'react'
import { DownloadTask } from 'src/types/downloadQueue'

export default function DownloadQueue(): React.JSX.Element | null {
  const [queue, setQueue] = useState<DownloadTask[]>([])
  // const [expandedErrorId, setExpandedErrorId] = useState<string | null>(null)
  // 🌟 NEW: Track the whole task object for the popup instead of just an ID
  const [errorTask, setErrorTask] = useState<DownloadTask | null>(null)

  useEffect(() => {
    const cleanupQueue = window.backendAPI.onQueueUpdated((newQueue) => setQueue(newQueue))
    const cleanupProgress = window.backendAPI.onQueueProgress(({ id, progress }) => {
      setQueue((prev) => prev.map((t) => (t.id === id ? { ...t, progress } : t)))
    })

    return () => {
      cleanupQueue()
      cleanupProgress()
    }
  }, [])

  if (queue.length === 0) return null

  const hasActiveTasks = queue.some((t) => t.status === 'pending' || t.status === 'downloading')

  return (
    // 🌟 flex: 1 and minHeight: 0 forces it to stay within the bounds of MainTab
    <div
      style={{
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        marginTop: '32px'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px'
        }}
      >
        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Download Queue</h3>
        <button
          onClick={() => window.backendAPI.cancelAllDownloads()}
          disabled={!hasActiveTasks}
          style={{
            backgroundColor: hasActiveTasks ? 'var(--danger-red)' : 'transparent',
            color: hasActiveTasks ? 'white' : 'var(--text-secondary)',
            border: `1px solid ${hasActiveTasks ? 'transparent' : 'var(--border-color)'}`,
            padding: '4px 12px',
            borderRadius: '4px',
            fontSize: '0.8rem',
            cursor: hasActiveTasks ? 'pointer' : 'not-allowed',
            opacity: hasActiveTasks ? 1 : 0.6
          }}
        >
          Cancel All
        </button>
      </div>

      {/* 🌟 Scrollable inner container
        - overflow: 'auto' handles BOTH horizontal and vertical scroll automatically
        */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          backgroundColor: 'var(--bg-panel)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px'
        }}
      >
        {/* 🌟 The Table UI
          - table-layout: fixed and minWidth forces horizontal scrolling on small screens
          */}
        <table
          style={{
            // width: '100%',
            // borderCollapse: 'collapse',
            // textAlign: 'left',
            // fontSize: '0.85rem'
            minWidth: '840px',
            width: '100%',
            borderCollapse: 'collapse', // minimal + reduce space
            textAlign: 'left',
            fontSize: '0.85rem',
            tableLayout: 'fixed'
          }}
        >
          <thead>
            <tr>
              {/* Sticky headers with opaque backgrounds and strict widths */}
              <th
                style={{
                  width: '22%',
                  padding: '12px',
                  borderBottom: '1px solid var(--border-color)',
                  position: 'sticky',
                  top: 0,
                  background: 'var(--bg-hover)',
                  zIndex: 1
                }}
              >
                Manga
              </th>
              <th
                style={{
                  width: '22%',
                  padding: '12px',
                  borderBottom: '1px solid var(--border-color)',
                  position: 'sticky',
                  top: 0,
                  background: 'var(--bg-hover)',
                  zIndex: 1
                }}
              >
                Chapter
              </th>
              <th
                style={{
                  width: '18%',
                  padding: '12px',
                  borderBottom: '1px solid var(--border-color)',
                  position: 'sticky',
                  top: 0,
                  background: 'var(--bg-hover)',
                  zIndex: 1
                }}
              >
                URL
              </th>
              <th
                style={{
                  width: '10%',
                  padding: '12px',
                  borderBottom: '1px solid var(--border-color)',
                  position: 'sticky',
                  top: 0,
                  background: 'var(--bg-hover)',
                  zIndex: 1
                }}
              >
                Status
              </th>
              <th
                style={{
                  width: '16%',
                  padding: '12px',
                  borderBottom: '1px solid var(--border-color)',
                  position: 'sticky',
                  top: 0,
                  background: 'var(--bg-hover)',
                  zIndex: 1
                }}
              >
                Progress
              </th>
              <th
                style={{
                  width: '12%',
                  padding: '12px',
                  borderBottom: '1px solid var(--border-color)',
                  textAlign: 'right',
                  position: 'sticky',
                  top: 0,
                  background: 'var(--bg-hover)',
                  zIndex: 1
                }}
              >
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {queue.map((task) => (
              <tr key={task.id}>
                <td
                  style={{
                    padding: '12px',
                    borderBottom: '1px solid var(--border-color)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title={task.mangaTitle}
                >
                  {task.mangaTitle}
                </td>

                <td
                  style={{
                    padding: '12px',
                    borderBottom: '1px solid var(--border-color)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title={task.chapterTitle}
                >
                  {task.chapterTitle}
                </td>

                <td
                  style={{
                    padding: '12px',
                    borderBottom: '1px solid var(--border-color)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    color: 'var(--text-secondary)'
                  }}
                  title={task.url}
                >
                  {task.url}
                </td>

                {/* Status */}
                <td
                  style={{
                    padding: '12px',
                    borderBottom: '1px solid var(--border-color)',
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}
                >
                  <span
                    style={{
                      color:
                        task.status === 'failed'
                          ? '#fca5a5'
                          : task.status === 'completed'
                            ? '#86efac'
                            : task.status === 'cancelled'
                              ? '#fde047'
                              : 'var(--text-primary)'
                    }}
                  >
                    {task.status}
                  </span>
                </td>

                {/* Progress Bar */}
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        flex: 1,
                        height: '6px',
                        backgroundColor: 'var(--bg-dark)',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${task.progress}%`,
                          transition: 'width 0.3s ease',
                          backgroundColor:
                            task.status === 'failed'
                              ? 'var(--danger-red)'
                              : task.status === 'completed'
                                ? '#22c55e'
                                : task.status === 'cancelled'
                                  ? '#eab308'
                                  : 'var(--accent-blue)'
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        minWidth: '30px'
                      }}
                    >
                      {task.progress}%
                    </span>
                  </div>
                </td>

                {/* Actions */}
                <td
                  style={{
                    padding: '12px',
                    borderBottom: '1px solid var(--border-color)',
                    textAlign: 'right'
                  }}
                >
                  {(task.status === 'pending' || task.status === 'downloading') && (
                    <button
                      onClick={() => window.backendAPI.cancelDownload(task.id)}
                      style={{ color: '#fca5a5', textDecoration: 'underline' }}
                    >
                      Cancel
                    </button>
                  )}

                  {task.status === 'completed' && task.savePath && (
                    <button
                      onClick={() => window.backendAPI.openFolder(task.savePath!)}
                      style={{ color: '#86efac', textDecoration: 'underline' }}
                    >
                      Open
                    </button>
                  )}

                  {task.status === 'failed' && task.error ? (
                    <button
                      onClick={() => setErrorTask(task)}
                      style={{ color: '#fca5a5', textDecoration: 'underline' }}
                    >
                      View Error
                    </button>
                  ) : (
                    <></>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* 🌟 The Error Modal Popup */}
        {errorTask && (
          <div className="modal-overlay" onClick={() => setErrorTask(null)}>
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              style={{ width: '600px' }}
            >
              <div className="modal-header">
                <h3 style={{ margin: 0, color: '#fca5a5' }}>Download Error</h3>
                <button className="btn-close" onClick={() => setErrorTask(null)}>
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <div style={{ marginBottom: '16px', fontSize: '0.9rem' }}>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    Manga:{' '}
                    <span style={{ color: 'var(--text-primary)' }}>{errorTask.mangaTitle}</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    Chapter:{' '}
                    <span style={{ color: 'var(--text-primary)' }}>{errorTask.chapterTitle}</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    Url: <span style={{ color: 'var(--text-primary)' }}>{errorTask.url}</span>
                  </div>
                </div>

                <div
                  style={{
                    padding: '16px',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '6px',
                    color: '#fca5a5',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    overflowX: 'auto',
                    fontSize: '0.85rem'
                  }}
                >
                  {typeof errorTask.error === 'object'
                    ? JSON.stringify(errorTask.error, null, 2)
                    : String(errorTask.error)}
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setErrorTask(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

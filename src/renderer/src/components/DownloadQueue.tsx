import { useEffect, useState } from 'react'
import React from 'react'
import { DownloadTask } from 'src/types/downloadQueue'

type ColumnDef = {
  id: string
  label: string
  width: string
  align?: 'left' | 'right' | 'center'
}

const QUEUE_COLUMNS: ColumnDef[] = [
  { id: 'manga', label: 'Manga', width: '22%' },
  { id: 'chapter', label: 'Chapter', width: '22%' },
  { id: 'url', label: 'URL', width: '18%' },
  { id: 'status', label: 'Status', width: '10%' },
  { id: 'progress', label: 'Progress', width: '16%' },
  { id: 'action', label: 'Action', width: '12%', align: 'right' }
]

export default function DownloadQueue(): React.JSX.Element | null {
  const [queue, setQueue] = useState<DownloadTask[]>([])
  // Track the whole task object for the details popup
  const [selectedTask, setSelectedTask] = useState<DownloadTask | null>(null)

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
    // 🌟 flex: 1 and minHeight: 0 forces it to stay within the bounds of Downloads tab
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
        <table className="queue-table">
          <thead>
            <tr>
              {QUEUE_COLUMNS.map((col) => (
                <th key={col.id} style={{ width: col.width, textAlign: col.align || 'left' }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {queue.map((task) => (
              // Since row is clickable, the children components need stopPropagation to prevent this onClick handler
              <tr key={task.id} onClick={() => setSelectedTask(task)} className="queue-row">
                <td className="truncate" title={task.mangaTitle}>
                  {task.mangaTitle}
                </td>

                <td className="truncate" title={task.chapterTitle}>
                  {task.chapterTitle}
                </td>

                <td
                  className="truncate"
                  style={{ color: 'var(--text-secondary)' }}
                  title={task.url}
                >
                  {task.url}
                </td>

                {/* Status */}
                <td
                  style={{
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}
                >
                  <span
                    style={{
                      color:
                        task.status === 'failed'
                          ? 'var(--danger-red-light)'
                          : task.status === 'completed'
                            ? 'var(--accent-green-light)'
                            : task.status === 'cancelled'
                              ? 'var(--accent-yellow-light)'
                              : 'var(--text-primary)'
                    }}
                  >
                    {task.status}
                  </span>
                </td>

                {/* Progress Bar */}
                <td>
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
                                ? 'var(--accent-green)'
                                : task.status === 'cancelled'
                                  ? 'var(--accent-yellow)'
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
                <td style={{ textAlign: 'right' }}>
                  {(task.status === 'pending' || task.status === 'downloading') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        window.backendAPI.cancelDownload(task.id)
                      }}
                      style={{ color: 'var(--danger-red-light)', textDecoration: 'underline' }}
                    >
                      Cancel
                    </button>
                  )}

                  {task.status === 'completed' && task.savePath && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        window.backendAPI.openFolder(task.savePath!)
                      }}
                      style={{ color: 'var(--accent-green-light)', textDecoration: 'underline' }}
                    >
                      Open
                    </button>
                  )}

                  {task.status === 'failed' ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        window.backendAPI.addToQueue(task.url)
                      }}
                      style={{ color: 'var(--accent-blue)', textDecoration: 'underline' }}
                    >
                      Retry
                    </button>
                  ) : (
                    <></>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* 🌟 The Details Modal Popup */}
        {selectedTask && (
          <div className="modal-overlay" onClick={() => setSelectedTask(null)}>
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              style={{ width: '600px' }}
            >
              <div className="modal-header">
                <h3 style={{ margin: 0 }}>Task Details</h3>
                <button className="btn-close" onClick={() => setSelectedTask(null)}>
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <div style={{ marginBottom: '16px', fontSize: '0.9rem' }}>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    Manga:{' '}
                    <span style={{ color: 'var(--text-primary)' }}>{selectedTask.mangaTitle}</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    Chapter:{' '}
                    <span style={{ color: 'var(--text-primary)' }}>
                      {selectedTask.chapterTitle}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    Url:{' '}
                    <span
                      style={{
                        color: 'var(--text-primary)',
                        wordBreak: 'break-all',
                        userSelect: 'all'
                      }}
                    >
                      {selectedTask.url}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    Status:{' '}
                    <span style={{ color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                      {selectedTask.status}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    Progress:{' '}
                    <span style={{ color: 'var(--text-primary)' }}>{selectedTask.progress}%</span>
                  </div>
                </div>

                {selectedTask.status === 'failed' && selectedTask.error ? (
                  <div
                    style={{
                      padding: '16px',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '6px',
                      color: 'var(--danger-red-light)',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                      overflowX: 'auto',
                      fontSize: '0.85rem',
                      marginTop: '16px'
                    }}
                  >
                    {typeof selectedTask.error === 'object'
                      ? JSON.stringify(selectedTask.error, null, 2)
                      : String(selectedTask.error)}
                  </div>
                ) : (
                  <></>
                )}
              </div>

              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setSelectedTask(null)}>
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

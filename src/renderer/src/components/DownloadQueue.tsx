import { useEffect, useState } from 'react'
import { DownloadTask } from 'src/types/downloadQueue'

export default function DownloadQueue(): React.JSX.Element | null {
  const [queue, setQueue] = useState<DownloadTask[]>([])

  useEffect(() => {
    // Listen for full queue state updates
    const cleanupQueue = window.backendAPI.onQueueUpdated((newQueue) => {
      setQueue(newQueue)
    })

    // Listen for high-frequency progress updates
    const cleanupProgress = window.backendAPI.onQueueProgress(({ id, progress }) => {
      setQueue((prev) => prev.map((task) => (task.id === id ? { ...task, progress } : task)))
    })

    return () => {
      cleanupQueue()
      cleanupProgress()
    }
  }, [])

  if (queue.length === 0) return null // Hide entirely if empty

  return (
    <div
      style={{
        marginTop: '32px',
        backgroundColor: 'var(--bg-dark)',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid var(--border-color)'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}
      >
        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Download Queue</h3>
        <button
          onClick={() => window.backendAPI.cancelAllDownloads()}
          style={{
            backgroundColor: 'var(--danger-red)',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '4px',
            fontSize: '0.8rem'
          }}
        >
          Cancel All
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {queue.map((task) => (
          <div
            key={task.id}
            style={{
              backgroundColor: 'var(--bg-panel)',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span
                style={{
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '70%'
                }}
                title={task.title}
              >
                {task.title}
              </span>
              <span
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase'
                }}
              >
                {task.status}
              </span>
            </div>

            {/* Progress Bar */}
            <div
              style={{
                width: '100%',
                height: '8px',
                backgroundColor: 'var(--bg-dark)',
                borderRadius: '4px',
                overflow: 'hidden',
                marginBottom: '8px'
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

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.8rem'
              }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>{task.progress}%</span>
              {(task.status === 'pending' || task.status === 'downloading') && (
                <button
                  onClick={() => window.backendAPI.cancelDownload(task.id)}
                  style={{ color: 'var(--danger-red)' }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

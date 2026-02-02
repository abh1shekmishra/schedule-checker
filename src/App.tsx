import { useState, useEffect } from 'react'
import './App.css'

type PostType = 'instaReel' | 'instaTrialReel' | 'youtubeVideo' | 'youtubeShorts'

interface DayStatus {
  instaReel: boolean
  instaTrialReel: boolean
  youtubeVideo: boolean
  youtubeShorts: boolean
}

interface PostData {
  [dateKey: string]: DayStatus
}

const EMPTY_STATUS: DayStatus = {
  instaReel: false,
  instaTrialReel: false,
  youtubeVideo: false,
  youtubeShorts: false,
}

const isDayStatus = (value: unknown): value is DayStatus => {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.instaReel === 'boolean' &&
    typeof v.instaTrialReel === 'boolean' &&
    typeof v.youtubeVideo === 'boolean' &&
    typeof v.youtubeShorts === 'boolean'
  )
}

const normalizeStoredData = (raw: unknown): PostData => {
  if (!raw || typeof raw !== 'object') return {}
  const obj = raw as Record<string, unknown>
  const result: PostData = {}

  for (const [key, value] of Object.entries(obj)) {
    if (isDayStatus(value)) {
      result[key] = value
      continue
    }

    // Backward compatibility with old shape: { instagram: boolean, youtube: boolean }
    if (value && typeof value === 'object') {
      const legacy = value as Record<string, unknown>
      const instagram = Boolean(legacy.instagram)
      const youtube = Boolean(legacy.youtube)

      if (instagram || youtube) {
        result[key] = {
          ...EMPTY_STATUS,
          instaReel: instagram,
          youtubeShorts: youtube,
        }
      }
    }
  }

  return result
}

function App() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [postData, setPostData] = useState<PostData>({})
  const [activeDate, setActiveDate] = useState<Date | null>(null)

  // Load data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('schedule-tracker-data')
    if (savedData) {
      setPostData(normalizeStoredData(JSON.parse(savedData)))
    }
  }, [])

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('schedule-tracker-data', JSON.stringify(postData))
  }, [postData])

  // Update current date every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  const getDateKey = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  const hasAnyInsta = (status: DayStatus) => status.instaReel || status.instaTrialReel
  const hasAnyYouTube = (status: DayStatus) => status.youtubeVideo || status.youtubeShorts

  const openDay = (date: Date) => {
    setActiveDate(date)
  }

  const closeDay = () => {
    setActiveDate(null)
  }

  const toggleTypeForDateKey = (dateKey: string, type: PostType) => {
    setPostData(prev => {
      const current = prev[dateKey] ?? EMPTY_STATUS
      const next: DayStatus = {
        ...current,
        [type]: !current[type],
      }

      const shouldKeep = Object.values(next).some(Boolean)

      if (!shouldKeep) {
        const { [dateKey]: _, ...rest } = prev
        return rest
      }

      return {
        ...prev,
        [dateKey]: next,
      }
    })
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { daysInMonth, startingDayOfWeek }
  }

  const changeMonth = (direction: number) => {
    setSelectedMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() + direction)
      return newDate
    })
  }

  const isToday = (date: Date): boolean => {
    return date.toDateString() === currentDate.toDateString()
  }

  const getMonthName = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(selectedMonth)
    const days = []
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    // Empty cells before the first day
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day)
      const dateKey = getDateKey(date)
      const status = postData[dateKey] || EMPTY_STATUS
      const today = isToday(date)

      days.push(
        <button
          key={day}
          type="button"
          className={`calendar-day day-btn ${today ? 'today' : ''}`}
          onClick={() => openDay(date)}
          aria-label={`Open ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`}
        >
          <div className="day-number">{day}</div>
          <div className="type-grid" aria-hidden="true">
            <span className={`type-pill insta ${status.instaReel ? 'active' : ''}`}>IR</span>
            <span className={`type-pill insta ${status.instaTrialReel ? 'active' : ''}`}>IT</span>
            <span className={`type-pill yt ${status.youtubeVideo ? 'active' : ''}`}>YV</span>
            <span className={`type-pill yt ${status.youtubeShorts ? 'active' : ''}`}>YS</span>
          </div>
        </button>
      )
    }

    return (
      <>
        <div className="weekdays">
          {weekDays.map(day => (
            <div key={day} className="weekday">{day}</div>
          ))}
        </div>
        <div className="calendar-grid">
          {days}
        </div>
      </>
    )
  }

  const getStreak = () => {
    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(checkDate.getDate() - i)
      const key = getDateKey(checkDate)
      const status = postData[key]
      
      if (status && hasAnyInsta(status) && hasAnyYouTube(status)) {
        streak++
      } else {
        break
      }
    }
    
    return streak
  }

  return (
    <div className="app">
      <div className="container">
        <div className="glass-card">
          <header className="header">
            <h1>Schedule Tracker</h1>
            <p className="subtitle">Stay consistent, stay creative</p>
          </header>

          <div className="stats">
            <div className="stat-card">
              <div className="stat-value">{getStreak()}</div>
              <div className="stat-label">Day Streak</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{Object.values(postData).filter(hasAnyInsta).length}</div>
              <div className="stat-label">Instagram Days</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{Object.values(postData).filter(hasAnyYouTube).length}</div>
              <div className="stat-label">YouTube Days</div>
            </div>
          </div>

          <div className="calendar-header">
            <button className="nav-btn" onClick={() => changeMonth(-1)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6"></path>
              </svg>
            </button>
            <h2 className="month-title">{getMonthName(selectedMonth)}</h2>
            <button className="nav-btn" onClick={() => changeMonth(1)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6"></path>
              </svg>
            </button>
          </div>

          <div className="calendar">
            {renderCalendar()}
          </div>

          <div className="legend">
            <div className="legend-item">
              <div className="legend-icon insta"></div>
              <span>IR / IT</span>
            </div>
            <div className="legend-item">
              <div className="legend-icon yt"></div>
              <span>YV / YS</span>
            </div>
          </div>

          {activeDate && (
            <div className="modal-overlay" role="presentation" onClick={closeDay}>
              <div
                className="modal"
                role="dialog"
                aria-modal="true"
                aria-label="Edit day"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <div className="modal-title">
                    {activeDate.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
                  </div>
                  <button type="button" className="modal-close" onClick={closeDay} aria-label="Close">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18"></path>
                      <path d="M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>

                {(() => {
                  const key = getDateKey(activeDate)
                  const status = postData[key] || EMPTY_STATUS

                  const rows: Array<{ type: PostType; label: string; checked: boolean }> = [
                    { type: 'instaReel', label: 'Instagram Reel/Post', checked: status.instaReel },
                    { type: 'instaTrialReel', label: 'Instagram Trial Reel/Post', checked: status.instaTrialReel },
                    { type: 'youtubeVideo', label: 'YouTube Video', checked: status.youtubeVideo },
                    { type: 'youtubeShorts', label: 'YouTube Shorts', checked: status.youtubeShorts },
                  ]

                  return (
                    <div className="modal-body">
                      {rows.map((row) => (
                        <button
                          key={row.type}
                          type="button"
                          className="option-row"
                          onClick={() => toggleTypeForDateKey(key, row.type)}
                        >
                          <span className="option-label">{row.label}</span>
                          <span className={`switch ${row.checked ? 'on' : ''}`} aria-hidden="true">
                            <span className="switch-thumb"></span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App

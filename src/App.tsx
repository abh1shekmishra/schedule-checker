import { useState, useEffect } from 'react'
import './App.css'

interface PostStatus {
  instagram: boolean
  youtube: boolean
}

interface PostData {
  [dateKey: string]: PostStatus
}

function App() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [postData, setPostData] = useState<PostData>({})

  // Load data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('schedule-tracker-data')
    if (savedData) {
      setPostData(JSON.parse(savedData))
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

  const togglePost = (date: Date, platform: 'instagram' | 'youtube') => {
    const key = getDateKey(date)
    setPostData(prev => ({
      ...prev,
      [key]: {
        instagram: platform === 'instagram' ? !(prev[key]?.instagram || false) : (prev[key]?.instagram || false),
        youtube: platform === 'youtube' ? !(prev[key]?.youtube || false) : (prev[key]?.youtube || false)
      }
    }))
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
      const status = postData[dateKey] || { instagram: false, youtube: false }
      const today = isToday(date)

      days.push(
        <div key={day} className={`calendar-day ${today ? 'today' : ''}`}>
          <div className="day-number">{day}</div>
          <div className="post-status">
            <button
              className={`status-btn instagram ${status.instagram ? 'active' : ''}`}
              onClick={() => togglePost(date, 'instagram')}
              title="Instagram"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" fill="none" stroke="#fff" strokeWidth="2"></path>
                <circle cx="17.5" cy="6.5" r="1.5" fill="#fff"></circle>
              </svg>
            </button>
            <button
              className={`status-btn youtube ${status.youtube ? 'active' : ''}`}
              onClick={() => togglePost(date, 'youtube')}
              title="YouTube"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"></path>
              </svg>
            </button>
          </div>
        </div>
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
      
      if (status && status.instagram && status.youtube) {
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
              <div className="stat-value">{Object.values(postData).filter(d => d.instagram).length}</div>
              <div className="stat-label">Instagram Posts</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{Object.values(postData).filter(d => d.youtube).length}</div>
              <div className="stat-label">YouTube Shorts</div>
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
              <div className="legend-icon instagram"></div>
              <span>Instagram</span>
            </div>
            <div className="legend-item">
              <div className="legend-icon youtube"></div>
              <span>YouTube</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App

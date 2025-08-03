export default function SubjectItem({ subject, showPlan, onDelete }) {
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  return (
    <div className="subject-item">
      <div className="subject-info">
        <h3>{subject.name}</h3>
        <p>
          Difficulty: {subject.difficulty}/10 • Importance: {subject.importance}/10
        </p>
      </div>
      <div className="subject-actions">
        {showPlan && (
          <span className="time-display">{formatTime(subject.time)}</span>
        )}
        <button className="delete-button" onClick={onDelete}>
          ✕
        </button>
      </div>
    </div>
  )
}
import { useState } from 'react';
import SubjectItem from './components/SubjectItem';
import './App.css';
import axios from 'axios';

function App() {
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState({ name: '', difficulty: 5, importance: 5 });
  const [availableHours, setAvailableHours] = useState(1);
  const [showPlan, setShowPlan] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAddSubject = (e) => {
    e.preventDefault();
    if (!newSubject.name) return;
    setSubjects([...subjects, newSubject]);
    setNewSubject({ name: '', difficulty: 5, importance: 5 });
  };

  const handleRemoveSubject = (index) => {
    setSubjects(subjects.filter((_, i) => i !== index));
    setShowPlan(false); 
  };

  const getTotalTime = () => {
    const totalMinutes = subjects.reduce((sum, subject) => sum + (subject.time || 0), 0);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const callOpenRouterAPI = async () => {
    const API_KEY = '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'; 

    const prompt = `You are an AI Study Planner. For each subject, calculate a weight based on:
- 70% Difficulty + 30% Importance.
Return only the computed weights.

Subjects:
${subjects.map(s => `- ${s.name}: Difficulty ${s.difficulty}, Importance ${s.importance}`).join('\n')}

Return JSON like this:
{
  "plan": [
    { "name": "Subject1", "weight": number },
    { "name": "Subject2", "weight": number }
  ]
}
No explanation, only JSON.`;

    const response = await axios.post('/api/openrouter', {
  model: 'mistralai/mixtral-8x7b-instruct',
  messages: [{ role: 'user', content: prompt }],
  temperature: 0.2
});

    const reply = response.data.choices[0].message.content;
    console.log('OpenRouter Response:', reply);

    let jsonString = reply.match(/\{[\s\S]*\}/)?.[0];
    if (!jsonString) throw new Error('No valid JSON found in response');

    const planData = JSON.parse(jsonString);
    return planData.plan;
  };

  const generatePlan = async () => {
  setLoading(true);
  try {
    const plan = await callOpenRouterAPI();

const totalWeight = plan.reduce((sum, item) => sum + item.weight, 0);
const targetTotal = availableHours * 60;

const timeDistributedPlan = plan.map(item => ({
  name: item.name,
  time: Math.round((item.weight / totalWeight) * targetTotal)
}));


  const updatedSubjects = subjects.map(subject => {
    const apiSubject = timeDistributedPlan.find(item => item.name === subject.name);
  return { ...subject, time: apiSubject ? apiSubject.time : 0 };
});

setSubjects(updatedSubjects);
setShowPlan(true);

  } catch (error) {
    console.error('Error:', error);
    alert('Failed to generate plan. Check console.');
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="app">
      <header>
        <div className="logo">📚</div>
        <h1>AI Study Planner</h1>
        <p>Organize your studies by adding subjects with their difficulty and importance levels</p>
      </header>

      <div className="input-form">
        <div className="form-group">
          <label>Subject Name</label>
          <input type="text" value={newSubject.name} onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })} placeholder="Enter subject name" />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Difficulty (1-10)</label>
            <input type="number" min="1" max="10" value={newSubject.difficulty} onChange={(e) => setNewSubject({ ...newSubject, difficulty: Number(e.target.value) })} />
          </div>

          <div className="form-group">
            <label>Importance (1-10)</label>
            <input type="number" min="1" max="10" value={newSubject.importance} onChange={(e) => setNewSubject({ ...newSubject, importance: Number(e.target.value) })} />
          </div>
        </div>

        <button className="add-button" onClick={handleAddSubject}>Add Subject</button>
      </div>

      {subjects.length > 0 && (
        <div className="subjects-list">
          <div className="list-header">
            <h2>{showPlan ? 'Generated Study Plan' : 'Added Subjects'}</h2>
            <div className="hours-input">
              <label>Available Hours:</label>
              <input type="number" min="1" value={availableHours} onChange={(e) => setAvailableHours(Number(e.target.value))} />
              <button className="generate-button" onClick={generatePlan} disabled={loading}>
                {loading ? 'Generating...' : 'Generate Plan (AI)'}
              </button>
            </div>
          </div>

          {loading && <div className="spinner"></div>}

          {subjects.map((subject, index) => (
            <SubjectItem key={index} subject={subject} showPlan={showPlan} onDelete={() => handleRemoveSubject(index)} />
          ))}

          {showPlan && (
            <div className="total-time">
              <h3>Total Study Time</h3>
              <p>{getTotalTime()}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;

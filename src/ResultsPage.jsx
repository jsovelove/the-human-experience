import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import './ResultsPage.css';

function ResultsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'responses'));
        const responses = querySnapshot.docs.map(doc => doc.data());

        // Count yes and no responses
        const yesCount = responses.filter(r => r.answer === 'yes').length;
        const noCount = responses.filter(r => r.answer === 'no').length;

        const chartData = [
          { name: 'Yes', value: yesCount },
          { name: 'No', value: noCount }
        ];

        setData(chartData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load results. Please try again.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const COLORS = ['#D12800', '#1800D1'];

  const handleContinue = () => {
    navigate('/explore');
  };

  if (loading) {
    return (
      <div className="results-page">
        <div className="results-container">
          <p className="loading-text">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="results-page">
        <div className="results-container">
          <p className="error-text">{error}</p>
          <button className="continue-button" onClick={handleContinue}>
            Continue Anyway
          </button>
        </div>
      </div>
    );
  }

  const totalResponses = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="results-page">
      <div className="results-container">
        <h1 className="results-title">You are alive. Are you scared?</h1>
        <p className="results-subtitle">
          {totalResponses} {totalResponses === 1 ? 'response' : 'responses'}
        </p>

        <div className="chart-container">
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => 
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <button className="continue-button" onClick={handleContinue}>
          Continue
        </button>
      </div>
    </div>
  );
}

export default ResultsPage;


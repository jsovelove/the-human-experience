import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';
import './QuestionPage.css';

function QuestionPage() {
  const navigate = useNavigate();
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (selectedAnswer === null || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Save the answer to Firestore
      await addDoc(collection(db, 'responses'), {
        question: 'You are alive. Are you scared?',
        answer: selectedAnswer,
        timestamp: new Date()
      });

      // Navigate to results page
      navigate('/results');
    } catch (error) {
      console.error('Error saving response:', error);
      alert('Failed to save your response. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="question-page">
      <div className="question-container">
        <h1 className="question-text">You are alive. Are you scared?</h1>
        
        <div className="checkbox-container">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={selectedAnswer === 'yes'}
              onChange={() => setSelectedAnswer('yes')}
              disabled={isSubmitting}
            />
            <span>Yes</span>
          </label>
          
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={selectedAnswer === 'no'}
              onChange={() => setSelectedAnswer('no')}
              disabled={isSubmitting}
            />
            <span>No</span>
          </label>
        </div>

        <button 
          className="submit-button"
          onClick={handleSubmit}
          disabled={selectedAnswer === null || isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </div>
  );
}

export default QuestionPage;


import './App.css'
import diagramImage from './assets/diagram.jpg'

function SecondPage() {
  return (
    <div className="app" style={{ backgroundColor: 'black' }}>
      <div className="content">
        <div style={{ textAlign: 'center' }}>
          <img 
            src={diagramImage} 
            alt="Diagram" 
            style={{ 
              maxWidth: '35%', 
              height: 'auto',
              borderRadius: '8px'
            }} 
          />
        </div>
      </div>
    </div>
  )
}

export default SecondPage


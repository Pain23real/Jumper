import React from 'react';
import GameContainer from '../components/GameContainer';

const GamePage = () => {
  return (
    <div className="game-page">
      <div className="game-header">
        <h1 className="game-title">The Secret Jump</h1>
      </div>
      
      <div className="game-content">
        <GameContainer />
      </div>
      
      <div className="game-instructions">
        <h2>How to Play</h2>
        
        <div className="instructions-grid">
          <div className="instruction-item">
            <div className="instruction-icon">🎮</div>
            <p>Use <span className="key">A</span> or <span className="key">←</span> to move left, <span className="key">D</span> or <span className="key">→</span> to move right</p>
          </div>
          <div className="instruction-item">
            <div className="instruction-icon">🧿</div>
            <p>Character automatically jumps on umbrellas</p>
          </div>
          <div className="instruction-item">
            <div className="instruction-icon">🏆</div>
            <p>Achieve higher ranks by accumulating more points</p>
          </div>
        </div>

        <div className="umbrellas-section">
          <h3 className="section-title">Umbrella Types</h3>
          <div className="umbrellas-grid">
            <div className="umbrella-card">
              <div className="umbrella-visual purple">
                <div className="umbrella-canopy"></div>
                <div className="umbrella-handle"></div>
              </div>
              <div className="umbrella-info">
                <h4>Normal</h4>
                <p>Standard umbrella that provides a reliable bounce</p>
              </div>
            </div>
            
            <div className="umbrella-card">
              <div className="umbrella-visual red">
                <div className="umbrella-canopy broken"></div>
                <div className="umbrella-handle"></div>
              </div>
              <div className="umbrella-info">
                <h4>Breaking</h4>
                <p>Collapses after a single use - be ready to move!</p>
              </div>
            </div>
            
            <div className="umbrella-card">
              <div className="umbrella-visual yellow">
                <div className="umbrella-canopy"></div>
                <div className="umbrella-handle"></div>
              </div>
              <div className="umbrella-info">
                <h4>Temporary</h4>
                <p>Disappears after a short time - don't linger!</p>
              </div>
            </div>
            
            <div className="umbrella-card">
              <div className="umbrella-visual green">
                <div className="umbrella-canopy"></div>
                <div className="umbrella-handle"></div>
                <div className="direction-arrow">↔️</div>
              </div>
              <div className="umbrella-info">
                <h4>Moving</h4>
                <p>Slides horizontally - time your jumps carefully</p>
              </div>
            </div>
            
            <div className="umbrella-card">
              <div className="umbrella-visual ice">
                <div className="umbrella-canopy"></div>
                <div className="umbrella-handle"></div>
                <div className="ice-effect"></div>
              </div>
              <div className="umbrella-info">
                <h4>Slippery</h4>
                <p>Icy surface causes sliding - appears in higher ranks</p>
              </div>
            </div>
            
            <div className="umbrella-card">
              <div className="umbrella-visual swing">
                <div className="umbrella-canopy"></div>
                <div className="umbrella-handle"></div>
              </div>
              <div className="umbrella-info">
                <h4>Swinging</h4>
                <p>Sways back and forth - requires precise timing</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="difficulty-section">
          <h3 className="section-title">Difficulty Progression</h3>
          <div className="difficulty-grid">
            <div className="rank-card">
              <div className="rank-badge">👾</div>
              <div className="rank-info">
                <p>Breaking umbrellas begin to appear</p>
              </div>
            </div>
            
            <div className="rank-card">
              <div className="rank-badge">🌪️</div>
              <div className="rank-info">
                <p>Wind starts blowing, affecting your movement</p>
              </div>
            </div>
            
            <div className="rank-card">
              <div className="rank-badge">📏</div>
              <div className="rank-info">
                <p>Umbrellas shrink in size by 30%</p>
              </div>
            </div>
            
            <div className="rank-card">
              <div className="rank-badge">☔</div>
              <div className="rank-info">
                <p>Deadly raindrops appear - avoid at all costs!</p>
              </div>
            </div>
            
            <div className="rank-card">
              <div className="rank-badge">⚡</div>
              <div className="rank-info">
                <p>Faster moving platforms and more temporary umbrellas</p>
              </div>
            </div>
            
            <div className="rank-card">
              <div className="rank-badge">🔮</div>
              <div className="rank-info">
                <p>Swinging umbrellas appear and wind gets stronger</p>
              </div>
            </div>
            
            <div className="rank-card">
              <div className="rank-badge">❄️</div>
              <div className="rank-info">
                <p>Slippery ice appears on umbrellas</p>
              </div>
            </div>
            
            <div className="rank-card">
              <div className="rank-badge">⭐</div>
              <div className="rank-info">
                <p>Ultimate challenge with maximum difficulty</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .game-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          animation: fadeIn 0.5s ease-out;
        }
        
        .game-header {
          text-align: center;
          margin-bottom: 30px;
          position: relative;
        }
        
        .game-title {
          font-size: 2.5rem;
          color: #8a2be2;
          margin-bottom: 20px;
          position: relative;
          display: inline-block;
          text-transform: uppercase;
          font-weight: 800;
          letter-spacing: 2px;
          transform-style: preserve-3d;
          transform: perspective(500px) rotateX(10deg);
          animation: float3d 6s ease-in-out infinite;
        }
        
        .game-title::before {
          content: "The Secret Jump";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          color: rgba(138, 43, 226, 0.8);
          transform: translateZ(-8px);
          filter: blur(3px);
          opacity: 0.7;
        }
        
        .game-title::after {
          content: '';
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 100px;
          height: 3px;
          background: linear-gradient(90deg, transparent, #8a2be2, transparent);
          box-shadow: 0 0 15px 5px rgba(138, 43, 226, 0.3);
        }
        
        .game-content {
          margin-bottom: 40px;
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(138, 43, 226, 0.3);
          position: relative;
        }
        
        .game-content::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #1a0933, #8a2be2, #1a0933);
          z-index: 10;
        }
        
        .game-instructions {
          background-color: rgba(0, 0, 0, 0.3);
          border-radius: 15px;
          padding: 30px;
          margin-top: 30px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(5px);
          border: 1px solid rgba(138, 43, 226, 0.2);
          position: relative;
          overflow: hidden;
        }
        
        .game-instructions::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: 
            linear-gradient(45deg, transparent 48%, rgba(138, 43, 226, 0.1) 50%, transparent 52%),
            linear-gradient(-45deg, transparent 48%, rgba(138, 43, 226, 0.1) 50%, transparent 52%);
          background-size: 30px 30px;
          pointer-events: none;
          z-index: 0;
        }
        
        .game-instructions > * {
          position: relative;
          z-index: 1;
        }
        
        .game-instructions h2 {
          margin-top: 0;
          text-align: center;
          margin-bottom: 25px;
          color: #8a2be2;
          font-size: 1.8rem;
          text-shadow: 0 0 10px rgba(138, 43, 226, 0.3);
        }
        
        .section-title {
          text-align: center;
          color: #8a2be2;
          margin: 40px 0 25px 0;
          font-size: 1.5rem;
          position: relative;
          text-shadow: 0 0 10px rgba(138, 43, 226, 0.3);
        }
        
        .section-title::after {
          content: '';
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 80px;
          height: 3px;
          background: linear-gradient(90deg, transparent, #8a2be2, transparent);
        }
        
        .instructions-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .instruction-item {
          display: flex;
          align-items: flex-start;
          gap: 15px;
          background-color: rgba(74, 20, 140, 0.2);
          padding: 15px;
          border-radius: 10px;
          transition: all 0.3s ease;
        }
        
        .instruction-item:hover {
          background-color: rgba(74, 20, 140, 0.3);
          transform: translateY(-3px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
        
        .instruction-icon {
          font-size: 30px;
          line-height: 1;
          margin-top: 5px;
        }
        
        .umbrellas-grid, .difficulty-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        
        .umbrella-card, .rank-card {
          background-color: rgba(74, 20, 140, 0.2);
          border-radius: 10px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 15px;
          transition: all 0.3s ease;
          height: 100%;
        }
        
        .umbrella-card:hover, .rank-card:hover {
          background-color: rgba(74, 20, 140, 0.3);
          transform: translateY(-5px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
        }
        
        .umbrella-visual {
          position: relative;
          height: 80px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .umbrella-canopy {
          width: 80px;
          height: 40px;
          border-radius: 80px 80px 0 0;
          position: absolute;
          top: 0;
          box-shadow: 0 -5px 15px rgba(0, 0, 0, 0.2);
        }
        
        .umbrella-handle {
          width: 4px;
          height: 40px;
          position: absolute;
          top: 40px;
        }
        
        .direction-arrow {
          position: absolute;
          font-size: 20px;
          top: -25px;
        }
        
        .ice-effect {
          position: absolute;
          width: 60px;
          height: 10px;
          background: linear-gradient(90deg, rgba(255,255,255,0.5), rgba(100,200,255,0.8), rgba(255,255,255,0.5));
          border-radius: 10px;
          top: 38px;
          filter: blur(2px);
        }
        
        .umbrella-visual.purple .umbrella-canopy {
          background-color: #8a2be2;
          box-shadow: 0 0 10px rgba(138, 43, 226, 0.5);
        }
        
        .umbrella-visual.purple .umbrella-handle {
          background-color: #654321;
        }
        
        .umbrella-visual.red .umbrella-canopy {
          background-color: #ff4757;
          box-shadow: 0 0 10px rgba(255, 71, 87, 0.5);
        }
        
        .umbrella-visual.red .umbrella-canopy.broken::after {
          content: '';
          position: absolute;
          width: 40px;
          height: 2px;
          background-color: white;
          top: 20px;
          transform: rotate(-45deg);
        }
        
        .umbrella-visual.red .umbrella-canopy.broken::before {
          content: '';
          position: absolute;
          width: 40px;
          height: 2px;
          background-color: white;
          top: 20px;
          transform: rotate(45deg);
        }
        
        .umbrella-visual.red .umbrella-handle {
          background-color: #654321;
        }
        
        .umbrella-visual.yellow .umbrella-canopy {
          background-color: #ffa502;
          box-shadow: 0 0 10px rgba(255, 165, 2, 0.5);
          animation: pulse 2s infinite;
        }
        
        .umbrella-visual.yellow .umbrella-handle {
          background-color: #654321;
        }
        
        .umbrella-visual.green .umbrella-canopy {
          background-color: #2ed573;
          box-shadow: 0 0 10px rgba(46, 213, 115, 0.5);
        }
        
        .umbrella-visual.green .umbrella-handle {
          background-color: #654321;
        }
        
        .umbrella-visual.ice .umbrella-canopy {
          background-color: #64c8ff;
          box-shadow: 0 0 10px rgba(100, 200, 255, 0.5);
        }
        
        .umbrella-visual.ice .umbrella-handle {
          background-color: #654321;
        }
        
        .umbrella-visual.swing {
          animation: swing 2s infinite ease-in-out;
        }
        
        .umbrella-visual.swing .umbrella-canopy {
          background-color: #d630d6;
          box-shadow: 0 0 10px rgba(214, 48, 214, 0.5);
        }
        
        .umbrella-visual.swing .umbrella-handle {
          background-color: #654321;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        
        @keyframes swing {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(20px); }
        }
        
        .rank-card {
          flex-direction: row;
          align-items: center;
        }
        
        .rank-badge {
          font-size: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          flex-shrink: 0;
          background-color: rgba(138, 43, 226, 0.3);
        }
        
        .umbrella-info h4 {
          margin: 0 0 5px 0;
          color: #fff;
          text-align: center;
        }
        
        .umbrella-info p, .rank-info p {
          margin: 0;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.8);
          text-align: center;
        }
        
        .rank-info p {
          margin: 0;
          text-align: left;
        }
        
        .key {
          display: inline-block;
          background-color: rgba(255, 255, 255, 0.2);
          padding: 2px 8px;
          border-radius: 4px;
          margin: 0 4px;
          font-family: monospace;
          font-weight: bold;
        }
        
        @media (max-width: 1100px) {
          .umbrellas-grid, .difficulty-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .instructions-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        
        @media (max-width: 768px) {
          .instructions-grid {
            grid-template-columns: 1fr;
          }
          
          .game-title {
            font-size: 2rem;
          }
          
          .umbrellas-grid, .difficulty-grid {
            grid-template-columns: 1fr;
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes float3d {
          0% {
            transform: perspective(500px) rotateX(10deg) rotateY(-5deg);
            text-shadow: 
              1px 1px 0 #6a11cb,
              2px 2px 0 #6a11cb,
              3px 3px 0 #6a11cb,
              4px 4px 0 #6a11cb,
              5px 5px 0 #6a11cb,
              6px 6px 10px rgba(138, 43, 226, 0.7);
          }
          50% {
            transform: perspective(500px) rotateX(15deg) rotateY(5deg);
            text-shadow: 
              1px 1px 0 #6a11cb,
              2px 2px 0 #6a11cb,
              3px 3px 0 #6a11cb,
              4px 4px 0 #6a11cb,
              5px 5px 0 #6a11cb,
              6px 6px 10px rgba(138, 43, 226, 0.7);
          }
          100% {
            transform: perspective(500px) rotateX(10deg) rotateY(-5deg);
            text-shadow: 
              1px 1px 0 #6a11cb,
              2px 2px 0 #6a11cb,
              3px 3px 0 #6a11cb,
              4px 4px 0 #6a11cb,
              5px 5px 0 #6a11cb,
              6px 6px 10px rgba(138, 43, 226, 0.7);
          }
        }
      `}</style>
    </div>
  );
};

export default GamePage;
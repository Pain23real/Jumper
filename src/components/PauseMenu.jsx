import React from 'react';

const PauseMenu = ({ visible, onResume, onRestart, onShowLeaderboard, onExit }) => {
  if (!visible) return null;
  
  return (
    <div className="pause-menu-overlay">
      <div className="pause-menu-container">
        <h1>Game Paused</h1>
        
        <div className="buttons">
          <button className="resume-button" onClick={onResume}>
            Resume
          </button>
          
          <button className="restart-button" onClick={onRestart}>
            Restart
          </button>
          
          <button className="leaderboard-button" onClick={onShowLeaderboard}>
            Leaderboard
          </button>
          
          {onExit && (
            <button className="exit-button" onClick={onExit}>
              Exit Game
            </button>
          )}
        </div>
        
        <div className="help-text">
          Press <span className="key">ESC</span> to resume
        </div>
      </div>
      
      <style jsx>{`
        .pause-menu-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 100;
          backdrop-filter: blur(5px);
        }
        
        .pause-menu-container {
          background-color: #4a2b7a;
          border-radius: 10px;
          padding: 30px;
          text-align: center;
          width: 90%;
          max-width: 400px;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
        }
        
        h1 {
          color: white;
          font-size: 2rem;
          margin-top: 0;
          margin-bottom: 30px;
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
        }
        
        .buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        button {
          padding: 12px;
          font-size: 1rem;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        button:hover {
          transform: translateY(-2px);
        }
        
        .resume-button {
          background-color: #8a2be2;
          color: white;
        }
        
        .resume-button:hover {
          background-color: #9845f5;
        }
        
        .restart-button {
          background-color: #17a2b8;
          color: white;
        }
        
        .restart-button:hover {
          background-color: #1ab6cf;
        }
        
        .leaderboard-button {
          background-color: rgba(255, 255, 255, 0.2);
          color: white;
        }
        
        .leaderboard-button:hover {
          background-color: rgba(255, 255, 255, 0.3);
        }
        
        .exit-button {
          background-color: #dc3545;
          color: white;
          margin-top: 10px;
        }
        
        .exit-button:hover {
          background-color: #e04553;
        }
        
        .help-text {
          margin-top: 25px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9rem;
        }
        
        .key {
          display: inline-block;
          background-color: rgba(255, 255, 255, 0.2);
          padding: 2px 6px;
          border-radius: 4px;
          margin: 0 3px;
          font-family: monospace;
        }
      `}</style>
    </div>
  );
};

export default PauseMenu; 
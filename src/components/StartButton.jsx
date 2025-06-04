import React from 'react';

const StartButton = ({ visible, onStart }) => {
  if (!visible) return null;
  
  return (
    <div className="start-button-wrapper">
      <button 
        className="start-button" 
        onClick={onStart}
        onTouchStart={onStart} // Для мобильных устройств
      >
        Start Game
      </button>
      
      <style jsx>{`
        .start-button-wrapper {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 10;
        }
        
        .start-button {
          padding: 15px 40px;
          font-size: 1.5rem;
          background-color: #8a2be2;
          color: white;
          border: none;
          border-radius: 50px;
          cursor: pointer;
          box-shadow: 0 0 20px rgba(138, 43, 226, 0.5);
          transition: all 0.3s ease;
          font-weight: bold;
          letter-spacing: 1px;
          position: relative;
          overflow: hidden;
        }
        
        .start-button:before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.2) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          transition: all 0.8s;
        }
        
        .start-button:hover {
          transform: translateY(-5px);
          box-shadow: 0 7px 30px rgba(138, 43, 226, 0.7);
          background-color: #9845f5;
        }
        
        .start-button:hover:before {
          left: 100%;
        }
        
        .start-button:active {
          transform: translateY(0);
          box-shadow: 0 3px 15px rgba(138, 43, 226, 0.6);
        }
      `}</style>
    </div>
  );
};

export default StartButton; 
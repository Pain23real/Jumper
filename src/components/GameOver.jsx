import React, { useState, useEffect, useCallback } from "react";
import { getCategory } from '../utils/gameHelpers';
import { sendGameResult } from '../utils/blockchainHelpers';

const GameOver = ({ visible, score, rank, onRestart, onShowLeaderboard }) => {
  const [isSending, setIsSending] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);
  const [sendingInitiated, setSendingInitiated] = useState(false);
  
  // Function to send results to blockchain using useCallback
  const sendResultToBlockchain = useCallback(async () => {
    // Проверяем, был ли уже отправлен результат для этой игры
    const lastSentScore = localStorage.getItem('lastSentScore');
    const lastSentTimestamp = localStorage.getItem('lastSentTimestamp');
    
    // Если отправка уже в процессе, результат уже отправлен или произошла ошибка - не отправляем
    if (isSending || txHash || error) {
      console.log(`Skipping send: isSending=${isSending}, txHash exists=${!!txHash}, error exists=${!!error}`);
      return;
    }
    
    // Check if the game is actually finished (visible=true) and has a score
    if (!visible || score <= 0) {
      console.log(`Invalid game state for sending: visible=${visible}, score=${score}`);
      return;
    }
    
    // Проверяем, не отправляли ли мы уже этот же результат недавно (в течение последних 5 минут)
    if (lastSentScore === score.toString() && lastSentTimestamp && (Date.now() - parseInt(lastSentTimestamp)) < 300000) {
      console.log("This score was already sent recently, skipping duplicate submission");
      return;
    }
    
    try {
      console.log(`Starting blockchain submission: score=${score}`);
      setIsSending(true);
      setError(null);
      
      // Устанавливаем флаг, что отправка началась
      localStorage.setItem('sendingInProgress', 'true');
      localStorage.setItem('lastSentScore', score.toString());
      localStorage.setItem('lastSentTimestamp', Date.now().toString());
      
      // Get nickname from localStorage
      const playerName = localStorage.getItem('playerName') || 'Anonymous';
      
      // Here we should get additional data from the game
      // In a real project, this data should be passed from the game
      const jumpsCount = Math.floor(score / 10).toString(); // Approximate estimate
      const platformsVisited = Math.floor(score / 50).toString(); // Approximate estimate
      
      // Send result to blockchain
      const tx = await sendGameResult(
        score.toString(),
        jumpsCount,
        platformsVisited,
        playerName
      );
      
      console.log(`Blockchain submission completed: tx=${tx}`);
      setTxHash(tx);
      
      // Очищаем флаг отправки
      localStorage.removeItem('sendingInProgress');
    } catch (err) {
      console.error("Error sending result:", err);
      setError("Transaction failed: " + (err.message || "Unknown error"));
      
      // Очищаем флаг отправки в случае ошибки
      localStorage.removeItem('sendingInProgress');
    } finally {
      setIsSending(false);
    }
  }, [score, isSending, txHash, error, visible]); // Add visible as dependency
  
  // Автоматически отправляем результат когда появляется окно Game Over
  useEffect(() => {
    // Отправляем результат только когда окно становится видимым,
    // процесс отправки еще не начат и нет результатов предыдущей отправки
    if (visible && !sendingInitiated && !txHash && !error && !isSending && score > 0) {
      console.log("Game Over is visible, initiating blockchain submission");
      
      // Устанавливаем флаг, что отправка была инициирована для этой сессии
      setSendingInitiated(true);
      
      // Добавляем небольшую задержку перед отправкой для уверенности, что компонент полностью смонтирован
      const timer = setTimeout(() => {
        sendResultToBlockchain();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [visible, txHash, isSending, error, sendResultToBlockchain, score, sendingInitiated]);
  
  // Сбрасываем флаг sendingInitiated когда компонент становится невидимым
  useEffect(() => {
    if (!visible) {
      setSendingInitiated(false);
    }
  }, [visible]);
  
  // Check for pending transactions on component mount
  useEffect(() => {
    // Проверяем, был ли прерван процесс отправки в прошлый раз
    const sendingInProgress = localStorage.getItem('sendingInProgress');
    if (sendingInProgress === 'true') {
      console.log("Cleaning up interrupted transaction state");
      localStorage.removeItem('sendingInProgress');
    }
  }, []);
  
  if (!visible) return null;
  
  // Create motivational message
  const getMessage = (score) => {
    if (score < 500) {
      return "Don't give up! Keep trying!";
    } else if (score < 1000) {
      return "Good start! Can you reach the next level?";
    } else if (score < 2000) {
      return "Well done! You're getting better!";
    } else if (score < 3000) {
      return "Amazing! You're becoming a master!";
    } else {
      return "INCREDIBLE! You're a true legend!";
    }
  };
  
  const category = getCategory(score);
  const message = getMessage(score);
  
  return (
    <div className="game-over-overlay">
      <div className="game-over-container">
        <div className="security-header">
          <div className="security-icon">🛡️</div>
        <h1>Game Over!</h1>
        </div>
        
        <div className="score-display">
          <div className="score-item">
            <span className="score-label">Your score:</span>
            <span className="score-value">{score}</span>
          </div>
          
          <div className="score-item">
            <span className="score-label">Category:</span>
            <span className="score-value">{category}</span>
          </div>
          
          {rank && (
            <div className="score-item">
              <span className="score-label">Rank:</span>
              <span className="score-value">{rank}</span>
            </div>
          )}
        </div>
        
        <div className="message">
          <div className="message-icon">💎</div>
          {message}
        </div>
        
        <div className="blockchain-section">
          <div className="blockchain-header">
            <div className="blockchain-icon">⛓️</div>
            <h3>Blockchain Record</h3>
          </div>
          
          {isSending ? (
            <div className="sending-status">
              <div className="loading-spinner"></div>
              <p>Sending result to blockchain...</p>
            </div>
          ) : txHash ? (
            <div className="tx-success">
              <div className="success-icon">✓</div>
              <p>Result successfully sent to blockchain!</p>
              <a 
                href={`https://explorer.solana.com/tx/${txHash}?cluster=devnet`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="tx-link"
              >
                View transaction
              </a>
            </div>
          ) : error ? (
            <div className="tx-error">
              <div className="error-icon">⚠️</div>
              <p>{error}</p>
            </div>
          ) : (
            <div className="sending-status">
              <div className="loading-spinner"></div>
              <p>Preparing to send result...</p>
            </div>
          )}
        </div>
        
        <div className="buttons">
          <button className="restart-button" onClick={onRestart}>
            <span className="button-text">Play Again</span>
            <span className="button-glow"></span>
          </button>
          
          <button className="leaderboard-button" onClick={onShowLeaderboard}>
            <span className="leaderboard-icon">🏆</span>
            <span className="button-text">Leaderboard</span>
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .game-over-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 100;
          backdrop-filter: blur(5px);
        }
        
        .game-over-container {
          background-color: #1a0933;
          border-radius: 10px;
          padding: 30px;
          text-align: center;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 0 30px rgba(176, 38, 255, 0.5);
          animation: fadeIn 0.5s ease-in-out;
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(176, 38, 255, 0.3);
        }
        
        .game-over-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: 
            linear-gradient(45deg, transparent 48%, rgba(176, 38, 255, 0.1) 50%, transparent 52%),
            linear-gradient(-45deg, transparent 48%, rgba(176, 38, 255, 0.1) 50%, transparent 52%);
          background-size: 20px 20px;
          pointer-events: none;
          z-index: 0;
        }
        
        .game-over-container > * {
          position: relative;
          z-index: 1;
        }
        
        .security-header {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }
        
        .security-icon {
          font-size: 1.8rem;
          margin-right: 10px;
          animation: pulse 2s infinite;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 0.8; }
        }
        
        @keyframes rotate {
          100% {
            transform: rotate(1turn);
          }
        }
        
        @keyframes neonFlicker {
          0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% {
            text-shadow: 0 0 5px #fff, 0 0 10px #fff, 0 0 15px #b026ff, 0 0 20px #b026ff;
          }
          20%, 24%, 55% {
            text-shadow: none;
          }
        }
        
        h1 {
          color: #ffffff;
          font-size: 2.5rem;
          margin: 0;
          margin-bottom: 20px;
          text-shadow: 0 0 5px #fff, 0 0 10px #fff, 0 0 15px #b026ff, 0 0 20px #b026ff;
          animation: neonFlicker 3s infinite;
        }
        
        .score-display {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 20px;
        }
        
        .score-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: rgba(26, 9, 51, 0.8);
          padding: 10px 20px;
          border-radius: 5px;
          border: 1px solid rgba(176, 38, 255, 0.3);
          box-shadow: 0 0 10px rgba(176, 38, 255, 0.2);
        }
        
        .score-label {
          font-weight: bold;
          color: #e0e0e0;
        }
        
        .score-value {
          font-size: 1.2rem;
          color: #b026ff;
          text-shadow: 0 0 5px rgba(176, 38, 255, 0.7);
        }
        
        .message {
          background-color: rgba(26, 9, 51, 0.8);
          border-left: 4px solid #b026ff;
          padding: 15px;
          margin: 20px 0;
          text-align: left;
          color: #ffcc00;
          font-style: italic;
          font-size: 1.1rem;
          position: relative;
          display: flex;
          align-items: center;
          box-shadow: 0 0 15px rgba(176, 38, 255, 0.3);
        }
        
        .message-icon {
          margin-right: 10px;
          font-size: 1.3rem;
          animation: pulse 2s infinite;
        }
        
        .blockchain-section {
          margin: 20px 0;
          padding: 20px;
          background-color: rgba(26, 9, 51, 0.8);
          border-radius: 8px;
          min-height: 80px;
          border: 1px solid rgba(176, 38, 255, 0.3);
          position: relative;
          overflow: hidden;
        }
        
        .blockchain-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(45deg, #4a2b7a, #8a2be2, #4a2b7a);
          background-size: 200% 200%;
          opacity: 0.1;
          animation: gradientMove 15s linear infinite;
          pointer-events: none;
        }
        
        @keyframes gradientMove {
          0% { background-position: 0% 0%; }
          50% { background-position: 100% 100%; }
          100% { background-position: 0% 0%; }
        }
        
        .blockchain-header {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 15px;
        }
        
        .blockchain-icon {
          font-size: 1.3rem;
          margin-right: 10px;
          animation: pulse 2s infinite;
        }
        
        .blockchain-header h3 {
          margin: 0;
          color: #e0e0e0;
          font-size: 1.3rem;
          text-shadow: 0 0 5px rgba(176, 38, 255, 0.5);
        }
        
        .sending-status {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #e0e0e0;
          position: relative;
          z-index: 1;
        }
        
        .loading-spinner {
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top: 4px solid #b026ff;
          width: 30px;
          height: 30px;
          animation: spin 1s linear infinite;
          margin-bottom: 10px;
          box-shadow: 0 0 15px rgba(176, 38, 255, 0.5);
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .tx-success {
          color: #28a745;
          background-color: rgba(40, 167, 69, 0.1);
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 10px;
          border: 1px solid rgba(40, 167, 69, 0.3);
          position: relative;
          z-index: 1;
        }
        
        .success-icon {
          font-size: 1.5rem;
          color: #28a745;
          margin-bottom: 10px;
          text-shadow: 0 0 10px rgba(40, 167, 69, 0.5);
        }
        
        .tx-error {
          color: #dc3545;
          background-color: rgba(220, 53, 69, 0.1);
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 10px;
          border: 1px solid rgba(220, 53, 69, 0.3);
          position: relative;
          z-index: 1;
        }
        
        .error-icon {
          font-size: 1.5rem;
          color: #dc3545;
          margin-bottom: 10px;
          text-shadow: 0 0 10px rgba(220, 53, 69, 0.5);
        }
        
        .tx-link {
          display: inline-block;
          margin-top: 10px;
          color: #4d4dff;
          text-decoration: underline;
          text-shadow: 0 0 5px rgba(77, 77, 255, 0.5);
          transition: all 0.3s ease;
        }
        
        .tx-link:hover {
          color: #b026ff;
          text-shadow: 0 0 8px rgba(176, 38, 255, 0.7);
        }
        
        .buttons {
          display: flex;
          gap: 15px;
          justify-content: center;
          margin-top: 25px;
        }
        
        button {
          padding: 12px 25px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: bold;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .button-text {
          position: relative;
          z-index: 2;
        }
        
        .button-glow {
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: conic-gradient(transparent, rgba(255, 255, 255, 0.2), transparent 30%);
          animation: rotate 4s linear infinite;
        }
        
        .restart-button {
          background: linear-gradient(45deg, #8a2be2, #b026ff);
          color: white;
          box-shadow: 0 0 15px rgba(176, 38, 255, 0.5);
        }
        
        .restart-button:hover {
          background: linear-gradient(45deg, #9845f5, #c23aff);
          transform: translateY(-2px);
          box-shadow: 0 0 20px rgba(176, 38, 255, 0.7);
        }
        
        .leaderboard-button {
          background: linear-gradient(45deg, #ffcc00, #ffd700);
          color: #1a0933;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 20px;
          box-shadow: 0 0 15px rgba(255, 204, 0, 0.3);
        }
        
        .leaderboard-button:hover {
          background: linear-gradient(45deg, #ffd700, #ffe44d);
          transform: translateY(-2px);
          box-shadow: 0 0 20px rgba(255, 204, 0, 0.5);
        }
        
        .leaderboard-icon {
          font-size: 1.2rem;
          animation: trophyPulse 2s infinite;
        }
        
        @keyframes trophyPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        
        /* Mobile styles */
        @media (max-width: 768px) {
          .game-over-container {
            width: 95%;
            padding: 20px;
            max-height: 90vh;
            overflow-y: auto;
          }
          
          h1 {
            font-size: 2rem;
          }
          
          .score-item {
            padding: 8px 15px;
            font-size: 0.9rem;
          }
          
          .score-value {
            font-size: 1.1rem;
          }
          
          .message {
            padding: 12px;
            font-size: 1rem;
          }
          
          .blockchain-section {
            padding: 15px;
            min-height: 60px;
          }
          
          .blockchain-header h3 {
            font-size: 1.1rem;
          }
          
          .buttons {
            flex-direction: column;
            gap: 10px;
          }
          
          button {
            width: 100%;
            padding: 15px 20px;
            font-size: 1.1rem;
          }
          
          .tx-link {
            font-size: 0.9rem;
          }
        }
        
        @media (max-width: 480px) {
          .game-over-container {
            padding: 15px;
          }
          
          h1 {
            font-size: 1.8rem;
            margin-bottom: 15px;
          }
          
          .score-item {
            padding: 6px 12px;
            font-size: 0.8rem;
          }
          
          .score-value {
            font-size: 1rem;
          }
          
          .message {
            padding: 10px;
            font-size: 0.9rem;
          }
          
          .blockchain-section {
            padding: 12px;
          }
          
          .blockchain-header h3 {
            font-size: 1rem;
          }
          
          button {
            padding: 12px 15px;
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default GameOver;

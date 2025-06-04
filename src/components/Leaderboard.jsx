import React, { useState, useEffect } from 'react';

// Функция для получения цвета категории
const getCategoryColor = (category) => {
  switch (category) {
    case 'Sybil': return '#6c757d';
    case 'Approve?': return '#28a745';
    case 'Gmpc': return '#17a2b8';
    case 'Arcian': return '#fd7e14';
    case 'PARASOL ☂️': return '#fd7e14';
    case 'Loosty GM': return '#dc3545';
    case 'Well you a monster': return '#7952b3';
    case 'A BOT?': return '#ff6b6b';
    case 'LEGEND': return '#ffc107';
    default: return '#6c757d';
  }
};

// Функция для получения категории по очкам
const getCategory = (score) => {
  if (score < 1500) return 'Sybil';
  if (score < 3000) return 'Approve?';
  if (score < 5000) return 'Gmpc';
  if (score < 7000) return 'Arcian';
  if (score < 10000) return 'PARASOL ☂️';
  if (score < 15000) return 'Loosty GM';
  if (score < 30000) return 'Well you a monster';
  if (score < Infinity) return 'A BOT?';
  return 'LEGEND';
};

const Leaderboard = ({ playerName, visible, onClose }) => {
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [playerRank, setPlayerRank] = useState(null);
  const [playerScore, setPlayerScore] = useState(0);
  
  // Загружаем данные из localStorage при монтировании
  useEffect(() => {
    const loadLeaderboard = () => {
      let data = JSON.parse(localStorage.getItem('records') || '[]');
      
      // Сортируем по убыванию очков
      data.sort((a, b) => b.score - a.score);
      setRecords(data);
      
      // Находим данные текущего игрока
      const currentPlayerIndex = data.findIndex(r => r.name === playerName);
      setPlayerRank(currentPlayerIndex !== -1 ? currentPlayerIndex + 1 : null);
      setPlayerScore(currentPlayerIndex !== -1 ? data[currentPlayerIndex].score : 0);
    };
    
    if (visible) {
      loadLeaderboard();
    }
  }, [visible, playerName]);
  
  // Фильтруем записи по поисковому запросу
  const filteredRecords = searchTerm 
    ? records.filter(record => record.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : records;
  
  if (!visible) return null;
  
  return (
    <div className="leaderboard-overlay">
      <div className="leaderboard-container">
        <h2>Leaderboard</h2>
        
        {/* Информация о текущем игроке */}
        <div className="player-info">
          {playerRank !== null ? (
            <>
              <div className="player-stats">
                <div className="player-best">Your best: {playerScore} points</div>
                <div className="player-rank">
                  <span>Rank: {playerRank}</span>
                  <div 
                    className="category-badge" 
                    style={{ backgroundColor: getCategoryColor(getCategory(playerScore)) }}
                  >
                    {getCategory(playerScore)}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="no-record">You don't have a record yet. Play to get on the leaderboard!</div>
          )}
        </div>
        
        {/* Поле поиска */}
        <div className="search-container">
          <input 
            type="text" 
            placeholder="Search by nickname..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        {/* Таблица лидеров */}
        <div className="leaderboard-table-wrapper">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Nickname</th>
                <th>Score</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record, index) => {
                const isCurrentPlayer = record.name === playerName;
                const category = getCategory(record.score);
                
                let rankClass = '';
                if (index === 0) rankClass = 'gold-rank';
                else if (index === 1) rankClass = 'silver-rank';
                else if (index === 2) rankClass = 'bronze-rank';
                
                return (
                  <tr 
                    key={`${record.name}-${index}`}
                    className={isCurrentPlayer ? 'highlighted-row' : ''}
                  >
                    <td className={rankClass}>{index + 1}</td>
                    <td>{record.name}</td>
                    <td>{record.score}</td>
                    <td>
                      <div 
                        className="category-badge"
                        style={{ backgroundColor: getCategoryColor(category) }}
                      >
                        {category}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan="4" className="no-results">No results found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Информация о количестве записей */}
        <div className="total-players">
          Total players: {records.length}
        </div>
        
        <button className="close-btn" onClick={onClose}>
          Close
        </button>
      </div>
      
      <style jsx>{`
        .leaderboard-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .leaderboard-container {
          background-color: #4a2b7a;
          border-radius: 10px;
          padding: 20px;
          width: 90%;
          max-width: 1200px; /* Увеличено в 2 раза с 600px */
          max-height: 80vh;
          overflow-y: auto;
        }
        
        .player-info {
          background-color: rgba(138, 79, 255, 0.2);
          padding: 15px;
          margin-bottom: 15px;
          border-radius: 8px;
        }
        
        .player-stats {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .player-best {
          font-weight: bold;
          font-size: 16px; /* Фиксированный размер */
        }
        
        .player-rank {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 16px; /* Фиксированный размер */
        }
        
        .no-record {
          text-align: center;
          font-style: italic;
          color: #ffcc00;
          font-size: 16px; /* Фиксированный размер */
        }
        
        .search-container {
          margin-bottom: 15px;
        }
        
        .search-input {
          width: 100%;
          padding: 10px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background-color: rgba(255, 255, 255, 0.1);
          color: white;
        }
        
        .leaderboard-table-wrapper {
          margin: 15px 0;
          overflow-x: auto;
        }
        
        .leaderboard-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .leaderboard-table th,
        .leaderboard-table td {
          padding: 10px;
          text-align: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          font-size: 16px; /* Фиксированный размер для всех ячеек таблицы */
        }
        
        .leaderboard-table th {
          background-color: #8a2be2;
          font-size: 18px; /* Фиксированный размер для заголовков */
        }
        
        .leaderboard-table tr:nth-child(even) {
          background-color: rgba(255, 255, 255, 0.05);
        }
        
        .highlighted-row {
          background-color: rgba(138, 79, 255, 0.3) !important;
          font-weight: bold;
        }
        
        .gold-rank {
          color: gold;
          font-weight: bold;
          font-size: 16px; /* Фиксированный размер */
        }
        
        .silver-rank {
          color: silver;
          font-weight: bold;
          font-size: 16px; /* Фиксированный размер */
        }
        
        .bronze-rank {
          color: #cd7f32;
          font-weight: bold;
          font-size: 16px; /* Фиксированный размер */
        }
        
        .category-badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 14px; /* Фиксированный размер */
          font-weight: bold;
        }
        
        .no-results {
          text-align: center;
          font-style: italic;
          font-size: 16px; /* Фиксированный размер */
        }
        
        .total-players {
          text-align: center;
          font-style: italic;
          margin: 15px 0;
          color: rgba(255, 255, 255, 0.7);
          font-size: 16px; /* Фиксированный размер */
        }
        
        .close-btn {
          display: block;
          margin: 0 auto;
          padding: 10px 20px;
          background-color: #8a2be2;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          transition: background-color 0.3s ease;
          font-size: 16px; /* Фиксированный размер */
        }
        
        .close-btn:hover {
          background-color: #9845f5;
        }
      `}</style>
    </div>
  );
};

export default Leaderboard; 
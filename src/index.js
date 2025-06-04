// Импортируем полифилл для process
import './process-polyfill';

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Фикс для ошибки ethereum
if (typeof window.ethereum === 'undefined') {
  // Создаем пустой объект, если ethereum не существует
  Object.defineProperty(window, 'ethereum', {
    value: {},
    writable: false
  });
}

// Фикс для Buffer
if (typeof window.Buffer === 'undefined') {
  window.Buffer = require('buffer/').Buffer;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

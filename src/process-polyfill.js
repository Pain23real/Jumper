// Полифилл для process в браузере
import processBrowser from 'process/browser';
 
window.process = processBrowser;
export default processBrowser; 
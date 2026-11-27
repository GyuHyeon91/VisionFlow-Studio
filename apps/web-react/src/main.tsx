import ReactDOM from 'react-dom/client';
import App from './App';
import { clearResultCache } from './store/useStore';
import './styles/global.css';

// 새로고침/재접속 시 이전 세션의 분석 캐시를 버린다 (모델 변경 후 오래된 결과 방지)
clearResultCache();

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);

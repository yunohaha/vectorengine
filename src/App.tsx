import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, PlusSquare } from 'lucide-react';
import Gallery from './screens/Gallery';
import Editor from './screens/Editor';

function App() {
  return (
    <BrowserRouter>
      {/* Весь интерфейс с темным фоном */}
      <div className="min-h-screen bg-slate-950 text-white">
        
        {/* Шапка сайта (видна на всех страницах) */}
        <nav className="border-b border-slate-800 p-4">
          <div className="container mx-auto flex items-center justify-between">
            {/* Логотип и ссылка на галерею */}
            <Link to="/" className="flex items-center gap-2 text-xl font-bold hover:text-blue-400 transition">
              <Home size={24} />
              VectorEngine
            </Link>
            
            {/* Кнопка создания нового проекта */}
            <Link to="/editor/new" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition">
              <PlusSquare size={20} />
              Создать проект
            </Link>
          </div>
        </nav>

        {/* Анимация перехода между страницами */}
        <AnimatePresence mode="wait">
          <Routes>
            {/* Главная страница - Галерея */}
            <Route path="/" element={<Gallery />} />
            
            {/* Страница редактора с параметром id */}
            <Route path="/editor/:id" element={<Editor />} />
          </Routes>
        </AnimatePresence>
      </div>
    </BrowserRouter>
  );
}

export default App;
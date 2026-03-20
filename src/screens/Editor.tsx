import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Square, Circle, MousePointer, Palette, Layers } from 'lucide-react';

export default function Editor() {
  // Получаем id из адреса (например /editor/123)
  const { id } = useParams();
  const navigate = useNavigate();

  // Функция возврата в галерею
  const goBack = () => navigate('/');

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-[calc(100vh-73px)] flex flex-col bg-slate-900"
    >
      {/* Верхняя панель инструментов */}
      <header className="h-14 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900">
        <div className="flex items-center gap-4">
          {/* Кнопка "Назад" */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={goBack}
            className="p-2 hover:bg-slate-800 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </motion.button>
          
          {/* Название проекта */}
          <h2 className="text-lg font-semibold">
            {id === 'new' ? 'Новый проект' : `Проект №${id}`}
          </h2>
        </div>

        {/* Кнопка "Сохранить" */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition"
        >
          <Save size={18} />
          Сохранить
        </motion.button>
      </header>

      {/* Основная рабочая область */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Левая панель - инструменты */}
        <aside className="w-16 border-r border-slate-800 bg-slate-900 p-2 flex flex-col gap-2">
          {[
            { icon: MousePointer, name: 'Выбор' },
            { icon: Square, name: 'Квадрат' },
            { icon: Circle, name: 'Круг' },
            { icon: Palette, name: 'Цвет' },
            { icon: Layers, name: 'Слои' },
          ].map((tool, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.1, x: 5 }}
              whileTap={{ scale: 0.9 }}
              className="p-3 hover:bg-slate-800 rounded-lg transition group relative"
              title={tool.name}
            >
              <tool.icon size={20} className="text-slate-400 group-hover:text-white" />
            </motion.button>
          ))}
        </aside>

        {/* Центральная область - холст */}
        <main className="flex-1 bg-slate-800 p-8 overflow-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full h-full flex items-center justify-center text-slate-400">
            <p>Здесь будет холст для рисования</p>
          </div>
        </main>

        {/* Правая панель - свойства */}
        <aside className="w-64 border-l border-slate-800 bg-slate-900 p-4 overflow-auto">
          <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-slate-400">
            Свойства
          </h3>
          
          {/* Примеры настроек */}
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 block mb-2">Цвет</label>
              <div className="flex gap-2">
                {['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500'].map((color, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    className={`w-8 h-8 ${color} rounded-lg`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-400 block mb-2">Размер</label>
              <input type="range" min="1" max="50" className="w-full" />
            </div>

            <div>
              <label className="text-sm text-slate-400 block mb-2">Прозрачность</label>
              <input type="range" min="0" max="1" step="0.1" className="w-full" />
            </div>
          </div>
        </aside>
      </div>
    </motion.div>
  );
}
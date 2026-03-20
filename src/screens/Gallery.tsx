import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Folder, Plus } from 'lucide-react';

// Тип для проекта (чтобы TypeScript не ругался)
type Project = {
  id: string;
  name: string;
  date: string;
};

export default function Gallery() {
  // Состояние - массив проектов
  const [projects, setProjects] = useState<Project[]>([
    { id: '1', name: 'Мой первый рисунок', date: '2024-01-15' },
    { id: '2', name: 'Портрет кота', date: '2024-01-20' },
    { id: '3', name: 'Закат в горах', date: '2024-01-25' },
  ]);

  // Функция добавления нового проекта
  const addProject = () => {
    const newProject = {
      id: Date.now().toString(), // уникальный ID из времени
      name: `Проект ${projects.length + 1}`,
      date: new Date().toISOString().split('T')[0] // сегодняшняя дата
    };
    setProjects([...projects, newProject]);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container mx-auto p-6"
    >
      {/* Заголовок */}
      <h1 className="text-3xl font-bold mb-8">Мои проекты</h1>

      {/* Сетка проектов */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Карточки существующих проектов */}
        {projects.map((project) => (
          <Link to={`/editor/${project.id}`} key={project.id}>
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              className="bg-slate-800 rounded-xl p-6 cursor-pointer border-2 border-transparent hover:border-blue-500 transition-all"
            >
              <Folder size={48} className="text-blue-400 mb-4" />
              <h2 className="text-xl font-semibold">{project.name}</h2>
              <p className="text-slate-400 text-sm mt-2">{project.date}</p>
            </motion.div>
          </Link>
        ))}

        {/* Карточка для создания нового проекта */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={addProject}
          className="bg-slate-800/50 rounded-xl p-6 cursor-pointer border-2 border-dashed border-slate-600 hover:border-blue-500 flex flex-col items-center justify-center min-h-[200px] transition-all"
        >
          <Plus size={48} className="text-slate-400 mb-4" />
          <p className="text-slate-400">Создать новый проект</p>
        </motion.div>
      </div>
    </motion.div>
  );
}
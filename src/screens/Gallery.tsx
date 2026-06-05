import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../style.css';
import { initStorage, loadProjectIndex, saveProject } from '../lib/projectStorage';

interface Project {
  id: string;     
  name: string;    
  date: string;  
}

const Gallery: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      setIsLoading(true);
      await initStorage();
      const index = await loadProjectIndex();
      
      const loadedProjects = index.map(p => ({
        id: p.id,
        name: p.name,
        date: p.updatedAt
      }));
      
      setProjects(loadedProjects);
      setIsLoading(false);
    };
    
    loadProjects();
  }, []);

  const createProject = async () => {
    if (!newProjectName.trim()) return;
    
    const newId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const newProject: Project = {
      id: newId,
      name: newProjectName,
      date: now
    };
    
    await saveProject({
      metadata: {
        id: newId,
        name: newProjectName,
        createdAt: now,
        updatedAt: now
      },
      lineAlgorithm: 'bresenham',
      shapes: []
    });
    
    setProjects([...projects, newProject]);
    setNewProjectName('');
    setIsCreating(false);
  };

  return (
    <div className="gallery-container">
      <div className="gallery-header">
        <h1>Мои проекты</h1>
        
        {!isCreating ? (
          <button className="btn-primary" onClick={() => setIsCreating(true)}>
            + Создать проект
          </button>
        ) : (
          <div className="create-project-form">
            <input
              type="text"
              placeholder="Название проекта"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createProject()}
              autoFocus
            />
            <button onClick={createProject}>Создать</button>
            <button onClick={() => setIsCreating(false)}>Отмена</button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="empty-state">
          <p>Загрузка проектов...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <p>У вас пока нет проектов :/ </p>
          <button className="btn-primary" onClick={() => setIsCreating(true)}>
            Создать первый проект
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(project => (
            <Link to={`/editor/${project.id}`} key={project.id} className="project-card-link">
              <div className="project-card">
                <h3 className="project-card-title">{project.name}</h3>
                <p className="project-card-date">
                  {new Date(project.date).toLocaleDateString('ru-RU')}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Gallery;
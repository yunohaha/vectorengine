import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../style.css';


interface Project {
  id: string;     
  name: string;    
  date: string;  
}

const Gallery: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([
    { id: '1', name: 'Первая картиночка', date: new Date().toISOString() }
  ]);
  
  const [isCreating, setIsCreating] = useState(false);
  
  const [newProjectName, setNewProjectName] = useState('');

  const addProject = () => {
    if (newProjectName.trim()) {
      const newProject: Project = {
        id: Date.now().toString(),  
        name: newProjectName,
        date: new Date().toISOString()
      };
      setProjects([...projects, newProject]);
      setNewProjectName('');
      setIsCreating(false);
    }
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
              onKeyPress={(e) => e.key === 'Enter' && addProject()}
              autoFocus
            />
            <button onClick={addProject}>Создать</button>
            <button onClick={() => setIsCreating(false)}>Отмена</button>
          </div>
        )}
      </div>

      {projects.length === 0 ? (
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
                <div className="project-card-icon">📐</div>
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
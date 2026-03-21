import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../style.css';

const Editor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div className="editor-container">
      <header className="editor-toolbar">
        <button className="toolbar-btn" onClick={() => navigate('/')}>
          ← Назад
        </button>
        <h2 className="editor-title">
          {id === 'new' ? 'Новый проект' : `Редактирование проекта №${id}`}
        </h2>
        <button className="toolbar-btn primary">Сохранить</button>
      </header>


      <div className="editor-main">
        <aside className="tools-panel">
          <div className="tool-item active">
            <span>🖱️</span>
            <span>Выбор</span>
          </div>
          <div className="tool-item">
            <span>⬛</span>
            <span>Квадрат</span>
          </div>
          <div className="tool-item">
            <span>⚪</span>
            <span>Круг</span>
          </div>
          <div className="tool-item">
            <span>📏</span>
            <span>Линия</span>
          </div>
        </aside>

        <main className="canvas-area">
          <div className="canvas">
            <div className="canvas-placeholder">
              <p>Ваш холст</p>
              <p className="canvas-hint">Кликните, чтобы начать рисование</p>
            </div>
          </div>
        </main>

        <aside className="properties-panel">
          <h3>Свойства</h3>
          <div className="property-group">
            <label>Цвет</label>
            <input type="color" defaultValue="#f16382" />
          </div>
          <div className="property-group">
            <label>Толщина</label>
            <input type="range" min="1" max="10" defaultValue="2" />
          </div>
          <div className="property-group">
            <label>Непрозрачность</label>
            <input type="range" min="0" max="100" defaultValue="100" />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Editor;
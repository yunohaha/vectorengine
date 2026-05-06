import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../style.css';
import CanvasScene from '../components/CanvasScene';
import { type LineAlg } from '../lib/raster/RasterRenderer'; 
import type { Shape } from '../lib/shapes/Shape';
import { Rect } from '../lib/shapes/Rect';
import { Line } from '../lib/shapes/Line';
import { Oval } from '../lib/shapes/Oval';
import { Triangle } from '../lib/shapes/Triangle';
import { QuadraticBezier } from '../lib/shapes/QuadraticBezier';
import { CubicBezier } from '../lib/shapes/CubicBezier';
import { PathBezier } from '../lib/shapes/PathBezier';

import lineIcon from '../img/line.svg';
import rectIcon from '../img/rect.svg';
import ovalIcon from '../img/oval.svg';
import triangleIcon from '../img/triangle.svg';
import curvIcon from '../img/quadratic.svg';


const Editor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lineAlg, setLineAlg] = useState<LineAlg>('bresenham');
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);


  const getRandomPosition = () => {
    const minX = 150;
    const maxX = 1350;
    const minY = 100;
    const maxY = 700;

    return {
      x: minX + Math.random() * (maxX - minX),
      y: minY + Math.random() * (maxY - minY),
      rotation: Math.random() * Math.PI * 2
    };
  };

  const addRect = () => {
    const pos = getRandomPosition();
    const rect = new Rect(120, 80,
      { x: pos.x, y: pos.y, rotation: pos.rotation  },
      { fillStyle: '#da7fd2', fillOpacity: 0.7, strokeStyle: '#300428', strokeWidth: 2, strokeOpacity: 1 }
    );
    setShapes([...shapes, rect]);
    setSelectedId(rect.id);
  };

  const addLine = () => {
    const pos = getRandomPosition();
    const line = new Line(-60, 0, 60, 0,
      { x: pos.x, y: pos.y, rotation: pos.rotation },
      { strokeStyle: '#36032f', strokeWidth: 3, strokeOpacity: 1 }
    );
    setShapes([...shapes, line]);
    setSelectedId(line.id);
  };

  const addOval = () => {
    const pos = getRandomPosition();
    const oval = new Oval(70, 50,
      { x: pos.x, y: pos.y, rotation: pos.rotation },
      { fillStyle: '#e209ff', fillOpacity: 0.7, strokeStyle: '#333', strokeWidth: 2, strokeOpacity: 1 }
    );
    setShapes([...shapes, oval]);
    setSelectedId(oval.id);
  };

  const addTriangle = () => {
    const pos = getRandomPosition();
    const triangle = new Triangle(0, -50, -43, 25, 43, 25,
      { x: pos.x, y: pos.y, rotation: pos.rotation },
      { fillStyle: '#5d8bdf', fillOpacity: 0.7, strokeStyle: '#333', strokeWidth: 2, strokeOpacity: 1 }
    );
    setShapes([...shapes, triangle]);
    setSelectedId(triangle.id);
  };

  const addQuadraticBezier = () => {
    const pos = getRandomPosition();
    const bezier = new QuadraticBezier(
      { x: -60, y: 0 },
      { x: 0, y: -60 },
      { x: 60, y: 0 },
      { x: pos.x, y: pos.y, rotation: pos.rotation},
      { strokeStyle: '#471b99', strokeWidth: 3, strokeOpacity: 1 }
    );
    setShapes([...shapes, bezier]);
    setSelectedId(bezier.id);
  };

  const addCubicBezier = () => {
    const pos = getRandomPosition();
    const bezier = new CubicBezier(
      { x: -60, y: 0 },
      { x: -20, y: -60 },
      { x: 20, y: 60 },
      { x: 60, y: 0 },
      { x: pos.x, y: pos.y, rotation: 0, },
      { strokeStyle: '#3b0f04', strokeWidth: 3, strokeOpacity: 1 }
    );
    setShapes([...shapes, bezier]);
    setSelectedId(bezier.id);
  };

  const addPathBezier = () => {
    const pos = getRandomPosition();
    const path = new PathBezier(
      [   { x: -80, y: 0 },  
          { x: -60, y: -80 }, 
          { x: -20, y: -80 }, 
          { x: 0, y: 0 },    
          { x: 20, y: 80 },   
          { x: 60, y: 80 }, 
          { x: 80, y: 0 }     
      ],
  'bezier', true,
      { x: pos.x, y: pos.y, rotation: 0},
      {  fillOpacity: 0, strokeStyle: '#e66fb4', strokeWidth: 3, strokeOpacity: 1 }
    );
    setShapes([...shapes, path]);
    setSelectedId(path.id);
  };

  const deleteSelected = () => {
    if (selectedId) {
      setShapes(shapes.filter(s => s.id !== selectedId));
      setSelectedId(null);
    }
  };

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
          <div className="tool-group-title-1">Алгоритмы</div>
          <div className={`tool-item ${lineAlg === 'bresenham' ? 'active' : ''}`}
            onClick={() => setLineAlg('bresenham')}
          >
            <span>✎</span>
            <span>Брезенхем</span>
          </div>
          <div className={`tool-item ${lineAlg === 'wu' ? 'active' : ''}`}
            onClick={() => setLineAlg('wu')}
          >
            <span>📏</span>
            <span>By</span>
          </div>

          <div className="tool-group-title">Фигуры</div>
          <div className="tool-item" onClick={addRect}>
            <img src={rectIcon} alt="Прямоугольник" className="tool-icon" />
          </div>

          <div className="tool-item" onClick={addLine}>
            <img src={lineIcon} alt="Линия" className="tool-icon" />
          </div>

          <div className="tool-item" onClick={addOval}>
            <img src={ovalIcon} alt="Овал" className="tool-icon" />
          </div>
          
          <div className="tool-item" onClick={addTriangle}>
            <img src={triangleIcon} alt="Треугольник" className="tool-icon" />
          </div>
        
          <div className="tool-group-title">Кривые</div>
          <div className="tool-item" onClick={addQuadraticBezier}>
            <img src={curvIcon} alt="Квадро.Безье" className="tool-icon" />
            <span>Квадро</span>
          </div>
          <div className="tool-item" onClick={addCubicBezier}>
            <img src={curvIcon} alt="Квадро.Безье" className="tool-icon" />
            <span>Кубич.</span>
          </div>
          <div className="tool-item" onClick={addPathBezier}>
            <img src={curvIcon} alt="Квадро.Безье" className="tool-icon" />
            <span>Замкн.</span>
          </div>

          <div className="tool-group-title">Действия</div>
          <div className="tool-item" onClick={deleteSelected}>
            <span>Удалить</span>
          </div>
        </aside>

        <main className="canvas-area" style={{ position: 'relative' }}>
                    <CanvasScene 
                      lineAlg={lineAlg} 
                      shapes={shapes}
                      selectedId={selectedId}
                      onSelect={setSelectedId}
                    />
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
# Отчёт по лабораторной работе №6
- Цигельник Юля Б9124-09.03.03пикд(3)
- https://github.com/yunohaha/vectorengine/tree/lab-6

---

## Цель работы
Расширить систему геометрических фигур, разработанную в лабораторной работе №5, добавив новые типы объектов:

- Triangle — треугольник
- QuadraticBezier — квадратичная кривая Безье
- CubicBezier — кубическая кривая Безье
- PathBezier — составной путь (ломаная, кривые Безье, Catmull-Rom сплайны)

---
## Часть 1. Фигура Triangle (треугольник)
`Triangle` — замкнутая фигура, заданная тремя вершинами. Наследуется от Shape и реализует все его абстрактные методы.

Треугольник хранится относительно собственного центра. При создании вычисляется центр:

```ts
const cx = (x1 + x2 + x3) / 3;
const cy = (y1 + y2 + y3) / 3;
```
После этого каждая вершина сдвигается на этот центр — так треугольник оказывается в локальной системе координат с центром в (0,0).

Сначала вершины переводятся в экранные координаты через матрицу трансформации `getLocalToDeviceMatrix`. Затем:

- Заливка — треугольник закрашивается через fillPolygon
- Обводка — три стороны рисуются через strokeLine
```ts
for (let i = 0; i < points.length; i++) {
                const p1 = points[i];
                const p2 = points[(i + 1) % points.length];
                r.strokeLine(p1.x, p1.y, p2.x, p2.y, strokeRGBA, this.style.strokeWidth);
            }
```
**hitTest**
Используется метод знаков. Для каждой стороны треугольника вычисляется, с какой стороны от неё находится точка. Если точка со всех сторон находится одинаково (все знаки положительные или все отрицательные) — она внутри треугольника.
**Границы (bounds)**
Границы находятся по трём вершинам после трансформации в экранные координаты — берутся минимальные и максимальные значения X и Y.

---

## Часть 2. Кривые Безье
Кривые Безье задаются параметрически, где параметр `t` изменяется от 0 до 1.

### 2.1. QuadraticBezier (квадратичная кривая)К
Квадратичная кривая Безье задаётся тремя точками:
- `P0` — начало
- `P1` — управляющая точка (кривая тянется к ней, но не проходит через неё)
- `P2` — конец

**Формула:**
```ts
evalLocal(t: number): Point2D {
        const mt = 1 - t;
        const x = mt * mt * this.p0.x + 2 * mt * t * this.p1.x + t * t * this.p2.x;
        const y = mt * mt * this.p0.y + 2 * mt * t * this.p1.y + t * t * this.p2.y;
        return { x, y };
    }
```
**Аппроксимация**
Растровый рендерер не умеет рисовать кривые напрямую, поэтому кривая заменяется на ломаную из отрезков. Чем больше отрезков, тем точнее кривая:

```ts
 flattenLocal(segments: number = 32): Point2D[] {
        const points: Point2D[] = [];
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            points.push(this.evalLocal(t));
        }
        return points;
```
**Отрисовка и hitTest**
- Отрисовка — рисуются отрезки между соседними точками аппроксимации
- HitTest — проверяется расстояние от точки клика до каждого отрезка. Если расстояние меньше порога (5px или половина толщины линии), клик считается попаданием

### 2.2. CubicBezier (кубическая кривая)

Кубическая кривая Безье задаётся четырьмя точками:
- `P0` — начало
- `P1` и `P2` — управляющие точки
- `P3` — конец
Две управляющие точки дают больше гибкости — можно создавать S-образные кривые и сложные изгибы.

**Формула:**
```ts
 evalLocal(t: number): Point2D {
        const mt = 1 - t;
        const mt2 = mt * mt;
        const mt3 = mt2 * mt;
        const t2 = t * t;
        const t3 = t2 * t;
        
        const x = mt3 * this.p0.x + 3 * mt2 * t * this.p1.x + 3 * mt * t2 * this.p2.x + t3 * this.p3.x;
        const y = mt3 * this.p0.y + 3 * mt2 * t * this.p1.y + 3 * mt * t2 * this.p2.y + t3 * this.p3.y;
        return { x, y };
    }
```

---


## Часть 3. PathBezier (составной путь)

`PathBezier` — это контейнер для хранения последовательности точек, которые могут интерпретироваться по-разному в зависимости от режима. Поддерживает три режима:

Режим	| Описание
--------|---------
polyline	| Точки соединяются прямыми отрезками (ломаная)
bezier | 	Каждые 4 точки образуют кубическую кривую Безье
catmull	| Catmull-Rom сплайн — плавная кривая, проходящая через все точки

**Основные параметры:**
- `points` — массив опорных точек в локальных координатах
- `mode` — способ интерпретации точек (polyline, bezier, catmull)
- `closed` — замыкает линию (последняя точка соединяется с первой)

**Ключевые методы**
`flattenLocal()`
Превращает путь в ломаную из отрезков. Для каждого режима логика своя:
- `polyline` — просто копирует все точки
- `bezier` — разбивает на группы по 4 точки, каждую превращает в кубическую кривую Безье, затем аппроксимирует её отрезками
- `catmull` — сначала строит Catmull-Rom сплайн через все точки, преобразует его в кубические кривые Безье, затем аппроксимирует

`catmullRomToBezier()`
Преобразует один сегмент Catmull-Rom сплайна (между точками P1 и P2) в кубическую кривую Безье. Использует соседние точки P0 и P3 для определения касательных. Параметр `tension = 0`.5 задаёт "натяжение" кривой.

`drawRaster()`
Отрисовка пути:
Рисуются отрезки между соседними точками аппроксимации
 - Если `closed = true` — добавляется отрезок от последней точки к первой
 - Если `closed = true` и есть заливка — внутренняя область заливается через `fillPolygon`

`hitTest()`
Проверка попадания точки в путь:
- Сначала получаем аппроксимированную ломаную
- Для каждого отрезка вычисляем расстояние от точки до отрезка
- Если минимальное расстояние меньше порога (5px или половина толщины) — попадание
- Для замкнутого пути дополнительно проверяется отрезок между последней и первой точкой

`getBounds() / getLocalBounds()`
Границы вычисляются по всем точкам аппроксимации — берутся минимальные и максимальные значения X и Y.
---

## Часть 4. Интеграция с React

### 4.1. Editor.tsx 
```ts
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
          <div className="tool-group-title">Алгоритмы</div>
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
```
**Добавление фигур**
Каждая фигура создаётся со случайной позицией и поворотом. Функция `getRandomPosition() `генерирует координаты в пределах холста (150-1350 по X, 100-700 по Y) и случайный угол поворота.

Удаляется фигура с выбранным ID, после чего сбрасывается выделение.

**Панель инструментов**
Панель разделена на группы:
- Алгоритмы — переключение между Брезенхемом и Ву
- Фигуры — кнопки с иконками для добавления прямоугольника, линии, овала, треугольника
- Кривые — квадратичная, кубическая и замкнутая кривая
- Действия — удаление выделенной фигуры

Кнопки используют иконки из папки src/img
(Обновила левую панель)
При большом количестве инструментов левая панель может не помещаться по высоте. Для удобства работы добавлена вертикальная прокрутка.
![alt text](image-3.png)

---
 
## Часть 5. Тестирование
Для проверки корректности работы фигур были написаны unit-тесты с использованием Vitest.
| Группа | Тест | Что проверяет |
|--------|------|---------------|
| **Rect** | `hitTest` | Попадание точки внутрь/снаружи прямоугольника |
| | `bounds` | Корректность вычисления границ после трансформации |
| | `transform` | Преобразование точки через матрицу (поворот 90°) |
| **Line** | `hitTest` | Попадание точки на линию (на линии, рядом, далеко) |
| **Oval** | `hitTest` | Попадание точки в эллипс (центр, внутри, граница, снаружи) |
| **Triangle** | `hitTest` | Попадание точки в треугольник |
| | `bounds` | Локальные границы треугольника |
| **QuadraticBezier** | `eval` | Вычисление средней точки кривой (при t=0.5) |
| **CubicBezier** | `start/end` | Начало и конец кривой совпадают с P0 и P3 |
| **PathBezier** | `polyline` | Количество точек аппроксимации ломаной |
| | `closed` | Флаг замкнутости работает |

![alt text](image.png)

## Вывод
В ходе выполнения лабораторной работы №6 система геометрических фигур была расширена.

**Скриншот 1 — Все фигуры на холсте**
![alt text](image-1.png)

**Скриншот 2 — Выделение фигуры**
![alt text](image-2.png)

**Скриншот 3— все фигуры в рандомных местах с рандомным поворотом(по клику на левой панели)**
![alt text](image-4.png)
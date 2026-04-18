
# Отчёт по лабораторным №1 и №2

-  Цигельник Юля Б9124-09.03.03пикд(3)
- https://github.com/yunohaha/vectorengine/tree/lab-1-2

---

# Лабораторная работа №1
Целью первой лабораторной работы является установка и настройка необходимого программного обеспечения для разработки кроссплатформенного настольного приложения с использованием фреймворка Tauri, а также создание базовой структуры проекта.


### Технологический стек проекта

**Node.js** — среда выполнения JavaScript, позволяющая запускать JavaScript-код вне браузера. Вместе с менеджером пакетов npm (Node Package Manager) используется для управления зависимостями фронтенд-части приложения.

**Rust** — системный язык программирования, разработанный Mozilla, обеспечивающий высокую производительность и безопасность памяти без сборщика мусора. Cargo — менеджер пакетов для Rust, аналог npm.

**Tauri Framework** — фреймворк для создания кроссплатформенных настольных приложений (Windows, macOS, Linux). Архитектура Tauri объединяет фронтенд на React с бэкендом на Rust, используя IPC (Inter-Process Communication) для взаимодействия между ними.

**TypeScript** — типизированное надмножество JavaScript, добавляющее статическую типизацию. Позволяет обнаруживать ошибки на этапе компиляции, что повышает надежность кода.

**Vite** — современный инструмент сборки, обеспечивающий быструю разработку благодаря технологии HMR (Hot Module Replacement), которая позволяет обновлять код без полной перезагрузки приложения.

**React** — библиотека для построения пользовательских интерфейсов, основанная на компонентном подходе. Использует виртуальный DOM для эффективного обновления интерфейса.

**React Router** — библиотека для маршрутизации в React-приложениях, позволяющая создавать навигацию между страницами без перезагрузки.

### 3. Результаты

В ходе выполнения лабораторной работы №1 были достигнуты следующие результаты:

#### 1. Установлено необходимое ПО

| Компонент | Версия |
|-----------|--------|
| Node.js | v20.10.0 |
| npm | v10.2.3 |
| Rust | 1.75.0 |
| Cargo | 1.75.0 |
| Microsoft C++ Build Tools | Последняя версия |

#### 2. Создана структура проекта

![alt text](image.png)

#### 3. Настроены конфигурационные файлы

| Файл | Назначение |
|------|------------|
| `package.json` | Управление зависимостями и скриптами |
| `tsconfig.json` | Настройки компиляции TypeScript |
| `vite.config.ts` | Конфигурация сборщика Vite |

#### 4. Приложение успешно запущено

```powershell
npm run tauri dev
```
---
# Лабораторная работа №2

**React** — это библиотека для создания пользовательских интерфейсов, разработанная компанией Facebook. Основная идея React — компонентный подход.

**Компонент** — это независимая часть интерфейса, которая:
 - Имеет свою логику
 - Может использоваться многократно
 - Может получать данные через пропсы
 - Может хранить свое состояние

**JSX (JavaScript XML)** — это расширение JavaScript, позволяющее писать HTML-подобный код внутри JavaScript. TSX — это то же самое, но с поддержкой TypeScript.

**Хуки** — это специальные функции, которые позволяют использовать состояние и другие возможности React в функциональных компонентах.

**useState** — управление состоянием
```useState``` позволяет хранить данные, которые могут меняться. При изменении этих данных компонент автоматически перерисовывается.

**React Router:** система, которая автоматически:
- Отслеживает URL и синхронизирует с UI.
- Позволяет декларативно описать маршруты (URL → компонент).
- Управляет историей (Back/Forward), параметрами, поисковой строкой и вложенными маршрутами.

**Framer Motion** — это самая популярная библиотека для создания анимаций в React.
Она превращает статичные «картонные» страницы в современное приложение с
плавными откликами.

## 5.1 Подготовка (Маршрутизация)
#### Цель этапа:
 - Научить приложение переключаться между экранами без перезагрузки страницы. Для этого используется библиотека React Router, которая позволяет синхронизировать URL с отображаемым компонентом.

 **Шаг 1: Установка зависимостей**
Для работы навигации необходимо установить следующие пакеты:

```npm install react-router-dom```

**react-router-dom** — библиотека для маршрутизации в React-приложениях. Позволяет создавать навигацию между страницами без перезагрузки.

**Шаг 2: Создание базовой маршрутизации**
В файле ```src/App.tsx``` была создана базовая структура маршрутизации с использованием компонентов BrowserRouter, Routes и Route.
```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Gallery from './screens/Gallery';
import Editor from './screens/Editor';
import './style.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <NavBar />
        
        <Routes>
          <Route path="/" element={<Gallery />} />
          <Route path="/editor/:id" element={<Editor />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
``` 

## 5.2 Экран «Галерея» (Управление состоянием)
Экран «Галерея» является главной страницей приложения. Он выполняет следующие функции:
- Отображение списка всех проектов пользователя
- Создание новых проектов
- Переход в редактор выбранного проекта
####  Создание файла компонента

В папке `src/screens/` создан файл `Gallery.tsx`, содержащий компонент галереи.

**Структура компонента:**

```tsx
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
```
**Реализованные функции:**

***1. Отображение списка проектов***
 - Проекты отображаются в виде сетки (grid). Каждая карточка содержит:
    -   Иконку проекта 

    - Название проекта

- Дату создания в формате "дд.мм.гггг"

***2. Создание нового проекта***

- При нажатии на кнопку «+ Создать проект»:

- Появляется форма ввода

- Пользователь вводит название

- При нажатии Enter или кнопки «Создать» проект добавляется в список

***3. Навигация в редактор***

- При клике на карточку проекта происходит переход на страницу /editor/{id}, где {id} — уникальный идентификатор проекта.


**Результат**
На данном этапе создан полноценный экран галереи, который:
- Показывает список проектов
- Позволяет создавать новые проекты
- Обеспечивает переход в редактор
- Имеет плавные анимации при взаимодействии

Скриншот экрана галереи:
![Скриншот экрана галереи](image-1.png)

## 5.3 Экран «Редактор» (Компоновка UI)

Экран «Редактор» является основным рабочим пространством приложения. Он предоставляет пользователю интерфейс для создания и редактирования векторных изображений. Экран разделен на функциональные зоны:
| Зона | Назначение |
|------|------------|
| Верхняя панель | Управление (навигация, сохранение) |
| Левая панель | Выбор инструментов рисования |
| Центральная зона | Холст для рисования |
| Правая панель | Настройка свойств инструментов |

#### Создание файла компонента

В папке `src/screens/` создан файл `Editor.tsx`, содержащий компонент редактора.

```tsx
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
```
#### Пояснение ключевых элементов
```tsx
const { id } = useParams<{ id: string }>();
```
- Хук useParams извлекает параметры из URL.
```tsx
const navigate = useNavigate();
```
- Хук useNavigate возвращает функцию для перехода между страницами.
#### Компоновка интерфейса (Flexbox)
Для расположения трех панелей используется Flexbox:
```.editor-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}
```

Скриншот экрана редактора:
![alt text](image-2.png)

---


## Итоговый вывод

В ходе выполнения лабораторной работы №2 было разработано React-приложение с двумя экранами: **Галерея** и **Редактор**.

**Реализованный функционал:**

- **Маршрутизация** — с помощью React Router организована навигация между страницами без перезагрузки. Параметры URL передаются в компоненты через `useParams`.

- **Галерея** — отображает список проектов в виде карточек. Реализовано создание новых проектов через форму ввода. При клике на карточку происходит переход в редактор с передачей ID проекта.

- **Редактор** — имеет четыре функциональные зоны: верхняя панель (навигация и сохранение), левая панель инструментов, центральный холст, правая панель свойств. ID проекта отображается в заголовке.

- **Анимации** — с помощью Framer Motion добавлены плавные переходы между страницами (Fade-in) и анимация карточек при наведении.

- **Стилизация** — интерфейс выполнен в темной теме с использованием Flexbox для раскладки и CSS для детальной стилизации.


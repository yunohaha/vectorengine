# Отчёт по лабораторной работе №8
- Цигельник Юля Б9124-09.03.03пикд(3)
- https://github.com/yunohaha/vectorengine/tree/lab-8

---

В лабораторной работе в графический редактор была добавлена функциональность сохранения и загрузки проектов. Теперь пользователь может сохранять свои работы на диск и открывать их после перезапуска приложения.


## Что было добавлено

### Система хранения проектов

Был создан модуль `projectStorage.ts`, который обеспечивает:

Функция | 	Назначение |
--------|--------------|
initStorage() | Создание папки для проектов в документах пользователя |
saveProject()	| Сохранение проекта в JSON-файл |
loadProject()	| Загрузка проекта из файла по ID |
loadProjectIndex()	| Получение списка всех сохраненных проектов |

### Восстановление фигур

Создан модуль `shapeFactory.ts` с функцией shapeFromJSON(), которая:

1. Определяет тип фигуры по полю type
2. Создает экземпляр соответствующего класса
3. Восстанавливает все параметры
4. Возвращает готовую фигуру для отображения


### Плагины Tauri
Для работы с файловой системой были установлены и настроены плагины:

```
# Frontend
npm install @tauri-apps/plugin-fs
npm install @tauri-apps/plugin-dialog

# Backend (Rust)
cargo add tauri-plugin-fs
cargo add tauri-plugin-dialog
```
###  Настройка прав доступа

В файле `capabilities/default.json` были добавлены разрешения:

Разрешение	 | Назначение  |
-------------|-------------|
fs:allow-mkdir	| Создание папки для проектов |
fs:allow-read-text-file	| Чтение файлов проектов |
fs:allow-write-text-file	| Запись/сохранение проектов |
fs:allow-exists	| Проверка существования файла

### Изменения в компонентах
**Editor.tsx**
Добавленные состояния:
```ts
const [projectName, setProjectName] = useState<string>('Новый проект');
const [projectId, setProjectId] = useState<string | null>(null);
const [isSaving, setIsSaving] = useState<boolean>(false);
const [isLoading, setIsLoading] = useState<boolean>(true);
```
Добавленная функция:

```ts
const handleSave = async () => {
    // Сбор данных проекта
    const projectData = {
        metadata: { id, name, createdAt, updatedAt },
        lineAlgorithm: lineAlg,
        shapes: shapes.map(shape => shape.toJSON())
    };
    await saveProject(projectData);
};
```

**Gallery.tsx**
Изменения:
- Загрузка реальных проектов из файловой системы
- Сохранение новых проектов в папку на диске
- Отображение динамического списка проектов
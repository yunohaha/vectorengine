# Отчёт по лабораторной работе №5
- Цигельник Юля Б9124-09.03.03пикд(3)
- https://github.com/yunohaha/vectorengine/tree/lab-5

---

## Цель работы
Спроектировать и реализовать базовую систему геометрических фигур для векторного редактора, включающую:
- Базовый класс Shape с поддержкой трансформаций (перемещение, поворот, масштаб)
- Классы конкретных фигур: Rect, Line, Oval
- Механизмы отрисовки, проверки попадания точки и вычисления гран

---

## Часть 1. Архитектура системы

### 1.1. Основные сущности

Сущность |	Назначение
---------|------------
Transform	|Описывает трансформацию фигуры: положение (x, y), поворот (rotation), масштаб (scaleX, scaleY)
Bounds |	Ограничивающий прямоугольник фигуры в экранных координатах
ShapeStyle	| Стилевое оформление: цвет заливки, цвет обводки, прозрачность, толщина

### 1.2. Схема классов

```text
Shape (абстрактный)
├── Rect      (прямоугольник)
├── Line      (линия/отрезок)
├── Oval      (овал/эллипс)
├── Triangle  (треугольник) — во 2-й части
└── Bezier    (кривые) — во 2-й части
```
## Часть 2. Реализация базового класса Shape

**Transform (трансформация)**
```ts
export interface Transform {
    x: number;        // смещение по X
    y: number;        // смещение по Y
    rotation: number; // угол поворота (в радианах)
    scaleX: number;   // масштаб по X
    scaleY: number;   // масштаб по Y
} 
```
Назначение: Описывает, как фигура преобразуется в пространстве. Благодаря этому фигура может быть перемещена, повернута и масштабирована.

**ShapeStyle (стили)**

```ts
export interface ShapeStyle {
    fillStyle: string;     // цвет заливки (HEX)
    fillOpacity: number;   // прозрачность заливки (0-1)
    strokeStyle: string;   // цвет обводки (HEX)
    strokeWidth: number;   // толщина обводки в пикселях
    strokeOpacity: number; // прозрачность обводки (0-1)
}
```

**Bounds (границы)**

```ts
export interface Bounds {
    minX: number;  // левая граница
    minY: number;  // верхняя граница
    maxX: number;  // правая граница
    maxY: number;  // нижняя граница
}
```
Назначение: Ограничивающий прямоугольник фигуры в экранных координатах. Используется для быстрой отрисовки и hit-тестирования.

###  Конструктор класса Shape

```ts
constructor(transform?: Partial<Transform>, style?: Partial<ShapeStyle>) {
    this.id = crypto.randomUUID();  // уникальный идентификатор
    this.transform = {
        x: transform?.x ?? 0,
        y: transform?.y ?? 0,
        rotation: transform?.rotation ?? 0,
        scaleX: transform?.scaleX ?? 1,
        scaleY: transform?.scaleY ?? 1,
    };
    this.style = {
        fillStyle: style?.fillStyle ?? '#000000',
        fillOpacity: style?.fillOpacity ?? 1,
        strokeStyle: style?.strokeStyle ?? '#000000',
        strokeWidth: style?.strokeWidth ?? 1,
        strokeOpacity: style?.strokeOpacity ?? 1,
    };
}
```

Пояснение:
- crypto.randomUUID() — генерирует уникальный ID для каждой фигуры
- Partial<Transform> — позволяет передавать только часть полей (остальные берутся по умолчанию)
- ?? (nullish coalescing) — если значение не передано, ставится значение по умолчанию

### Методы трансформации координат

**getLocalToDeviceMatrix()**

```ts
getLocalToDeviceMatrix(): Mat3 {
    const { x, y, rotation, scaleX, scaleY } = this.transform;
    return mat3.fromTransform(x, y, rotation, scaleX, scaleY);
}
```
Возвращает матрицу 3×3, которая переводит точку из локальных координат фигуры в экранные координаты.
Локальные координаты фигуры простые (например, для прямоугольника: от -50 до 50). А на экране фигура может быть повёрнута, увеличена и сдвинута. Матрица выполняет это преобразование за один шаг.

**getDeviceToLocalMatrix()**

```ts
getDeviceToLocalMatrix(): Mat3 | null {
    return mat3.invert(this.getLocalToDeviceMatrix());
}
```
Возвращает обратную матрицу — переводит точку из экранных координат в локальные.

Используется в hitTest() — когда пользователь кликает по экрану, нужно понять, попал ли клик в фигуру. Для этого точку клика переводят в локальные координаты фигуры и проверяют простое условие.

**transformPointToDevice() и transformPointToLocal()**
```ts
transformPointToDevice(px: number, py: number): Point2D {
    return mat3.transformPoint(this.getLocalToDeviceMatrix(), px, py);
}

transformPointToLocal(px: number, py: number): Point2D | null {
    const inv = this.getDeviceToLocalMatrix();
    if (!inv) return null;
    return mat3.transformPoint(inv, px, py);
}
```
Умножают одну точку на соответствующую матрицу.

**getCenter()**
```ts
getCenter(): Point2D {
    const bounds = this.getBounds();
    return {
        x: (bounds.minX + bounds.maxX) / 2,
        y: (bounds.minY + bounds.maxY) / 2,
    };
}
```
Вычисляет центр фигуры как среднюю точку ограничивающего прямоугольника.

**resizeFromDeviceAABB()**
```ts
resizeFromDeviceAABB(minX, minY, maxX, maxY): void {
    const center = this.getCenter();
    const newCenter = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
    
    this.transform.x += newCenter.x - center.x;
    
    const oldBounds = this.getBounds();
    const oldWidth = oldBounds.maxX - oldBounds.minX;
    const oldHeight = oldBounds.maxY - oldBounds.minY;
    const newWidth = maxX - minX;
    const newHeight = maxY - minY;
    
    if (oldWidth > 0) this.transform.scaleX *= newWidth / oldWidth;
    if (oldHeight > 0) this.transform.scaleY *= newHeight / oldHeight;
}
```
Изменяет размер и положение фигуры по новым экранным границам. Используется при ручном изменении размера фигуры.
Алгоритм:
1. Находим текущий центр фигуры
2. Находим новый центр по переданным границам
3. Сдвигаем фигуру на разницу центров
4. Вычисляем новые масштабы как отношение новой ширины/высоты к старой

**Абстрактные методы**

```ts
abstract clone(): Shape;                    // создание копии
abstract drawRaster(r: RasterRenderer): void;  // отрисовка
abstract hitTest(px: number, py: number): boolean;  // проверка попадания
abstract getBounds(): Bounds;               // границы в экранных координатах
abstract getLocalBounds(): Bounds;          // границы в локальных координатах
abstract toJSON(): object;                  // сериализация
```
Эти методы должны быть реализованы в каждом классе-наследнике (Rect, Line, Oval), потому что каждая фигура имеет свою геометрию и способ отрисовки.
---

## Часть 3. Фигура Rect (прямоугольник)
### 3.1. Назначение класса Rect
`Rect` — это класс, представляющий прямоугольник. Он наследуется от базового класса `Shape` и реализует все его абстрактные методы.

Что хранит прямоугольник:
- `width` — ширина
- `height` — высота

### 3.2. Конструктор

```ts
constructor(width: number, height: number, transform?: Partial<Transform>, style?: Partial<ShapeStyle>) {
    super(transform, style);
    this.width = width;
    this.height = height;
}
```
Параметры:
Параметр | Тип |	Описание
---------|-----|------------
width	| number |	Ширина прямоугольника
height |	number	| Высота прямоугольника
transform	| Partial<Transform>	| Позиция, поворот, масштаб (необязательно)
style	 | Partial<ShapeStyle>| 	Стили (цвета, прозрачность) (необязательно)

### 3.3. Локальная геометрия
В локальной системе координат прямоугольник центрирован в точке (0,0). Это упрощает трансформации.

Углы прямоугольника в локальных координатах:

```text
        (-w/2, -h/2)          (w/2, -h/2)
               ┌─────────────────┐
               │                 │
               │       ●         │  ← центр (0,0)
               │      (0,0)      │
               │                 │
               └─────────────────┘
        (-w/2, h/2)           (w/2, h/2)
```
Реализация:

```typescript
getLocalCorners(): Point2D[] {
    const w2 = this.width / 2;   // половина ширины
    const h2 = this.height / 2;  // половина высоты
    return [
        { x: -w2, y: -h2 },  // левый верхний
        { x:  w2, y: -h2 },  // правый верхний
        { x:  w2, y:  h2 },  // правый нижний
        { x: -w2, y:  h2 },  // левый нижний
    ];
}
```

### 3.4. Преобразование в экранные координаты
```ts
getDeviceCorners(): Point2D[] {
    const matrix = this.getLocalToDeviceMatrix();
    return this.getLocalCorners().map(p => mat3.transformPoint(matrix, p.x, p.y));
}
```
1. Получаем матрицу трансформации (из Shape)
2. Применяем её к каждому углу
3. Получаем экранные координаты углов с учётом поворота, масштаба и сдвига

### 3.5. Отрисовка (drawRaster)

```ts
drawRaster(r: RasterRenderer): void {
    const corners = this.getDeviceCorners();

    const fillRGBA = hexToRGBA(this.style.fillStyle, Math.round(this.style.fillOpacity * 255));
    const strokeRGBA = hexToRGBA(this.style.strokeStyle, Math.round(this.style.strokeOpacity * 255));

    // 1. Рисуем заливку
    if (this.style.fillOpacity > 0) {
        r.fillPolygon(corners, fillRGBA);
    }

    // 2. Рисуем обводку
    if (this.style.strokeWidth > 0 && this.style.strokeOpacity > 0) {
        for (let i = 0; i < corners.length; i++) {
            const p1 = corners[i];
            const p2 = corners[(i + 1) % corners.length];
            r.strokeLine(p1.x, p1.y, p2.x, p2.y, strokeRGBA, this.style.strokeWidth);
        }
    }
}
```
Алгоритм отрисовки:

Шаг |	Действие	| Условие
----|---------------|--------
1	| Получить экранные координаты углов	| —
2	| Преобразовать HEX-цвета в RGBA	| `hexToRGBA()`
3	| Нарисовать заливку	| если `fillOpacity > 0`
4	| Нарисовать обводку (4 стороны)	| если `strokeWidth > 0` и `strokeOpacity > 0`
Обводка рисуется как 4 отдельных отрезка, соединяющих углы по порядку. Последняя сторона соединяет последний угол с первым благодаря (i + 1) % corners.length.

### 3.6. Проверка попадания (hitTest)
```ts
hitTest(px: number, py: number): boolean {
    const local = this.transformPointToLocal(px, py);
    if (!local) return false;

    const w2 = this.width / 2;
    const h2 = this.height / 2;
    return local.x >= -w2 && local.x <= w2 && local.y >= -h2 && local.y <= h2;
}
```
- Экранная точка (px, py) =>  
- transformPointToLocal()  ← обратная матрица =>       
- Локальная точка (lx, ly) =>      
- Проверка: -w/2 ≤ lx ≤ w/2 И -h/2 ≤ ly ≤ h/2 =>      
- true => попадание, false => мимо

### 3.7. Вычисление границ (getBounds)

```ts
getBounds(): Bounds {
    const corners = this.getDeviceCorners();
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    for (const p of corners) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
    }
    return { minX, minY, maxX, maxY };
}
```
Находит минимальные и максимальные значения X и Y среди всех углов. Это даёт ограничивающий прямоугольник (AABB — Axis-Aligned Bounding Box) фигуры.

### 3.8. Локальные границы (getLocalBounds)

```ts
getLocalBounds(): Bounds {
    const w2 = this.width / 2;
    const h2 = this.height / 2;
    return { minX: -w2, minY: -h2, maxX: w2, maxY: h2 };
}
```
Возвращает границы прямоугольника в локальной системе координат (без учёта трансформации). Всегда прямоугольник, центрированный в (0,0).
Используется для вычислений, где не нужен поворот

### 3.9. Клонирование (clone)

```ts
clone(): Rect {
    return new Rect(this.width, this.height, { ...this.transform }, { ...this.style });
}
```
Создаёт полную копию фигуры с теми же параметрами.

## Часть 4. Фигура Line (линия)

### 4.1. Назначение класса Line
`Line` — класс, представляющий отрезок линии. Наследуется от `Shape` и реализует все абстрактные методы.

Что хранит линия:
- `(x1, y1)` — начальная точка
- `(x2, y2)` — конечная точка

### 4.2. Конструктор
```ts
constructor(x1: number, y1: number, x2: number, y2: number, 
            transform?: Partial<Transform>, style?: Partial<ShapeStyle>) {
    super(transform, style);
    this.x1 = x1; this.y1 = y1;
    this.x2 = x2; this.y2 = y2;
}
```
### 4.3. Локальные и экранные точки
```ts
getLocalPoints(): Point2D[] {
    return [{ x: this.x1, y: this.y1 }, { x: this.x2, y: this.y2 }];
}

getDevicePoints(): Point2D[] {
    const matrix = this.getLocalToDeviceMatrix();
    return this.getLocalPoints().map(p => mat3.transformPoint(matrix, p.x, p.y));
}
```
Принцип: Локальные точки => матрица трансформации => экранные точки.

### 4.4. Отрисовка (drawRaster)

```ts
drawRaster(r: RasterRenderer): void {
    const [p1, p2] = this.getDevicePoints();
    const strokeRGBA = hexToRGBA(this.style.strokeStyle, Math.round(this.style.strokeOpacity * 255));
    
    if (this.style.strokeWidth > 0 && this.style.strokeOpacity > 0) {
        r.strokeLine(p1.x, p1.y, p2.x, p2.y, strokeRGBA, this.style.strokeWidth);
    }
} 
```
- Получает экранные координаты концов линии
- Преобразует HEX-цвет в RGBA
- Рисует отрезок через strokeLine (с учётом толщины)

### 4.5. Проверка попадания (hitTest)
```ts
hitTest(px: number, py: number): boolean {
    const local = this.transformPointToLocal(px, py);
    if (!local) return false;
    
    const ax = this.x2 - this.x1, ay = this.y2 - this.y1;
    const len2 = ax * ax + ay * ay;
    
    if (len2 === 0) {
        // Вырожденный случай: линия-точка
        return Math.hypot(local.x - this.x1, local.y - this.y1) < this.style.strokeWidth / 2;
    }
    
    // Проекция точки на отрезок (параметр t от 0 до 1)
    let t = ((local.x - this.x1) * ax + (local.y - this.y1) * ay) / len2;
    t = Math.max(0, Math.min(1, t));
    
    // Ближайшая точка на отрезке
    const projX = this.x1 + t * ax;
    const projY = this.y1 + t * ay;
    
    // Расстояние от точки до отрезка
    const dist = Math.hypot(local.x - projX, local.y - projY);
    return dist < this.style.strokeWidth / 2;
}
```

Алгоритм:

Шаг | 	Действие
----|------------
1	| Перевести экранную точку в локальные координаты
2	| Вычислить вектор направления (ax, ay) и его длину
3	| Найти проекцию точки на линию (параметр t)
4	| Ограничить t диапазоном [0, 1] (попадание на отрезок, а не на всю прямую)
5	| Найти ближайшую точку на отрезке
6	| Если расстояние меньше половины толщины линии → попадание

### 4.6. Границы (getBounds и getLocalBounds)

```ts
getBounds(): Bounds {
    const points = this.getDevicePoints();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of points) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
    }
    return { minX, minY, maxX, maxY };
}

getLocalBounds(): Bounds {
    return {
        minX: Math.min(this.x1, this.x2),
        minY: Math.min(this.y1, this.y2),
        maxX: Math.max(this.x1, this.x2),
        maxY: Math.max(this.y1, this.y2),
    };
}
```
`getLocalBounds()` — границы в локальных координатах (без трансформации)
`getBounds()` — границы на экране (с учётом поворота, масштаба, сдвига)

### 4.7. Клонирование и сериализация

```ts
clone(): Line {
    return new Line(this.x1, this.y1, this.x2, this.y2, 
                    { ...this.transform }, { ...this.style });
}

toJSON(): object {
    return {
        type: 'line',
        id: this.id,
        x1: this.x1, y1: this.y1,
        x2: this.x2, y2: this.y2,
        transform: { ...this.transform },
        style: { ...this.style },
    };
}
```
---  

## Часть 5. Фигура Oval (овал/эллипс)

### 5.1. Параметры
Овал хранит:
- `rx` — радиус по оси X
- `ry` — радиус по оси Y

### 5.2. Аппроксимация
Эллипс рисуется как многоугольник из N точек (по умолчанию 32):
```typescript
x = rx × cos(θ)
y = ry × sin(θ)
θ ∈ [0, 2π]
```

### 5.3. Hit test (уравнение эллипса)

```typescript
hitTest(px, py) {
    const local = this.transformPointToLocal(px, py);
    const dx = local.x / rx, dy = local.y / ry;
    return dx*dx + dy*dy ≤ 1;
}
```
---
## Часть 6. Интеграция с React

### 6.1. Компонент CanvasScene

Для отображения фигур на холсте используется компонент `CanvasScene.tsx`. Он выполняет следующие задачи:
- Создаёт экземпляр `RasterRenderer` из ЛР №4
- Хранит массив фигур и отрисовывает их в каждом кадре
- Поддерживает переключение алгоритмов рисования линий (Брезенхем / Ву)

```ts
const [shapes] = useState<Shape[]>([
        // Прямоугольник 150×100, повёрнутый на 0.3 рад (~17°)
        new Rect(150, 100, { x: 300, y: 200, rotation: 0.3 }, {
            fillStyle: '#FF6B6B', fillOpacity: 0.8,
            strokeStyle: '#333333', strokeWidth: 3, strokeOpacity: 1,
        }),
        // Линия от (-50,-50) до (50,50), сдвинутая в (500,150)
        new Line(-50, -50, 50, 50, { x: 500, y: 150 }, {
            strokeStyle: '#4ECDC4', strokeWidth: 4, strokeOpacity: 1,
        }),
        // Овал с радиусами 80 и 50, повёрнутый на 0.5 рад (~29°)
        new Oval(80, 50, { x: 500, y: 350, rotation: 0.5 }, {
            fillStyle: '#45B7D1', fillOpacity: 0.7,
            strokeStyle: '#2C3E50', strokeWidth: 2, strokeOpacity: 1,
        }),
    ]);
 ```
 ## Часть 7. Тестирование

### 7.1. Назначение тестов
Для проверки корректности работы фигур были написаны unit-тесты, проверяющие:
- `hitTest()` — попадание точки в фигуру
- `getBounds()` — вычисление границ
- `transformPointToDevice()` — преобразование координат

```ts
import { test, expect } from 'vitest';
import { Rect } from './Rect';
import { Line } from './Line';
import { Oval } from './Oval';

test('Rect hitTest', () => {
    const rect = new Rect(100, 100, { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 });
    
    expect(rect.hitTest(0, 0)).toBe(true);      
    expect(rect.hitTest(40, 40)).toBe(true);    
    expect(rect.hitTest(60, 60)).toBe(false);  
});

test('Rect bounds', () => {
    const rect = new Rect(100, 100, { x: 50, y: 50, rotation: 0, scaleX: 1, scaleY: 1 });
    const bounds = rect.getBounds();
    
    expect(bounds.minX).toBeCloseTo(0);
    expect(bounds.minY).toBeCloseTo(0);
    expect(bounds.maxX).toBeCloseTo(100);
    expect(bounds.maxY).toBeCloseTo(100);
});

test('Line hitTest', () => {
    const line = new Line(-50, 0, 50, 0, { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 });
    
    expect(line.hitTest(0, 0)).toBe(true);      
    expect(line.hitTest(30, 0)).toBe(true);    
    expect(line.hitTest(30, 5)).toBe(false);  
});

test('Oval hitTest', () => {
    const oval = new Oval(50, 30, { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 });
    
    expect(oval.hitTest(0, 0)).toBe(true);      
    expect(oval.hitTest(40, 0)).toBe(true);     
    expect(oval.hitTest(50, 0)).toBe(true);     
    expect(oval.hitTest(60, 0)).toBe(false);    
});

test('Rect transform', () => {
    const rect = new Rect(100, 100, { x: 100, y: 100, rotation: Math.PI / 2, scaleX: 1, scaleY: 1 });
    
    
    const point = rect.transformPointToDevice(0, 0);
    expect(point.x).toBeCloseTo(100);
    expect(point.y).toBeCloseTo(100);
});
```

![alt text](image.png)
![alt text](image-1.png)
---

## Вывод
В ходе выполнения лабораторной работы №5 спроектирована и реализована система геометрических фигур для векторного редактора.
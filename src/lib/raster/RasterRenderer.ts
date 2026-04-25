export type RGBA = { r: number; g: number; b: number; a: number };
export type LineAlg = 'bresenham' | 'wu';
// TODO: Реализуйте функцию ограничения значения байта (от 0 до 255)
export function clampByte(v: number): number {
    throw new Error('Not implemented: clampByte');
}
// TODO: Реализуйте парсинг HEX-строки (например, "#FF0000" или "#F00") в
объект RGBA
export function hexToRGBA(hex: string, alpha = 255): RGBA {
    throw new Error('Not implemented: hexToRGBA');
}
export class RasterRenderer {
    private ctx: CanvasRenderingContext2D;
    private imageData: ImageData | null = null;
    private buf!: Uint8ClampedArray;

    width = 0; // физические пиксели
    height = 0; // физические пиксели
    dpr = 1;

    private canvas: HTMLCanvasElement;
    private _onWindowResize: () => void;
    private lineAlg: LineAlg = 'bresenham';
    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('No 2D context');
        }
        this.ctx = ctx;
        this._onWindowResize = () => this.resize();
        window.addEventListener('resize', this._onWindowResize);
        this.resize();
    }
    dispose() {
        window.removeEventListener('resize', this._onWindowResize);
    }
    setLineAlgorithm(a: LineAlg) {
        this.lineAlg = a;
    }
    getLineAlgorithm(): LineAlg {
        return this.lineAlg;
    }
    // Управляющий метод рисования линий
    drawLine(x0: number, y0: number, x1: number, y1: number, color: RGBA) {
        if (this.lineAlg === 'wu') {
            this.drawLineWu(x0, y0, x1, y1, color);
        } else {
            this.drawLineBrassenham(x0, y0, x1, y1, color);
        }
    }
    // ===================================================================
    // ЗАДАЧА: РЕАЛИЗОВАТЬ МЕТОДЫ НИЖЕ
    // ===================================================================
    // TODO: Вычисление 1D индекса в массиве buf по 2D координатам (x, y)
    // См. формулу в пункте 1.1
    private idx(x: number, y: number): number {
        throw new Error('Not implemented: idx');
    }
 // TODO: Установка одного пикселя.
 // Получите индекс через this.idx и запишите RGBA компоненты в
this.buf
setPixel(x: number, y: number, color: RGBA) {
    throw new Error('Not implemented: setPixel');
}
 // TODO: Альфа-блендинг См. пункт 1.4
 // Учтите alphaFactor для алгоритма Ву.
 private blendPixel(x: number, y: number, color: RGBA, alphaFactor = 1)
{
    throw new Error('Not implemented: blendPixel');
}
// TODO: Жизненный цикл кадра. См. пункт 2.1
// Учтите devicePixelRatio (dpr). Создайте новый ImageData.
resize() {
    throw new Error('Not implemented: resize');
}
// TODO: Очистка буфера. Заполните this.buf нулями, если clear = true
beginFrame(clear = true) {
    throw new Error('Not implemented: beginFrame');
}
// TODO: Вывод буфера на экран. Используйте this.ctx.putImageData
commit() {
    throw new Error('Not implemented: commit');
}
// TODO: Алгоритм Брезенхема. См. пункт 1.5
// Используйте this.setPixel для отрисовки
drawLineBrassenham(x0: number, y0: number, x1: number, y1: number,
    color: RGBA) {
    throw new Error('Not implemented: drawLineBrassenham');
}
// TODO: Алгоритм Сяолиня Ву. См. пункт 1.6
// Обязательно используйте this.blendPixel для отрисовки
drawLineWu(x0: number, y0: number, x1: number, y1: number, color:
    RGBA) {
    throw new Error('Not implemented: drawLineWu');
}
 // TODO: Отрисовка горизонтальной линии (для заливки). См. пункт 2.2
 private drawHSpan(y: number, x0: number, x1: number, color: RGBA) {
    throw new Error('Not implemented: drawHSpan');
}
// TODO: Заливка многоугольника (Scanline). Используйте drawHSpan
fillPolygon(points: { x: number; y: number }[], color: RGBA) {
    throw new Error('Not implemented: fillPolygon');
}
// TODO: Заливка окружности. Используйте drawHSpan
fillCircle(cx: number, cy: number, radius: number, color: RGBA) {
    throw new Error('Not implemented: fillCircle');
}
// TODO: Отрисовка толстого отрезка (прямоугольник + шапки). См. пункт
2.5
strokeLine(x0: number, y0: number, x1: number, y1: number, color:
    RGBA, width = 1) {
    throw new Error('Not implemented: strokeLine');
}
// TODO: Отрисовка контура фигуры. См. пункт 2.5
strokePolygon(points: { x: number; y: number }[], color: RGBA, width =
    1) {
    throw new Error('Not implemented: strokePolygon');
}
}
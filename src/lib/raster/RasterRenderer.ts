export type RGBA = { r: number; g: number; b: number; a: number };
export type LineAlg = 'bresenham' | 'wu';


export function clampByte(v: number): number {
    return Math.max(0, Math.min(255, Math.round(v)));
}

export function hexToRGBA(hex: string, alpha = 255): RGBA {
    hex = hex.replace('#', '');

    if (hex.length == 3){
        hex = hex.split('').map(c => c + c).join('');
    }

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return {r, g, b, a: alpha };
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



    drawLine(x0: number, y0: number, x1: number, y1: number, color: RGBA) {
        if (this.lineAlg === 'wu') {
            this.drawLineWu(x0, y0, x1, y1, color);
        } else {
            this.drawLineBrassenham(x0, y0, x1, y1, color);
        }
    }
 


    private idx(x: number, y: number): number {
        return((y * this.width + x)*4);
    }
 

    setPixel(x: number, y: number, color: RGBA) {
        
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;

        const i = this.idx(x, y);

        this.buf[i] = clampByte(color.r);
        this.buf[i+1] = clampByte(color.g);
        this.buf[i+2] = clampByte(color.b);
        this.buf[i+3] = clampByte(color.a);

    }

    private blendPixel(x: number, y: number, color: RGBA, alphaFactor = 1) {

        if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;

        const i = this.idx(x, y);


        let srcA  = (color.a / 255) * alphaFactor;
        srcA = Math.min(1, Math.max(0, srcA));

        if (srcA <= 0) return;

        const dstR = this.buf[i] / 255;
        const dstG = this.buf[i + 1] / 255;
        const dstB = this.buf[i + 2] / 255;
        const dstA = this.buf[i + 3] / 255;

        const srcR = color.r / 255;
        const srcG = color.g / 255;
        const srcB = color.b / 255;

        if (srcA >=1){
            this.buf[i] = clampByte(color.r);
            this.buf[i+1] = clampByte(color.g);
            this.buf[i+2] = clampByte(color.b);
            this.buf[i+3] = 255;
            return;
        }

        const outR = srcR * srcA + dstR * dstA * (1 - srcA);
        const outG = srcG * srcA + dstG * dstA * (1 - srcA);
        const outB = srcB * srcA + dstB * dstA * (1 - srcA);
        const outA = srcA + dstA * (1 - srcA);

        if (outA > 0) {
            this.buf[i] = clampByte(outR* 255);
            this.buf[i + 1] = clampByte(outG* 255);
            this.buf[i + 2] = clampByte(outB * 255);
            this.buf[i + 3] = clampByte(outA * 255);

        }else {
            this.buf[i] = 0;
            this.buf[i + 1] = 0;
            this.buf[i + 2] = 0;
            this.buf[i + 3] = 0;
        }

    }



    resize() {
        this.dpr = window.devicePixelRatio || 1;
    
        const rect = this.canvas.getBoundingClientRect();
        const cssWidth = rect.width;
        const cssHeight = rect.height;
        
        this.width = Math.max(1, Math.floor(cssWidth * this.dpr));
        this.height = Math.max(1, Math.floor(cssHeight * this.dpr));

        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        this.canvas.style.width = `${cssWidth}px`;
        this.canvas.style.height = `${cssHeight}px`;
        
        this.imageData = this.ctx.createImageData(this.width, this.height);
        this.buf = this.imageData.data;
    }



    beginFrame(clear = true) {
        if (clear) {
            for (let i = 0; i < this.buf.length; i++) {
                this.buf[i] = 0;
            }
        }
    }



    commit() {
        if (this.imageData) {
            this.ctx.putImageData(this.imageData, 0, 0);
        }
    }
    



    drawLineBrassenham(x0: number, y0: number, x1: number, y1: number, color: RGBA) {
        let dx = Math.abs(x1 - x0);
        let dy = Math.abs(y1 - y0);

        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;

        let err = dx - dy;

        let x = x0;
        let y = y0;

        while (true) {

            this.setPixel(x, y, color);

            if (x === x1 && y === y1) break;
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }

            if (e2 < dx) {
                err += dx;
                y += sy; 
            }
        }
    }
  



    drawLineWu(x0: number, y0: number, x1: number, y1: number, color: RGBA) {
        const fpart = (x: number ) => x - Math.floor(x);
        const rfpart = (x: number) => 1 - fpart(x);

        const plot = (x: number, y: number, brightness: number) => {
            this.blendPixel(x, y, color, brightness);
        };

        let steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);

        if (steep) {
            [x0, y0] = [y0, x0];
            [x1, y1] = [y1, x1];
        }

        if (x0 > x1) {
            [x0, x1] = [x1, x0];
            [y0, y1] = [y1, y0];
        }

        let dx = x1 - x0;
        let dy = y1 - y0;
        let gradient = dy / dx;

        let xend = Math.round(x0);
        let yend = y0 + gradient * (xend - x0);

        let xgap = rfpart(x0 + 0.5);

        let xpxl1 = xend;
        let ypxl1 = Math.floor(yend);

        if (steep) {
            plot(ypxl1, xpxl1, rfpart(yend) * xgap);
            plot(ypxl1 + 1, xpxl1, fpart(yend) * xgap);
        } else {
            plot(xpxl1, ypxl1, rfpart(yend) * xgap);
            plot(xpxl1, ypxl1 + 1, fpart(yend) * xgap);
        }

        let intery = yend + gradient;
        
        // Обработка конечной точки
        xend = Math.round(x1);
        yend = y1 + gradient * (xend - x1);
        xgap = fpart(x1 + 0.5);
        let xpxl2 = xend;
        let ypxl2 = Math.floor(yend);
        
        if (steep) {
            plot(ypxl2, xpxl2, rfpart(yend) * xgap);
            plot(ypxl2 + 1, xpxl2, fpart(yend) * xgap);
        } else {
            plot(xpxl2, ypxl2, rfpart(yend) * xgap);
            plot(xpxl2, ypxl2 + 1, fpart(yend) * xgap);
        }

        if (steep) {
            for (let x = xpxl1 + 1; x <= xpxl2 - 1; x++) {
                let y = Math.floor(intery);
                plot(y, x, rfpart(intery));
                plot(y + 1, x, fpart(intery));
                intery += gradient;
            }
        } else {
            for (let x = xpxl1 + 1; x <= xpxl2 - 1; x++) {
                let y = Math.floor(intery);
                plot(x, y, rfpart(intery));
                plot(x, y + 1, fpart(intery));
                intery += gradient;
            }
        }
    }



    private drawHSpan(y: number, x0: number, x1: number, color: RGBA) {
        
        let startX = Math.min(x0, x1);  
        let endX = Math.max(x0, x1);    
        
        for (let x = startX; x <= endX; x++) {
            if (color.a < 255) {
                this.blendPixel(x, y, color);
            } else {
                this.setPixel(x, y, color);
            }
        }
    }



    fillPolygon(points: { x: number; y: number }[], color: RGBA) {
        if (points.length < 3) return;

        let minY = Math.min(...points.map(p => p.y));
        let maxY = Math.max(...points.map(p => p.y));

        minY = Math.max(0, Math.floor(minY));
        maxY = Math.min(this.height - 1, Math.ceil(maxY));

        for (let y = minY; y <= maxY; y++) {
            const intersections: number[] = [];

            for (let i = 0; i < points.length; i++) {
                const p1 = points[i];
                const p2 = points[(i + 1) % points.length];  
         
                if (p1.y === p2.y) continue;
                
                const minYEdge = Math.min(p1.y, p2.y);
                const maxYEdge = Math.max(p1.y, p2.y);
                
                if (y >= minYEdge && y < maxYEdge) {

                    const t = (y - p1.y) / (p2.y - p1.y);
                    const x = p1.x + t * (p2.x - p1.x);
                    intersections.push(x);
                }
            }
        
            intersections.sort((a, b) => a - b);
            
             for (let i = 0; i < intersections.length; i += 2) {
                if (i + 1 < intersections.length) {
                    const x1 = Math.ceil(intersections[i]);
                    const x2 = Math.floor(intersections[i + 1]);
                    if (x1 <= x2) {
                        this.drawHSpan(y, x1, x2, color);
                    }
                }
            }
        }
    }




    fillCircle(cx: number, cy: number, radius: number, color: RGBA) {
    const r = Math.round(radius);
    const centerX = Math.round(cx);
    const centerY = Math.round(cy);
    
    for (let y = -r; y <= r; y++) {
        const dy = y;
        const dx = Math.sqrt(Math.max(0, r * r - dy * dy));
        const x1 = Math.round(centerX - dx);
        const x2 = Math.round(centerX + dx);
        
        this.drawHSpan(centerY + y, x1, x2, color);
    }
}

    


    strokeLine(x0: number, y0: number, x1: number, y1: number, color: RGBA, width = 1) {
        if (width <= 1) {
            this.drawLine(x0, y0, x1, y1, color);
            return;
        }
    
        const dx = x1 - x0;
        const dy = y1 - y0;
        const len = Math.hypot(dx, dy); 
        
        if (len === 0) return;
       
        const nx = -dy / len;  
        const ny = dx / len;   
        
        const half = width / 2;  
       
        const p1 = { x: x0 + nx * half, y: y0 + ny * half };
        const p2 = { x: x0 - nx * half, y: y0 - ny * half };
        const p3 = { x: x1 - nx * half, y: y1 - ny * half };
        const p4 = { x: x1 + nx * half, y: y1 + ny * half };
        
        this.fillPolygon([p1, p2, p3, p4], color);
        
        this.fillCircle(x0, y0, half, color);
        this.fillCircle(x1, y1, half, color);
    }




    strokePolygon(points: { x: number; y: number }[], color: RGBA, width = 1) {
        if (points.length < 2) return;
  
        for (let i = 0; i < points.length; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length];
            this.strokeLine(p1.x, p1.y, p2.x, p2.y, color, width);
        }
    }
}
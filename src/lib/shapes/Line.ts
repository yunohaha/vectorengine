import { Shape, type Bounds, type Transform, type ShapeStyle } from './Shape';
import type { RasterRenderer } from '../raster/RasterRenderer';
import { hexToRGBA } from '../raster/RasterRenderer';
import  {  mat3, type Point2D  } from '../math/mat3';

export class Line extends Shape {
     x1: number; y1: number;  
    x2: number; y2: number; 

    constructor(x1: number, y1: number, x2: number, y2: number, transform?: Partial<Transform>, style?: Partial<ShapeStyle>) {
        super(transform, style);
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }

    getControlPoints(): Point2D[] {
        return [
            { x: this.x1, y: this.y1 },
            { x: this.x2, y: this.y2 }
        ];
    }

    setControlPoint(index: number, point: Point2D): void {
        if (index === 0) {
            this.x1 = point.x;
            this.y1 = point.y;
        }

        if (index === 1) {
            this.x2 = point.x;
            this.y2 = point.y;
        }
    }

    getLocalPoints(): Point2D[] {
        return[
            {x: this.x1, y: this.y1 },
            {x: this.x2, y: this.y2 },
        ];
    }

    getDevicePoints(): Point2D[] {
        const matrix = this.getLocalToDeviceMatrix();
        return this.getLocalPoints().map(p => mat3.transformPoint(matrix, p.x, p.y));
    }

    drawRaster(r: RasterRenderer): void {
        const points = this.getDevicePoints();
        const strokeRGBA = hexToRGBA(this.style.strokeStyle, Math.round(this.style.strokeOpacity * 255));
        
        if (this.style.strokeWidth > 0 && this.style.strokeOpacity > 0) {
            r.strokeLine(points[0].x, points[0].y, points[1].x, points[1].y, strokeRGBA, this.style.strokeWidth);
        }
    }

    hitTest(px: number, py: number): boolean {
        const local = this.transformPointToLocal(px, py);
        if (!local) return false;
        
        const ax = this.x2 - this.x1;
        const ay = this.y2 - this.y1;
        const len2 = ax * ax + ay * ay;
        
        if (len2 === 0) {
            const dx = local.x - this.x1;
            const dy = local.y - this.y1;
            return Math.hypot(dx, dy) < this.style.strokeWidth / 2;
        }
        
        let t = ((local.x - this.x1) * ax + (local.y - this.y1) * ay) / len2;
        t = Math.max(0, Math.min(1, t));
        
        const projX = this.x1 + t * ax;
        const projY = this.y1 + t * ay;
        
        const dist = Math.hypot(local.x - projX, local.y - projY);
        return dist < this.style.strokeWidth / 2;
    }

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

    clone(): Line {
        return new Line(this.x1, this.y1, this.x2, this.y2, { ...this.transform }, { ...this.style });
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
}
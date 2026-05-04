import { Shape, type Bounds, type Transform, type ShapeStyle } from './Shape';
import type { RasterRenderer } from '../raster/RasterRenderer';
import { hexToRGBA } from '../raster/RasterRenderer';
import  {  mat3, type Point2D  } from '../math/mat3';

export class Oval extends Shape {
    rx: number; 
    ry: number;
      
    constructor(rx: number, ry: number, transform?: Partial<Transform>, style?: Partial<ShapeStyle>) {
        super(transform, style);
        this.rx = Math.abs(rx);
        this.ry = Math.abs(ry);
    }

    getLocalPoints(segments: number = 32): Point2D[] {
        const points: Point2D[] = [];
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = Math.cos(angle) * this.rx;
            const y = Math.sin(angle) * this.ry;
            points.push({ x, y });
        }
        return points;
    }

    getDevicePoints(segments: number = 32): Point2D[] {
        const matrix = this.getLocalToDeviceMatrix();
        return this.getLocalPoints(segments).map(p => mat3.transformPoint(matrix, p.x, p.y));
    }

    drawRaster(r: RasterRenderer): void {
        const points = this.getDevicePoints();
        const fillRGBA = hexToRGBA(this.style.fillStyle, Math.round(this.style.fillOpacity * 255));
        const strokeRGBA = hexToRGBA(this.style.strokeStyle, Math.round(this.style.strokeOpacity * 255));
        
        if (this.style.fillOpacity > 0) {
            r.fillPolygon(points, fillRGBA);
        }
        
        if (this.style.strokeWidth > 0 && this.style.strokeOpacity > 0) {
            for (let i = 0; i < points.length - 1; i++) {
                r.strokeLine(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y, strokeRGBA, this.style.strokeWidth);
            }
        }
    }

    hitTest(px: number, py: number): boolean {
        const local = this.transformPointToLocal(px, py);
        if (!local) return false;
        
        const dx = local.x / this.rx;
        const dy = local.y / this.ry;
        return dx * dx + dy * dy <= 1;
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
        return { minX: -this.rx, minY: -this.ry, maxX: this.rx, maxY: this.ry };
    }

    clone(): Oval {
        return new Oval(this.rx, this.ry, { ...this.transform }, { ...this.style });
    }

    toJSON(): object {
        return {
            type: 'oval',
            id: this.id,
            rx: this.rx,
            ry: this.ry,
            transform: { ...this.transform },
            style: { ...this.style },
        };
    }
}
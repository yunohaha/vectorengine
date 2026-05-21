import { Shape, type Bounds, type Transform, type ShapeStyle } from './Shape';
import type { RasterRenderer } from '../raster/RasterRenderer';
import { hexToRGBA } from '../raster/RasterRenderer';
import { mat3, type Point2D } from '../math/mat3';

export class QuadraticBezier extends Shape {
    private p0: Point2D;  
    private p1: Point2D;  
    private p2: Point2D;  

    constructor(
        p0: Point2D, p1: Point2D, p2: Point2D,
        transform?: Partial<Transform>,
        style?: Partial<ShapeStyle>
    ) {
        super(transform, style);
        this.p0 = { ...p0 };
        this.p1 = { ...p1 };
        this.p2 = { ...p2 };
    }

    evalLocal(t: number): Point2D {
        const mt = 1 - t;
        const x = mt * mt * this.p0.x + 2 * mt * t * this.p1.x + t * t * this.p2.x;
        const y = mt * mt * this.p0.y + 2 * mt * t * this.p1.y + t * t * this.p2.y;
        return { x, y };
    }

    flattenLocal(segments: number = 32): Point2D[] {
        const points: Point2D[] = [];
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            points.push(this.evalLocal(t));
        }
        return points;
    }
    getLocalPoints(): Point2D[] {
        return this.flattenLocal();
    }

    getDevicePoints(): Point2D[] {
        const matrix = this.getLocalToDeviceMatrix();
        return this.flattenLocal().map(p => mat3.transformPoint(matrix, p.x, p.y));
    }

    drawRaster(r: RasterRenderer): void {
        const points = this.getDevicePoints();
        const strokeRGBA = hexToRGBA(this.style.strokeStyle, Math.round(this.style.strokeOpacity * 255));
        
        if (this.style.strokeWidth > 0 && this.style.strokeOpacity > 0) {
            for (let i = 0; i < points.length - 1; i++) {
                r.strokeLine(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y, strokeRGBA, this.style.strokeWidth);
            }
        }
    }

    hitTest(px: number, py: number): boolean {
        const points = this.getDevicePoints();
        const threshold = Math.max(5, this.style.strokeWidth / 2);
        
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            
            const ax = p2.x - p1.x;
            const ay = p2.y - p1.y;
            const len2 = ax * ax + ay * ay;
            
            if (len2 === 0) {
                const dx = px - p1.x;
                const dy = py - p1.y;
                if (Math.hypot(dx, dy) < threshold) return true;
                continue;
            }
            
            let t = ((px - p1.x) * ax + (py - p1.y) * ay) / len2;
            t = Math.max(0, Math.min(1, t));
            
            const projX = p1.x + t * ax;
            const projY = p1.y + t * ay;
            
            const dist = Math.hypot(px - projX, py - projY);
            if (dist < threshold) return true;
        }
        
        return false;
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

    getControlPoints(): Point2D[] {
        return [this.p0, this.p1, this.p2];
    }

    setControlPoint(index: number, localPt: Point2D): void {
        switch (index) {
            case 0: this.p0 = { ...localPt }; break;
            case 1: this.p1 = { ...localPt }; break;
            case 2: this.p2 = { ...localPt }; break;
        }
    }

    getLocalBounds(): Bounds {
        const points = this.flattenLocal();
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const p of points) {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        }
        return { minX, minY, maxX, maxY };
    }

    clone(): QuadraticBezier {
        return new QuadraticBezier(
            { ...this.p0 }, { ...this.p1 }, { ...this.p2 },
            { ...this.transform }, { ...this.style }
        );
    }

    toJSON(): object {
        return {
            type: 'quadratic',
            id: this.id,
            points: [this.p0, this.p1, this.p2],
            transform: { ...this.transform },
            style: { ...this.style },
        };
    }
}
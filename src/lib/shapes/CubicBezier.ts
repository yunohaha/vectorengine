import { Shape, type Bounds, type Transform, type ShapeStyle } from './Shape';
import type { RasterRenderer } from '../raster/RasterRenderer';
import { hexToRGBA } from '../raster/RasterRenderer';
import { mat3, type Point2D } from '../math/mat3';

export class CubicBezier extends Shape {
    private p0: Point2D;
    private p1: Point2D;
    private p2: Point2D;
    private p3: Point2D;

    constructor(
        p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D,
        transform?: Partial<Transform>,
        style?: Partial<ShapeStyle>
    ) {
        super(transform, style);
        this.p0 = { ...p0 };
        this.p1 = { ...p1 };
        this.p2 = { ...p2 };
        this.p3 = { ...p3 };
    }

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

    flattenLocal(segments: number = 200): Point2D[] {
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


    getDevicePoints(segments: number = 200): Point2D[] {
        const matrix = this.getLocalToDeviceMatrix();
        return this.flattenLocal(segments).map(p => mat3.transformPoint(matrix, p.x, p.y));
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
                if (Math.hypot(px - p1.x, py - p1.y) < threshold) return true;
                continue;
            }
            
            let t = ((px - p1.x) * ax + (py - p1.y) * ay) / len2;
            t = Math.max(0, Math.min(1, t));
            
            const projX = p1.x + t * ax;
            const projY = p1.y + t * ay;
            
            if (Math.hypot(px - projX, py - projY) < threshold) return true;
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
        return [{ ...this.p0 }, { ...this.p1 }, { ...this.p2 }, { ...this.p3 }];
    }

    setControlPoint(index: number, localPt: Point2D): void {
        switch (index) {
            case 0: this.p0 = { ...localPt }; break;
            case 1: this.p1 = { ...localPt }; break;
            case 2: this.p2 = { ...localPt }; break;
            case 3: this.p3 = { ...localPt }; break;
        }
    }

    getLocalBounds(): Bounds {
        const points = this.flattenLocal(48);
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const p of points) {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        }
        return { minX, minY, maxX, maxY };
    }

    clone(): CubicBezier {
        return new CubicBezier(
            { ...this.p0 }, { ...this.p1 }, { ...this.p2 }, { ...this.p3 },
            { ...this.transform }, { ...this.style }
        );
    }

    toJSON(): object {
        return {
            type: 'cubic',
            id: this.id,
            points: [this.p0, this.p1, this.p2, this.p3],
            transform: { ...this.transform },
            style: { ...this.style },
        };
    }
}
import { Shape, type Bounds, type Transform, type ShapeStyle } from './Shape';
import type { RasterRenderer } from '../raster/RasterRenderer';
import { hexToRGBA } from '../raster/RasterRenderer';
import { mat3, type Point2D } from '../math/mat3';

export class Triangle extends Shape {
    private localPoints: Point2D[];  
    constructor(
        x1: number, y1: number,
        x2: number, y2: number,
        x3: number, y3: number,
        transform?: Partial<Transform>,
        style?: Partial<ShapeStyle>
    ) {
        super(transform, style);
        
        const cx = (x1 + x2 + x3) / 3;
        const cy = (y1 + y2 + y3) / 3;
        
        this.localPoints = [
            { x: x1 - cx, y: y1 - cy },
            { x: x2 - cx, y: y2 - cy },
            { x: x3 - cx, y: y3 - cy },
        ];
    }

    getLocalPoints(): Point2D[] {
        return [...this.localPoints];
    }

    getDevicePoints(): Point2D[] {
        const matrix = this.getLocalToDeviceMatrix();
        return this.localPoints.map(p => mat3.transformPoint(matrix, p.x, p.y));
    }

    drawRaster(r: RasterRenderer): void {
        const points = this.getDevicePoints();
        const fillRGBA = hexToRGBA(this.style.fillStyle, Math.round(this.style.fillOpacity * 255));
        const strokeRGBA = hexToRGBA(this.style.strokeStyle, Math.round(this.style.strokeOpacity * 255));
        
        if (this.style.fillOpacity > 0) {
            r.fillPolygon(points, fillRGBA);
        }
        
        if (this.style.strokeWidth > 0 && this.style.strokeOpacity > 0) {
            for (let i = 0; i < points.length; i++) {
                const p1 = points[i];
                const p2 = points[(i + 1) % points.length];
                r.strokeLine(p1.x, p1.y, p2.x, p2.y, strokeRGBA, this.style.strokeWidth);
            }
        }
    }

    hitTest(px: number, py: number): boolean {
        const local = this.transformPointToLocal(px, py);
        if (!local) return false;
        
        const [p1, p2, p3] = this.localPoints;
        
        const sign = (a: Point2D, b: Point2D, p: Point2D): number => {
            return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
        };
        
        const s1 = sign(p1, p2, local);
        const s2 = sign(p2, p3, local);
        const s3 = sign(p3, p1, local);
        
        const hasPos = s1 > 0 || s2 > 0 || s3 > 0;
        const hasNeg = s1 < 0 || s2 < 0 || s3 < 0;
        
        return !(hasPos && hasNeg);
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
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const p of this.localPoints) {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        }
        return { minX, minY, maxX, maxY };
    }

    getControlPoints(): Point2D[] {
        return [...this.localPoints];
    }

    setControlPoint(index: number, localPt: Point2D): void {
        if (index >= 0 && index < this.localPoints.length) {
            this.localPoints[index] = { ...localPt };
        }
    }

    clone(): Triangle {
        const [p1, p2, p3] = this.getLocalPoints();
        const center = this.getCenter();
        return new Triangle(
            p1.x + center.x, p1.y + center.y,
            p2.x + center.x, p2.y + center.y,
            p3.x + center.x, p3.y + center.y,
            { ...this.transform },
            { ...this.style }
        );
    }

    toJSON(): object {
        const center = this.getCenter();
        const absPoints = this.localPoints.map(p => ({
            x: p.x + center.x,
            y: p.y + center.y
        }));
        return {
            type: 'triangle',
            id: this.id,
            points: absPoints,
            transform: { ...this.transform },
            style: { ...this.style },
        };
    }
}
import { Shape, type Bounds, type Transform, type ShapeStyle } from './Shape';
import type { RasterRenderer } from '../raster/RasterRenderer';
import { hexToRGBA } from '../raster/RasterRenderer';
import { mat3, type Point2D } from '../math/mat3';
import { CubicBezier } from './CubicBezier';
export type PathMode = 'polyline' | 'bezier' | 'catmull';

export class PathBezier extends Shape {
    private points: Point2D[];
    private mode: PathMode;
    private closed: boolean;

    constructor(
        points: Point2D[],
        mode: PathMode = 'polyline',
        closed: boolean = false,
        transform?: Partial<Transform>,
        style?: Partial<ShapeStyle>
    ) {
        super(transform, style);
        this.points = points.map(p => ({ ...p }));
        this.mode = mode;
        this.closed = closed;
    }


    getLocalPoints(): Point2D[] {
        return this.flattenLocal(60);
    }

    getControlPoints(): Point2D[] {
        return this.points.map(p => ({ ...p }));
    }

    setControlPoint(index: number, localPt: Point2D): void {
        if (index >= 0 && index < this.points.length) {
            this.points[index] = { ...localPt };
        }
    }

    private catmullRomToBezier(p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D): Point2D[] {
        const tension = 0.5;
        return [
            { ...p1 },
            {
                x: p1.x + (p2.x - p0.x) * tension,
                y: p1.y + (p2.y - p0.y) * tension
            },
            {
                x: p2.x - (p3.x - p1.x) * tension,
                y: p2.y - (p3.y - p1.y) * tension
            },
            { ...p2 }
        ];
    }

    flattenLocal(segmentsPerCurve: number = 100): Point2D[] {
        if (this.points.length < 2) return [];
        
        const result: Point2D[] = [];
        
        if (this.mode === 'polyline') {
            for (let i = 0; i < this.points.length; i++) {
                result.push({ ...this.points[i] });
            }
        } 
        else if (this.mode === 'bezier' && this.points.length >= 4) {
            for (let i = 0; i < this.points.length - 3; i += 3) {
                const cubic = new CubicBezier(
                    this.points[i], this.points[i + 1],
                    this.points[i + 2], this.points[i + 3]
                );
                const pts = cubic.flattenLocal(segmentsPerCurve);
                result.push(...pts);
            }
        }
        else if (this.mode === 'catmull' && this.points.length >= 2) {
            const extended = [...this.points];
            if (this.closed) {
                extended.push(this.points[0], this.points[1]);
            }
            
            for (let i = 0; i < extended.length - 3; i++) {
                const [p0, p1, p2, p3] = extended.slice(i, i + 4);
                const bezierPoints = this.catmullRomToBezier(p0, p1, p2, p3);
                const cubic = new CubicBezier(
                    bezierPoints[0], bezierPoints[1],
                    bezierPoints[2], bezierPoints[3]
                );
                const pts = cubic.flattenLocal(segmentsPerCurve);
                result.push(...pts);
            }
            result.push({ ...this.points[this.points.length - 1] });
            if (this.closed && this.points.length > 2) {
                result.push({ ...this.points[0] });
            }
        }
        
        return result;
    }

    getDevicePoints(segmentsPerCurve: number = 100): Point2D[] {
        const matrix = this.getLocalToDeviceMatrix();
        return this.flattenLocal(segmentsPerCurve).map(p => mat3.transformPoint(matrix, p.x, p.y));
    }

    drawRaster(r: RasterRenderer): void {
        const points = this.getDevicePoints(30);
        const strokeRGBA = hexToRGBA(this.style.strokeStyle, Math.round(this.style.strokeOpacity * 255));
        
        if (this.style.strokeWidth > 0 && this.style.strokeOpacity > 0) {
            for (let i = 0; i < points.length - 1; i++) {
                r.strokeLine(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y, strokeRGBA, this.style.strokeWidth);
            }
            if (this.closed && points.length > 2) {
                const last = points[points.length - 1];
                const first = points[0];
                r.strokeLine(last.x, last.y, first.x, first.y, strokeRGBA, this.style.strokeWidth);
            }
        }
        
        if (this.closed && this.style.fillOpacity > 0 && points.length >= 3) {
            const fillRGBA = hexToRGBA(this.style.fillStyle, Math.round(this.style.fillOpacity * 255));
            r.fillPolygon(points, fillRGBA);
        }
    }

    hitTest(px: number, py: number): boolean {
        const points = this.getDevicePoints(120);
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
        
        if (this.closed && points.length > 2) {
            const last = points[points.length - 1];
            const first = points[0];
            const ax = first.x - last.x;
            const ay = first.y - last.y;
            const len2 = ax * ax + ay * ay;
            
            if (len2 > 0) {
                let t = ((px - last.x) * ax + (py - last.y) * ay) / len2;
                t = Math.max(0, Math.min(1, t));
                const projX = last.x + t * ax;
                const projY = last.y + t * ay;
                if (Math.hypot(px - projX, py - projY) < threshold) return true;
            }
        }
        
        return false;
    }

    getBounds(): Bounds {
        const points = this.getDevicePoints(120);
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
        const points = this.flattenLocal(120);
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const p of points) {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        }
        return { minX, minY, maxX, maxY };
    }

    getClosed(): boolean {
        return this.closed;
    }


    addPoint(localPt: Point2D, index?: number): void {
        if (index !== undefined && index >= 0 && index <= this.points.length) {
            this.points.splice(index, 0, { ...localPt });
        } else {
            this.points.push({ ...localPt });
        }
    }

    removePoint(index: number): void {
        if (index >= 0 && index < this.points.length) {
            this.points.splice(index, 1);
        }
    }

    setMode(mode: PathMode): void {
        this.mode = mode;
    }

    setClosed(closed: boolean): void {
        this.closed = closed;
    }

    clone(): PathBezier {
        return new PathBezier(
            this.points.map(p => ({ ...p })),
            this.mode,
            this.closed,
            { ...this.transform },
            { ...this.style }
        );
    }

    toJSON(): object {
        return {
            type: 'path',
            id: this.id,
            points: this.points,
            mode: this.mode,
            closed: this.closed,
            transform: { ...this.transform },
            style: { ...this.style },
        };
    }
}
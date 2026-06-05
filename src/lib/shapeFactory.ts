import { Rect } from './shapes/Rect';
import { Line } from './shapes/Line';
import { Oval } from './shapes/Oval';
import { Triangle } from './shapes/Triangle';
import { CubicBezier } from './shapes/CubicBezier';
import { QuadraticBezier } from './shapes/QuadraticBezier';
import { PathBezier } from './shapes/PathBezier';
import type { Shape } from './shapes/Shape';

export function shapeFromJSON(data: any): Shape | null {
    const { type, id, transform, style, ...rest } = data;
    
    let shape: Shape | null = null;
    
    switch (type) {
        case 'rect':
            shape = new Rect(rest.width, rest.height, transform, style);
            break;
            
        case 'line':
            shape = new Line(rest.x1, rest.y1, rest.x2, rest.y2, transform, style);
            break;
            
        case 'oval':
            shape = new Oval(rest.rx, rest.ry, transform, style);
            break;
            
        case 'triangle':
            const [p1, p2, p3] = rest.points;
            shape = new Triangle(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, transform, style);
            break;
            
        case 'cubicbezier':
        case 'cubic':
            shape = new CubicBezier(rest.p0, rest.p1, rest.p2, rest.p3, transform, style);
            break;
            
        case 'quadraticbezier':
        case 'quadratic':
        case 'quad':
            shape = new QuadraticBezier(rest.p0, rest.p1, rest.p2, transform, style);
            break;
            
        case 'pathbezier':
        case 'path':
            shape = new PathBezier(rest.points, rest.mode, rest.closed, transform, style);
            break;
            
        default:
            console.warn(`Unknown shape type: ${type}`);
            return null;
    }
    
    if (shape && id) {
        (shape as any).id = id;
    }
    
    return shape;
}

export function restoreShapes(shapesData: any[]): Shape[] {
    const shapes: Shape[] = [];
    for (const data of shapesData) {
        const shape = shapeFromJSON(data);
        if (shape) shapes.push(shape);
    }
    return shapes;
}
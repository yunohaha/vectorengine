import { test, expect } from 'vitest';
import { Rect } from './Rect';
import { Line } from './Line';
import { Oval } from './Oval';
import { Triangle } from './Triangle';
import { QuadraticBezier } from './QuadraticBezier';
import { CubicBezier } from './CubicBezier';
import { PathBezier } from './PathBezier';


test('Rect hitTest', () => {
    const rect = new Rect(100, 100);
    expect(rect.hitTest(0, 0)).toBe(true);
    expect(rect.hitTest(40, 40)).toBe(true);
    expect(rect.hitTest(60, 60)).toBe(false);
});

test('Rect bounds', () => {
    const rect = new Rect(100, 100, { x: 50, y: 50 });
    const bounds = rect.getBounds();
    expect(bounds.minX).toBeCloseTo(0);
    expect(bounds.minY).toBeCloseTo(0);
    expect(bounds.maxX).toBeCloseTo(100);
    expect(bounds.maxY).toBeCloseTo(100);
});

test('Rect transform', () => {
    const rect = new Rect(100, 100, { x: 100, y: 100, rotation: Math.PI / 2 });
    const point = rect.transformPointToDevice(0, 0);
    expect(point.x).toBeCloseTo(100);
    expect(point.y).toBeCloseTo(100);
});



test('Line hitTest', () => {
    const line = new Line(-50, 0, 50, 0);
    expect(line.hitTest(0, 0)).toBe(true);
    expect(line.hitTest(30, 0)).toBe(true);
    expect(line.hitTest(30, 5)).toBe(false);
});


test('Oval hitTest', () => {
    const oval = new Oval(50, 30);
    expect(oval.hitTest(0, 0)).toBe(true);
    expect(oval.hitTest(40, 0)).toBe(true);
    expect(oval.hitTest(50, 0)).toBe(true);
    expect(oval.hitTest(60, 0)).toBe(false);
});


test('Triangle hitTest', () => {
    const triangle = new Triangle(0, -50, -43, 25, 43, 25);
    expect(triangle.hitTest(0, 0)).toBe(true);
    expect(triangle.hitTest(0, -40)).toBe(true);
    expect(triangle.hitTest(0, -60)).toBe(false);
});

test('Triangle bounds', () => {
    const triangle = new Triangle(0, -50, -43, 25, 43, 25);
    const bounds = triangle.getLocalBounds();
    expect(bounds.minX).toBeCloseTo(-43);
    expect(bounds.maxX).toBeCloseTo(43);
    expect(bounds.minY).toBeCloseTo(-50);
    expect(bounds.maxY).toBeCloseTo(25);
});


test('QuadraticBezier eval', () => {
    const bezier = new QuadraticBezier(
        { x: 0, y: 0 },
        { x: 50, y: 100 },
        { x: 100, y: 0 }
    );
    const mid = bezier.evalLocal(0.5);
    expect(mid.x).toBeCloseTo(50);
    expect(mid.y).toBeCloseTo(50);
});


test('CubicBezier start and end', () => {
    const bezier = new CubicBezier(
        { x: 0, y: 0 },
        { x: 30, y: 100 },
        { x: 70, y: -100 },
        { x: 100, y: 0 }
    );
    expect(bezier.evalLocal(0).x).toBeCloseTo(0);
    expect(bezier.evalLocal(0).y).toBeCloseTo(0);
    expect(bezier.evalLocal(1).x).toBeCloseTo(100);
    expect(bezier.evalLocal(1).y).toBeCloseTo(0);
});

test('PathBezier polyline', () => {
    const path = new PathBezier(
        [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }],
        'polyline'
    );
    expect(path.flattenLocal().length).toBe(3);
});

test('PathBezier closed', () => {
    const path = new PathBezier(
        [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }],
        'polyline',
        true
    );
    expect(path.getClosed()).toBe(true);
});
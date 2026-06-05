import { 
    BaseDirectory, 
    mkdir, 
    readTextFile, 
    writeTextFile,
    exists
} from '@tauri-apps/plugin-fs';

const PROJECTS_DIR = 'vectorengine/projects';
const INDEX_FILE = 'vectorengine/index.json';

export interface ProjectMetadata {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
}

export interface ProjectData {
    metadata: ProjectMetadata;
    lineAlgorithm: 'bresenham' | 'wu';
    shapes: any[];
}

export interface ProjectIndex {
    projects: ProjectMetadata[];
}

export async function initStorage(): Promise<void> {
    try {
        console.log('Initializing storage...');
        await mkdir(PROJECTS_DIR, { 
            baseDir: BaseDirectory.Document,
            recursive: true 
        });
        console.log('Storage initialized at:', PROJECTS_DIR);
    } catch (error) {
        console.error('Failed to init storage:', error);
    }
}

export async function loadProjectIndex(): Promise<ProjectMetadata[]> {
    try {
        const content = await readTextFile(INDEX_FILE, {
            baseDir: BaseDirectory.Document
        });
        const index = JSON.parse(content) as ProjectIndex;
        return index.projects || [];
    } catch (error) {
        console.log('No index file found, returning empty list');
        return [];
    }
}

export async function saveProject(project: ProjectData): Promise<void> {
    try {
        console.log('Saving project:', project.metadata.id);
        
        const projectPath = `${PROJECTS_DIR}/${project.metadata.id}`;
        const projectFile = `${projectPath}/project.json`;
        
        await mkdir(projectPath, { 
            baseDir: BaseDirectory.Document, 
            recursive: true 
        });
        
        project.metadata.updatedAt = new Date().toISOString();
        
        const jsonString = JSON.stringify(project, null, 2);
        await writeTextFile(projectFile, jsonString, {
            baseDir: BaseDirectory.Document
        });
        
        console.log('Project file saved:', projectFile);
        
        await updateProjectIndex(project.metadata);
        
        console.log('Project saved successfully');
    } catch (error) {
        console.error('Failed to save project:', error);
        throw error;
    }
}
async function updateProjectIndex(metadata: ProjectMetadata): Promise<void> {
    try {
        const projects = await loadProjectIndex();
        const existingIndex = projects.findIndex(p => p.id === metadata.id);
        
        if (existingIndex >= 0) {
            projects[existingIndex] = metadata;
        } else {
            projects.push(metadata);
        }
        
        await writeTextFile(INDEX_FILE, JSON.stringify({ projects }, null, 2), {
            baseDir: BaseDirectory.Document
        });
        
        console.log('Index updated');
    } catch (error) {
        console.error('Failed to update index:', error);
    }
}

export async function loadProject(projectId: string): Promise<ProjectData | null> {
    try {
        const projectFile = `${PROJECTS_DIR}/${projectId}/project.json`;
        
        console.log('Loading project from:', projectFile);
        
        const fileExists = await exists(projectFile, {
            baseDir: BaseDirectory.Document
        });
        
        if (!fileExists) {
            console.log('Project file not found');
            return null;
        }
        
        const content = await readTextFile(projectFile, {
            baseDir: BaseDirectory.Document
        });
        
        const project = JSON.parse(content) as ProjectData;
        console.log('Project loaded:', project.metadata.name);
        
        return project;
    } catch (error) {
        console.error('Failed to load project:', error);
        return null;
    }
}
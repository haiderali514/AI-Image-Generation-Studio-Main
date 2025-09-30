/**
 * @file This file manages the persistence of recent projects using localStorage.
 */
import { DocumentSettings } from '../types';

const RECENT_PROJECTS_KEY = 'ai-design-tool-recent-projects';
const MAX_RECENT_PROJECTS = 20; // Keep the list from growing indefinitely

/**
 * Extends DocumentSettings to include metadata for recent project management.
 */
export interface RecentProject extends DocumentSettings {
  id: string;
  lastModified: number; // Unix timestamp for sorting
  thumbnail?: string; // Optional base64 thumbnail
}

/**
 * Retrieves all recent projects from localStorage, sorted by most recently modified.
 * @returns {RecentProject[]} An array of recent projects.
 */
export const getRecentProjects = (): RecentProject[] => {
  try {
    const saved = localStorage.getItem(RECENT_PROJECTS_KEY);
    if (!saved) return [];
    const projects: RecentProject[] = JSON.parse(saved);
    // Sort by last modified, newest first
    return projects.sort((a, b) => b.lastModified - a.lastModified);
  } catch (error) {
    console.error('Failed to parse recent projects from localStorage:', error);
    return [];
  }
};

/**
 * Adds a new document to the list of recent projects.
 * @param {DocumentSettings} document - The document to add.
 * @returns {RecentProject} The newly created recent project object.
 */
export const addRecentProject = (document: DocumentSettings): RecentProject => {
  const newProject: RecentProject = {
    ...document,
    id: crypto.randomUUID(),
    lastModified: Date.now(),
  };

  let projects = getRecentProjects();
  // Remove existing project with same ID if any, to move it to the top
  projects = projects.filter(p => p.id !== newProject.id);
  projects.unshift(newProject); // Add to the beginning of the array

  // Limit the number of recent projects stored
  if (projects.length > MAX_RECENT_PROJECTS) {
    projects = projects.slice(0, MAX_RECENT_PROJECTS);
  }

  try {
    localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error('Failed to save recent project to localStorage:', error);
  }
  
  return newProject;
};

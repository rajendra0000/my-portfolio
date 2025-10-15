export interface MediumPost {
  title: string;
  url: string;
  publishedAt: string;
  summary: string;
  tags: string[];
  isExternal?: boolean;
}

export const mediumPosts: MediumPost[] = [
  
];

export function getMediumPosts(): MediumPost[] {
  return mediumPosts;
} 
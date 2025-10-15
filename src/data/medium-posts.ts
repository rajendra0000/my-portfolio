export interface MediumPost {
  title: string;
  url: string;
  publishedAt: string;
  summary: string;
  tags: string[];
  isExternal?: boolean;
}

export const mediumPosts: MediumPost[] = [
  {
    title: "How I Landed a Google DeepMind Project in Google Summer of Code 2025: A Step-by-Step Guide",
    url: "https://medium.com/@heilcheng2-c/how-i-landed-a-google-deepmind-project-in-google-summer-of-code-2025-a-step-by-step-guide-ccb2dee66769",
    publishedAt: "2025-05-10",
    summary: "A comprehensive guide sharing my experience and strategies for successfully securing a Google DeepMind project in Google Summer of Code 2025.",
    tags: ["Google Summer of Code", "DeepMind", "Career", "Guide"],
    isExternal: true
  },
  {
    title: "完整分析及證據：香港名校中學生發明 MediSafe 應用程式之爭議",
    url: "https://medium.com/@heilcheng2-c/完整分析及證據-香港名校中學生發明-medisafe-應用程式之爭議-43c18f1d8c1b",
    publishedAt: "2025-06-23",
    summary: "An in-depth analysis with evidence regarding the controversy surrounding the MediSafe app invention by Hong Kong elite secondary school students.",
    tags: ["Hong Kong", "Education", "Technology", "Analysis"],
    isExternal: true
  }
];

export function getMediumPosts(): MediumPost[] {
  return mediumPosts;
} 
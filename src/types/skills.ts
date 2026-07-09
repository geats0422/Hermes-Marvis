export interface SkillCollectionChild {
  name: string;
  description: string;
}

export interface SkillCollection {
  id: string;
  category: string | null;
  router: SkillCollectionChild | null;
  children: SkillCollectionChild[];
}

export interface SkillStandalone {
  id: string;
  name: string;
  description: string;
  category: string | null;
}

export interface SkillCollectionsResponse {
  collections: SkillCollection[];
  standalones: SkillStandalone[];
}

export function getCollectionSkillNames(c: SkillCollection): string[] {
  return c.router
    ? [c.router.name, ...c.children.map((ch) => ch.name)]
    : c.children.map((ch) => ch.name);
}

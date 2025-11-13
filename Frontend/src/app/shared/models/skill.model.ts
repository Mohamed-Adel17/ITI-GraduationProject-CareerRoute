/**
 * Skill Model
 *
 * Represents skills in the Career Route application.
 * Skills are areas of expertise that can be used for both:
 * - User career interests (areas where they seek guidance)
 * - Mentor expertise tags (areas where they provide consultation)
 *
 * Skills belong to categories and are organized under them.
 * Based on Skills-Endpoints.md contract.
 */

/**
 * Skill Interface (SkillDto)
 * Represents a skill entity from the backend
 *
 * @remarks
 * - Skills are flat (no parent-child relationships)
 * - Each skill belongs to exactly one category
 * - Used for both user career interests and mentor expertise
 * - Mix of career guidance and technical consultation areas
 */
export interface Skill {
  /** Unique identifier for the skill (integer) */
  id: number;

  /** Name of the skill */
  name: string;

  /** Category ID this skill belongs to */
  categoryId: number;

  /** Category name (populated by backend for convenience) */
  categoryName: string;

  /** Whether the skill is active/visible */
  isActive: boolean;
}

/**
 * Skill Summary
 * Lightweight version of Skill for simple lists
 */
export interface SkillSummary {
  /** Unique identifier (integer) */
  id: number;

  /** Skill name */
  name: string;

  /** Whether the skill is active */
  isActive?: boolean;
}

// ==================== Helper Functions ====================

/**
 * Get skill display name
 * @param skill - Skill to get name from
 * @returns Display name or empty string
 */
export function getSkillName(skill: Skill | SkillSummary | null | undefined): string {
  return skill?.name || '';
}

/**
 * Get skill names as string array
 * @param skills - Array of skills
 * @returns Array of skill names
 */
export function getSkillNames(skills: Skill[] | SkillSummary[]): string[] {
  return skills.map(skill => skill.name);
}

/**
 * Get only active skills
 * @param skills - Array of skills
 * @returns Only active skills
 */
export function getActiveSkills(skills: Skill[]): Skill[] {
  return skills.filter(skill => skill.isActive);
}

/**
 * Find skill by name (case-insensitive)
 * @param skills - Array of skills to search
 * @param name - Name to search for
 * @returns Matching skill or undefined
 */
export function findSkillByName(skills: Skill[], name: string): Skill | undefined {
  const normalizedName = name.toLowerCase().trim();
  return skills.find(skill => skill.name.toLowerCase() === normalizedName);
}

/**
 * Find skill by ID
 * @param skills - Array of skills to search
 * @param id - ID to search for
 * @returns Matching skill or undefined
 */
export function findSkillById(skills: Skill[], id: number): Skill | undefined {
  return skills.find(skill => skill.id === id);
}

/**
 * Group skills by category
 * @param skills - Array of skills to group
 * @returns Map of categoryId to skills array
 */
export function groupSkillsByCategory(skills: Skill[]): Map<number, Skill[]> {
  const grouped = new Map<number, Skill[]>();

  for (const skill of skills) {
    const categorySkills = grouped.get(skill.categoryId) || [];
    categorySkills.push(skill);
    grouped.set(skill.categoryId, categorySkills);
  }

  return grouped;
}

/**
 * Sort skills alphabetically by name
 * @param skills - Array of skills to sort
 * @returns Sorted array
 */
export function sortSkills(skills: Skill[]): Skill[] {
  return [...skills].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Convert Skill to SkillSummary
 * @param skill - Full skill object
 * @returns Lightweight skill summary
 */
export function toSkillSummary(skill: Skill): SkillSummary {
  return {
    id: skill.id,
    name: skill.name,
    isActive: skill.isActive
  };
}

// ==================== Type Guards ====================

/**
 * Type guard to check if object is a Skill
 * @param obj - Object to check
 * @returns True if object is a Skill
 */
export function isSkill(obj: any): obj is Skill {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'number' &&
    typeof obj.name === 'string' &&
    typeof obj.categoryId === 'number' &&
    typeof obj.categoryName === 'string' &&
    typeof obj.isActive === 'boolean'
  );
}

/**
 * Type guard to check if object is a SkillSummary
 * @param obj - Object to check
 * @returns True if object is a SkillSummary
 */
export function isSkillSummary(obj: any): obj is SkillSummary {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'number' &&
    typeof obj.name === 'string'
  );
}

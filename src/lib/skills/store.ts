import { createClient } from '@/lib/supabase/server';
import {
  MentraSkillManifest,
  getMentraSkill,
  listMentraSkills
} from './catalog';

const ALLOWED_SKILL_TOOLS = new Set([
  'getPlayerProgress',
  'addFinanceTransaction',
  'getFinanceSummary',
  'createQuest',
  'getTodayQuests',
  'completeQuest',
  'createGoal',
  'createSkill',
  'getNextLearningActivity',
  'saveJournal',
  'searchMemory',
  'getConnections',
  'routeToAgent',
  'scheduleMonitor',
  'listMonitors',
  'searchGmail',
  'readEmail',
  'draftEmail',
  'sendEmail',
  'getCalendarEvents',
  'createCalendarEvent',
  'searchDrive',
  'readDriveFile',
  'readSheet',
  'appendToSheet',
  'searchContacts',
  'runWebResearch',
  'runMultiAgentTask',
  'browserRead',
  'browserClick',
  'browserType',
  'browserSubmit'
]);

export interface PersistedMentraSkill extends MentraSkillManifest {
  custom: true;
  version: number;
}

function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function validateTools(requiredTools: string[]): string[] {
  const unique = Array.from(new Set(requiredTools));
  const invalid = unique.filter(tool => !ALLOWED_SKILL_TOOLS.has(tool));

  if (invalid.length > 0) {
    throw new Error(
      `Unsupported skill tools: ${invalid.join(', ')}`
    );
  }

  return unique;
}

function parseInstructions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(item => typeof item === 'string')
    .map(item => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function mapCustomSkill(row: any): PersistedMentraSkill {
  return {
    name: row.name,
    title: row.title,
    description: row.description || '',
    category: row.category,
    requiredTools: Array.isArray(row.required_tools)
      ? row.required_tools
      : [],
    instructions: parseInstructions(row.instructions),
    custom: true,
    version: Number(row.version || 1)
  };
}

export async function listAvailableMentraSkills(
  userId: string,
  category?: MentraSkillManifest['category']
): Promise<Array<MentraSkillManifest | PersistedMentraSkill>> {
  const builtins = listMentraSkills(category);
  const supabase = createClient();

  let query = supabase
    .from('mentra_custom_skills')
    .select('*')
    .eq('user_id', userId)
    .eq('is_enabled', true)
    .order('updated_at', { ascending: false });

  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error || !data) return builtins;

  return [
    ...builtins,
    ...data.map(mapCustomSkill)
  ];
}

export async function getAvailableMentraSkill(
  userId: string,
  name: string
): Promise<MentraSkillManifest | PersistedMentraSkill | null> {
  const normalized = normalizeName(name);
  const builtin = getMentraSkill(normalized);
  if (builtin) return builtin;

  const supabase = createClient();
  const { data, error } = await supabase
    .from('mentra_custom_skills')
    .select('*')
    .eq('user_id', userId)
    .eq('name', normalized)
    .eq('is_enabled', true)
    .maybeSingle();

  if (error || !data) return null;
  return mapCustomSkill(data);
}

export async function saveCustomMentraSkill(
  userId: string,
  input: {
    name: string;
    title: string;
    description: string;
    category: MentraSkillManifest['category'];
    requiredTools: string[];
    instructions: string[];
  }
): Promise<PersistedMentraSkill> {
  const name = normalizeName(input.name);
  if (!name) throw new Error('Skill name is required.');

  if (getMentraSkill(name)) {
    throw new Error('Built-in skill names cannot be overwritten.');
  }

  const requiredTools = validateTools(input.requiredTools);
  const instructions = parseInstructions(input.instructions);

  if (instructions.length === 0) {
    throw new Error('At least one skill instruction is required.');
  }

  const supabase = createClient();

  const { data: existing } = await supabase
    .from('mentra_custom_skills')
    .select('id, version')
    .eq('user_id', userId)
    .eq('name', name)
    .maybeSingle();

  const version = Number(existing?.version || 0) + 1;

  const payload = {
    user_id: userId,
    name,
    title: input.title.trim().slice(0, 120),
    description: input.description.trim().slice(0, 1000),
    category: input.category,
    required_tools: requiredTools,
    instructions,
    source: 'USER_CREATED',
    trust_level: 'USER',
    is_enabled: true,
    version,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('mentra_custom_skills')
    .upsert(payload, { onConflict: 'user_id,name' })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to save custom skill.');
  }

  return mapCustomSkill(data);
}

export async function disableCustomMentraSkill(
  userId: string,
  name: string
): Promise<boolean> {
  const normalized = normalizeName(name);
  if (!normalized || getMentraSkill(normalized)) return false;

  const supabase = createClient();
  const { error } = await supabase
    .from('mentra_custom_skills')
    .update({
      is_enabled: false,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('name', normalized);

  return !error;
}

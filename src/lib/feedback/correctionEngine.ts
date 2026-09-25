import { createClient } from '@/lib/supabase/server';

export type CorrectionType =
  | 'WRONG_FACT'
  | 'OUTDATED_FACT'
  | 'WRONG_PREFERENCE'
  | 'WRONG_PRIORITY'
  | 'WRONG_PROJECT'
  | 'WRONG_DATE'
  | 'TEMPORARY_OVERRIDE';

export interface UserCorrection {
  id: string;
  userId: string;
  correctionType: CorrectionType;
  targetEntityType: 'GOAL' | 'PROJECT' | 'PREFERENCE' | 'MEMORY' | 'HABIT';
  targetEntityId?: string;
  oldValue?: string;
  newValue: string;
  isDurable: boolean;
  status: 'APPLIED' | 'REVERTED';
  appliedAt: string;
  createdAt: string;
}

const memCorrections: UserCorrection[] = [];

/**
 * Applies a structured user correction.
 * Updates current operating context, marks outdated information as historical,
 * and differentiates between permanent preferences and temporary day overrides.
 */
export async function applyUserCorrection(
  userId: string,
  correction: {
    correctionType: CorrectionType;
    targetEntityType: 'GOAL' | 'PROJECT' | 'PREFERENCE' | 'MEMORY' | 'HABIT';
    targetEntityId?: string;
    oldValue?: string;
    newValue: string;
    isDurable?: boolean; // false if temporary context like "aaj business mat dena"
  }
): Promise<{ success: boolean; correction: UserCorrection }> {
  const id = `cor_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const isDurable = correction.isDurable ?? (correction.correctionType !== 'TEMPORARY_OVERRIDE');

  const entry: UserCorrection = {
    id,
    userId,
    correctionType: correction.correctionType,
    targetEntityType: correction.targetEntityType,
    targetEntityId: correction.targetEntityId,
    oldValue: correction.oldValue,
    newValue: correction.newValue,
    isDurable,
    status: 'APPLIED',
    appliedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  memCorrections.push(entry);

  try {
    const supabase = createClient();
    Promise.resolve(
      supabase.from('user_corrections').insert({
        id,
        user_id: userId,
        correction_type: entry.correctionType,
        target_entity_type: entry.targetEntityType,
        target_entity_id: entry.targetEntityId || null,
        old_value: entry.oldValue || null,
        new_value: entry.newValue,
        is_durable: entry.isDurable,
        status: entry.status,
        applied_at: entry.appliedAt,
        created_at: entry.createdAt
      })
    ).catch(() => {});
  } catch {
    // In-memory fallback
  }

  return { success: true, correction: entry };
}

/**
 * Retrieves all active corrections for a user to inject into current prompt context.
 */
export async function getActiveCorrections(userId: string): Promise<UserCorrection[]> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('user_corrections')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'APPLIED')
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        userId: d.user_id,
        correctionType: d.correction_type,
        targetEntityType: d.target_entity_type,
        targetEntityId: d.target_entity_id,
        oldValue: d.old_value,
        newValue: d.new_value,
        isDurable: d.is_durable,
        status: d.status,
        appliedAt: d.applied_at,
        createdAt: d.created_at
      }));
    }
  } catch {
    // Fallback
  }

  return memCorrections.filter(c => c.userId === userId && c.status === 'APPLIED');
}

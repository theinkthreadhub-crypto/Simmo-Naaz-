set lock_timeout = '5s';

alter table public.xp_transactions
  drop constraint if exists xp_transactions_source_type_check;

alter table public.xp_transactions
  add constraint xp_transactions_source_type_check
  check (
    source_type in (
      'QUEST',
      'SKILL_LESSON',
      'SKILL_PRACTICE',
      'JOURNAL',
      'JOURNAL_LOG',
      'MILESTONE',
      'GOAL_MILESTONE',
      'BOSS_MISSION',
      'ACHIEVEMENT',
      'STREAK_BONUS',
      'MANUAL'
    )
  );

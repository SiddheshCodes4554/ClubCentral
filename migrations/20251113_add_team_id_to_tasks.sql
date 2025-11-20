DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'tasks'
      AND column_name = 'team_id'
  ) THEN
    ALTER TABLE tasks
      ADD COLUMN team_id varchar;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'tasks'
      AND kcu.column_name = 'team_id'
  ) THEN
    ALTER TABLE tasks
      ADD CONSTRAINT tasks_team_id_fkey
      FOREIGN KEY (team_id) REFERENCES teams(id)
      ON DELETE SET NULL;
  END IF;
END
$$;


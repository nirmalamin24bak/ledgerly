-- ============================================================
-- AI QUERY RPC — Run this AFTER the main schema SQL
-- This enables the AI natural-language query feature.
-- ============================================================

-- Allowlist: only these table names can appear in queries
CREATE OR REPLACE FUNCTION execute_user_query(p_sql TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_upper TEXT;
  v_result JSONB;
BEGIN
  v_upper := upper(trim(p_sql));

  -- Security: only allow SELECT
  IF NOT (v_upper LIKE 'SELECT%') THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;

  -- Block dangerous patterns
  IF v_upper ~ '\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|GRANT|REVOKE|EXECUTE|COPY|SET|RESET|BEGIN|COMMIT|ROLLBACK)\b' THEN
    RAISE EXCEPTION 'Query contains forbidden operations';
  END IF;

  -- Limit result size (prevent huge scans)
  IF v_upper NOT LIKE '%LIMIT%' THEN
    p_sql := p_sql || ' LIMIT 100';
  END IF;

  EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || p_sql || ') t'
    INTO v_result;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION execute_user_query(TEXT) TO authenticated;

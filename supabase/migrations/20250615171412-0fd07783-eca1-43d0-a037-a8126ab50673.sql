
CREATE OR REPLACE FUNCTION public.get_public_tables()
RETURNS TABLE(table_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT pg_tables.tablename::TEXT
  FROM pg_catalog.pg_tables
  WHERE pg_tables.schemaname = 'public';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

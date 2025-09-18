SELECT json_agg(row_to_json(t))
FROM (
  SELECT id, title, description
  FROM courses
) t;

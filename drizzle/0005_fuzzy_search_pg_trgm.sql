CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "courses_search_title_trgm_idx"
ON "courses" USING gin (
  (translate(lower("title"), 'áàäâãåÁÀÄÂÃÅéèëêÉÈËÊíìïîÍÌÏÎóòöôõÓÒÖÔÕúùüûÚÙÜÛñÑçÇ', 'aaaaaaAAAAAAeeeeEEEEiiiiIIIIoooooOOOOOuuuuUUUUnNcC')) gin_trgm_ops
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "programas_search_title_trgm_idx"
ON "programas" USING gin (
  (translate(lower("title"), 'áàäâãåÁÀÄÂÃÅéèëêÉÈËÊíìïîÍÌÏÎóòöôõÓÒÖÔÕúùüûÚÙÜÛñÑçÇ', 'aaaaaaAAAAAAeeeeEEEEiiiiIIIIoooooOOOOOuuuuUUUUnNcC')) gin_trgm_ops
);

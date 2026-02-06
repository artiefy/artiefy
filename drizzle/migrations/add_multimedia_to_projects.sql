-- Add multimedia field to projects table to store multiple image/video references
ALTER TABLE "projects" ADD COLUMN "multimedia" text DEFAULT NULL;

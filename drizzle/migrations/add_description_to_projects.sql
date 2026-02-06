-- Add description field to projects table
-- This field stores the initial project description/overview
-- while planteamiento stores the problem statement

ALTER TABLE projects ADD COLUMN description text;

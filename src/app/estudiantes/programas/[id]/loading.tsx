import { CourseDetailsSkeleton } from '~/components/estudiantes/layout/coursedetail/CourseDetailsSkeleton';

// Streamed while the detail page resolves its data. Reuses the course detail
// skeleton so the hero, tabs and sidebar do not jump when content arrives.
export default function Loading() {
  return <CourseDetailsSkeleton />;
}

import type { Course } from './index';

export interface CourseHeaderProps {
  course: Course;
  totalStudents: number;
  isEnrolled: boolean;
  isEnrolling: boolean;
  isUnenrolling: boolean;
  isSubscriptionActive: boolean;
  subscriptionEndDate: string | null;
  onEnroll: () => Promise<void>;
  onUnenroll: () => Promise<void>;
  isCheckingEnrollment: boolean;
}

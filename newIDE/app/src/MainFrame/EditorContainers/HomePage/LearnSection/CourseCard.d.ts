import * as React from 'react';
import type { Course } from '../../../../Utils/GDevelopServices/Asset';
import type { CourseListingData } from '../../../../Utils/GDevelopServices/Shop';
import type { CourseCompletion } from '../UseCourses';

export declare const getChipColorFromEnglishLevel: (
  englishLevel: string
) => string;

export declare const getSpecializationConfig: (specializationId: string) => {
  label: React.ReactNode;
  color: string;
};

export type Props = {
  completion: CourseCompletion | null | undefined;
  course: Course | null | undefined;
  courseListingData: CourseListingData | null | undefined;
  onClick?: () => void;
  discountedPrice?: boolean;
  disabled?: boolean;
};

declare const CourseCard: React.ComponentType<Props>;
export default CourseCard;

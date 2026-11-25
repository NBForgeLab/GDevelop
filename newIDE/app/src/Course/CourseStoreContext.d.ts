import * as React from 'react';
import type {
  CourseListingData,
  CourseChapterListingData,
} from '../Utils/GDevelopServices/Shop';

export type CourseChapterStoreState = {
  listedCourses: CourseListingData[] | null;
  listedCourseChapters: CourseChapterListingData[] | null;
};

export declare const initialCourseStoreState: CourseChapterStoreState;

export declare const CourseStoreStateProvider: (props: {
  children: React.ReactNode;
}) => React.ReactElement;

declare const CourseStoreContext: React.Context<CourseChapterStoreState>;
export default CourseStoreContext;

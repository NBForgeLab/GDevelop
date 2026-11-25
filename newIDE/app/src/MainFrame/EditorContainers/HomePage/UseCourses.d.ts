export type CourseChapterCompletion = {
  completedTasks: number;
  tasks: number;
};

export type CourseCompletion = {
  percentage: number;
  completedChapters: number;
  chapters: number;
};

declare const useCourses: () => Record<string, any>;
export default useCourses;

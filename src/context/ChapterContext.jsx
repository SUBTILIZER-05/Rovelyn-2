import React from 'react';
import { useAppData } from './AppDataContext';

export const ChapterProvider = ({ children }) => {
  return <>{children}</>;
};

export const useChapters = () => {
  const data = useAppData();
  return {
    chapters: data.chapters || [],
    loading: data.loading,
    fetchChapters: data.fetchUserData,
    addChapter: data.addChapter,
    deleteChapter: data.deleteChapter,
    updateChapter: data.updateChapter,
    getSubjectChapters: data.getSubjectChapters,
  };
};

export default ChapterProvider;

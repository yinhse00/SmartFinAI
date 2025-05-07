
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import TimetableViewer from '@/components/timetable/TimetableViewer';

const TimetablePage: React.FC = () => {
  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-finance-dark-blue dark:text-white">Transaction Timetable</h1>
        <p className="text-gray-600 dark:text-gray-300">
          View and manage transaction timetables for regulatory compliance
        </p>
      </div>
      
      <TimetableViewer />
    </MainLayout>
  );
};

export default TimetablePage;

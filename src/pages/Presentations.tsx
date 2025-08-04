import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { PresentationProjectSelector } from '@/components/presentation/PresentationProjectSelector';
import { PresentationWorkspace } from '@/components/presentation/PresentationWorkspace';
import { PresentationType } from '@/types/presentation';

const Presentations = () => {
  const [selectedProject, setSelectedProject] = useState<{
    id: string;
    type: PresentationType;
  } | null>(null);

  const handleProjectSelect = (projectId: string, type: PresentationType) => {
    setSelectedProject({ id: projectId, type });
  };

  const handleBack = () => {
    setSelectedProject(null);
  };

  if (selectedProject) {
    return (
      <PresentationWorkspace
        projectId={selectedProject.id}
        presentationType={selectedProject.type}
        onBack={handleBack}
      />
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Presentations & Pitch Books
          </h1>
          <p className="text-muted-foreground">
            Create professional presentations for IPO roadshows, investment banking pitches, and client materials
          </p>
        </div>
        
        <PresentationProjectSelector onProjectSelect={handleProjectSelect} />
      </div>
    </MainLayout>
  );
};

export default Presentations;
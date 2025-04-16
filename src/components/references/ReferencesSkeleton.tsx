
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const ReferencesSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex space-x-4 p-4 border rounded-lg">
          <Skeleton className="h-12 w-12 rounded-md" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-3 w-[200px]" />
            <div className="flex gap-4">
              <Skeleton className="h-3 w-[100px]" />
              <Skeleton className="h-3 w-[100px]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReferencesSkeleton;

import { ApiUsageControl } from '@/components/chat/ApiUsageControl';
import { APIUsageDashboard } from '@/components/ipo/APIUsageDashboard';

export const ApiUsageSettings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">API Usage Management</h2>
        <p className="text-muted-foreground">
          Control your API usage and optimize costs with manual controls and monitoring.
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <ApiUsageControl />
        <APIUsageDashboard />
      </div>
    </div>
  );
};
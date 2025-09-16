
import SidebarLayout from '@/components/layout/SidebarLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const SupportPage = () => {
  return (
    <SidebarLayout>
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Help & Support</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Find help and support here.</p>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
};

export default SupportPage;

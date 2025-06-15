
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const SupportPage = () => {
  return (
    <MainLayout>
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
    </MainLayout>
  );
};

export default SupportPage;

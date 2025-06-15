
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const BillingPage = () => {
  return (
    <MainLayout>
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Billing & Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Manage your billing and payment information.</p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default BillingPage;

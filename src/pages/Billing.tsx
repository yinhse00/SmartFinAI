
import SidebarLayout from '@/components/layout/SidebarLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const BillingPage = () => {
  return (
    <SidebarLayout>
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
    </SidebarLayout>
  );
};

export default BillingPage;

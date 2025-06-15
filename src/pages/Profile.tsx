
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const ProfilePage = () => {
  return (
    <MainLayout>
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Manage your profile information.</p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ProfilePage;

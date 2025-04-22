
import MainLayout from '@/components/layout/MainLayout';
import { DataTable } from '@/components/data-table/DataTable';

type UserData = {
  id: number;
  name: string;
  age: number;
  role: string;
};

const sampleData: UserData[] = [
  { id: 1, name: "Alice", age: 25, role: "Developer" },
  { id: 2, name: "Bob", age: 30, role: "Designer" },
  { id: 3, name: "Charlie", age: 35, role: "Manager" }
];

const columns = [
  { key: 'id' as const, header: 'ID', width: '10%' },
  { key: 'name' as const, header: 'Name', width: '30%' },
  { key: 'age' as const, header: 'Age', width: '20%' },
  { key: 'role' as const, header: 'Role', width: '40%' }
];

export default function Dashboard() {
  return (
    <MainLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">User Data</h1>
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="p-6">
            <DataTable data={sampleData} columns={columns} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

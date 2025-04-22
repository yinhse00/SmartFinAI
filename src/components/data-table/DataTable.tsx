
import { useState, useMemo } from 'react';
import { CaretSort, Search } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';

interface DataTableProps<T> {
  data: T[];
  columns: {
    key: keyof T;
    header: string;
    width?: string;
  }[];
}

export function DataTable<T extends { [key: string]: any }>({ data, columns }: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null;
    direction: 'asc' | 'desc' | null;
  }>({
    key: null,
    direction: null,
  });
  const [searchTerm, setSearchTerm] = useState('');

  const handleSort = (key: keyof T) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }
    
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    let sortableData = [...data];
    
    if (searchTerm) {
      sortableData = sortableData.filter(item => 
        Object.values(item).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (sortConfig.key && sortConfig.direction) {
      sortableData.sort((a, b) => {
        if (a[sortConfig.key!] < b[sortConfig.key!]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key!] > b[sortConfig.key!]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return sortableData;
  }, [data, sortConfig, searchTerm]);

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <Search className="mr-2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={String(column.key)}
                  className="cursor-pointer hover:bg-muted/50"
                  style={{ width: column.width }}
                  onClick={() => handleSort(column.key)}
                >
                  <div className="flex items-center space-x-2">
                    <span>{column.header}</span>
                    <CaretSort className="h-4 w-4" />
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((row, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell key={String(column.key)}>
                    {row[column.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}


import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"

interface StyledTableProps {
  headers: string[];
  rows: (string | number | JSX.Element)[][];
}

export function StyledTable({ headers, rows }: StyledTableProps) {
  return (
    <div className="w-full overflow-auto rounded-md border bg-white shadow-sm dark:bg-gray-800">
      <Table>
        <TableHeader className="sticky top-0">
          <TableRow>
            {headers.map((header, index) => (
              <TableHead 
                key={index}
                className="bg-gray-50 font-semibold dark:bg-gray-900"
              >
                {header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow 
              key={rowIndex}
              className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {row.map((cell, cellIndex) => (
                <TableCell 
                  key={cellIndex}
                  className={rowIndex % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'}
                >
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

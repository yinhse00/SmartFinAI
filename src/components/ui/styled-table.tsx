
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { ChevronUp, ChevronDown } from "lucide-react"

interface StyledTableProps {
  headers: string[];
  rows: (string | number | JSX.Element)[][];
  sortable?: boolean;
  onSort?: (column: number) => void;
}

export function StyledTable({ 
  headers, 
  rows, 
  sortable = false,
  onSort 
}: StyledTableProps) {
  return (
    <div className="w-full overflow-auto rounded-md border bg-white shadow-sm dark:bg-gray-800">
      <Table>
        <TableHeader className="sticky top-0 z-10">
          <TableRow>
            {headers.map((header, index) => (
              <TableHead 
                key={index}
                className={`
                  bg-gray-50 font-semibold dark:bg-gray-900 
                  ${sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : ''}
                `}
                onClick={sortable ? () => onSort && onSort(index) : undefined}
              >
                <div className="flex items-center justify-between">
                  {header}
                  {sortable && (
                    <div className="flex flex-col ml-2">
                      <ChevronUp className="h-3 w-3 text-gray-400" />
                      <ChevronDown className="h-3 w-3 text-gray-400" />
                    </div>
                  )}
                </div>
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
                  className={`
                    ${rowIndex % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'}
                    p-4 text-sm
                  `}
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

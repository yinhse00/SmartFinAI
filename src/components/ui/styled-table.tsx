
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
    <div className="w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <Table>
        <TableHeader className="sticky top-0 z-10">
          <TableRow>
            {headers.map((header, index) => (
              <TableHead 
                key={index}
                className={`
                  bg-gray-50 px-6 py-4 text-left text-sm font-semibold text-gray-900 
                  dark:bg-gray-900 dark:text-gray-100
                  ${sortable ? 'cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-700' : ''}
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
                    px-6 py-4 text-sm text-gray-700 dark:text-gray-300
                    border-t border-gray-200 dark:border-gray-700
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

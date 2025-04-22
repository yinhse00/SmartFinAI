
import { StyledTable } from "@/components/ui/styled-table"

const TableExample = () => {
  const headers = ["Name", "Role", "Department", "Status"]
  const rows = [
    ["John Smith", "Senior Developer", "Engineering", "Active"],
    ["Sarah Johnson", "Product Manager", "Product", "On Leave"],
    ["Mike Williams", "UX Designer", "Design", "Active"],
    ["Emily Brown", "Data Analyst", "Analytics", "Active"],
    ["James Wilson", "Tech Lead", "Engineering", "Away"]
  ]

  const handleSort = (columnIndex: number) => {
    console.log("Sorting by column:", columnIndex);
    // Implement sorting logic here if needed
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        Team Members
      </h2>
      <StyledTable 
        headers={headers} 
        rows={rows} 
        sortable={true}
        onSort={handleSort}
      />
    </div>
  )
}

export default TableExample

"use client"

import * as React from "react"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export interface Column<T> {
  id: string
  header: string
  accessorKey?: keyof T
  cell?: (row: T) => React.ReactNode
  sortable?: boolean
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  pageSize?: number
  pageSizeOptions?: number[]
  onRowClick?: (row: T) => void
  emptyMessage?: string
  sortColumn?: string
  sortDirection?: "asc" | "desc"
  onSort?: (column: string) => void
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  loading = false,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  onRowClick,
  emptyMessage = "No results found.",
  sortColumn,
  sortDirection,
  onSort,
}: DataTableProps<T>) {
  const [page, setPage] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(initialPageSize)

  const totalPages = Math.ceil(data.length / pageSize)
  const paginatedData = data.slice(page * pageSize, (page + 1) * pageSize)

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value))
    setPage(0)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-white">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                {columns.map((column) => (
                  <TableHead key={column.id} className={column.className}>
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index} className="border-border">
                  {columns.map((column) => (
                    <TableCell key={column.id} className={column.className}>
                      <Skeleton className="h-5 w-full bg-gray-100" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-white p-8 text-center">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50 border-border hover:bg-gray-50/50">
              {columns.map((column) => (
                <TableHead key={column.id} className={cn("font-medium text-gray-600", column.className)}>
                  {column.sortable && onSort ? (
                    <button
                      onClick={() => onSort(column.id)}
                      className="flex items-center gap-1 hover:text-gray-900"
                    >
                      {column.header}
                      {sortColumn === column.id ? (
                        sortDirection === "asc" ? (
                          <ArrowUp className="h-4 w-4" />
                        ) : (
                          <ArrowDown className="h-4 w-4" />
                        )
                      ) : (
                        <ArrowUpDown className="h-4 w-4 opacity-50" />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row) => (
              <TableRow
                key={row.id}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  "border-border",
                  onRowClick && "cursor-pointer hover:bg-gray-50"
                )}
              >
                {columns.map((column) => (
                  <TableCell key={column.id} className={column.className}>
                    {column.cell
                      ? column.cell(row)
                      : column.accessorKey
                      ? String(row[column.accessorKey] ?? "")
                      : null}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Rows per page:</span>
          <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="w-[70px] h-8 bg-white border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-border">
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>
            {page * pageSize + 1}-{Math.min((page + 1) * pageSize, data.length)} of{" "}
            {data.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-border bg-white hover:bg-gray-50"
            onClick={() => setPage(0)}
            disabled={page === 0}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-border bg-white hover:bg-gray-50"
            onClick={() => setPage(page - 1)}
            disabled={page === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-2 text-sm text-gray-500">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-border bg-white hover:bg-gray-50"
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-border bg-white hover:bg-gray-50"
            onClick={() => setPage(totalPages - 1)}
            disabled={page >= totalPages - 1}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

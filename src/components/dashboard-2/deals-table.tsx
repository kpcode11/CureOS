"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ClipboardList,
  Search,
  Filter,
  FileInput,
  MoreHorizontal,
  X,
  Eye,
  Pencil,
  Trash2,
  Copy,
  FileSpreadsheet,
  FileText,
  Database,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export interface DataRow {
  id: string;
  name: string;
  initial: string;
  color: string;
  type: string;
  status: "Active" | "Inactive" | "Pending" | "Verified";
  value: number | string;
  details: string;
  lastUpdated: string;
}

const dataTypes = ["Patients", "Doctors", "Users", "Roles"];
const statuses = ["Active", "Inactive", "Pending", "Verified"];

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

export function DealsTable() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [dataType, setDataType] = React.useState("Patients");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [data, setData] = React.useState<DataRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const hasActiveFilters = statusFilter !== "all";

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let endpoint = '';
        switch (dataType) {
          case 'Patients':
            endpoint = '/api/patients';
            break;
          case 'Doctors':
            endpoint = '/api/doctors';
            break;
          case 'Users':
            endpoint = '/api/admin/users';
            break;
          case 'Roles':
            endpoint = '/api/admin/roles';
            break;
        }
        
        const response = await fetch(endpoint);
        const result = await response.json();
        
        const transformedData: DataRow[] = Array.isArray(result) ? result.map((item: any, index: number) => {
          const colors = [
            "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500",
            "bg-pink-500", "bg-teal-500", "bg-red-500", "bg-indigo-500"
          ];
          
          return {
            id: item.id || index.toString(),
            name: item.name || item.firstName ? `${item.firstName} ${item.lastName}` : item.email || 'N/A',
            initial: (item.name || item.firstName || item.email || 'N').substring(0, 2).toUpperCase(),
            color: colors[index % colors.length],
            type: dataType,
            status: item.isActive === false ? 'Inactive' : item.verified === false ? 'Pending' : 'Active',
            value: item.patientNumber || item.employeeId || item.permissions?.length || 'N/A',
            details: item.email || item.department || item.description || 'No details',
            lastUpdated: item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : new Date().toLocaleDateString()
          };
        }) : [];
        
        setData(transformedData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [dataType]);

  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.details.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [data, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, pageSize]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, pageSize, dataType]);

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Inactive":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "Verified":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:px-6 sm:py-3.5">
        <div className="flex items-center gap-2 sm:gap-2.5 flex-1">
          <Button variant="outline" size="icon" className="size-7 sm:size-8 shrink-0">
            <ClipboardList className="size-4 sm:size-[18px] text-muted-foreground" />
          </Button>
          <span className="text-sm sm:text-base font-medium">{dataType} Data</span>
          <Badge variant="secondary" className="ml-1 text-[10px] sm:text-xs">
            {filteredData.length}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 sm:size-5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 sm:pl-10 w-full sm:w-[160px] lg:w-[200px] h-8 sm:h-9 text-sm"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`h-8 sm:h-9 gap-1.5 sm:gap-2 ${hasActiveFilters ? "border-primary" : ""}`}
              >
                <Filter className="size-3.5 sm:size-4" />
                <span className="hidden sm:inline">Filter</span>
                {hasActiveFilters && (
                  <span className="size-1.5 sm:size-2 rounded-full bg-primary" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[220px]">
              <DropdownMenuLabel>Data Type</DropdownMenuLabel>
              {dataTypes.map((type) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={dataType === type}
                  onCheckedChange={() => setDataType(type)}
                >
                  {type}
                </DropdownMenuCheckboxItem>
              ))}

              <DropdownMenuSeparator />

              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={statusFilter === "all"}
                onCheckedChange={() => setStatusFilter("all")}
              >
                All Statuses
              </DropdownMenuCheckboxItem>
              {statuses.map((status) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={statusFilter === status}
                  onCheckedChange={() => setStatusFilter(status)}
                >
                  {status}
                </DropdownMenuCheckboxItem>
              ))}

              {hasActiveFilters && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={clearFilters}
                    className="text-destructive"
                  >
                    <X className="size-4 mr-2" />
                    Clear all filters
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="hidden sm:block w-px h-[22px] bg-border" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 sm:h-9 gap-1.5 sm:gap-2">
                <FileInput className="size-3.5 sm:size-4" />
                <span className="hidden sm:inline">Import</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <FileSpreadsheet className="size-4 mr-2" />
                Import from CSV
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileText className="size-4 mr-2" />
                Import from Excel
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Database className="size-4 mr-2" />
                Import from CRM
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 px-3 sm:px-6 pb-3">
          <span className="text-[10px] sm:text-xs text-muted-foreground">Filters:</span>
          {statusFilter !== "all" && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer text-[10px] sm:text-xs h-5 sm:h-6"
              onClick={() => setStatusFilter("all")}
            >
              {statusFilter}
              <X className="size-2.5 sm:size-3" />
            </Badge>
          )}
        </div>
      )}

      <div className="px-3 sm:px-6 pb-3 sm:pb-4 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[40px] font-medium text-muted-foreground text-xs sm:text-sm">
                #
              </TableHead>
              <TableHead className="min-w-[180px] font-medium text-muted-foreground text-xs sm:text-sm">
                Name
              </TableHead>
              <TableHead className="hidden md:table-cell min-w-[140px] font-medium text-muted-foreground text-xs sm:text-sm">
                Details
              </TableHead>
              <TableHead className="min-w-[100px] font-medium text-muted-foreground text-xs sm:text-sm">
                Status
              </TableHead>
              <TableHead className="min-w-[90px] font-medium text-muted-foreground text-xs sm:text-sm">
                ID/Value
              </TableHead>
              <TableHead className="hidden lg:table-cell min-w-[150px] font-medium text-muted-foreground text-xs sm:text-sm">
                Type
              </TableHead>
              <TableHead className="hidden sm:table-cell font-medium text-muted-foreground text-xs sm:text-sm">
                Last Updated
              </TableHead>
              <TableHead className="w-[40px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground text-sm"
                >
                  No data found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, index) => (
                <TableRow 
                  key={row.id}
                  className="hover:bg-muted/50 transition-colors border-border/50"
                >
                  <TableCell className="font-medium text-xs sm:text-sm text-muted-foreground">
                    #{(currentPage - 1) * pageSize + index + 1}
                  </TableCell>
                  <TableCell className="font-medium text-xs sm:text-sm">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold",
                        row.type === 'PATIENTS' ? 'bg-blue-100 text-blue-600' :
                        row.type === 'DOCTORS' ? 'bg-green-100 text-green-600' :
                        row.type === 'ROLES' ? 'bg-purple-100 text-purple-600' :
                        'bg-gray-100 text-gray-600'
                      )}>
                        {row.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium leading-tight">{row.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{row.details}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="text-xs sm:text-sm">
                      <p className="font-medium">{row.details}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={cn(
                      "text-xs font-medium border-0",
                      row.status === 'Active' ? 'bg-green-100 text-green-600' :
                      row.status === 'Inactive' ? 'bg-red-100 text-red-600' :
                      row.status === 'Pending' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-gray-100 text-gray-600'
                    )}>
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-xs sm:text-sm">
                    {row.value}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs sm:text-sm">
                    <div>
                      <p className="font-medium">{row.type}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-xs sm:text-sm text-muted-foreground">
                    {row.lastUpdated}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 sm:px-6 py-3 border-t">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <span className="hidden sm:inline">Rows per page:</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => setPageSize(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-muted-foreground">
            {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} 
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="size-4" />
          </Button>
          
          <div className="flex items-center gap-1 mx-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="icon"
                  className="size-8"
                  onClick={() => goToPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => goToPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

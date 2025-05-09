
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  CalendarIcon,
  MoreHorizontal,
  Eye,
  Printer,
  Trash2,
  Download,
  FileBarChart2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

type ReportStatus = "Initial" | "Completed" | "Pending" | "Verified";

interface Report {
  reportDate: string;
  reportId: string;
  patientName: string;
  phone: string;
  doctor: string;
  status: ReportStatus;
}

const initialReportsData: Report[] = [
  {
    reportDate: "2024-07-20",
    reportId: "RPT001",
    patientName: "Mr. Shivek Bhasin",
    phone: "9876543210",
    doctor: "Dr. Emily Carter",
    status: "Completed",
  },
  {
    reportDate: "2024-07-19",
    reportId: "RPT002",
    patientName: "Ms. Anya Sharma",
    phone: "8765432109",
    doctor: "Dr. John Davis",
    status: "Pending",
  },
  {
    reportDate: "2024-07-18",
    reportId: "RPT003",
    patientName: "Dr. Rohan Verma",
    phone: "7654321098",
    doctor: "Dr. Alice Smith",
    status: "Verified",
  },
  {
    reportDate: "2024-07-17",
    reportId: "RPT004",
    patientName: "Mrs. Priya Patel",
    phone: "6543210987",
    doctor: "Dr. Robert Jones",
    status: "Initial",
  },
   {
    reportDate: "2024-07-16",
    reportId: "RPT005",
    patientName: "Mr. Arjun Reddy",
    phone: "5432109876",
    doctor: "Dr. Emily Carter",
    status: "Completed",
  },
];

const additionalReportsData: Report[] = [
    {
    reportDate: "2024-07-15",
    reportId: "RPT006",
    patientName: "Ms. Zara Khan",
    phone: "4321098765",
    doctor: "Dr. John Davis",
    status: "Pending",
  },
  {
    reportDate: "2024-07-14",
    reportId: "RPT007",
    patientName: "Mr. Vikram Singh",
    phone: "3210987654",
    doctor: "Dr. Alice Smith",
    status: "Verified",
  },
];


export default function ReportsPage() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    new Date()
  );
  const [reports, setReports] = React.useState(initialReportsData);
  const [visibleReportsCount, setVisibleReportsCount] = React.useState(initialReportsData.length);

  const filteredReports = reports.filter(
    (report) =>
      (report.patientName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (report.reportId?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (report.doctor?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (report.phone || "").includes(searchTerm)
  ).slice(0, visibleReportsCount);

  const handleShowMore = () => {
    const newCount = Math.min(reports.length, visibleReportsCount + 5); // Show 5 more or remaining
    if (newCount > visibleReportsCount) {
        setVisibleReportsCount(newCount);
    } else if (reports.length < initialReportsData.length + additionalReportsData.length) {
        // If all current reports are shown, try to load more from additional data
        const currentlyLoadedCount = reports.length - initialReportsData.length;
        if (currentlyLoadedCount < additionalReportsData.length) {
            const nextBatch = additionalReportsData.slice(currentlyLoadedCount, currentlyLoadedCount + 1); // Load one more
            setReports(prev => [...prev, ...nextBatch]);
            setVisibleReportsCount(prev => prev + nextBatch.length);
        }
    }
  };

  const getStatusBadgeClass = (status: ReportStatus) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-700 border-green-300"; // Using theme accent for actual component
      case "Pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-300"; // Using theme secondary for actual component
      case "Verified":
        return "bg-blue-100 text-blue-700 border-blue-300"; // Using theme primary for actual component
      case "Initial":
        return "bg-red-100 text-red-700 border-red-300"; // Using theme destructive for actual component
      default:
        return "bg-gray-100 text-gray-700 border-gray-300"; // Using theme muted for actual component
    }
  };

  const getStatusBadgeVariant = (status: ReportStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "Completed": return "default"; // Will be styled by accent
      case "Pending": return "secondary"; // Will be styled by its own HSL or a yellow
      case "Verified": return "default"; // Will be styled by primary
      case "Initial": return "destructive";
      default: return "outline";
    }
  }


  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
                <FileBarChart2 className="h-8 w-8 text-primary" />
                <div>
                    <CardTitle className="text-3xl font-bold">Reports</CardTitle>
                    <CardDescription>View and manage patient reports.</CardDescription>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <div className="relative flex-grow sm:flex-grow-0 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
                  className="pl-10 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" className="w-full sm:w-auto">
                <Download className="mr-2 h-5 w-5" /> Download All
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full sm:w-auto justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Date</TableHead>
                <TableHead>Report ID</TableHead>
                <TableHead>Patient Name</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead className="hidden lg:table-cell">Doctor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.length > 0 ? (
                filteredReports.map((report) => (
                  <TableRow key={report.reportId}>
                    <TableCell>{format(new Date(report.reportDate), "PP")}</TableCell>
                    <TableCell className="font-medium">{report.reportId}</TableCell>
                    <TableCell>{report.patientName}</TableCell>
                    <TableCell className="hidden md:table-cell">{report.phone}</TableCell>
                    <TableCell className="hidden lg:table-cell">{report.doctor}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={getStatusBadgeVariant(report.status)}
                        className={cn(
                            report.status === "Completed" && "bg-accent text-accent-foreground",
                            report.status === "Pending" && "bg-yellow-500 text-white", // Custom yellow as secondary might not be yellow
                            report.status === "Verified" && "bg-primary text-primary-foreground",
                            report.status === "Initial" && "bg-destructive text-destructive-foreground"
                        )}
                      >
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Report
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Printer className="mr-2 h-4 w-4" />
                            Print Report
                          </DropdownMenuItem>
                           <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Report
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No reports found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {(visibleReportsCount < reports.length || reports.length < initialReportsData.length + additionalReportsData.length) && filteredReports.length > 0 && (
            <CardFooter className="justify-center border-t pt-6">
                <Button variant="outline" onClick={handleShowMore}>Show More</Button>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}


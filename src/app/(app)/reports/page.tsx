
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  CalendarIcon,
  MoreHorizontal,
  Eye,
  Printer,
  Trash2,
  Download,
  FileBarChart2,
  Loader2,
  Edit,
  ListOrdered,
  Sigma,
  Send, // Added Send icon
  Mail, // Added Mail icon
  MessageSquare, // Added MessageSquare icon for WhatsApp
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SendReportDialog } from '@/components/send-report-dialog'; // New Dialog

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

type ReportStatus = "Initial" | "Pending" | "Completed" | "Verified";

interface Report {
  id: number;
  reportDate: string;
  reportIdNumber: string;
  patientName: string;
  patientPhone?: string | null; // Ensure this is fetched and passed
  patientEmail?: string | null; // Ensure this is fetched and passed
  doctorName?: string;
  billNumber?: string;
  status: ReportStatus;
  patient?: { fullName: string, patientId?: string, id?: number, email?: string | null, phone?: string | null }; // Ensure email/phone here
  doctor?: { fullName: string, doctorID?: string, id?: number };
  bill?: { billNumber: string, id?: number };
  notes?: string | null;
}

// Define local types for what the frontend expects for displaying report details
type ParameterFieldTypeFE = 'Numeric' | 'Text' | 'Option List' | 'Formula' | 'Group' | 'Text Editor' | 'Numeric Unbounded';

interface TestParameterFE {
  id: number; 
  name: string;
  fieldType: ParameterFieldTypeFE;
  units?: string | null;
  rangeText?: string | null;
  rangeLow?: number | null;
  rangeHigh?: number | null;
  options?: string[] | string | null; 
  isFormula?: boolean;
  formulaString?: string | null;
  parentId?: number | null;
  testMethod?: string | null;
}

interface TestDetailsFE {
  id: number;
  name: string;
  parameters?: TestParameterFE[];
}

interface ReportItemFE {
  id: number;
  reportId: number;
  itemName: string;
  itemType: 'Test' | 'Package';
  originalItemId: number | null;
  testDetails?: TestDetailsFE | null;
}

interface ReportParameterResultFE {
  id: number;
  reportId: number;
  testParameterId: number;
  resultValue?: string | null;
  isAbnormal?: boolean | null;
  notes?: string | null;
}

interface FullReportForView extends Report {
  items?: ReportItemFE[];
  parameterResults?: ReportParameterResultFE[];
}


export default function ReportsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [searchInputValue, setSearchInputValue] = React.useState("");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);
  const [reports, setReports] = React.useState<Report[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalReports, setTotalReports] = React.useState(0);
  const [limit] = React.useState(10);
  const [reportToDelete, setReportToDelete] = React.useState<Report | null>(null);

  const [selectedReportForDialog, setSelectedReportForDialog] = React.useState<Report | null>(null);
  const [detailedReportData, setDetailedReportData] = React.useState<FullReportForView | null>(null);
  const [isViewReportDialogOpen, setIsViewReportDialogOpen] = React.useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = React.useState(false);

  // State for Send Report Dialog
  const [isSendReportDialogOpen, setIsSendReportDialogOpen] = React.useState(false);
  const [reportToSend, setReportToSend] = React.useState<Report | null>(null);
  const [sendChannel, setSendChannel] = React.useState<'whatsapp' | 'email' | null>(null);


  const fetchReports = React.useCallback(async (page: number, search: string, date?: Date) => {
    setIsLoading(true);
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      toast({ title: "Authentication Error", description: "Please login.", variant: "destructive" });
      router.push('/');
      setIsLoading(false);
      return;
    }

    let queryParams = `page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`;
    if (date) {
        queryParams += `&date=${format(date, 'yyyy-MM-dd')}`;
    }

    try {
      const response = await fetch(`${BACKEND_API_URL}/reports?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (!response.ok) {
        if (response.status === 401) {
            toast({ title: "Authentication Error", description: "Session expired. Please login again.", variant: "destructive" });
            router.push('/');
        } else {
            throw new Error('Failed to fetch reports');
        }
        return;
      }
      const result = await response.json();
      if (result.success) {
        setReports(result.data);
        setTotalPages(result.totalPages);
        setCurrentPage(result.currentPage);
        setTotalReports(result.totalReports);
      } else {
        toast({ title: "Error", description: result.message || "Could not fetch reports.", variant: "destructive" });
        setReports([]);
        setTotalPages(1);
        setTotalReports(0);
      }
    } catch (error: any) {
      toast({ title: "Network Error", description: error.message || "Failed to connect to server.", variant: "destructive" });
      setReports([]);
      setTotalPages(1);
      setTotalReports(0);
    } finally {
      setIsLoading(false);
    }
  }, [limit, router, toast]);

  React.useEffect(() => {
    fetchReports(currentPage, searchTerm, selectedDate);
  }, [fetchReports, currentPage, searchTerm, selectedDate]);

  const handleSearchTrigger = () => {
    setCurrentPage(1);
    setSearchTerm(searchInputValue);
  };

  const handleKeyPressSearch = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearchTrigger();
    }
  };

  const handleDateSelect = (newDate?: Date) => {
    setCurrentPage(1);
    setSelectedDate(newDate);
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
    }
  };

  const getStatusBadgeClass = (status: ReportStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "Completed": return "default";
      case "Pending": return "secondary";
      case "Verified": return "default";
      case "Initial": return "destructive";
      default: return "outline";
    }
  };

  const handleViewReportDetails = async (report: Report) => {
    setSelectedReportForDialog(report);
    setIsViewReportDialogOpen(true);
    setDetailedReportData(null);
    setIsFetchingDetails(true);

    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        toast({ title: "Authentication Error", description: "Please login.", variant: "destructive" });
        setIsFetchingDetails(false);
        setIsViewReportDialogOpen(false);
        return;
    }
    try {
        const response = await fetch(`${BACKEND_API_URL}/reports/${report.id}`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
        });
        if (!response.ok) throw new Error('Failed to fetch report details');
        const result = await response.json();
        if (result.success && result.data) {
            setDetailedReportData(result.data as FullReportForView);
        } else {
            throw new Error(result.message || 'Could not load report details.');
        }
    } catch (error: any) {
        toast({ title: "Error Loading Details", description: error.message, variant: "destructive" });
    } finally {
        setIsFetchingDetails(false);
    }
  };

  const confirmDeleteReport = async () => {
    if (!reportToDelete) return;
    setIsDeleting(true);
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        toast({ title: "Authentication Error", description: "Please login.", variant: "destructive" });
        router.push('/');
        setIsDeleting(false);
        setReportToDelete(null);
        return;
    }
    try {
        const response = await fetch(`${BACKEND_API_URL}/reports/${reportToDelete.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` },
        });
        const result = await response.json();
        if (response.ok && result.success) {
            toast({ title: "Report Deleted", description: `Report ${reportToDelete.reportIdNumber} has been deleted.` });
             if (reports.length === 1 && currentPage > 1) {
                handlePageChange(currentPage - 1);
            } else {
                fetchReports(currentPage, searchTerm, selectedDate);
            }
            setTotalReports(prev => prev -1); 
        } else {
            toast({ title: "Error Deleting Report", description: result.message || "Could not delete report.", variant: "destructive" });
        }
    } catch (error: any) {
        toast({ title: "Network Error", description: error.message || "Failed to connect to server.", variant: "destructive" });
    } finally {
        setIsDeleting(false);
        setReportToDelete(null);
    }
  };

  const handleDownloadAllReports = async () => {
    setIsDownloading(true);
    toast({ title: "Preparing Download", description: "Your Excel file is being generated..."});
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        toast({ title: "Authentication Error", description: "Please login.", variant: "destructive" });
        setIsDownloading(false);
        return;
    }
    try {
        const response = await fetch(`${BACKEND_API_URL}/reports/export`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${authToken}`},
        });

        if (!response.ok) {
            const errorResult = await response.json().catch(() => ({ message: "Failed to download reports." }));
            throw new Error(errorResult.message || `Server error: ${response.status}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const contentDisposition = response.headers.get('content-disposition');
        let fileName = 'reports.xlsx';
        if (contentDisposition) {
            const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
            if (fileNameMatch && fileNameMatch.length > 1) {
                fileName = fileNameMatch[1];
            }
        }
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast({ title: "Download Started", description: "Reports Excel file is downloading."});

    } catch (error: any) {
        console.error("Download error:", error);
        toast({ title: "Download Failed", description: error.message || "Could not download reports.", variant: "destructive"});
    } finally {
        setIsDownloading(false);
    }
  };

  const openSendDialog = (report: Report, channelType: 'whatsapp' | 'email') => {
    setReportToSend(report);
    setSendChannel(channelType);
    setIsSendReportDialogOpen(true);
  };


  return (
    <AlertDialog open={!!reportToDelete} onOpenChange={(openStatus) => { if (!openStatus) setReportToDelete(null); }}>
      <div className="flex flex-col gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                  <FileBarChart2 className="h-8 w-8 text-primary" />
                  <div>
                      <CardTitle className="text-3xl font-bold">Reports ({totalReports})</CardTitle>
                      <CardDescription>View and manage patient reports.</CardDescription>
                  </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <div className="relative flex-grow sm:flex-grow-0 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search reports..."
                    className="pl-10 w-full"
                    value={searchInputValue}
                    onChange={(e) => setSearchInputValue(e.target.value)}
                    onKeyPress={handleKeyPressSearch}
                    disabled={isLoading}
                  />
                </div>
                <Button onClick={handleSearchTrigger} className="w-full sm:w-auto" disabled={isLoading}>
                  {isLoading && searchTerm === searchInputValue && searchInputValue !== "" ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Search className="mr-2 h-5 w-5 md:hidden" />}
                  <span className="hidden md:inline">Search</span>
                </Button>
                <Button variant="outline" className="w-full sm:w-auto" onClick={handleDownloadAllReports} disabled={isLoading || isDownloading}>
                  {isDownloading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Download className="mr-2 h-5 w-5" />}
                  {isDownloading ? 'Downloading...' : 'Download All'}
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-full sm:w-auto justify-start text-left font-normal"
                      disabled={isLoading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
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
                  <TableHead className="hidden lg:table-cell">Bill ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: limit }).map((_, index) => (
                      <TableRow key={`report-skeleton-${index}`}>
                          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
                      </TableRow>
                  ))
                ) : reports.length > 0 ? (
                  reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>{format(new Date(report.reportDate), "PP")}</TableCell>
                      <TableCell className="font-medium">{report.reportIdNumber}</TableCell>
                      <TableCell>{report.patientName}</TableCell>
                      <TableCell className="hidden md:table-cell">{report.patientPhone || 'N/A'}</TableCell>
                      <TableCell className="hidden lg:table-cell">{report.doctorName || 'N/A'}</TableCell>
                      <TableCell className="hidden lg:table-cell">{report.billNumber || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusBadgeClass(report.status)}
                          className={cn(
                              report.status === "Completed" && "bg-accent text-accent-foreground",
                              report.status === "Pending" && "bg-yellow-500 text-white",
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
                            <DropdownMenuItem onClick={() => handleViewReportDetails(report)}>
                              <Eye className="mr-2 h-4 w-4" /> View Report
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/reports/edit/${report.id}`)} disabled={report.status === 'Verified'}>
                              <Edit className="mr-2 h-4 w-4" /> Edit Report
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/reports/print/${report.id}`)}>
                              <Printer className="mr-2 h-4 w-4" /> Print Report
                            </DropdownMenuItem>
                            {/* <DropdownMenuSeparator />
                             <DropdownMenuItem onClick={() => openSendDialog(report, 'whatsapp')}>
                              <MessageSquare className="mr-2 h-4 w-4 text-green-600" /> Send via WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openSendDialog(report, 'email')}>
                              <Mail className="mr-2 h-4 w-4 text-blue-600" /> Send via Email
                            </DropdownMenuItem> */}
                            <DropdownMenuSeparator />
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive-foreground focus:bg-destructive"
                                  onSelect={(e) => e.preventDefault()}
                                  onClick={() => setReportToDelete(report)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete Report
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      No reports found.
                      {searchTerm || selectedDate ? " Try adjusting your search or date filter." : ""}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
          {totalPages > 1 && (
              <CardFooter className="justify-center border-t pt-6 space-x-2">
                  <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || isLoading}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || isLoading}
                >
                  Next
                </Button>
              </CardFooter>
          )}
        </Card>
      </div>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete report "{reportToDelete?.reportIdNumber}".
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setReportToDelete(null)} disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmDeleteReport}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Delete Report
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>

      {selectedReportForDialog && (
        <Dialog open={isViewReportDialogOpen} onOpenChange={setIsViewReportDialogOpen}>
          <DialogContent className="sm:max-w-2xl lg:max-w-3xl">
            <div className="flex flex-col h-full max-h-[calc(85vh-theme(spacing.12))]">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="flex items-center text-2xl font-semibold">
                  <FileBarChart2 className="mr-3 h-7 w-7 text-primary" />
                  Report Details: {selectedReportForDialog.reportIdNumber}
                </DialogTitle>
                 <DialogDescription>
                  <span>Patient: {detailedReportData?.patient?.fullName || selectedReportForDialog.patientName || 'N/A'}</span>
                  {detailedReportData?.doctor?.fullName && <span className="mx-1">| Doctor: Dr. {detailedReportData.doctor.fullName}</span>}
                  {detailedReportData?.bill?.billNumber && <span className="mx-1">| Bill: {detailedReportData.bill.billNumber}</span>}
                  <span className="mx-1">| Date: {format(new Date(selectedReportForDialog.reportDate), "PPP")}</span>
                </DialogDescription>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  Status:&nbsp;
                  <Badge
                    variant={getStatusBadgeClass(detailedReportData?.status || selectedReportForDialog.status)}
                    className={cn(
                      (detailedReportData?.status || selectedReportForDialog.status) === "Completed" && "bg-accent text-accent-foreground",
                      (detailedReportData?.status || selectedReportForDialog.status) === "Pending" && "bg-yellow-500 text-white",
                      (detailedReportData?.status || selectedReportForDialog.status) === "Verified" && "bg-primary text-primary-foreground",
                      (detailedReportData?.status || selectedReportForDialog.status) === "Initial" && "bg-destructive text-destructive-foreground"
                    )}
                  >
                    {detailedReportData?.status || selectedReportForDialog.status}
                  </Badge>
                </div>
              </DialogHeader>
              <Separator className="my-4 flex-shrink-0" />
              <ScrollArea className="flex-1 min-h-0 pr-4">
                {isFetchingDetails ? (
                  <div className="space-y-4 p-4">
                    <Skeleton className="h-8 w-1/3" /> <Skeleton className="h-6 w-full" /> <Skeleton className="h-6 w-2/3" />
                    <Separator className="my-3"/>
                    <Skeleton className="h-8 w-1/4 mb-2" /> <div className="space-y-2"> <Skeleton className="h-10 w-full" /> <Skeleton className="h-10 w-full" /> </div>
                  </div>
                ) : detailedReportData ? (
                  <div className="space-y-4">
                    <div>
                      <Label className="font-semibold text-foreground">Overall Report Notes:</Label>
                      <div className="text-sm text-muted-foreground mt-1 p-2 border rounded-md bg-muted/50 min-h-[60px] prose prose-sm max-w-none whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: detailedReportData.notes || 'No overall notes provided.' }} />
                    </div>
                    {detailedReportData.items && detailedReportData.items.length > 0 && (
                      <Accordion type="multiple" defaultValue={detailedReportData.items.map((item, index) => `view-item-${item.originalItemId || item.id}-${index}`)} className="w-full">
                        {detailedReportData.items.map((item, index) => (
                          <AccordionItem value={`view-item-${item.originalItemId || item.id}-${index}`} key={`view-report-item-${item.originalItemId || item.id}-${index}`}>
                            <Card className="shadow-sm">
                              <AccordionTrigger className="w-full px-4 py-3 hover:no-underline bg-secondary/30 rounded-t-md">
                                <CardTitle className="text-lg font-semibold text-left">{item.itemName} ({item.itemType})</CardTitle>
                              </AccordionTrigger>
                              <AccordionContent className="border-t">
                                <CardContent className="pt-4 space-y-3">
                                  {item.itemType === 'Package' && <p className="text-sm text-muted-foreground">This is a package. Individual test results are listed under their respective tests if applicable.</p>}
                                  {item.itemType === 'Test' && item.testDetails && item.testDetails.parameters && item.testDetails.parameters.length > 0 && (
                                    <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_0.5fr] items-center gap-x-4 gap-y-1 py-1 px-1 border-b text-xs font-medium text-muted-foreground">
                                      <span>Parameter</span> <span>Result</span> <span>Units</span> <span>Ref. Range</span> <span>Abn.</span>
                                    </div>
                                  )}
                                  {item.itemType === 'Test' && item.testDetails?.parameters?.map((param) => {
                                    const result = detailedReportData.parameterResults?.find(pr => pr.testParameterId === param.id);
                                    if (param.fieldType === 'Group') {
                                        return <div key={`param-group-${param.id}`} className="grid grid-cols-[1fr] items-center gap-x-4 gap-y-2 py-3 px-1 border-b last:border-b-0 bg-muted/50 rounded"><Label className="font-semibold text-md text-foreground pl-1">{param.name}</Label></div>;
                                    }
                                    if (param.fieldType === 'Text Editor') {
                                        return (<div key={`param-text-editor-${param.id}`} className="mt-2 mb-4 col-span-full">
                                                    <h4 className="text-sm font-medium">{param.name}:</h4>
                                                    <div className={cn("text-editor-content whitespace-pre-wrap print:text-xs prose prose-sm max-w-none p-2 border rounded-md bg-background min-h-[50px]", result?.isAbnormal && 'text-destructive')} dangerouslySetInnerHTML={{ __html: result?.resultValue || param.options || 'N/A' }} />
                                                </div>);
                                    }
                                    return (
                                      <div key={`param-result-${param.id}`} className="grid grid-cols-[2fr_1.5fr_1fr_1fr_0.5fr] items-center gap-x-4 gap-y-1 py-1.5 px-1 border-b last:border-b-0 text-sm">
                                        <span className="truncate font-medium text-foreground">{param.name} {param.fieldType === 'Formula' && <Sigma className="inline h-3 w-3 ml-1 text-blue-500" />}</span>
                                        <span className={cn("font-mono", result?.isAbnormal && "font-bold text-destructive")}>{result?.resultValue || 'N/A'}</span>
                                        <span className="text-muted-foreground">{param.units || 'N/A'}</span>
                                        <span className="text-muted-foreground">{param.rangeText || (param.rangeLow !== null && param.rangeHigh !== null ? `${param.rangeLow} - ${param.rangeHigh}`: 'N/A')}</span>
                                        <div className="flex justify-center"> {result?.isAbnormal && <Badge variant="destructive" className="px-1.5 py-0.5 text-xs">!</Badge>} </div>
                                      </div>
                                    );
                                  })}
                                  {item.itemType === 'Test' && (!item.testDetails?.parameters || item.testDetails.parameters.length === 0) && (
                                    <p className="text-sm text-muted-foreground">No parameters defined for this test in the report.</p>
                                  )}
                                </CardContent>
                              </AccordionContent>
                            </Card>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    )}
                    {(!detailedReportData.items || detailedReportData.items.length === 0) && ( <p className="text-sm text-muted-foreground text-center py-4">No items (tests/packages) found in this report.</p> )}
                  </div>
                ) : ( <p className="text-muted-foreground text-center py-6">Could not load detailed report data.</p> )}
              </ScrollArea>
              <DialogFooter className="pt-4 border-t sm:justify-between flex-shrink-0">
                <Button variant="outline" onClick={() => router.push(`/reports/print/${selectedReportForDialog?.id}`)}> <Printer className="mr-2 h-4 w-4" /> Print Report </Button>
                <DialogClose asChild> <Button variant="secondary">Close</Button> </DialogClose>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {reportToSend && sendChannel && (
        <SendReportDialog
          isOpen={isSendReportDialogOpen}
          onClose={() => { setIsSendReportDialogOpen(false); setReportToSend(null); setSendChannel(null); }}
          reportId={reportToSend.id}
          reportNumber={reportToSend.reportIdNumber}
          patientName={reportToSend.patientName}
          defaultRecipient={sendChannel === 'email' ? reportToSend.patientEmail || '' : reportToSend.patientPhone || ''}
          sendChannel={sendChannel}
        />
      )}
    </AlertDialog>
  );
}

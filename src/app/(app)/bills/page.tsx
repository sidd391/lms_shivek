
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
  PlusCircle,
  CalendarIcon,
  MoreHorizontal,
  Eye,
  Printer,
  Trash2,
  Edit, 
  Loader2,
  FileText,
  UserCircle,
  Stethoscope,
  IndianRupee,
  Percent,
  StickyNote,
  CheckCircle,
  Hourglass,
  AlertCircle,
  XCircle, // Added for Cancelled status
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { format } from "date-fns";
import Link from "next/link";
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import type { BillStatus as BackendBillStatus, PaymentMode, BillAttributes } from '@/backend/models/Bill'; 
import type { BillItemAttributes } from '@/backend/models/BillItem';
import type { PatientAttributes } from '@/backend/models/Patient';
import type { DoctorAttributes } from '@/backend/models/Doctor';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

type FrontendBillStatus = "Pending" | "Paid" | "Partial" | "Cancelled"; 

interface Bill {
  id: number;
  billDate: string;
  billNumber: string;
  patientName: string;
  patientPhone?: string;
  doctorName?: string;
  subTotal: number;
  discountAmount: number;
  grandTotal: number;
  amountReceived: number;
  amountDue: number;
  status: BackendBillStatus; 
  // For dialog - these will be populated from a detailed fetch
  patient?: PatientAttributes & { fullName?: string };
  doctor?: DoctorAttributes & { fullName?: string };
  items?: BillItemAttributes[];
  notes?: string | null;
  paymentMode?: PaymentMode | null;
}


export default function BillsPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [searchInputValue, setSearchInputValue] = React.useState(""); 
  const [searchTerm, setSearchTerm] = React.useState(""); 
  
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);
  const [bills, setBills] = React.useState<Bill[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalBills, setTotalBills] = React.useState(0);
  const [limit] = React.useState(10);
  const [billToDelete, setBillToDelete] = React.useState<Bill | null>(null);

  // State for View Bill Dialog
  const [selectedBillForDialog, setSelectedBillForDialog] = React.useState<Bill | null>(null);
  const [detailedBillData, setDetailedBillData] = React.useState<Bill | null>(null);
  const [isViewBillDialogOpen, setIsViewBillDialogOpen] = React.useState(false);
  const [isFetchingBillDetails, setIsFetchingBillDetails] = React.useState(false);


  const fetchBills = React.useCallback(async (page: number, search: string, date?: Date) => {
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
      const response = await fetch(`${BACKEND_API_URL}/bills?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (!response.ok) {
        if (response.status === 401) {
            toast({ title: "Authentication Error", description: "Session expired. Please login again.", variant: "destructive" });
            router.push('/');
        } else {
            throw new Error('Failed to fetch bills');
        }
        return; 
      }
      const result = await response.json();
      if (result.success) {
        setBills(result.data);
        setTotalPages(result.totalPages);
        setCurrentPage(result.currentPage); 
        setTotalBills(result.totalBills);
      } else {
        toast({ title: "Error", description: result.message || "Could not fetch bills.", variant: "destructive" });
        setBills([]); 
        setTotalPages(1);
        setTotalBills(0);
      }
    } catch (error: any) {
      toast({ title: "Network Error", description: error.message || "Failed to connect to server.", variant: "destructive" });
      setBills([]); 
      setTotalPages(1);
      setTotalBills(0);
    } finally {
      setIsLoading(false);
    }
  }, [limit, router, toast]);

  React.useEffect(() => {
    fetchBills(currentPage, searchTerm, selectedDate);
  }, [fetchBills, currentPage, searchTerm, selectedDate]);

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

   const getStatusBadgeClass = (status: BackendBillStatus): string => {
    switch (status) {
      case "Done": return "bg-green-500 text-white"; 
      case "Pending": return "bg-yellow-500 text-white"; 
      case "Partial": return "bg-orange-500 text-white"; 
      case "Cancelled": return "bg-gray-500 text-white";
      default: return "bg-secondary text-secondary-foreground";
    }
  };
  
  const getDisplayStatus = (status: BackendBillStatus): FrontendBillStatus => {
      switch (status) {
          case "Done": return "Paid";
          case "Pending": return "Pending";
          case "Partial": return "Partial";
          case "Cancelled": return "Cancelled";
          default: return "Pending"; 
      }
  };

  const getStatusIcon = (status?: BackendBillStatus | null) => {
    switch(status) {
        case 'Done': return <CheckCircle className="h-4 w-4 mr-1" />;
        case 'Pending': return <Hourglass className="h-4 w-4 mr-1" />;
        case 'Partial': return <AlertCircle className="h-4 w-4 mr-1" />;
        case 'Cancelled': return <XCircle className="h-4 w-4 mr-1" />;
        default: return null;
    }
  };


  const confirmDeleteBill = async () => {
    if (!billToDelete) return;
    setIsDeleting(true);
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        toast({ title: "Authentication Error", description: "Please login.", variant: "destructive" });
        router.push('/');
        setIsDeleting(false);
        setBillToDelete(null);
        return;
    }
    try {
        const response = await fetch(`${BACKEND_API_URL}/bills/${billToDelete.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` },
        });
        const result = await response.json();
        if (response.ok && result.success) {
            toast({ title: "Bill Deleted", description: `Bill ${billToDelete.billNumber} has been deleted.` });
            setBills(prevBills => prevBills.filter(b => b.id !== billToDelete.id));
            setTotalBills(prevTotal => prevTotal -1);
            if (bills.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            } else {
                fetchBills(currentPage, searchTerm, selectedDate); 
            }
        } else {
            toast({ title: "Error Deleting Bill", description: result.message || "Could not delete bill.", variant: "destructive" });
        }
    } catch (error: any) {
        toast({ title: "Network Error", description: error.message || "Failed to connect to server.", variant: "destructive" });
    } finally {
        setIsDeleting(false);
        setBillToDelete(null);
    }
  };

  const canEditBill = (status: BackendBillStatus): boolean => {
    return status === 'Pending' || status === 'Partial';
  };

  const handleViewBillDetails = async (bill: Bill) => {
    setSelectedBillForDialog(bill); // Set basic info immediately
    setIsViewBillDialogOpen(true);
    setDetailedBillData(null); // Reset detailed data
    setIsFetchingBillDetails(true);

    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      toast({ title: "Authentication Error", description: "Please login.", variant: "destructive" });
      setIsFetchingBillDetails(false);
      setIsViewBillDialogOpen(false);
      return;
    }
    try {
      const response = await fetch(`${BACKEND_API_URL}/bills/${bill.id}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error('Failed to fetch bill details');
      const result = await response.json();
      if (result.success && result.data) {
        const fetchedBill = result.data as Bill;
        // Ensure fullName is constructed if not present (it should be from backend parseBillNumerics now)
        if (fetchedBill.patient && !fetchedBill.patient.fullName && fetchedBill.patient.firstName && fetchedBill.patient.lastName) {
          fetchedBill.patient.fullName = `${fetchedBill.patient.title || ''} ${fetchedBill.patient.firstName} ${fetchedBill.patient.lastName}`.trim();
        }
        if (fetchedBill.doctor && !fetchedBill.doctor.fullName && fetchedBill.doctor.firstName && fetchedBill.doctor.lastName) {
          fetchedBill.doctor.fullName = `${fetchedBill.doctor.title || ''} ${fetchedBill.doctor.firstName} ${fetchedBill.doctor.lastName}`.trim();
        }
        setDetailedBillData(fetchedBill);
      } else {
        throw new Error(result.message || 'Could not load bill details.');
      }
    } catch (error: any) {
      toast({ title: "Error Loading Details", description: error.message, variant: "destructive" });
    } finally {
      setIsFetchingBillDetails(false);
    }
  };


  return (
    <AlertDialog open={!!billToDelete} onOpenChange={(openStatus) => { if (!openStatus) setBillToDelete(null); }}>
      <div className="flex flex-col gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="text-3xl font-bold">Bills ({totalBills})</CardTitle>
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <div className="relative flex-grow sm:flex-grow-0 md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search bills, patients..."
                    className="pl-10 w-full"
                    value={searchInputValue}
                    onChange={(e) => setSearchInputValue(e.target.value)}
                    onKeyPress={handleKeyPressSearch}
                  />
                </div>
                 <Button onClick={handleSearchTrigger} className="w-full sm:w-auto" disabled={isLoading}>
                  {isLoading && searchTerm === searchInputValue && searchInputValue !== "" ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Search className="mr-2 h-5 w-5 md:hidden" />}
                  <span className="hidden md:inline">Search</span>
                </Button>
                <Link href="/bills/create" passHref>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
                    <PlusCircle className="mr-2 h-5 w-5" /> Create Bill
                  </Button>
                </Link>
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
            <CardDescription>Manage and track patient billing information.</CardDescription>
          </CardHeader>
        </Card>

        <Card className="shadow-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill Date</TableHead>
                  <TableHead>Bill ID</TableHead>
                  <TableHead>Patient Name</TableHead>
                  <TableHead className="hidden md:table-cell">Phone</TableHead>
                  <TableHead className="hidden lg:table-cell">Doctor</TableHead>
                  <TableHead className="text-right">Total (₹)</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Discount (₹)</TableHead>
                  <TableHead className="text-right">Due (₹)</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: limit }).map((_, index) => (
                      <TableRow key={`bill-skeleton-${index}`}>
                          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-5 w-16" /></TableCell>
                          <TableCell className="text-right hidden sm:table-cell"><Skeleton className="h-5 w-16" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-5 w-16" /></TableCell>
                          <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
                      </TableRow>
                  ))
                ) : bills.length > 0 ? (
                  bills.map((bill) => (
                    <TableRow key={bill.id}>
                      <TableCell>{format(new Date(bill.billDate), "PP")}</TableCell>
                      <TableCell className="font-medium">{bill.billNumber}</TableCell>
                      <TableCell>{bill.patientName}</TableCell>
                      <TableCell className="hidden md:table-cell">{bill.patientPhone || 'N/A'}</TableCell>
                      <TableCell className="hidden lg:table-cell">{bill.doctorName || 'N/A'}</TableCell>
                      <TableCell className="text-right">{bill.grandTotal.toFixed(2)}</TableCell>
                      <TableCell className="text-right hidden sm:table-cell">{bill.discountAmount.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-semibold">{bill.amountDue.toFixed(2)}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge className={getStatusBadgeClass(bill.status)}>
                            {getStatusIcon(bill.status)}
                            {getDisplayStatus(bill.status)}
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
                            <DropdownMenuItem onClick={() => handleViewBillDetails(bill)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Bill
                            </DropdownMenuItem>
                            {canEditBill(bill.status) && (
                              <DropdownMenuItem 
                                  onClick={() => router.push(`/bills/edit/${bill.id}`)} 
                              > 
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Bill
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => router.push(`/bills/print/${bill.id}`)}>
                              <Printer className="mr-2 h-4 w-4" />
                              Print Bill
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                             <AlertDialogTrigger asChild>
                                <DropdownMenuItem 
                                  className="text-destructive focus:text-destructive-foreground focus:bg-destructive"
                                  onSelect={(e) => e.preventDefault()} 
                                  onClick={() => setBillToDelete(bill)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Bill
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                      No bills found.
                      {searchTerm || selectedDate ? " Try adjusting your search or date filter." : (
                          <Link href="/bills/create" passHref className="block mt-2">
                              <Button variant="link" className="text-primary">
                                  <PlusCircle className="mr-2 h-4 w-4" /> Create the first bill
                              </Button>
                          </Link>
                      )}
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
            This action cannot be undone. This will permanently delete bill "{billToDelete?.billNumber}"
            and its associated report.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setBillToDelete(null)} disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmDeleteBill}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Delete Bill
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>

      {/* View Bill Dialog */}
      {selectedBillForDialog && (
        <Dialog open={isViewBillDialogOpen} onOpenChange={setIsViewBillDialogOpen}>
          <DialogContent className="sm:max-w-2xl lg:max-w-3xl"> {/* Removed flex flex-col and max-h from here */}
            <div className="flex flex-col h-full max-h-[calc(85vh-theme(spacing.12))]"> {/* Wrapper for flex layout */}
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="flex items-center text-2xl font-semibold">
                  <FileText className="mr-3 h-7 w-7 text-primary" />
                  Bill Details: {selectedBillForDialog.billNumber}
                </DialogTitle>
                <DialogDescription>
                  Date: {format(new Date(selectedBillForDialog.billDate), 'PPP')}
                </DialogDescription>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  Status:&nbsp;
                  <Badge className={getStatusBadgeClass(detailedBillData?.status || selectedBillForDialog.status)}>
                    {getStatusIcon(detailedBillData?.status || selectedBillForDialog.status)}
                    {getDisplayStatus(detailedBillData?.status || selectedBillForDialog.status)}
                  </Badge>
                </div>
              </DialogHeader>
              <Separator className="my-4 flex-shrink-0" />
              <ScrollArea className="flex-1 min-h-0 pr-4">
                {isFetchingBillDetails ? (
                  <div className="space-y-4 p-4">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-2/3" />
                    <Separator className="my-3"/>
                    <Skeleton className="h-8 w-1/4 mb-2" />
                    <div className="space-y-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                ) : detailedBillData ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="shadow-sm">
                        <CardHeader><CardTitle className="text-lg flex items-center"><UserCircle className="mr-2 h-5 w-5 text-muted-foreground" />Patient Details</CardTitle></CardHeader>
                        <CardContent className="space-y-1 text-sm">
                          <p><strong>Name:</strong> {detailedBillData.patient?.fullName || 'N/A'}</p>
                          <p><strong className="text-muted-foreground">Patient ID:</strong> {detailedBillData.patient?.patientId || 'N/A'}</p>
                          <p><strong className="text-muted-foreground">Phone:</strong> {detailedBillData.patient?.phone || 'N/A'}</p>
                        </CardContent>
                      </Card>
                      {detailedBillData.doctor && (
                        <Card className="shadow-sm">
                          <CardHeader><CardTitle className="text-lg flex items-center"><Stethoscope className="mr-2 h-5 w-5 text-muted-foreground" />Doctor Details</CardTitle></CardHeader>
                          <CardContent className="space-y-1 text-sm">
                            <p><strong>Name:</strong> {detailedBillData.doctor.fullName || 'N/A'}</p>
                            <p><strong className="text-muted-foreground">Doctor ID:</strong> {detailedBillData.doctor.doctorID || 'N/A'}</p>
                            <p><strong className="text-muted-foreground">Specialty:</strong> {detailedBillData.doctor.specialty || 'N/A'}</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                    
                    <Card className="shadow-sm">
                      <CardHeader><CardTitle className="text-lg font-semibold">Billed Items</CardTitle></CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[60%]">Item Name</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead className="text-right">Price (₹)</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {detailedBillData.items?.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell>{item.itemName}</TableCell>
                                <TableCell><Badge variant={item.itemType === 'Package' ? 'secondary' : 'outline'}>{item.itemType}</Badge></TableCell>
                                <TableCell className="text-right">{item.itemPrice.toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <Separator className="my-4" />
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal:</span><span className="font-medium">₹{detailedBillData.subTotal.toFixed(2)}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground flex items-center"><Percent className="mr-1 h-4 w-4"/>Discount:</span><span className="font-medium text-destructive">- ₹{detailedBillData.discountAmount.toFixed(2)}</span></div>
                          <Separator/>
                          <div className="flex justify-between text-md font-bold text-primary"><span>Grand Total:</span><span>₹{detailedBillData.grandTotal.toFixed(2)}</span></div>
                          <Separator/>
                          <div className="flex justify-between"><span className="text-muted-foreground flex items-center"><IndianRupee className="mr-1 h-4 w-4"/>Amount Received:</span><span className="font-medium">₹{detailedBillData.amountReceived.toFixed(2)}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Payment Mode:</span><span className="font-medium">{detailedBillData.paymentMode || 'N/A'}</span></div>
                          <div className="flex justify-between font-bold text-md"><span>Amount Due:</span><span className={detailedBillData.amountDue > 0 ? 'text-orange-600' : 'text-green-600'}>₹{detailedBillData.amountDue.toFixed(2)}</span></div>
                        </div>
                      </CardContent>
                    </Card>

                    {detailedBillData.notes && (
                      <Card className="shadow-sm">
                        <CardHeader><CardTitle className="text-lg flex items-center"><StickyNote className="mr-2 h-5 w-5 text-muted-foreground" />Notes</CardTitle></CardHeader>
                        <CardContent><p className="text-sm text-muted-foreground whitespace-pre-wrap">{detailedBillData.notes}</p></CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-6">Could not load detailed bill data.</p>
                )}
              </ScrollArea>
              <DialogFooter className="pt-4 border-t sm:justify-between flex-shrink-0">
                  <Button variant="outline" onClick={() => router.push(`/bills/print/${selectedBillForDialog.id}`)}>
                      <Printer className="mr-2 h-4 w-4" /> Print Bill
                  </Button>
                <DialogClose asChild>
                  <Button variant="secondary">Close</Button>
                </DialogClose>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AlertDialog>
  );
}
    

    

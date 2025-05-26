
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, PlusCircle, Search, MoreHorizontal, Edit, Trash2, Eye, UserCircle, PhoneIcon, Droplet, CalendarDays, VenusAndMars, Loader2 } from "lucide-react"; // Changed VenusMars to VenusAndMars, Added Loader2
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';


const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface Patient {
  id: number;
  patientId: string | null;
  title: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  gender: string;
  phone: string;
  email: string | null;
  status: "Active" | "Closed";
  imageSeed?: string;
  age?: number;
  address?: string | null;
  dob?: string | null;
  bloodGroup?: string;
}


export default function PatientsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [patients, setPatients] = React.useState<Patient[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalPatients, setTotalPatients] = React.useState(0);
  const [limit] = React.useState(5);
  const [selectedPatientForView, setSelectedPatientForView] = React.useState<Patient | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = React.useState(false);

  const fetchPatients = React.useCallback(async (page: number, search: string) => {
    setIsLoading(true);
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      toast({ title: "Authentication Error", description: "Please login.", variant: "destructive" });
      router.push('/');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_API_URL}/patients?page=${page}&limit=${limit}&search=${search}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (!response.ok) {
        if (response.status === 401) router.push('/');
        throw new Error('Failed to fetch patients');
      }
      const result = await response.json();
      if (result.success) {
        const fetchedPatients = result.data.map((p: Patient) => ({
          ...p,
          fullName: `${p.title} ${p.firstName} ${p.lastName}`,
          imageSeed: `${p.firstName}${p.lastName}`.toLowerCase().replace(/\s+/g, ''),
        }));
        setPatients(fetchedPatients);
        setTotalPages(result.totalPages);
        setCurrentPage(result.currentPage);
        setTotalPatients(result.totalPatients);
      } else {
        toast({ title: "Error", description: result.message || "Could not fetch patients.", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Network Error", description: error.message || "Failed to connect to server.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [limit, router, toast]);

  React.useEffect(() => {
    fetchPatients(currentPage, searchTerm);
  }, [fetchPatients, currentPage, searchTerm]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchPatients(1, searchTerm);
  };
  
  const handleKeyPressSearch = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleDeletePatient = async (patientIdToDelete: number) => {
     const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        toast({ title: "Authentication Error", description: "Please login.", variant: "destructive" });
        router.push('/');
        return;
      }
    try {
      const response = await fetch(`${BACKEND_API_URL}/patients/${patientIdToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      const result = await response.json();
      if (response.ok && result.success) {
        toast({ title: "Patient Deleted", description: result.message });
        fetchPatients(currentPage, searchTerm);
      } else {
        toast({ title: "Error", description: result.message || "Failed to delete patient.", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Network Error", description: error.message || "Failed to connect to server.", variant: "destructive" });
    }
  };

  const handleViewDetails = (patient: Patient) => {
    setSelectedPatientForView(patient);
    setIsViewDialogOpen(true);
  };
  
  const handleDownloadAllPatients = async () => {
    setIsDownloading(true);
    toast({ title: "Preparing Download", description: "Your patient data Excel file is being generated..."});
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        toast({ title: "Authentication Error", description: "Please login.", variant: "destructive" });
        setIsDownloading(false);
        return;
    }
    try {
        const response = await fetch(`${BACKEND_API_URL}/patients/export`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${authToken}`},
        });

        if (!response.ok) {
            const errorResult = await response.json().catch(() => ({ message: "Failed to download patient data." }));
            throw new Error(errorResult.message || `Server error: ${response.status}`);
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const contentDisposition = response.headers.get('content-disposition');
        let fileName = 'patients_export.xlsx';
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
        toast({ title: "Download Started", description: "Patient data Excel file is downloading."});

    } catch (error: any) {
        console.error("Download error:", error);
        toast({ title: "Download Failed", description: error.message || "Could not download patient data.", variant: "destructive"});
    } finally {
        setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="text-3xl font-bold">Patients ({totalPatients})</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <div className="relative flex-grow sm:flex-grow-0 md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search patients..."
                  className="pl-10 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPressSearch}
                />
              </div>
              <Button onClick={handleSearch} className="w-full sm:w-auto">
                <Search className="mr-2 h-5 w-5 md:hidden" />
                <span className="hidden md:inline">Search</span>
              </Button>
              <Link href="/patients/create" passHref>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-5 w-5" /> Create
                </Button>
              </Link>
              <Button variant="outline" className="w-full sm:w-auto" onClick={handleDownloadAllPatients} disabled={isLoading || isDownloading}>
                {isDownloading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Download className="mr-2 h-5 w-5" />} 
                {isDownloading ? 'Downloading...' : 'Download All'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px] hidden sm:table-cell"></TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead className="hidden lg:table-cell">Email</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: limit }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-6 w-40" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : patients.length > 0 ? (
                patients.map((patient) => (
                  <TableRow key={patient.id}>
                     <TableCell className="hidden sm:table-cell">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={`https://picsum.photos/seed/${patient.imageSeed || patient.id}/40/40`} alt={patient.fullName || 'Patient'} data-ai-hint={patient.imageSeed || "person avatar"} />
                        <AvatarFallback>{(patient.fullName || "P").split(" ").map(n => n[0]).join("").toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2 sm:hidden">
                          <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://picsum.photos/seed/${patient.imageSeed || patient.id}/32/32`} alt={patient.fullName || 'Patient'} data-ai-hint={patient.imageSeed || "person avatar"} />
                          <AvatarFallback>{(patient.fullName || "P").split(" ").map(n => n[0]).join("").toUpperCase()}</AvatarFallback>
                          </Avatar>
                          {patient.fullName}
                      </div>
                      <span className="hidden sm:inline">{patient.fullName}</span>
                    </TableCell>
                    <TableCell>{patient.gender}</TableCell>
                    <TableCell className="hidden md:table-cell">{patient.phone}</TableCell>
                    <TableCell className="hidden lg:table-cell">{patient.email || 'N/A'}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge
                        variant={patient.status === "Active" ? "default" : "secondary"}
                        className={
                          patient.status === "Active" ? "bg-accent text-accent-foreground" :
                          patient.status === "Closed" ? "bg-destructive text-destructive-foreground" : 
                          ""
                        }
                      >
                        {patient.status}
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
                          <DropdownMenuItem onClick={() => handleViewDetails(patient)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/patients/edit/${patient.id}`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Patient
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive-foreground focus:bg-destructive"
                            onClick={() => handleDeletePatient(patient.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Patient
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                 <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        No patients found.
                        {searchTerm ? " Try adjusting your search." : (
                            <Link href="/patients/create" passHref className="block mt-2">
                                <Button variant="link" className="text-primary">
                                    <PlusCircle className="mr-2 h-4 w-4" /> Create the first patient
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

      {selectedPatientForView && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center text-2xl font-semibold">
                <UserCircle className="mr-3 h-7 w-7 text-primary" />
                Patient Details
              </DialogTitle>
              <DialogDescription>
                Viewing information for {selectedPatientForView.fullName}.
              </DialogDescription>
            </DialogHeader>
            <Separator className="my-4" />
            <div className="grid gap-4 py-4 text-sm">
              <div className="grid grid-cols-[120px_1fr] items-center gap-x-4 gap-y-2">
                <Label className="text-right text-muted-foreground">Patient ID:</Label>
                <span className="font-medium">{selectedPatientForView.patientId || 'N/A'}</span>

                <Label className="text-right text-muted-foreground">Full Name:</Label>
                <span className="font-medium">{selectedPatientForView.fullName}</span>
                
                <Label className="text-right text-muted-foreground flex items-center justify-end"><CalendarDays className="mr-1 h-4 w-4"/>Age:</Label>
                <span className="font-medium">{selectedPatientForView.age !== undefined ? `${selectedPatientForView.age} years` : 'N/A'}</span>
                
                <Label className="text-right text-muted-foreground flex items-center justify-end"><Droplet className="mr-1 h-4 w-4"/>Blood Group:</Label>
                <span className="font-medium">{selectedPatientForView.bloodGroup || 'N/A'}</span>
                
                <Label className="text-right text-muted-foreground flex items-center justify-end"><VenusAndMars className="mr-1 h-4 w-4"/>Gender:</Label>
                <span className="font-medium">{selectedPatientForView.gender || 'N/A'}</span>
                
                <Label className="text-right text-muted-foreground flex items-center justify-end"><PhoneIcon className="mr-1 h-4 w-4"/>Phone:</Label>
                <span className="font-medium">{selectedPatientForView.phone || 'N/A'}</span>
                
                <Label className="text-right text-muted-foreground">Email:</Label>
                <span className="font-medium">{selectedPatientForView.email || 'N/A'}</span>

                <Label className="text-right text-muted-foreground">Address:</Label>
                <span className="font-medium col-span-1">{selectedPatientForView.address || 'N/A'}</span>
                
                <Label className="text-right text-muted-foreground">Status:</Label>
                <Badge 
                  variant={selectedPatientForView.status === "Active" ? "default" : "secondary"}
                  className={selectedPatientForView.status === "Active" ? "bg-accent text-accent-foreground w-fit" : "bg-destructive text-destructive-foreground w-fit"}
                >
                  {selectedPatientForView.status}
                </Badge>
              </div>
            </div>
            <Separator className="my-4" />
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
              <Button onClick={() => { router.push(`/patients/edit/${selectedPatientForView.id}`); setIsViewDialogOpen(false); }} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Edit className="mr-2 h-4 w-4" /> Edit Patient
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}


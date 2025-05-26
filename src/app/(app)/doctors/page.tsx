'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  PlusCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  UserPlus,
  Stethoscope,
  Loader2,
  Briefcase, 
  CalendarDays, 
  IndianRupee, 
  PhoneIcon,
} from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
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
  DialogContent as DoctorDialogContent, 
  DialogHeader as DoctorDialogHeader,
  DialogTitle as DoctorDialogTitle,
  DialogDescription as DoctorDialogDescription,
  DialogFooter as DoctorDialogFooter,
  DialogClose as DoctorDialogClose,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface Doctor {
  id: number;
  doctorID: string | null;
  title: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  specialty: string;
  phone: string;
  email: string | null;
  status: "Active" | "On Leave" | "Inactive";
  imageSeed?: string;
  experienceYears?: number | null;
  consultationFee?: number | null;
  qualification?: string | null;
  address?: string | null;
}

export default function DoctorsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [doctors, setDoctors] = React.useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalDoctors, setTotalDoctors] = React.useState(0);
  const [limit] = React.useState(5);
  const [doctorToDelete, setDoctorToDelete] = React.useState<Doctor | null>(null);
  const [selectedDoctorForView, setSelectedDoctorForView] = React.useState<Doctor | null>(null);
  const [isViewDoctorDialogOpen, setIsViewDoctorDialogOpen] = React.useState(false);


  const fetchDoctors = React.useCallback(async (page: number, search: string) => {
    setIsLoading(true);
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      toast({ title: "Authentication Error", description: "Please login.", variant: "destructive" });
      router.push('/');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_API_URL}/doctors?page=${page}&limit=${limit}&search=${search}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (!response.ok) {
        if (response.status === 401) router.push('/');
        throw new Error('Failed to fetch doctors');
      }
      const result = await response.json();
      if (result.success) {
        const fetchedDoctors = result.data.map((d: any) => ({
          ...d,
          fullName: `${d.title} ${d.firstName} ${d.lastName}`,
          imageSeed: `${d.firstName}${d.lastName}`.toLowerCase().replace(/\s+/g, ''),
          experienceYears: d.experienceYears !== null && d.experienceYears !== undefined 
                            ? parseInt(d.experienceYears, 10) 
                            : null,
          consultationFee: d.consultationFee !== null && d.consultationFee !== undefined 
                            ? parseFloat(d.consultationFee) 
                            : null,
        })) as Doctor[];
        setDoctors(fetchedDoctors);
        setTotalPages(result.totalPages);
        setCurrentPage(result.currentPage);
        setTotalDoctors(result.totalDoctors);
      } else {
        toast({ title: "Error", description: result.message || "Could not fetch doctors.", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Network Error", description: error.message || "Failed to connect to server.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [limit, router, toast]);

  React.useEffect(() => {
    fetchDoctors(currentPage, searchTerm);
  }, [fetchDoctors, currentPage, searchTerm]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchDoctors(1, searchTerm);
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

  const confirmDeleteDoctor = async () => {
    if (!doctorToDelete) return;
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      toast({ title: "Authentication Error", description: "Please login.", variant: "destructive" });
      router.push('/');
      return;
    }
    try {
      const response = await fetch(`${BACKEND_API_URL}/doctors/${doctorToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      const result = await response.json();
      if (response.ok && result.success) {
        toast({ title: "Doctor Deleted", description: result.message });
        fetchDoctors(currentPage, searchTerm); // Refresh the list
      } else {
        toast({ title: "Error", description: result.message || "Failed to delete doctor.", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Network Error", description: error.message || "Failed to connect to server.", variant: "destructive" });
    } finally {
      setDoctorToDelete(null);
    }
  };

  const handleViewDoctorDetails = (doctor: Doctor) => {
    setSelectedDoctorForView(doctor);
    setIsViewDoctorDialogOpen(true);
  };

  const getStatusBadgeVariant = (status: Doctor["status"]): "default" | "secondary" | "destructive" => {
    switch (status) {
      case "Active": return "default";
      case "On Leave": return "secondary";
      case "Inactive": return "destructive";
      default: return "default";
    }
  };

  return (
    <AlertDialog open={!!doctorToDelete} onOpenChange={(openStatus) => { if (!openStatus) setDoctorToDelete(null); }}>
      <div className="flex flex-col gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                  <Stethoscope className="h-8 w-8 text-primary" />
                  <div>
                      <CardTitle className="text-3xl font-bold">Doctors ({totalDoctors})</CardTitle>
                      <CardDescription>Manage doctor profiles, specialties, and availability.</CardDescription>
                  </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <div className="relative flex-grow sm:flex-grow-0 md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search doctors..."
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
                <Link href="/doctors/create" passHref>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
                    <UserPlus className="mr-2 h-5 w-5" /> Add New Doctor
                  </Button>
                </Link>
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
                  <TableHead>Specialty</TableHead>
                  <TableHead className="hidden md:table-cell">Phone</TableHead>
                  <TableHead className="hidden lg:table-cell">Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: limit }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell className="hidden sm:table-cell"><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-6 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : doctors.length > 0 ? (
                  doctors.map((doctor) => (
                    <TableRow key={doctor.id}>
                      <TableCell className="hidden sm:table-cell">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={`https://picsum.photos/seed/${doctor.imageSeed || doctor.id}/40/40`} alt={doctor.fullName || 'Doctor'} data-ai-hint={doctor.imageSeed || "doctor person"} />
                          <AvatarFallback>{(doctor.fullName || "Dr").split(" ").map(n => n[0]).join("").toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2 sm:hidden">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={`https://picsum.photos/seed/${doctor.imageSeed || doctor.id}/32/32`} alt={doctor.fullName || 'Doctor'} data-ai-hint={doctor.imageSeed || "doctor person"} />
                            <AvatarFallback>{(doctor.fullName || "Dr").split(" ").map(n => n[0]).join("").toUpperCase()}</AvatarFallback>
                          </Avatar>
                          {doctor.fullName}
                        </div>
                        <span className="hidden sm:inline">{doctor.fullName}</span>
                      </TableCell>
                      <TableCell>{doctor.specialty}</TableCell>
                      <TableCell className="hidden md:table-cell">{doctor.phone}</TableCell>
                      <TableCell className="hidden lg:table-cell">{doctor.email || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusBadgeVariant(doctor.status)}
                          className={
                            doctor.status === "Active" ? "bg-accent text-accent-foreground" :
                            doctor.status === "On Leave" ? "bg-yellow-500 text-white" :
                            "bg-muted text-muted-foreground"
                          }
                        >
                          {doctor.status}
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
                            <DropdownMenuItem onClick={() => handleViewDoctorDetails(doctor)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/doctors/edit/${doctor.id}`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Doctor
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive-foreground focus:bg-destructive"
                                onSelect={(e) => e.preventDefault()} // Prevent closing menu on select
                                onClick={() => setDoctorToDelete(doctor)}
                                >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Doctor
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                       No doctors found.
                        {searchTerm ? " Try adjusting your search." : (
                            <Link href="/doctors/create" passHref className="block mt-2">
                                <Button variant="link" className="text-primary">
                                    <UserPlus className="mr-2 h-4 w-4" /> Add the first doctor
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
        
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to delete this doctor?</AlertDialogTitle>
                <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the doctor
                "{doctorToDelete?.fullName}" and all associated data.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDoctorToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                onClick={confirmDeleteDoctor}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>

        {selectedDoctorForView && (
          <Dialog open={isViewDoctorDialogOpen} onOpenChange={setIsViewDoctorDialogOpen}>
            <DoctorDialogContent className="sm:max-w-lg">
              <DoctorDialogHeader>
                <DoctorDialogTitle className="flex items-center text-2xl font-semibold">
                  <Stethoscope className="mr-3 h-7 w-7 text-primary" />
                  Doctor Details
                </DoctorDialogTitle>
                <DoctorDialogDescription>
                  Viewing information for {selectedDoctorForView.fullName}.
                </DoctorDialogDescription>
              </DoctorDialogHeader>
              <Separator className="my-4" />
              <div className="grid gap-4 py-4 text-sm">
                <div className="grid grid-cols-[150px_1fr] items-center gap-x-4 gap-y-2">
                    <Label className="text-right text-muted-foreground">Doctor ID:</Label>
                    <span className="font-medium">{selectedDoctorForView.doctorID || 'N/A'}</span>
                    
                    <Label className="text-right text-muted-foreground">Full Name:</Label>
                    <span className="font-medium">{selectedDoctorForView.fullName}</span>
                    
                    <Label className="text-right text-muted-foreground flex items-center justify-end"><Briefcase className="mr-1 h-4 w-4" />Specialty:</Label>
                    <span className="font-medium">{selectedDoctorForView.specialty}</span>
                    
                    <Label className="text-right text-muted-foreground flex items-center justify-end"><CalendarDays className="mr-1 h-4 w-4" />Experience:</Label>
                    <span className="font-medium">
                        {selectedDoctorForView.experienceYears !== null && selectedDoctorForView.experienceYears !== undefined 
                        ? `${selectedDoctorForView.experienceYears} year(s)` 
                        : 'N/A'}
                    </span>
                    
                    <Label className="text-right text-muted-foreground flex items-center justify-end"><IndianRupee className="mr-1 h-4 w-4" />Consultation Fee:</Label>
                    <span className="font-medium">
                        {selectedDoctorForView.consultationFee !== null && selectedDoctorForView.consultationFee !== undefined  
                        ? `₹${selectedDoctorForView.consultationFee.toFixed(2)}` 
                        : 'N/A'}
                    </span>
                    
                    <Label className="text-right text-muted-foreground flex items-center justify-end"><PhoneIcon className="mr-1 h-4 w-4" />Phone:</Label>
                    <span className="font-medium">{selectedDoctorForView.phone}</span>
                    
                    <Label className="text-right text-muted-foreground">Email:</Label>
                    <span className="font-medium">{selectedDoctorForView.email || 'N/A'}</span>

                    <Label className="text-right text-muted-foreground">Qualification:</Label>
                    <span className="font-medium">{selectedDoctorForView.qualification || 'N/A'}</span>

                    <Label className="text-right text-muted-foreground">Address:</Label>
                    <span className="font-medium col-span-1">{selectedDoctorForView.address || 'N/A'}</span>
                    
                    <Label className="text-right text-muted-foreground">Status:</Label>
                    <Badge 
                        variant={getStatusBadgeVariant(selectedDoctorForView.status)}
                        className={
                            selectedDoctorForView.status === "Active" ? "bg-accent text-accent-foreground w-fit" :
                            selectedDoctorForView.status === "On Leave" ? "bg-yellow-500 text-white w-fit" :
                            "bg-muted text-muted-foreground w-fit"
                        }
                    >
                    {selectedDoctorForView.status}
                    </Badge>
                </div>
              </div>
              <Separator className="my-4" />
              <DoctorDialogFooter>
                <DoctorDialogClose asChild>
                  <Button variant="outline">Close</Button>
                </DoctorDialogClose>
                <Button onClick={() => { router.push(`/doctors/edit/${selectedDoctorForView.id}`); setIsViewDoctorDialogOpen(false); }} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Edit className="mr-2 h-4 w-4" /> Edit Doctor
                </Button>
              </DoctorDialogFooter>
            </DoctorDialogContent>
          </Dialog>
        )}
      </div>
    </AlertDialog>
  );
}


'use client';

import * as React from 'react';
import Link from 'next/link';
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
} from "lucide-react";

interface Doctor {
  id: string;
  fullName: string;
  specialty: string;
  phone: string;
  email: string;
  status: "Active" | "On Leave" | "Inactive";
  imageSeed: string;
}

const initialDoctorsData: Doctor[] = [
  { id: "DOC001", fullName: "Dr. Emily Carter", specialty: "Cardiologist", phone: "9876501234", email: "emily.carter@example.com", status: "Active", imageSeed: "doctor female" },
  { id: "DOC002", fullName: "Dr. John Davis", specialty: "Pediatrician", phone: "8765412309", email: "john.davis@example.com", status: "Active", imageSeed: "doctor male" },
  { id: "DOC003", fullName: "Dr. Alice Smith", specialty: "Neurologist", phone: "7654321098", email: "alice.smith@example.com", status: "On Leave", imageSeed: "doctor woman" },
  { id: "DOC004", fullName: "Dr. Robert Jones", specialty: "Orthopedic Surgeon", phone: "6543210987", email: "robert.jones@example.com", status: "Active", imageSeed: "surgeon male" },
  { id: "DOC005", fullName: "Dr. Carol White", specialty: "Dermatologist", phone: "5432109876", email: "carol.white@example.com", status: "Inactive", imageSeed: "dermatologist female" },
];

const additionalDoctorsData: Doctor[] = [
    { id: "DOC006", fullName: "Dr. Michael Brown", specialty: "General Physician", phone: "4321098765", email: "michael.brown@example.com", status: "Active", imageSeed: "physician man" },
    { id: "DOC007", fullName: "Dr. Linda Wilson", specialty: "Oncologist", phone: "3210987654", email: "linda.wilson@example.com", status: "Active", imageSeed: "oncologist woman" },
];

export default function DoctorsPage() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [doctors, setDoctors] = React.useState(initialDoctorsData);
  const [showMoreCount, setShowMoreCount] = React.useState(0);

  const filteredDoctors = doctors.filter(doctor =>
    (doctor.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (doctor.specialty?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (doctor.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (doctor.phone || '').includes(searchTerm)
  );

  const handleShowMore = () => {
    if (showMoreCount < additionalDoctorsData.length) {
        setDoctors(prevDoctors => [...prevDoctors, additionalDoctorsData[showMoreCount]]);
        setShowMoreCount(prevCount => prevCount + 1);
    }
  };
  
  const getStatusBadgeVariant = (status: Doctor["status"]): "default" | "secondary" | "destructive" => {
    switch (status) {
      case "Active":
        return "default"; // Styled by accent color
      case "On Leave":
        return "secondary"; // Styled by a yellow-ish color
      case "Inactive":
        return "destructive"; // Styled by destructive color (or a muted gray)
      default:
        return "default";
    }
  };


  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
                <Stethoscope className="h-8 w-8 text-primary" />
                <div>
                    <CardTitle className="text-3xl font-bold">Doctors</CardTitle>
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
                />
              </div>
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
              {filteredDoctors.length > 0 ? (
                filteredDoctors.map((doctor) => (
                  <TableRow key={doctor.id}>
                    <TableCell className="hidden sm:table-cell">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={`https://picsum.photos/seed/${doctor.imageSeed}/40/40`} alt={doctor.fullName} data-ai-hint={doctor.imageSeed} />
                        <AvatarFallback>{doctor.fullName.split(" ").map(n => n[0]).join("").toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2 sm:hidden">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://picsum.photos/seed/${doctor.imageSeed}/32/32`} alt={doctor.fullName} data-ai-hint={doctor.imageSeed} />
                          <AvatarFallback>{doctor.fullName.split(" ").map(n => n[0]).join("").toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {doctor.fullName}
                      </div>
                      <span className="hidden sm:inline">{doctor.fullName}</span>
                    </TableCell>
                    <TableCell>{doctor.specialty}</TableCell>
                    <TableCell className="hidden md:table-cell">{doctor.phone}</TableCell>
                    <TableCell className="hidden lg:table-cell">{doctor.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusBadgeVariant(doctor.status)}
                         className={
                          doctor.status === "Active" ? "bg-accent text-accent-foreground" :
                          doctor.status === "On Leave" ? "bg-yellow-500 text-white" :
                          "bg-muted text-muted-foreground" // For Inactive
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
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Doctor
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Doctor
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No doctors found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {showMoreCount < additionalDoctorsData.length && filteredDoctors.length > 0 && (
          <CardFooter className="justify-center border-t pt-6">
            <Button variant="outline" onClick={handleShowMore}>Show More</Button>
          </CardFooter>
        )}
         {filteredDoctors.length > 0 && showMoreCount >= additionalDoctorsData.length && (
           <CardFooter className="justify-center border-t pt-6 text-muted-foreground">
            All doctors loaded.
          </CardFooter>
        )}
      </Card>
    </div>
  );
}


'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, PlusCircle, Search, MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
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

const initialPatientsData = [
  { id: "PAT001", fullName: "Mr. Shivek Bhasin", gender: "Male", phone: "9876543210", email: "gamerloft14@gmail.com", status: "Active", imageSeed: "man avatar" },
  { id: "PAT002", fullName: "Ms. Anya Sharma", gender: "Female", phone: "8765432109", email: "anya.sharma@example.com", status: "Active", imageSeed: "woman avatar" },
  { id: "PAT003", fullName: "Dr. Rohan Verma", gender: "Male", phone: "7654321098", email: "rohan.verma@example.com", status: "Inactive", imageSeed: "doctor avatar" },
  { id: "PAT004", fullName: "Mrs. Priya Patel", gender: "Female", phone: "6543210987", email: "priya.patel@example.com", status: "Active", imageSeed: "female character" },
  { id: "PAT005", fullName: "Mr. Arjun Reddy", gender: "Male", phone: "5432109876", email: "arjun.reddy@example.com", status: "Pending", imageSeed: "male character" },
];

const additionalPatientsData = [
    { id: "PAT006", fullName: "Ms. Zara Khan", gender: "Female", phone: "4321098765", email: "zara.khan@example.com", status: "Active", imageSeed: "woman face" },
    { id: "PAT007", fullName: "Mr. Vikram Singh", gender: "Male", phone: "3210987654", email: "vikram.singh@example.com", status: "Active", imageSeed: "man face" },
];

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [patients, setPatients] = React.useState(initialPatientsData);
  const [showMoreCount, setShowMoreCount] = React.useState(0);

  const filteredPatients = patients.filter(patient =>
    (patient.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (patient.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (patient.phone || '').includes(searchTerm)
  );

  const handleShowMore = () => {
    if (showMoreCount < additionalPatientsData.length) {
        setPatients(prevPatients => [...prevPatients, additionalPatientsData[showMoreCount]]);
        setShowMoreCount(prevCount => prevCount + 1);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="text-3xl font-bold">Patients</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <div className="relative flex-grow sm:flex-grow-0 md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search patients..."
                  className="pl-10 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" className="w-full sm:w-auto">
                <Search className="mr-2 h-5 w-5 md:hidden" /> {/* Icon for smaller screens */}
                <span className="hidden md:inline">Search</span>
              </Button>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
                <PlusCircle className="mr-2 h-5 w-5" /> Create
              </Button>
              <Button variant="outline" size="icon" className="w-full sm:w-auto sm:aspect-square">
                <Download className="h-5 w-5" />
                <span className="sr-only">Download Patients Data</span>
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
              {filteredPatients.map((patient) => (
                <TableRow key={patient.id}>
                   <TableCell className="hidden sm:table-cell">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={`https://picsum.photos/seed/${patient.imageSeed}/40/40`} alt={patient.fullName} data-ai-hint={patient.imageSeed} />
                      <AvatarFallback>{patient.fullName.split(" ").map(n => n[0]).join("").toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2 sm:hidden">
                        <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://picsum.photos/seed/${patient.imageSeed}/32/32`} alt={patient.fullName} data-ai-hint={patient.imageSeed} />
                        <AvatarFallback>{patient.fullName.split(" ").map(n => n[0]).join("").toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {patient.fullName}
                    </div>
                    <span className="hidden sm:inline">{patient.fullName}</span>
                  </TableCell>
                  <TableCell>{patient.gender}</TableCell>
                  <TableCell className="hidden md:table-cell">{patient.phone}</TableCell>
                  <TableCell className="hidden lg:table-cell">{patient.email}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge 
                      variant={patient.status === "Active" ? "default" : patient.status === "Pending" ? "secondary" : "outline"}
                      className={
                        patient.status === "Active" ? "bg-accent text-accent-foreground" :
                        patient.status === "Pending" ? "bg-yellow-500/80 text-yellow-foreground" : 
                        patient.status === "Inactive" ? "bg-destructive/80 text-destructive-foreground" : ""
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
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Patient
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Patient
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredPatients.length === 0 && (
            <div className="text-center p-8 text-muted-foreground">
              No patients found.
            </div>
          )}
        </CardContent>
        {showMoreCount < additionalPatientsData.length && filteredPatients.length > 0 && (
          <CardFooter className="justify-center border-t pt-6">
            <Button variant="outline" onClick={handleShowMore}>Show More</Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}


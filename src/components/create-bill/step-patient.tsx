
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, UserPlus, Phone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Patient {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  age?: number;
  gender?: string;
  imageSeed?: string;
}

// Mock patient data - replace with actual API call
const mockPatients: Patient[] = [
  { id: "PAT001", fullName: "Mr. Shivek Bhasin", phone: "9876543210", email: "gamerloft14@gmail.com", age: 30, gender: "Male", imageSeed: "man avatar" },
  { id: "PAT002", fullName: "Ms. Anya Sharma", phone: "8765432109", email: "anya.sharma@example.com", age: 25, gender: "Female", imageSeed: "woman avatar" },
];


interface StepPatientProps {
  onPatientSelected: (patient: Patient | null) => void; // Patient type to be defined
}

export default function StepPatient({ onPatientSelected }: StepPatientProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [foundPatient, setFoundPatient] = React.useState<Patient | null>(null);
  const [searchAttempted, setSearchAttempted] = React.useState(false);

  const handleSearch = () => {
    setSearchAttempted(true);
    if (searchQuery.trim() === '') {
      setFoundPatient(null);
      onPatientSelected(null);
      return;
    }
    const patient = mockPatients.find(p => p.phone.includes(searchQuery.trim()));
    setFoundPatient(patient || null);
    onPatientSelected(patient || null);
  };

  return (
    <div className="space-y-6">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-2xl font-semibold">Select Patient</CardTitle>
        <CardDescription>Search for an existing patient or create a new one.</CardDescription>
      </CardHeader>
      
      <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
        <div className="relative flex-grow w-full md:w-auto">
          <Label htmlFor="patientPhoneSearch" className="sr-only">Search Patient Phone</Label>
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="patientPhoneSearch"
            type="tel"
            placeholder="Search by Phone Number..."
            className="pl-10 pr-12 py-3 text-base" // Added pr for search button
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button 
            size="icon" 
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={handleSearch}
            variant="ghost"
          >
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">OR</span>
        </div>
        <Link href="/patients/create" passHref>
          <Button variant="outline" className="w-full md:w-auto py-3">
            <UserPlus className="mr-2 h-5 w-5" />
            Create New Patient
          </Button>
        </Link>
      </div>

      {searchAttempted && (
        <div className="mt-6">
          {foundPatient ? (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={`https://picsum.photos/seed/${foundPatient.imageSeed || 'patient'}/80/80`} alt={foundPatient.fullName} data-ai-hint={foundPatient.imageSeed || 'patient person'}/>
                    <AvatarFallback>{foundPatient.fullName.split(" ").map(n => n[0]).join("").toUpperCase()}</AvatarFallback>
                  </Avatar>
                  {foundPatient.fullName}
                </CardTitle>
                <CardDescription>Patient ID: {foundPatient.id}</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <p><strong className="text-muted-foreground">Phone:</strong> {foundPatient.phone}</p>
                <p><strong className="text-muted-foreground">Email:</strong> {foundPatient.email || 'N/A'}</p>
                <p><strong className="text-muted-foreground">Age:</strong> {foundPatient.age || 'N/A'}</p>
                <p><strong className="text-muted-foreground">Gender:</strong> {foundPatient.gender || 'N/A'}</p>
              </CardContent>
            </Card>
          ) : (
            <p className="text-center text-muted-foreground p-4 border border-dashed rounded-md">
              No patient found with that phone number. Try creating a new patient.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

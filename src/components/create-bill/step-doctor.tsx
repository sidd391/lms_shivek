
'use client';

import * as React from 'react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Search, Stethoscope, UserPlus } from 'lucide-react'; 
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card'; // Added Card and CardContent

interface Doctor {
  id: string;
  fullName: string;
  specialty: string;
  phone: string;
  email?: string;
  imageSeed?: string;
}

// Mock doctor data - replace with actual API call
const mockDoctors: Doctor[] = [
  { id: "DOC001", fullName: "Dr. Emily Carter", specialty: "Cardiologist", phone: "9876501234", email: "emily.carter@example.com", imageSeed: "doctor female" },
  { id: "DOC002", fullName: "Dr. John Davis", specialty: "Pediatrician", phone: "8765412309", email: "john.davis@example.com", imageSeed: "doctor male" },
];

interface StepDoctorProps {
  onDoctorSelected?: (doctor: Doctor | null) => void; // Optional callback
}

export default function StepDoctor({ onDoctorSelected }: StepDoctorProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [foundDoctor, setFoundDoctor] = React.useState<Doctor | null>(null);
  const [searchAttempted, setSearchAttempted] = React.useState(false);

  const handleSearch = () => {
    setSearchAttempted(true);
    if (searchQuery.trim() === '') {
      setFoundDoctor(null);
      onDoctorSelected?.(null);
      return;
    }
    const doctor = mockDoctors.find(d => 
      d.fullName.toLowerCase().includes(searchQuery.trim().toLowerCase()) || 
      d.id.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );
    setFoundDoctor(doctor || null);
    onDoctorSelected?.(doctor || null);
  };

  return (
    <div className="space-y-6">
      <CardHeader className="p-0 mb-6">
        <CardTitle className="text-2xl font-semibold flex items-center">
          <Stethoscope className="mr-3 h-7 w-7 text-primary" />
          Select Doctor
        </CardTitle>
        <CardDescription>Search for a doctor by name or ID. This step is optional.</CardDescription>
      </CardHeader>
      
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-grow w-full md:w-auto">
          <Label htmlFor="doctorSearch" className="sr-only">Search Doctor</Label>
          <Input 
            id="doctorSearch" 
            placeholder="e.g., Dr. Smith or DOC001" 
            className="pl-10 pr-12 py-3 text-base" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Button 
            size="icon" 
            variant="ghost" 
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={handleSearch}
            aria-label="Search Doctor"
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>
         <span className="text-sm text-muted-foreground hidden md:inline">OR</span>
        <Button variant="outline" className="w-full md:w-auto py-3">
            <UserPlus className="mr-2 h-5 w-5" />
            Add New Doctor
        </Button>
      </div>

      {searchAttempted && (
        <div className="mt-6">
          {foundDoctor ? (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={`https://picsum.photos/seed/${foundDoctor.imageSeed || 'doctor'}/80/80`} alt={foundDoctor.fullName} data-ai-hint={foundDoctor.imageSeed || 'doctor person'} />
                    <AvatarFallback>{foundDoctor.fullName.split(" ").map(n => n[0]).join("").toUpperCase()}</AvatarFallback>
                  </Avatar>
                  {foundDoctor.fullName}
                </CardTitle>
                <CardDescription>Doctor ID: {foundDoctor.id} - {foundDoctor.specialty}</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <p><strong className="text-muted-foreground">Phone:</strong> {foundDoctor.phone}</p>
                <p><strong className="text-muted-foreground">Email:</strong> {foundDoctor.email || 'N/A'}</p>
              </CardContent>
            </Card>
          ) : (
            <p className="text-center text-muted-foreground p-4 border border-dashed rounded-md">
              No doctor found with that name or ID. You can add a new doctor or skip this step.
            </p>
          )}
        </div>
      )}

      {!searchAttempted && !foundDoctor && (
        <div className="p-6 border border-dashed rounded-md text-center text-muted-foreground bg-card">
          <Stethoscope className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
          <p>Search for a doctor or add a new one.</p>
          <p className="text-xs">If no doctor is selected, this section will be omitted from the bill.</p>
        </div>
      )}
    </div>
  );
}

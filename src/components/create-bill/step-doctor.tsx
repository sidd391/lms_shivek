
'use client';

import * as React from 'react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Search, Stethoscope, UserPlus, Loader2, XCircle } from 'lucide-react'; 
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';


const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface Doctor {
  id: string; 
  dbId: number; 
  fullName: string;
  specialty: string;
  phone: string;
  email?: string;
  imageSeed?: string;
}

interface StepDoctorProps {
  onDoctorSelected: (doctor: Doctor | null) => void;
  currentDoctorToDisplay: Doctor | null;
}

export default function StepDoctor({ onDoctorSelected, currentDoctorToDisplay }: StepDoctorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [searchPerformed, setSearchPerformed] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<Doctor[]>([]);

  const handleSearch = React.useCallback(async () => {
    const trimmedQuery = searchQuery.trim();
    onDoctorSelected(null);
    setSearchResults([]);

    if (trimmedQuery === '') {
      setSearchPerformed(false);
      return;
    }

    setIsLoading(true);
    setSearchPerformed(true);
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      toast({ title: 'Authentication Error', description: 'Please login to search doctors.', variant: 'destructive' });
      router.push('/');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_API_URL}/doctors?search=${encodeURIComponent(trimmedQuery)}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      const result = await response.json();

      if (response.ok && result.success) {
        if (result.data && result.data.length > 0) {
          const formattedDoctors: Doctor[] = result.data.map((apiDoc: any) => ({
            id: apiDoc.doctorID || `DOC_DB_${apiDoc.id}`,
            dbId: apiDoc.id,
            fullName: `${apiDoc.title} ${apiDoc.firstName} ${apiDoc.lastName}`,
            specialty: apiDoc.specialty,
            phone: apiDoc.phone,
            email: apiDoc.email,
            imageSeed: `${apiDoc.firstName}${apiDoc.lastName}`.toLowerCase().replace(/\s+/g, ''),
          }));
          setSearchResults(formattedDoctors);
          if (formattedDoctors.length === 1 && trimmedQuery.length > 5) { // Auto-select if single specific match
            onDoctorSelected(formattedDoctors[0]);
            setSearchResults([]); // Clear list after auto-selection
          }
        } else {
          setSearchResults([]);
          if (trimmedQuery) {
            toast({ title: 'Not Found', description: `No doctor found matching "${trimmedQuery}".`, variant: 'default' });
          }
        }
      } else {
        setSearchResults([]);
        toast({ title: 'Search Failed', description: result.message || 'Could not perform doctor search.', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Doctor search error:', error);
      setSearchResults([]);
      toast({ title: 'Network Error', description: 'Could not connect to the server.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, onDoctorSelected, toast, router]);

  React.useEffect(() => {
    if (searchQuery.trim() === '' && searchPerformed) {
      setSearchPerformed(false);
      setSearchResults([]);
      if (currentDoctorToDisplay) {
        onDoctorSelected(null);
      }
    }
  }, [searchQuery, searchPerformed, currentDoctorToDisplay, onDoctorSelected]);

  const handleSelectDoctorFromList = (doctor: Doctor) => {
    onDoctorSelected(doctor);
    setSearchResults([]); // Clear list after selection
    setSearchQuery(doctor.phone); // Or doctor.fullName, depends on desired UX
  };

  const handleClearSelection = () => {
    onDoctorSelected(null);
    setSearchQuery('');
    setSearchResults([]);
    setSearchPerformed(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim() === '') {
        setSearchPerformed(false);
        setSearchResults([]);
        if (currentDoctorToDisplay) {
            onDoctorSelected(null);
        }
    }
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            id="doctorSearch" 
            placeholder="e.g., Dr. Smith or DOC001" 
            className="pl-10 pr-12 py-3 text-base" 
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            disabled={isLoading}
          />
          <Button 
            size="icon" 
            variant="ghost" 
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={handleSearch}
            aria-label="Search Doctor"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
          </Button>
        </div>
         <span className="text-sm text-muted-foreground hidden md:inline">OR</span>
        <Link href="/doctors/create" passHref>
            <Button variant="outline" className="w-full md:w-auto py-3" disabled={isLoading}>
                <UserPlus className="mr-2 h-5 w-5" />
                Add New Doctor
            </Button>
        </Link>
      </div>

      {isLoading && (
         <div className="flex justify-center items-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Searching for doctor...</span>
        </div>
      )}

      {!isLoading && currentDoctorToDisplay && (
        <div className="mt-6">
          <Card className="shadow-md border-primary">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={`https://picsum.photos/seed/${currentDoctorToDisplay.imageSeed || 'doctor'}/80/80`} alt={currentDoctorToDisplay.fullName} data-ai-hint={currentDoctorToDisplay.imageSeed || 'doctor person'} />
                      <AvatarFallback>{currentDoctorToDisplay.fullName ? currentDoctorToDisplay.fullName.split(" ").map(n => n[0]).join("").toUpperCase() : 'DR'}</AvatarFallback>
                    </Avatar>
                    {currentDoctorToDisplay.fullName}
                  </CardTitle>
                  <CardDescription>Doctor ID: {currentDoctorToDisplay.id} - {currentDoctorToDisplay.specialty}</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={handleClearSelection} className="text-muted-foreground hover:text-destructive">
                  <XCircle className="mr-1 h-4 w-4"/> Clear
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <p><strong className="text-muted-foreground">Phone:</strong> {currentDoctorToDisplay.phone}</p>
              <p><strong className="text-muted-foreground">Email:</strong> {currentDoctorToDisplay.email || 'N/A'}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {!isLoading && !currentDoctorToDisplay && searchResults.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-md font-semibold text-foreground">Search Results ({searchResults.length}):</h3>
          <ScrollArea className="h-auto max-h-72 border rounded-md">
            <div className="p-2 space-y-2">
              {searchResults.map(doctor => (
                <Card 
                  key={doctor.dbId} 
                  className="cursor-pointer hover:shadow-lg transition-shadow duration-200 hover:border-primary"
                  onClick={() => handleSelectDoctorFromList(doctor)}
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSelectDoctorFromList(doctor)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={`https://picsum.photos/seed/${doctor.imageSeed || 'doctor'}/60/60`} alt={doctor.fullName} data-ai-hint={doctor.imageSeed || 'doctor person'} />
                        <AvatarFallback>{doctor.fullName ? doctor.fullName.split(" ").map(n => n[0]).join("").toUpperCase() : 'DR'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{doctor.fullName}</p>
                        <p className="text-xs text-muted-foreground">ID: {doctor.id} &bull; Specialty: {doctor.specialty}</p>
                        <p className="text-xs text-muted-foreground">Phone: {doctor.phone}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}


      {!isLoading && !currentDoctorToDisplay && searchResults.length === 0 && searchPerformed && searchQuery.trim() !== '' && (
        <div className="mt-6">
          <p className="text-center text-muted-foreground p-4 border border-dashed rounded-md">
            No doctor found matching "{searchQuery}". You can add a new doctor or skip this step.
          </p>
        </div>
      )}

      {!isLoading && !currentDoctorToDisplay && searchResults.length === 0 && !searchPerformed && (
        <div className="p-6 border border-dashed rounded-md text-center text-muted-foreground bg-card mt-4">
          <Stethoscope className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
          <p>Search for a doctor by name or ID, or add a new one.</p>
          <p className="text-xs">If no doctor is selected, this section will be omitted from the bill.</p>
        </div>
      )}
    </div>
  );
}

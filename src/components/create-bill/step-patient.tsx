
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, UserPlus, Phone, Loader2, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface Patient {
  id: string;
  dbId: number;
  fullName: string;
  phone: string;
  email?: string;
  age?: number;
  gender?: string;
  imageSeed?: string;
}

interface StepPatientProps {
  onPatientSelected: (patient: Patient | null) => void;
  currentPatientToDisplay: Patient | null;
}

export default function StepPatient({ onPatientSelected, currentPatientToDisplay }: StepPatientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [searchPerformed, setSearchPerformed] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<Patient[]>([]);

  const handleSearch = React.useCallback(async () => {
    const trimmedQuery = searchQuery.trim();
    onPatientSelected(null); 
    setSearchResults([]); 

    if (trimmedQuery === '') {
      setSearchPerformed(false);
      return;
    }

    setIsLoading(true);
    setSearchPerformed(true);
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      toast({ title: 'Authentication Error', description: 'Please login to search patients.', variant: 'destructive' });
      router.push('/');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_API_URL}/patients?search=${encodeURIComponent(trimmedQuery)}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      const result = await response.json();

      if (response.ok && result.success) {
        if (result.data && result.data.length > 0) {
          const formattedPatients: Patient[] = result.data.map((apiPatient: any) => ({
            id: apiPatient.patientId || `PAT_DB_${apiPatient.id}`,
            dbId: apiPatient.id,
            fullName: (`${apiPatient.title || ''} ${apiPatient.firstName || ''} ${apiPatient.lastName || ''}`).trim(),
            phone: apiPatient.phone,
            email: apiPatient.email || undefined,
            age: apiPatient.age,
            gender: apiPatient.gender,
            imageSeed: (`${apiPatient.firstName || ''}${apiPatient.lastName || ''}`).toLowerCase().replace(/\s+/g, '') || 'defaultpatient',
          }));
          setSearchResults(formattedPatients);
          if (formattedPatients.length === 1 && trimmedQuery.length > 5) {
            onPatientSelected(formattedPatients[0]);
            setSearchResults([]); 
          }
        } else {
          setSearchResults([]);
          if (trimmedQuery) { // Only toast if a search was actually performed
            toast({ title: 'Not Found', description: `No patient found matching "${trimmedQuery}".`, variant: 'default' });
          }
        }
      } else {
        setSearchResults([]);
        toast({ title: 'Search Failed', description: result.message || 'Could not perform patient search.', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Patient search error:', error);
      setSearchResults([]);
      toast({ title: 'Network Error', description: 'Could not connect to the server.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, onPatientSelected, toast, router]);


  React.useEffect(() => {
    if (searchQuery.trim() === '' && searchPerformed) {
      setSearchPerformed(false);
      setSearchResults([]);
      if (currentPatientToDisplay) {
        onPatientSelected(null);
      }
    }
  }, [searchQuery, searchPerformed, currentPatientToDisplay, onPatientSelected]);

  const handleSelectPatientFromList = (patient: Patient) => {
    onPatientSelected(patient);
    setSearchResults([]); 
    setSearchQuery(patient.phone); 
  };

  const handleClearSelection = () => {
    onPatientSelected(null);
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
        if (currentPatientToDisplay) {
            onPatientSelected(null);
        }
    }
  };

  return (
    <div className="space-y-6">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-2xl font-semibold">Select Patient</CardTitle>
        <CardDescription>Search for an existing patient by phone number or name, or create a new one.</CardDescription>
      </CardHeader>

      <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
        <div className="relative flex-grow w-full md:w-auto">
          <Label htmlFor="patientSearchInput" className="sr-only">Search Patient</Label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="patientSearchInput"
            type="text"
            placeholder="Search by Phone or Name..."
            className="pl-10 pr-12 py-3 text-base"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            disabled={isLoading}
          />
          <Button
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={handleSearch}
            variant="ghost"
            disabled={isLoading}
            aria-label="Search patient"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">OR</span>
        </div>
        <Link href="/patients/create" passHref>
          <Button variant="outline" className="w-full md:w-auto py-3" disabled={isLoading}>
            <UserPlus className="mr-2 h-5 w-5" />
            Create New Patient
          </Button>
        </Link>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Searching for patient...</span>
        </div>
      )}

      {!isLoading && currentPatientToDisplay && (
        <div className="mt-6">
          <Card className="shadow-md border-primary">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={`https://picsum.photos/seed/${currentPatientToDisplay.imageSeed || 'patient'}/80/80`} alt={currentPatientToDisplay.fullName} data-ai-hint={currentPatientToDisplay.imageSeed || 'patient person'} />
                      <AvatarFallback>{currentPatientToDisplay.fullName ? currentPatientToDisplay.fullName.split(" ").map(n => n[0]).join("").toUpperCase() : 'P'}</AvatarFallback>
                    </Avatar>
                    {currentPatientToDisplay.fullName}
                  </CardTitle>
                  <CardDescription>Patient DB ID: {currentPatientToDisplay.dbId} / Display ID: {currentPatientToDisplay.id}</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={handleClearSelection} className="text-muted-foreground hover:text-destructive">
                  <XCircle className="mr-1 h-4 w-4"/> Clear
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <p><strong className="text-muted-foreground">Phone:</strong> {currentPatientToDisplay.phone}</p>
              <p><strong className="text-muted-foreground">Email:</strong> {currentPatientToDisplay.email || 'N/A'}</p>
              <p><strong className="text-muted-foreground">Age:</strong> {currentPatientToDisplay.age || 'N/A'}</p>
              <p><strong className="text-muted-foreground">Gender:</strong> {currentPatientToDisplay.gender || 'N/A'}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {!isLoading && !currentPatientToDisplay && searchResults.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-md font-semibold text-foreground">Search Results ({searchResults.length}):</h3>
          <ScrollArea className="h-auto max-h-72 border rounded-md">
            <div className="p-2 space-y-2">
              {searchResults.map(patient => (
                <Card 
                  key={patient.dbId} 
                  className="cursor-pointer hover:shadow-lg transition-shadow duration-200 hover:border-primary"
                  onClick={() => handleSelectPatientFromList(patient)}
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSelectPatientFromList(patient)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={`https://picsum.photos/seed/${patient.imageSeed || 'patient'}/60/60`} alt={patient.fullName} data-ai-hint={patient.imageSeed || 'patient person'} />
                        <AvatarFallback>{patient.fullName ? patient.fullName.split(" ").map(n => n[0]).join("").toUpperCase() : 'P'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{patient.fullName}</p>
                        <p className="text-xs text-muted-foreground">ID: {patient.id} &bull; Phone: {patient.phone}</p>
                         <p className="text-xs text-muted-foreground">Age: {patient.age || 'N/A'} &bull; Gender: {patient.gender || 'N/A'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {!isLoading && !currentPatientToDisplay && searchResults.length === 0 && searchPerformed && searchQuery.trim() !== '' && (
        <div className="mt-6">
          <p className="text-center text-muted-foreground p-4 border border-dashed rounded-md">
            No patient found matching "{searchQuery}". Try a different search or create a new patient.
          </p>
        </div>
      )}

      {!isLoading && !currentPatientToDisplay && searchResults.length === 0 && !searchPerformed && (
        <div className="p-6 border border-dashed rounded-md text-center text-muted-foreground bg-card mt-4">
          <Search className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
          <p>Enter a phone number or name to search for an existing patient, or create a new one.</p>
          <p className="text-xs">A patient must be selected to proceed.</p>
        </div>
      )}
    </div>
  );
}

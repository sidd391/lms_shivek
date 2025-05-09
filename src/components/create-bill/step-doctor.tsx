
'use client';

import * as React from 'react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Search, UserMdIcon, Stethoscope } from 'lucide-react'; // UserMdIcon is a placeholder, Stethoscope is available

export default function StepDoctor() {
  return (
    <div className="space-y-6">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-2xl font-semibold flex items-center">
          <Stethoscope className="mr-3 h-7 w-7 text-primary" />
          Select Doctor (Optional)
        </CardTitle>
        <CardDescription>Search for a doctor or skip this step.</CardDescription>
      </CardHeader>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="doctorSearch">Search Doctor by Name or ID</Label>
          <div className="relative">
            <Input id="doctorSearch" placeholder="e.g., Dr. Smith or DOC001" className="pr-10 py-3 text-base" />
            <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
              <Search className="h-5 w-5 text-muted-foreground" />
               <span className="sr-only">Search Doctor</span>
            </Button>
          </div>
        </div>
        {/* Placeholder for search results or selected doctor */}
        <div className="p-4 border border-dashed rounded-md text-center text-muted-foreground">
          Doctor selection and details will appear here.
        </div>
      </div>
    </div>
  );
}

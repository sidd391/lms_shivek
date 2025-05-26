'use client';

import * as React from 'react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Beaker, FileText, PackagePlus, PlusCircle, Search, X, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import type { Test } from './step-summary'; // Import Test type from step-summary
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface StepTestProps {
  onTestsSelected?: (tests: Test[]) => void;
  initialSelectedTests?: Test[];
}

export default function StepTest({ onTestsSelected, initialSelectedTests = [] }: StepTestProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedTests, setSelectedTests] = React.useState<Test[]>(initialSelectedTests);
  const [openPopover, setOpenPopover] = React.useState(false);
  const [allAvailableItems, setAllAvailableItems] = React.useState<Test[]>([]);
  const [isLoadingItems, setIsLoadingItems] = React.useState(true);

  React.useEffect(() => {
    const fetchItems = async () => {
      setIsLoadingItems(true);
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        toast({ title: 'Authentication Error', description: 'Please login to load tests and packages.', variant: 'destructive' });
        router.push('/');
        setIsLoadingItems(false);
        return;
      }

      try {
        const [testsResponse, packagesResponse] = await Promise.all([
          fetch(`${BACKEND_API_URL}/tests`, { headers: { 'Authorization': `Bearer ${authToken}` } }),
          fetch(`${BACKEND_API_URL}/test-packages`, { headers: { 'Authorization': `Bearer ${authToken}` } })
        ]);

        const testsResult = await testsResponse.json();
        const packagesResult = await packagesResponse.json();

        let combinedItems: Test[] = [];

        if (testsResponse.ok && testsResult.success && Array.isArray(testsResult.data)) {
          const fetchedTests: Test[] = testsResult.data.map((t: any) => ({
            id: `T${t.id}`, // Prefix to distinguish from packages and ensure string ID
            dbId: t.id,
            name: t.name,
            price: parseFloat(t.price),
            isPackage: false,
          }));
          combinedItems = [...combinedItems, ...fetchedTests];
        } else {
          toast({ title: 'Error Loading Tests', description: testsResult.message || 'Could not fetch tests.', variant: 'destructive' });
        }

        if (packagesResponse.ok && packagesResult.success && Array.isArray(packagesResult.data)) {
          const fetchedPackages: Test[] = packagesResult.data.map((p: any) => ({
            id: `P${p.id}`, // Prefix to distinguish
            dbId: p.id,
            name: p.name,
            price: parseFloat(p.price),
            isPackage: true,
          }));
          combinedItems = [...combinedItems, ...fetchedPackages];
        } else {
          toast({ title: 'Error Loading Packages', description: packagesResult.message || 'Could not fetch packages.', variant: 'destructive' });
        }
        
        combinedItems.sort((a,b) => a.name.localeCompare(b.name));
        setAllAvailableItems(combinedItems);

      } catch (error) {
        console.error('Error fetching tests/packages:', error);
        toast({ title: 'Network Error', description: 'Could not connect to fetch tests/packages.', variant: 'destructive' });
      } finally {
        setIsLoadingItems(false);
      }
    };

    fetchItems();
  }, [router, toast]);
  
  React.useEffect(() => {
    if (JSON.stringify(initialSelectedTests) !== JSON.stringify(selectedTests)) {
        setSelectedTests(initialSelectedTests);
    }
  }, [initialSelectedTests, selectedTests]);


  const handleSelectTest = (test: Test) => {
    if (!selectedTests.find(t => t.id === test.id)) {
      const newSelectedTests = [...selectedTests, test];
      setSelectedTests(newSelectedTests);
      onTestsSelected?.(newSelectedTests);
    }
    setOpenPopover(false);
  };

  const handleRemoveTest = (testId: string) => {
    const newSelectedTests = selectedTests.filter(t => t.id !== testId);
    setSelectedTests(newSelectedTests);
    onTestsSelected?.(newSelectedTests);
  };

  const availableItemsForSelection = allAvailableItems.filter(
    (item) => !selectedTests.some((selected) => selected.id === item.id)
  );

  const totalAmount = selectedTests.reduce((sum, test) => sum + test.price, 0);

  return (
    <div className="space-y-6">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-2xl font-semibold flex items-center">
          <Beaker className="mr-3 h-7 w-7 text-primary" />
          Select Tests/Packages
        </CardTitle>
        <CardDescription>Add tests or packages to the bill. Search and select from the list below.</CardDescription>
      </CardHeader>
      
      <div className="space-y-4">
        <Popover open={openPopover} onOpenChange={setOpenPopover}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openPopover}
              className="w-full justify-between text-muted-foreground hover:text-foreground py-3 text-base"
              disabled={isLoadingItems}
            >
              {isLoadingItems ? "Loading items..." : (selectedTests.length > 0 ? `Selected ${selectedTests.length} item(s)` : "Click to select a test or package...")}
              {isLoadingItems ? <Loader2 className="ml-2 h-5 w-5 shrink-0 animate-spin" /> : <PlusCircle className="ml-2 h-5 w-5 shrink-0 opacity-50" />}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command>
              <CommandInput placeholder="Search test or package..." disabled={isLoadingItems} />
              <CommandList>
                {isLoadingItems ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">Loading available items...</div>
                ) : availableItemsForSelection.length === 0 && allAvailableItems.length > 0 ? (
                    <CommandEmpty>All available items already selected.</CommandEmpty>
                ) : availableItemsForSelection.length === 0 && allAvailableItems.length === 0 ? (
                    <CommandEmpty>No tests or packages available.</CommandEmpty>
                ) : (
                  <CommandGroup>
                    {availableItemsForSelection.map((item) => (
                      <CommandItem
                        key={item.id}
                        value={item.name}
                        onSelect={() => handleSelectTest(item)}
                        className="cursor-pointer"
                      >
                        <div className="flex justify-between w-full items-center">
                          <div className="flex items-center">
                            {item.isPackage ? <PackagePlus className="mr-2 h-4 w-4 text-accent" /> : <Beaker className="mr-2 h-4 w-4 text-primary" />}
                            <span>{item.name}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">₹{item.price.toFixed(2)}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {selectedTests.length > 0 && (
          <div className="space-y-3 pt-4">
            <h3 className="text-lg font-medium text-foreground">Selected Items:</h3>
            <ScrollArea className="h-auto max-h-60 w-full rounded-md border">
              <div className="p-4 space-y-3">
                {selectedTests.map(test => (
                  <div 
                    key={test.id} 
                    className="flex items-center justify-between p-3 rounded-md bg-card shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary">
                        {test.isPackage ? <PackagePlus className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">{test.name}</span>
                        <p className="text-sm text-muted-foreground">₹{test.price.toFixed(2)}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleRemoveTest(test.id)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Remove ${test.name}`}
                    >
                      <X className="mr-1 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
             <div className="pt-4 mt-4 border-t">
                <div className="flex justify-between text-lg font-semibold text-primary">
                    <span>Total Amount:</span>
                    <span>₹{totalAmount.toFixed(2)}</span>
                </div>
            </div>
          </div>
        )}
         {selectedTests.length === 0 && !isLoadingItems && (
            <div className="p-6 border border-dashed rounded-md text-center text-muted-foreground bg-card mt-4">
                <Beaker className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                <p>No tests or packages selected yet.</p>
                <p className="text-xs">Use the dropdown above to add items to the bill.</p>
            </div>
        )}
      </div>
    </div>
  );
}

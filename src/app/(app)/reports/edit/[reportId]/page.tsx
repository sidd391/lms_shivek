
'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, Controller, useFieldArray, type ControllerRenderProps, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, CheckCircle, FilePenLine, Loader2, Sigma } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Form, FormControl, FormField, FormItem, FormLabel as RHFFormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { Textarea } from '@/components/ui/textarea';

const TiptapEditor = dynamic(() => import('@/components/ui/tiptap-editor'), {
  ssr: false,
  loading: () => <div className="p-2 border rounded-md bg-muted min-h-[150px] text-sm">Loading Tiptap editor...</div>,
});


const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// For data fetched from backend for parameter definitions
interface TestParameterDefinition {
  id: number;
  name: string; // This is the parameter's defined name
  fieldType: ParameterFieldTypeFrontend;
  units?: string | null;
  rangeText?: string | null;
  rangeLow?: number | null;
  rangeHigh?: number | null;
  options?: string[] | string | null;
  isFormula?: boolean;
  formulaString?: string | null;
  parentId?: number | null;
  testMethod?: string | null;
}

const parameterFieldTypesFE = ['Numeric', 'Text', 'Option List', 'Formula', 'Group', 'Text Editor', 'Numeric Unbounded'] as const;
type ParameterFieldTypeFrontend = typeof parameterFieldTypesFE[number];

interface FetchedParameterResult {
  id: number;
  reportId: number;
  testParameterId: number;
  resultValue?: string | null;
  isAbnormal?: boolean | null;
  notes?: string | null;
}

const reportParameterResultSchema = z.object({
  id: z.number().optional().nullable(), // DB ID of the result entry, if it exists
  testParameterId: z.number(),         // Links to TestParameterDefinition.id
  parameterName: z.string(),           // Display name of the parameter
  fieldType: z.custom<ParameterFieldTypeFrontend>(),
  resultValue: z.string().optional().nullable(),
  isAbnormal: z.boolean().optional().nullable().default(false),
  notes: z.string().optional().nullable(),
  units: z.string().optional().nullable(),
  referenceRange: z.string().optional().nullable(),
  rangeLow: z.number().optional().nullable(),
  rangeHigh: z.number().optional().nullable(),
  options: z.union([z.array(z.string()), z.string()]).optional().nullable(), 
  isFormula: z.boolean().default(false),
  formulaString: z.string().optional().nullable(),
});
export type ReportParameterResultFormValue = z.infer<typeof reportParameterResultSchema>;

interface ReportItemFormValue {
  id: number; // ReportItem.id from DB
  itemName: string;
  itemType: 'Test' | 'Package';
  originalItemId: number | null; // Test.id or TestPackage.id
  testDetails?: {
    id: number; // Test.id
    name: string; // Test.name
    parameters: ReportParameterResultFormValue[];
  } | null;
}

const editReportFormSchema = z.object({
  reportIdNumber: z.string(),
  patientName: z.string().optional().nullable(), // Display name
  doctorName: z.string().optional().nullable(),  // Display name
  billNumber: z.string().optional().nullable(),  // Display name
  reportDate: z.string(),
  overallNotes: z.string().optional().nullable(),
  items: z.array(z.custom<ReportItemFormValue>()),
});
type EditReportFormValues = z.infer<typeof editReportFormSchema>;

interface FullReportDataForEditing {
  id: number;
  reportIdNumber: string;
  reportDate: string;
  status: string;
  notes?: string | null;
  patient?: { id?: number; patientId?: string; fullName?: string; }; // ADDED
  doctor?: { id?: number; doctorID?: string; fullName?: string; };   // ADDED
  bill?: { id?: number; billNumber?: string; };                     // ADDED
  items?: Array<{
    id: number;
    itemName: string;
    itemType: 'Test' | 'Package';
    originalItemId: number | null;
    testDetails?: {
      id: number;
      name: string;
      parameters?: TestParameterDefinition[];
    } | null;
  }>;
  parameterResults?: FetchedParameterResult[];
}


const evaluateFormula = (formulaString: string | null | undefined, dependentValues: Record<string, string | null | undefined>): string => {
  if (!formulaString || typeof formulaString !== 'string' || formulaString.trim() === '') {
    return '';
  }
  // console.log(`[evaluateFormula] Original Expression: "${formulaString}" Dependent Values:`, JSON.parse(JSON.stringify(dependentValues)));

  let resultExpression = formulaString;
  // Get parameter names from dependentValues, sort by length (desc) to replace longer names first
  const paramNames = Object.keys(dependentValues).sort((a, b) => b.length - a.length);

  paramNames.forEach(name => {
    // Escape special characters in the name for regex
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match whole word/phrase
    const paramRegex = new RegExp(`\\b${escapedName}\\b`, 'g');
    const value = dependentValues[name];
    const numValue = (value !== undefined && value !== null && String(value).trim() !== '') ? parseFloat(String(value)) : NaN;
    const replacement = isNaN(numValue) ? '0' : String(numValue); // Replace non-numbers with 0
    // console.log(`[evaluateFormula] Replacing "${name}" with "${replacement}" (original value: "${value}")`);
    resultExpression = resultExpression.replace(paramRegex, replacement);
    // console.log(`[evaluateFormula] Expression after replacing "${name}": ${resultExpression}`);
  });

  try {
    const remainingPlaceholders = resultExpression.match(/\b(?!Math\b)[a-zA-Z_][a-zA-Z0-9_ ]*\b/g);
    if (remainingPlaceholders && remainingPlaceholders.length > 0) {
        const allRemainingWereKnownButEmptyOrZero = remainingPlaceholders.every(ph => {
            const trimmedPh = ph.trim();
            return paramNames.includes(trimmedPh) && (String(dependentValues[trimmedPh]).trim() === '' || String(dependentValues[trimmedPh]).trim() === '0');
        });
        if (!allRemainingWereKnownButEmptyOrZero) {
          const unknownPlaceholders = remainingPlaceholders.filter(ph => !paramNames.includes(ph.trim()));
          if(unknownPlaceholders.length > 0){
            console.warn('[evaluateFormula] Dependency Error - remaining UNKNOWN placeholders:', unknownPlaceholders, "in expression:", resultExpression);
            return 'Dep Error';
          }
        }
    }

    if (resultExpression.trim() === '') return ''; // Avoid eval on empty string

    // eslint-disable-next-line no-new-func
    const calculatedValue = new Function(`"use strict"; try { return (${resultExpression}); } catch(e) { console.error('Formula runtime error:', e, 'Original:', formulaString, 'Processed:', resultExpression); return "Calc Error"; }`)();
    // console.log(`[evaluateFormula] Calculated value (raw):`, calculatedValue, "Processed Expression:", resultExpression);

    if (typeof calculatedValue === 'number' && isFinite(calculatedValue)) {
      // Determine precision for rounding
      let maxDecimals = 2; // Default
      if (Math.abs(calculatedValue) > 0 && Math.abs(calculatedValue) < 0.01 && String(calculatedValue).includes('.')) {
        maxDecimals = 4; // Higher precision for very small decimals
      } else if (String(calculatedValue).includes('.')) {
        const decimalPart = String(calculatedValue).split('.')[1];
        // Only increase precision if the decimal part is significant and long
        if (decimalPart && decimalPart.length > 2 && parseFloat(`0.${decimalPart}`) !== 0) {
            maxDecimals = Math.min(decimalPart.length, 4);
        }
      }
      return calculatedValue.toFixed(maxDecimals);
    } else if (typeof calculatedValue === 'string' && (calculatedValue === "Calc Error" || calculatedValue === "Dep Error")) {
        return calculatedValue; // Return specific error strings
    } else if (typeof calculatedValue === 'string' && !isNaN(parseFloat(calculatedValue)) && isFinite(parseFloat(calculatedValue))) {
        // If eval returned a string that is a number, format it
        return parseFloat(calculatedValue).toFixed(2);
    }
    console.warn('[evaluateFormula] Unexpected evaluation result type or value:', calculatedValue, "Processed Expression:", resultExpression);
    return 'Eval Error'; // Fallback error for other unexpected results
  } catch (e: any) {
    console.error('[evaluateFormula] Syntax Error in generated function. Original:', formulaString, 'Processed:', resultExpression, 'Error:', e);
    return 'Syntax Error';
  }
};


export default function EditReportPage() {
  const router = useRouter();
  const params = useParams();
  const reportId = params?.reportId as string;
  const { toast } = useToast();

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [reportData, setReportData] = React.useState<FullReportDataForEditing | null>(null);
  const [isReportVerified, setIsReportVerified] = React.useState(false);

  const form = useForm<EditReportFormValues>({
    resolver: zodResolver(editReportFormSchema),
    defaultValues: {
      reportIdNumber: '', patientName: '', doctorName: '', billNumber: '',
      reportDate: '', overallNotes: '', items: [],
    },
  });

  const { fields: itemFields } = useFieldArray({ control: form.control, name: "items" });
  const watchedItems = form.watch('items');


  React.useEffect(() => {
    if (!reportId) {
      setIsLoading(false);
      toast({ title: "Error", description: "Report ID is missing.", variant: "destructive" });
      router.push('/reports');
      return;
    }
      const fetchReportData = async () => {
        setIsLoading(true);
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
          toast({ title: "Authentication Error", description: "Please login.", variant: "destructive" });
          router.push('/');
          setIsLoading(false);
          return;
        }
        try {
          const response = await fetch(`${BACKEND_API_URL}/reports/${reportId}`, { headers: { 'Authorization': `Bearer ${authToken}` } });
          if (!response.ok) throw new Error('Failed to fetch report data');
          const result = await response.json();

          if (result.success && result.data) {
            const fetchedReport = result.data as FullReportDataForEditing;
            setReportData(fetchedReport);
            if (fetchedReport.status === 'Verified') setIsReportVerified(true);

            const transformedItems: ReportItemFormValue[] = (fetchedReport.items || []).map((item) => {
              const currentTestDetailsFromFetch = item.testDetails;
              
              const parametersForForm: ReportParameterResultFormValue[] = (currentTestDetailsFromFetch?.parameters || []).map((paramDef: TestParameterDefinition) => {
                const existingResult = (fetchedReport.parameterResults || []).find(
                  (p: FetchedParameterResult) => p.testParameterId === paramDef.id
                );
                const parsedRangeLow = paramDef.rangeLow !== null && paramDef.rangeLow !== undefined ? parseFloat(String(paramDef.rangeLow)) : null;
                const parsedRangeHigh = paramDef.rangeHigh !== null && paramDef.rangeHigh !== undefined ? parseFloat(String(paramDef.rangeHigh)) : null;

                let initialValue: string = ''; 
                if (existingResult?.resultValue !== null && existingResult?.resultValue !== undefined) {
                    if (existingResult.resultValue.trim() === '<p></p>' || existingResult.resultValue.trim() === '') {
                        // If existing result is an "empty" editor state for a Text Editor type, try to use the default template
                        if (paramDef.fieldType === 'Text Editor' && typeof paramDef.options === 'string' && paramDef.options.trim() !== '') {
                            initialValue = paramDef.options;
                            console.log(`PARAM INIT (Text Editor - Empty Result): Name: '${paramDef.name}', Using default template from paramDef.options. Length: ${paramDef.options.length}`);
                        } else {
                           initialValue = existingResult.resultValue; // Or keep it as <p></p> / "" if no default
                        }
                    } else {
                        initialValue = existingResult.resultValue; // Use the actual saved value
                         // console.log(`PARAM INIT: Name: '${paramDef.name}', Type: ${paramDef.fieldType}, Using existingResult.resultValue. Length: ${initialValue.length}`);
                    }
                } else if (paramDef.fieldType === 'Text Editor' && typeof paramDef.options === 'string' && paramDef.options.trim() !== '') {
                    // No saved result, and it's a Text Editor with a non-empty default template, use the template.
                    initialValue = paramDef.options;
                    console.log(`PARAM INIT (Text Editor - NO RESULT): Name: '${paramDef.name}', Using default template from paramDef.options. Length: ${initialValue.length}`);
                }
                // console.log(`Init for ${paramDef.name} (ID: ${paramDef.id}): existingResultValue: '${existingResult?.resultValue}', paramDef.options: '${typeof paramDef.options === 'string' ? paramDef.options : JSON.stringify(paramDef.options)}', final initialValue: '${initialValue}'`);

                let isInitiallyAbnormal = existingResult?.isAbnormal ?? false;
                if (!isInitiallyAbnormal && (paramDef.fieldType === 'Numeric' || paramDef.fieldType === 'Formula') && initialValue.trim() !== '') {
                  const numValue = parseFloat(initialValue);
                  if (!isNaN(numValue)) {
                      if ((parsedRangeLow !== null && numValue < parsedRangeLow) || (parsedRangeHigh !== null && numValue > parsedRangeHigh)) {
                          isInitiallyAbnormal = true;
                      }
                  }
                }
                const parsedOptionsForForm = (paramDef.fieldType === 'Option List' ? (Array.isArray(paramDef.options) ? paramDef.options : null) : null);
                
                const formParameter: ReportParameterResultFormValue = {
                  id: existingResult?.id ?? null,
                  testParameterId: paramDef.id,
                  parameterName: paramDef.name, 
                  fieldType: paramDef.fieldType as ParameterFieldTypeFrontend,
                  resultValue: initialValue,
                  isAbnormal: isInitiallyAbnormal,
                  notes: existingResult?.notes ?? '',
                  units: paramDef.units,
                  referenceRange: paramDef.rangeText || (parsedRangeLow !== null && parsedRangeHigh !== null ? `${parsedRangeLow} - ${parsedRangeHigh}` : ''),
                  rangeLow: parsedRangeLow,
                  rangeHigh: parsedRangeHigh,
                  options: parsedOptionsForForm,
                  isFormula: paramDef.isFormula ?? false,
                  formulaString: paramDef.formulaString,
                };
                return formParameter;
              });

              return {
                id: item.id,
                itemName: item.itemName,
                itemType: item.itemType,
                originalItemId: item.originalItemId,
                testDetails: currentTestDetailsFromFetch ? {
                  id: currentTestDetailsFromFetch.id,
                  name: currentTestDetailsFromFetch.name,
                  parameters: parametersForForm,
                } : null,
              };
            });
            // console.log("Transformed items for form reset:", JSON.parse(JSON.stringify(transformedItems)));

            form.reset({
              reportIdNumber: fetchedReport.reportIdNumber,
              patientName: fetchedReport.patient?.fullName || 'N/A', // Use optional chaining
              doctorName: fetchedReport.doctor?.fullName || 'N/A',   // Use optional chaining
              billNumber: fetchedReport.bill?.billNumber || 'N/A',     // Use optional chaining
              reportDate: new Date(fetchedReport.reportDate).toLocaleDateString(),
              overallNotes: fetchedReport.notes || '',
              items: transformedItems,
            });
          } else {
            toast({ title: "Error", description: result.message || "Report not found.", variant: "destructive" });
            router.push('/reports');
          }
        } catch (error: any) {
          toast({ title: "Error Loading Report", description: error.message, variant: "destructive" });
          router.push('/reports');
        } finally {
          setIsLoading(false);
        }
      };
      fetchReportData();
  }, [reportId, form, router, toast]);


React.useEffect(() => {
  if (isLoading || !watchedItems || watchedItems.length === 0) {
    return;
  }
  // console.log("Formula useEffect triggered. Watched items:", JSON.parse(JSON.stringify(watchedItems)));

  let hasChanges = false; 

  watchedItems.forEach((item, itemIndex) => {
    const currentItemFromForm = form.getValues(`items[${itemIndex}]` as any);

    if (currentItemFromForm && currentItemFromForm.itemType === 'Test' && currentItemFromForm.testDetails && currentItemFromForm.testDetails.parameters) {
      // console.log(`Processing formulas for item "${currentItemFromForm.itemName}" (index ${itemIndex})`);
      const dependentValuesForThisTest: Record<string, string | null | undefined> = {};
      // Ensure currentItemFromForm.testDetails exists before accessing its parameters
      currentItemFromForm.testDetails.parameters.forEach((paramDef: ReportParameterResultFormValue) => {
        dependentValuesForThisTest[paramDef.parameterName] = paramDef.resultValue;
      });
      // console.log(`Context for formula evaluation for item ${itemIndex}:`, JSON.parse(JSON.stringify(dependentValuesForThisTest)));

      currentItemFromForm.testDetails.parameters.forEach((param: ReportParameterResultFormValue, paramIndex: number) => {
        const fieldNamePrefix = `items[${itemIndex}].testDetails.parameters[${paramIndex}]`;
        const resultValuePath = `${fieldNamePrefix}.resultValue` as const;
        const isAbnormalPath = `${fieldNamePrefix}.isAbnormal` as const;

        if (param.isFormula && param.formulaString) {
          // console.log(`Evaluating formula for parameter "${param.parameterName}" (index ${paramIndex}) in item ${itemIndex}: ${param.formulaString}`);
          const calculatedFormulaValueStr = evaluateFormula(param.formulaString, dependentValuesForThisTest);
          // console.log(`Calculated value for "${param.parameterName}": ${calculatedFormulaValueStr}`);

          const currentValueInForm = form.getValues(resultValuePath as any);
          if (currentValueInForm !== calculatedFormulaValueStr) {
            // console.log(`Updating value for "${param.parameterName}" from "${currentValueInForm}" to "${calculatedFormulaValueStr}"`);
            form.setValue(resultValuePath as any, calculatedFormulaValueStr, { shouldDirty: true, shouldValidate: true });
            hasChanges = true;

            let isFormulaAbnormal = false;
            const numCalculatedValue = parseFloat(calculatedFormulaValueStr);
            if (!isNaN(numCalculatedValue)) {
                const pLow = typeof param.rangeLow === 'number' ? param.rangeLow : null;
                const pHigh = typeof param.rangeHigh === 'number' ? param.rangeHigh : null;
                if ((pLow !== null && numCalculatedValue < pLow) || (pHigh !== null && numCalculatedValue > pHigh)) {
                    isFormulaAbnormal = true;
                }
            }
            if (form.getValues(isAbnormalPath as any) !== isFormulaAbnormal) {
                form.setValue(isAbnormalPath as any, isFormulaAbnormal, { shouldDirty: true, shouldValidate: false });
                hasChanges = true;
            }
          }
        }
      });
    }
  });
}, [watchedItems, form, isLoading]);


  const handleSave = async (newStatus?: 'Completed' | 'Verified') => {
    if (!reportData) return;
    newStatus ? setIsVerifying(true) : setIsSaving(true);
    const authToken = localStorage.getItem('authToken');
    if (!authToken) { toast({ title: "Authentication Error", description: "Please login.", variant: "destructive" }); newStatus ? setIsVerifying(false) : setIsSaving(false); router.push('/'); return; }

    const formData = form.getValues();
    const resultsToSubmit: Array<{testParameterId: number; resultValue?: string | null; isAbnormal?: boolean | null; notes?: string | null;}> = [];
    formData.items.forEach(item => {
      if (item.itemType === 'Test' && item.testDetails && item.testDetails.parameters) {
        item.testDetails.parameters.forEach(param => {
            if(param.fieldType !== 'Group') {
                resultsToSubmit.push({
                  testParameterId: param.testParameterId, resultValue: param.resultValue,
                  isAbnormal: param.isAbnormal, notes: param.notes,
                });
            }
        });
      }
    });

    const payload: any = { results: resultsToSubmit, overallNotes: formData.overallNotes, };
    if (newStatus) payload.overallStatus = newStatus;

    try {
      const response = await fetch(`${BACKEND_API_URL}/reports/${reportId}/results`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        toast({ title: "Success", description: `Report ${newStatus ? newStatus.toLowerCase() : 'saved'}.` });
        if (newStatus === 'Verified') setIsReportVerified(true);
        form.reset(form.getValues(), { keepDirty: false, keepValues: true });
      } else { toast({ title: "Error", description: result.message || `Failed to ${newStatus ? newStatus.toLowerCase() : 'save'} report.`, variant: "destructive" }); }
    } catch (error: any) { toast({ title: "Network Error", description: error.message, variant: "destructive" }); }
    finally { newStatus ? setIsVerifying(false) : setIsSaving(false); }
  };

  if (isLoading || !reportData) { // Combined guard
    return ( <div className="space-y-6 p-4"> <Skeleton className="h-12 w-1/3" /> <Skeleton className="h-8 w-1/2" /> <Card><CardHeader><Skeleton className="h-6 w-1/4 mb-2" /><Skeleton className="h-4 w-full" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card> <Card><CardHeader><Skeleton className="h-6 w-1/4 mb-2" /><Skeleton className="h-4 w-full" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card> <div className="flex justify-end gap-2"><Skeleton className="h-10 w-24" /><Skeleton className="h-10 w-32" /></div> </div> );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(() => handleSave())} className="space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" onClick={() => router.push('/reports')} aria-label="Go back"> <ArrowLeft className="h-5 w-5" /> </Button>
                <div>
                  <CardTitle className="text-3xl font-bold flex items-center"> <FilePenLine className="mr-3 h-8 w-8 text-primary" /> Edit Report: {reportData.reportIdNumber} </CardTitle>
                  <CardDescription>
                     Patient: {reportData.patient?.fullName || 'N/A'} |
                    {(reportData.doctor?.fullName) ? ` Doctor: ${reportData.doctor.fullName} | ` : ''}
                    Bill: {reportData.bill?.billNumber || 'N/A'} |
                    Report Date: {reportData?.reportDate ? new Date(reportData.reportDate).toLocaleDateString() : 'N/A'} |
                    Status: <span className={`font-semibold ${isReportVerified ? 'text-green-600' : 'text-orange-500'}`}>{isReportVerified ? 'Verified' : (reportData?.status || 'N/A')}</span>
                  </CardDescription>
                </div>
              </div>
               {isReportVerified && <Badge variant="default" className="bg-green-600 text-white">Verified</Badge>}
            </div>
          </CardHeader>
        </Card>
        <Accordion type="multiple" defaultValue={itemFields.map((_, itemIndex) => `item-accordion-${itemIndex}`)} className="w-full space-y-4">
          {itemFields.map((itemField, itemIndex) => {
            const currentItemFromWatch = watchedItems[itemIndex];

            if (!currentItemFromWatch ) return null;
            const testDetailsFromWatch = currentItemFromWatch.testDetails;

            return (
              <AccordionItem value={`item-accordion-${itemIndex}`} key={itemField.id}>
                <Card className="shadow-md">
                  <AccordionTrigger className="w-full px-6 py-4 hover:no-underline">
                    <CardTitle className="text-xl font-semibold text-left">{currentItemFromWatch.itemName}</CardTitle>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CardContent className="pt-0">
                      {(!testDetailsFromWatch || !testDetailsFromWatch.parameters || testDetailsFromWatch.parameters.length === 0) && (
                        <p className="py-4 text-muted-foreground text-sm">No parameters defined for this test.</p>
                      )}

                      {testDetailsFromWatch && testDetailsFromWatch.parameters && testDetailsFromWatch.parameters.length > 0 &&
                        !testDetailsFromWatch.parameters.every((p: ReportParameterResultFormValue) => p.fieldType === 'Group' || p.fieldType === 'Text Editor') && (
                        <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_0.5fr] items-center gap-x-4 gap-y-3 py-2 px-1 border-b text-sm font-medium text-muted-foreground">
                          <span>Parameter</span> <span>Result</span> <span>Units</span> <span>Reference Range</span> <span>Abn.</span>
                        </div>
                      )}

                      {testDetailsFromWatch?.parameters?.map((param, paramIndex) => {
                        const fieldNamePrefix = `items[${itemIndex}].testDetails.parameters[${paramIndex}]`;
                        const resultValuePath = `${fieldNamePrefix}.resultValue` as const;
                        const isAbnormalPath = `${fieldNamePrefix}.isAbnormal` as const;
                        const watchedIsAbnormal = form.watch(isAbnormalPath as any);

                        if (param.fieldType === 'Group') {
                          return ( <div key={`param-group-${param.testParameterId}-${itemIndex}-${paramIndex}`} className="grid grid-cols-[1fr] items-center gap-x-4 gap-y-2 py-3 px-1 border-b last:border-b-0 bg-muted/50 rounded"> <RHFFormLabel className="font-semibold text-md text-foreground pl-1">{param.parameterName}</RHFFormLabel> </div> );
                        }
                        
                        if (param.fieldType === 'Text Editor') {
                            return (
                                <FormField
                                key={`param-field-tiptap-${param.testParameterId}-${itemIndex}-${paramIndex}`}
                                control={form.control}
                                name={resultValuePath as any}
                                render={({ field }) => (
                                    <FormItem className="col-span-full items-start gap-x-4 gap-y-2 py-2 px-1 border-b last:border-b-0">
                                    <RHFFormLabel htmlFor={resultValuePath as any} className="font-normal truncate mb-1 block">{param.parameterName}</RHFFormLabel>
                                    <FormControl>
                                      <div>
                                        <TiptapEditor
                                            ref={field.ref}
                                            content={String(field.value ?? '')} 
                                            onChange={field.onChange}
                                            readOnly={isReportVerified || param.isFormula}
                                            className={cn(
                                            "bg-background rounded-md border border-input min-h-[150px]",
                                            watchedIsAbnormal && !param.isFormula && "border-destructive ring-2 ring-destructive focus-within:border-destructive focus-within:ring-destructive"
                                            )}
                                        />
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                            );
                        }
                        // For other types (Numeric, Text, Option List, Formula, Numeric Unbounded)
                        return (
                          <div key={`param-entry-${param.testParameterId}-${itemIndex}-${paramIndex}`} className="grid grid-cols-[2fr_1.5fr_1fr_1fr_0.5fr] items-center gap-x-4 gap-y-2 py-2 px-1 border-b last:border-b-0">
                            <RHFFormLabel htmlFor={resultValuePath as any} className="font-normal truncate"> {param.parameterName} {param.isFormula && <Sigma className="inline h-3 w-3 ml-1 text-blue-500" />} </RHFFormLabel>
                            {param.fieldType === 'Option List' ? (
                                <Controller
                                  control={form.control} name={resultValuePath as any}
                                  render={({ field }: { field: ControllerRenderProps<EditReportFormValues, FieldPath<EditReportFormValues>> }) => (
                                    <Select onValueChange={(value) => { field.onChange(value); }} value={String(field.value ?? '')} disabled={isReportVerified || param.isFormula}>
                                      <FormControl> <SelectTrigger className={cn("text-sm", watchedIsAbnormal && !param.isFormula && "font-bold text-destructive border-destructive")}> <SelectValue placeholder="Select..." /> </SelectTrigger> </FormControl>
                                      <SelectContent> {(param.options && Array.isArray(param.options) ? param.options : []).map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)} </SelectContent>
                                    </Select>
                                  )} />
                            ) : (
                                <Controller control={form.control} name={resultValuePath as any}
                                  render={({ field }: { field: ControllerRenderProps<EditReportFormValues, FieldPath<EditReportFormValues>> }) => (
                                    <FormControl>
                                      <Input {...field} value={String(field.value ?? '')}
                                        onChange={(e) => {
                                          const newValue = e.target.value; field.onChange(newValue);
                                          if ((param.fieldType === 'Numeric' || param.fieldType === 'Formula') && !param.isFormula) {
                                              let abnormal = false; const numValue = parseFloat(newValue);
                                              if (!isNaN(numValue)) {
                                                  const pLow = typeof param.rangeLow === 'number' ? param.rangeLow : null;
                                                  const pHigh = typeof param.rangeHigh === 'number' ? param.rangeHigh : null;
                                                  if ((pLow !== null && numValue < pLow) || (pHigh !== null && numValue > pHigh)) abnormal = true;
                                              }
                                              form.setValue(isAbnormalPath as any, abnormal, { shouldDirty: true });
                                          } else if (param.fieldType === 'Numeric Unbounded' && !param.isFormula) {
                                            // For Numeric Unbounded, abnormality is manual or based on more complex logic
                                          }
                                        }}
                                        placeholder={param.isFormula ? "Calculated" : "Enter value"}
                                        className={cn("text-sm", watchedIsAbnormal && !param.isFormula && "font-bold text-destructive border-destructive")}
                                        readOnly={isReportVerified || param.isFormula}
                                        type={(param.fieldType === 'Numeric' || param.fieldType === 'Numeric Unbounded') && !param.isFormula ? "number" : "text"}
                                        step={(param.fieldType === 'Numeric' || param.fieldType === 'Numeric Unbounded') ? "any" : undefined} />
                                    </FormControl>
                                  )} />
                            )}
                            <span className="text-sm text-muted-foreground">{param.units || 'N/A'}</span>
                            <span className="text-sm text-muted-foreground">{param.referenceRange || 'N/A'}</span>
                            <Controller control={form.control} name={isAbnormalPath as any}
                              render={({ field }: { field: ControllerRenderProps<EditReportFormValues, FieldPath<EditReportFormValues>> }) => (
                                <FormControl>
                                  <Checkbox checked={Boolean(field.value ?? false)} onCheckedChange={field.onChange} disabled={isReportVerified || param.isFormula} className="mx-auto" />
                                </FormControl>
                              )} />
                          </div>
                        );
                      })}
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            );
          })}
        </Accordion>
        <Card className="shadow-md">
            <CardHeader><CardTitle>Overall Report Notes</CardTitle></CardHeader>
            <CardContent>
                <FormField control={form.control} name="overallNotes"
                    render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div>
                              <TiptapEditor
                                ref={field.ref}
                                content={String(field.value ?? '')}
                                onChange={field.onChange}
                                readOnly={isReportVerified}
                                className="min-h-[120px]"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                    )} />
            </CardContent>
        </Card>
        <CardFooter className="flex justify-end gap-3 border-t pt-6">
          <Button type="button" variant="outline" onClick={() => router.push('/reports')} disabled={isSaving || isVerifying}> Cancel </Button>
          {!isReportVerified && (
            <>
            <Button type="button" onClick={() => handleSave()} disabled={isSaving || isVerifying || (!form.formState.isDirty && !form.formState.isSubmitSuccessful) }> {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <Save className="mr-2 h-5 w-5" />} Save Changes </Button>
            <Button type="button" onClick={() => handleSave('Verified')} className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSaving || isVerifying}> {isVerifying ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <CheckCircle className="mr-2 h-5 w-5" />} Complete & Verify Report </Button>
            </>
          )}
           {isReportVerified && ( <Button type="button" variant="outline" onClick={() => router.push(`/reports/print/${reportId}`)}> Print Report </Button> )}
        </CardFooter>
      </form>
    </Form>
  );
}

    
      
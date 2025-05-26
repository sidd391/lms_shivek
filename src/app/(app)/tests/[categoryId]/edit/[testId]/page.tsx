
'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, type SubmitHandler, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription as FormDesc,
  FormField,
  FormItem,
  FormLabel as RHFFormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, TestTube, Loader2, PlusCircle, X, GripVertical, Sigma, Edit as EditIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label as UILabel } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';

const TiptapEditor = dynamic(() => import('@/components/ui/tiptap-editor'), {
  ssr: false,
  loading: () => <div className="p-2 border rounded-md bg-muted min-h-[150px] text-sm">Loading editor...</div>,
});
// Removed: import 'react-quill/dist/quill.snow.css';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const mockCategoryNames: Record<string, string> = {
  biochemistry: "Biochemistry", cardiology: "Cardiology", "clinical-pathology": "Clinical Pathology",
  haematology: "Haematology", hormones: "Hormones", microbiology: "Microbiology",
  radiology: "Radiology", serology: "Serology", "smear-tests": "Smear Tests", "general-panels": "General Panels",
};

const parameterFieldTypes = ['Numeric', 'Text', 'Option List', 'Formula', 'Group', 'Text Editor', 'Numeric Unbounded'] as const;
export type ParameterFieldType = typeof parameterFieldTypes[number];

const parameterFormSchema = z.object({
  dbId: z.number().optional().nullable(),
  parentId: z.number().optional().nullable(),
  _displayParentName: z.string().optional().nullable(),
  name: z.string().min(1, 'Parameter name is required.'),
  fieldType: z.enum(parameterFieldTypes),
  units: z.string().optional().nullable(),
  rangeLow: z.coerce.number().optional().nullable(),
  rangeHigh: z.coerce.number().optional().nullable(),
  rangeText: z.string().optional().nullable(),
  testMethod: z.string().optional().nullable(),
  isFormula: z.boolean().default(false).optional(),
  options: z.string().optional().nullable(),
  formulaString: z.string().optional().nullable(),
  order: z.number().optional(),
});
export type TestParameterFormValue = z.infer<typeof parameterFormSchema>;

const testFormSchema = z.object({
  name: z.string().min(3, 'Test name must be at least 3 characters.'),
  shortCode: z.string().min(1, 'Short code is required.').max(20, 'Short code too long.'),
  price: z.coerce.number().min(0, 'Price cannot be negative.'),
  turnAroundTime: z.string().min(1, 'Turnaround time is required.'),
  sampleType: z.string().min(1, 'Sample type is required.'),
  methodology: z.string().optional().nullable(),
  normalRange: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  parameters: z.array(parameterFormSchema).optional().default([]),
  categoryId: z.number().optional(),
});

type TestFormValues = z.infer<typeof testFormSchema>;

const NO_PARENT_VALUE = "__NO_PARENT__";

export default function EditTestPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const categoryId = params.categoryId as string;
  const testId = params.testId as string;
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoadingData, setIsLoadingData] = React.useState(true);
  const [categoryName, setCategoryName] = React.useState(mockCategoryNames[categoryId] || (categoryId.charAt(0).toUpperCase() + categoryId.slice(1).replace('-', ' ')));

  const [currentParameter, setCurrentParameter] = React.useState<Partial<TestParameterFormValue>>({
    name: '', fieldType: 'Numeric', units: '', rangeLow: null, rangeHigh: null, rangeText: '',
    testMethod: '', isFormula: false, options: null, formulaString: '', parentId: null, dbId: null, _displayParentName: null
  });
  const [currentParameterOptionsInput, setCurrentParameterOptionsInput] = React.useState('');
  const [currentParameterDefaultContent, setCurrentParameterDefaultContent] = React.useState('');
  const [selectedParentValueForDropdown, setSelectedParentValueForDropdown] = React.useState<string>(NO_PARENT_VALUE);

  const [isTemplateEditorOpen, setIsTemplateEditorOpen] = React.useState(false);
  const [editingTemplateForParamIndex, setEditingTemplateForParamIndex] = React.useState<number | null>(null);
  const [currentDialogEditorContent, setCurrentDialogEditorContent] = React.useState('');

  const form = useForm<TestFormValues>({
    resolver: zodResolver(testFormSchema),
    defaultValues: {
      name: '', shortCode: '', price: undefined, turnAroundTime: '', sampleType: '',
      methodology: '', normalRange: '', description: '', parameters: [],
    },
  });

  const { fields: parameterFields, append: appendParameter, remove: removeParameter, update: updateParameter } = useFieldArray({
    control: form.control, name: "parameters",
  });

  React.useEffect(() => {
    if (testId) {
      const fetchTestData = async () => {
        setIsLoadingData(true);
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
          toast({ title: "Authentication Error", description: "Please login.", variant: "destructive" });
          router.push('/'); setIsLoadingData(false); return;
        }
        try {
          const response = await fetch(`${BACKEND_API_URL}/tests/${testId}`, { headers: { 'Authorization': `Bearer ${authToken}` } });
          if (!response.ok) throw new Error('Failed to fetch test data.');
          const result = await response.json();
          if (result.success && result.data) {
            const testDataFromServer = result.data;

            const parsedParameters: TestParameterFormValue[] = (testDataFromServer.parameters || []).map((param: any) => {
              let displayParentName: string | null = null;
              if (param.parentId) {
                const parentParamDefinition = (testDataFromServer.parameters || []).find((p: any) => p.id === param.parentId);
                if (parentParamDefinition) {
                  displayParentName = parentParamDefinition.name;
                }
              }
              let optionsForForm = param.options;
              if (param.fieldType === 'Option List') {
                if (Array.isArray(param.options)) { 
                    optionsForForm = param.options.join('\n');
                } else if (typeof param.options === 'string') { 
                    try {
                        const parsed = JSON.parse(param.options);
                        if (Array.isArray(parsed)) optionsForForm = parsed.join('\n');
                    } catch (e) { /* keep as string if not valid JSON array */ }
                }
              }
              
              return {
                dbId: param.id,
                parentId: param.parentId,
                name: param.name,
                fieldType: param.fieldType,
                units: param.units,
                rangeLow: param.rangeLow !== null && param.rangeLow !== undefined ? parseFloat(String(param.rangeLow)) : null,
                rangeHigh: param.rangeHigh !== null && param.rangeHigh !== undefined ? parseFloat(String(param.rangeHigh)) : null,
                rangeText: param.rangeText,
                testMethod: param.testMethod,
                isFormula: param.isFormula ?? false,
                options: optionsForForm, // Store newline separated for OptionList, HTML for TextEditor
                formulaString: param.formulaString,
                order: param.order,
                _displayParentName: displayParentName
              };
            });

            form.reset({
              name: testDataFromServer.name || '', shortCode: testDataFromServer.shortCode || '',
              price: testDataFromServer.price !== null ? parseFloat(testDataFromServer.price) : undefined,
              turnAroundTime: testDataFromServer.turnAroundTime || '', sampleType: testDataFromServer.sampleType || '',
              methodology: testDataFromServer.methodology || '', normalRange: testDataFromServer.normalRange || '',
              description: testDataFromServer.description || '', parameters: parsedParameters, categoryId: testDataFromServer.categoryId,
            });

            if (testDataFromServer.category && testDataFromServer.category.name) setCategoryName(testDataFromServer.category.name);

            if (parsedParameters && parsedParameters.length > 0) {
              const firstParam = parsedParameters[0];
              setCurrentParameter({
                dbId: firstParam.dbId, parentId: firstParam.parentId, name: firstParam.name, fieldType: firstParam.fieldType,
                units: firstParam.units, rangeLow: firstParam.rangeLow, rangeHigh: firstParam.rangeHigh,
                rangeText: firstParam.rangeText, testMethod: firstParam.testMethod, isFormula: firstParam.isFormula,
                options: firstParam.options, formulaString: firstParam.formulaString, order: firstParam.order,
                _displayParentName: firstParam._displayParentName,
              });
              if (firstParam.fieldType === 'Text Editor' && typeof firstParam.options === 'string') setCurrentParameterDefaultContent(firstParam.options); else setCurrentParameterDefaultContent('');
              if (firstParam.fieldType === 'Option List' && typeof firstParam.options === 'string') setCurrentParameterOptionsInput(firstParam.options); else setCurrentParameterOptionsInput('');

              if (firstParam.parentId) {
                setSelectedParentValueForDropdown(firstParam.parentId.toString());
              } else {
                setSelectedParentValueForDropdown(NO_PARENT_VALUE);
              }
            } else {
              setCurrentParameter({ name: '', fieldType: 'Numeric', units: '', rangeLow: null, rangeHigh: null, rangeText: '', testMethod: '', isFormula: false, options: null, formulaString: '', parentId: null, dbId: null, _displayParentName: null });
              setCurrentParameterDefaultContent(''); setCurrentParameterOptionsInput(''); setSelectedParentValueForDropdown(NO_PARENT_VALUE);
            }
          } else {
            toast({ title: "Error", description: result.message || "Test data not found.", variant: "destructive" });
            router.push(`/tests/${categoryId}`);
          }
        } catch (error) {
          console.error('Error fetching test data:', error);
          toast({ title: "Error", description: "Could not load test data.", variant: "destructive" });
          router.push(`/tests/${categoryId}`);
        } finally { setIsLoadingData(false); }
      };
      fetchTestData();
    }
  }, [testId, categoryId, form, router, toast]);

  const handleCurrentParameterFieldTypeChange = React.useCallback((value: string) => {
    const newFieldType = value as ParameterFieldType;
    setCurrentParameter(prev => {
      const newCurrentParam = {
        ...prev,
        fieldType: newFieldType,
        isFormula: newFieldType === 'Formula',
        options: (newFieldType !== 'Option List' && newFieldType !== 'Text Editor') ? null : prev.options,
      };
      if (newFieldType === 'Text Editor') {
        setCurrentParameterDefaultContent(typeof newCurrentParam.options === 'string' ? newCurrentParam.options : '');
        setCurrentParameterOptionsInput('');
      } else if (newFieldType === 'Option List') {
        let optionsForInput = '';
        if (typeof newCurrentParam.options === 'string') {
            try { const parsed = JSON.parse(newCurrentParam.options); if (Array.isArray(parsed)) { optionsForInput = parsed.join('\n'); }
            } catch (e) {  optionsForInput = newCurrentParam.options; }
        }
        setCurrentParameterOptionsInput(optionsForInput);
        setCurrentParameterDefaultContent('');
      } else {
        setCurrentParameterDefaultContent(''); setCurrentParameterOptionsInput('');
      }
      return newCurrentParam;
    });
  }, []);

  const handleParentParameterChange = React.useCallback((value: string) => {
    setSelectedParentValueForDropdown(value);
    let parentIdToSet: number | null = null;
    let parentNameForDisplay: string | null = null;

    if (value === NO_PARENT_VALUE) {
      parentIdToSet = null; parentNameForDisplay = null;
    } else if (value.startsWith('temp-')) {
      const tempIdKey = value;
      const parentParamInForm = parameterFields.find(p => `temp-${(p as any).id}` === tempIdKey);
      if (parentParamInForm) parentNameForDisplay = parentParamInForm.name;
      parentIdToSet = null; 
    } else {
      const numericId = parseInt(value, 10);
      if (!isNaN(numericId)) {
        parentIdToSet = numericId;
        const parentParamInForm = parameterFields.find(p => p.dbId === numericId);
        if (parentParamInForm) parentNameForDisplay = parentParamInForm.name;
      }
    }
    setCurrentParameter(prev => ({ ...prev, parentId: parentIdToSet, _displayParentName: parentNameForDisplay }));
  }, [parameterFields]);

  const handleAddParameter = () => {
    if (!currentParameter.name || !currentParameter.fieldType) {
      toast({ title: "Parameter Incomplete", description: "Parameter Name and Field Type are required.", variant: "destructive"}); return;
    }
    if (currentParameter.fieldType === 'Formula' && !currentParameter.formulaString?.trim()) {
      toast({ title: "Formula Required", description: "Please enter the formula string for this parameter.", variant: "destructive"}); return;
    }
    let paramOptionsValue: string | null = null;
    if (currentParameter.fieldType === 'Option List') {
      if (currentParameterOptionsInput.trim()) {
        const parsedOptionsList = currentParameterOptionsInput.split('\n').map(opt => opt.trim()).filter(opt => opt);
        if (parsedOptionsList.length === 0) { toast({ title: "Options Required", description: "Please enter valid options for 'Option List' type.", variant: "destructive"}); return; }
        paramOptionsValue = JSON.stringify(parsedOptionsList);
      } else { toast({ title: "Options Required", description: "Please enter options for 'Option List' type.", variant: "destructive"}); return; }
    } else if (currentParameter.fieldType === 'Text Editor') {
      paramOptionsValue = currentParameterDefaultContent;
    }

    let finalRangeText = currentParameter.rangeText ?? '';
    const isGroup = currentParameter.fieldType === 'Group';
    const isTextEditor = currentParameter.fieldType === 'Text Editor';
    const isNumericUnbounded = currentParameter.fieldType === 'Numeric Unbounded';
    const isFormula = currentParameter.fieldType === 'Formula';

    const noUnitsForType = isGroup || isTextEditor;
    const noNumericRangesForType = isGroup || isTextEditor || isNumericUnbounded || currentParameter.fieldType === 'Text' || currentParameter.fieldType === 'Option List';
    const noTestMethodForType = isGroup || isTextEditor; // Formula can have test method

    if (!noNumericRangesForType && finalRangeText.trim() === '' && typeof currentParameter.rangeLow === 'number' && typeof currentParameter.rangeHigh === 'number') {
      finalRangeText = `${currentParameter.rangeLow} - ${currentParameter.rangeHigh}`;
    }

    let actualParentIdForNewParam = currentParameter.parentId;
    let displayParentNameForNewParam = currentParameter._displayParentName;

    if (selectedParentValueForDropdown && selectedParentValueForDropdown.startsWith('temp-')) {
        const tempParentIdKey = selectedParentValueForDropdown;
        const parentParamInForm = parameterFields.find(p => `temp-${(p as any).id}` === tempParentIdKey);
        if (parentParamInForm) displayParentNameForNewParam = parentParamInForm.name;
        actualParentIdForNewParam = null; 
    } else if (selectedParentValueForDropdown && selectedParentValueForDropdown !== NO_PARENT_VALUE) {
        const numericId = parseInt(selectedParentValueForDropdown, 10);
        if (!isNaN(numericId)) actualParentIdForNewParam = numericId;
        // Re-confirm display name from current list if ID is chosen
        const parentParamInForm = parameterFields.find(p => p.dbId === numericId);
        if (parentParamInForm) displayParentNameForNewParam = parentParamInForm.name;
    }


    const newParamToAdd: TestParameterFormValue = {
      dbId: currentParameter.dbId || null, name: currentParameter.name!, fieldType: currentParameter.fieldType!,
      units: noUnitsForType ? null : currentParameter.units,
      rangeLow: noNumericRangesForType ? null : currentParameter.rangeLow,
      rangeHigh: noNumericRangesForType ? null : currentParameter.rangeHigh,
      rangeText: (isGroup || isTextEditor || (!isFormula && currentParameter.fieldType !== 'Text' && currentParameter.fieldType !== 'Numeric' && currentParameter.fieldType !== 'Numeric Unbounded')) ? null : finalRangeText,
      testMethod: noTestMethodForType ? null : currentParameter.testMethod,
      isFormula: isFormula,
      options: paramOptionsValue,
      formulaString: isFormula ? currentParameter.formulaString : null,
      order: parameterFields.length + 1,
      parentId: actualParentIdForNewParam,
      _displayParentName: displayParentNameForNewParam,
    };
    appendParameter(newParamToAdd);
    setCurrentParameter({ name: '', fieldType: 'Numeric', units: '', rangeLow: null, rangeHigh: null, rangeText: '', testMethod: '', isFormula: false, options: null, formulaString: '', parentId: null, dbId: null, _displayParentName: null });
    setCurrentParameterOptionsInput(''); setCurrentParameterDefaultContent(''); setSelectedParentValueForDropdown(NO_PARENT_VALUE);
  };

  const handleOpenTemplateEditor = (index: number) => {
    const param = parameterFields[index];
    if (param && param.fieldType === 'Text Editor') {
      setCurrentDialogEditorContent(typeof param.options === 'string' ? param.options : '');
      setEditingTemplateForParamIndex(index);
      setIsTemplateEditorOpen(true);
    }
  };

  const handleSaveTemplateFromDialog = () => {
    if (editingTemplateForParamIndex !== null && editingTemplateForParamIndex < parameterFields.length) {
      const fieldToUpdate = { ...parameterFields[editingTemplateForParamIndex], options: currentDialogEditorContent };
      updateParameter(editingTemplateForParamIndex, fieldToUpdate);
      toast({ title: "Template Updated", description: "Default content for the parameter has been updated in the form." });
    }
    setIsTemplateEditorOpen(false);
    setEditingTemplateForParamIndex(null);
  };

  const onSubmit: SubmitHandler<TestFormValues> = async (data) => {
    setIsSubmitting(true);
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      toast({ title: "Authentication Error", description: "Please login.", variant: "destructive" });
      setIsSubmitting(false); router.push('/'); return;
    }
    const parametersForBackend = data.parameters?.map(p => { const { _displayParentName, ...paramWithoutDisplay } = p; return paramWithoutDisplay; });
    const payload = { ...data, categoryId: parseInt(categoryId, 10), parameters: parametersForBackend };
    try {
      const response = await fetch(`${BACKEND_API_URL}/tests/${testId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        toast({ title: 'Test Updated', description: `The test "${result.data.name}" has been successfully updated.` });
        router.push(`/tests/${categoryId}`);
      } else {
        toast({ title: 'Failed to Update Test', description: result.message || (result.errors ? result.errors.join(', ') : 'An error occurred.'), variant: 'destructive' });
      }
    } catch (error: any) {
      console.error('Update test request error:', error);
      toast({ title: 'Network Error', description: 'Could not connect to the server.', variant: 'destructive' });
    } finally { setIsSubmitting(false); }
  };

  const isCurrentParamGroup = currentParameter.fieldType === 'Group';
  const isCurrentParamTextEditor = currentParameter.fieldType === 'Text Editor';
  const isCurrentParamNumericUnbounded = currentParameter.fieldType === 'Numeric Unbounded';
  const isCurrentParamFormula = currentParameter.fieldType === 'Formula';

  const showUnitsInput = !isCurrentParamGroup && !isCurrentParamTextEditor;
  const showNumericRangeInputs = currentParameter.fieldType === 'Numeric' || currentParameter.fieldType === 'Formula';
  const showTextualRangeInput = currentParameter.fieldType === 'Numeric Unbounded' || currentParameter.fieldType === 'Text' || currentParameter.fieldType === 'Numeric' || currentParameter.fieldType === 'Formula';
  const showTestMethodInput = !isCurrentParamGroup && !isCurrentParamTextEditor; // Formula can have test method
  const showOptionsInput = currentParameter.fieldType === 'Option List';
  const showFormulaStringInput = isCurrentParamFormula;


  const groupParametersForDropdown = parameterFields.filter((p): p is TestParameterFormValue & {id: string} => p.fieldType === 'Group');

  if (isLoadingData) {
    return (
      <div className="flex flex-col gap-6">
        <Card className="shadow-lg"><CardHeader><Skeleton className="h-8 w-3/5" /></CardHeader></Card>
        <Card className="shadow-md"> <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader> <CardContent className="space-y-6"> {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)} <Skeleton className="h-20 w-full" /> </CardContent> </Card>
        <CardFooter className="flex justify-end gap-4 pt-6 border-t"> <Skeleton className="h-10 w-24" /> <Skeleton className="h-10 w-32" /> </CardFooter>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" onClick={() => router.push(`/tests/${categoryId}`)} aria-label="Go back to tests list" disabled={isSubmitting}> <ArrowLeft className="h-5 w-5" /> </Button>
                <div> <CardTitle className="text-3xl font-bold flex items-center"> <EditIcon className="mr-3 h-8 w-8 text-primary" /> Edit Test </CardTitle> <CardDescription>Update details for test "{form.getValues('name') || `ID: ${testId}`}" in category "{categoryName}".</CardDescription> </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><RHFFormLabel>Test Name *</RHFFormLabel><FormControl><Input placeholder="e.g., Complete Blood Count" {...field} className="text-base"/></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="shortCode" render={({ field }) => ( <FormItem><RHFFormLabel>Short Code / Abbreviation *</RHFFormLabel><FormControl><Input placeholder="e.g., CBC, FBS" {...field} className="text-base"/></FormControl><FormDesc>Used in formulas. Keep it simple, e.g., HGB, RBC.</FormDesc><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField control={form.control} name="price" render={({ field }) => ( <FormItem><RHFFormLabel>Price (₹) *</RHFFormLabel><FormControl><Input type="number" placeholder="e.g., 350" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)} className="text-base"/></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="turnAroundTime" render={({ field }) => ( <FormItem><RHFFormLabel>Turnaround Time (TAT) *</RHFFormLabel><FormControl><Input placeholder="e.g., 24 hours, 3-5 days" {...field} className="text-base"/></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="sampleType" render={({ field }) => ( <FormItem><RHFFormLabel>Sample Type *</RHFFormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="text-base"><SelectValue placeholder="Select sample type" /></SelectTrigger></FormControl><SelectContent>{['Blood', 'Serum', 'Plasma', 'Urine', 'Stool', 'Swab', 'Biopsy', 'CSF (Cerebrospinal Fluid)', 'Other', 'N/A (e.g. for imaging)'].map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="methodology" render={({ field }) => ( <FormItem><RHFFormLabel>Methodology</RHFFormLabel><FormControl><Input placeholder="e.g., Spectrophotometry, ELISA" {...field} value={field.value ?? ''} className="text-base"/></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="normalRange" render={({ field }) => ( <FormItem><RHFFormLabel>General Normal Range</RHFFormLabel><FormControl><Input placeholder="e.g., 70-110 mg/dL (overall range)" {...field} value={field.value ?? ''} className="text-base"/></FormControl><FormDesc>Overall test range. Specific parameter ranges below.</FormDesc><FormMessage /></FormItem>)} />
              </div>
              <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><RHFFormLabel>Description / Clinical Significance</RHFFormLabel><FormControl><Textarea placeholder="Briefly describe the test and its use..." className="min-h-[100px] text-base" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader> <CardTitle className="text-xl font-semibold">Test Parameters / Fields</CardTitle> <CardDescription>Define the individual components or results reported for this test.</CardDescription> </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 border rounded-lg space-y-4 bg-muted/30">
                <h4 className="text-md font-medium">Add / Edit Parameter</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormItem> <UILabel>Parameter Name *</UILabel> <Input value={currentParameter.name ?? ''} onChange={(e) => setCurrentParameter(prev => ({...prev, name: e.target.value}))} placeholder="e.g., Hemoglobin" /> </FormItem>
                  <FormItem> <UILabel>Field Type *</UILabel>
                    <Select value={currentParameter.fieldType} onValueChange={handleCurrentParameterFieldTypeChange}>
                      <SelectTrigger><SelectValue placeholder="Select field type" /></SelectTrigger>
                      <SelectContent>{parameterFieldTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                    </Select>
                  </FormItem>
                   <FormItem> <UILabel>Parent Parameter (for grouping)</UILabel>
                    <Select value={selectedParentValueForDropdown} onValueChange={handleParentParameterChange}>
                      <SelectTrigger><SelectValue placeholder="Select parent (if any)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_PARENT_VALUE}>No Parent (Top-Level)</SelectItem>
                        {groupParametersForDropdown.map((groupParam: TestParameterFormValue & { id: string }) => (
                           <SelectItem
                             key={groupParam.id}
                             value={groupParam.dbId ? groupParam.dbId.toString() : `temp-${groupParam.id}`}
                           >
                             {groupParam.name} (Group{groupParam.dbId ? '' : ' - Unsaved'})
                           </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                </div>
                {isCurrentParamTextEditor && (
                  <div key={`quill-wrapper-for-${currentParameter.fieldType}-${currentParameter.name}`}>
                    <FormItem className="col-span-full">
                      <UILabel>Default Content / Template</UILabel>
                        <TiptapEditor
                            content={currentParameterDefaultContent || ''}
                            onChange={setCurrentParameterDefaultContent}
                            className="bg-background rounded-md border border-input min-h-[150px]"
                        />
                      <FormDesc className="text-xs">This content will be used as a template in reports.</FormDesc>
                    </FormItem>
                  </div>
                )}
                {showUnitsInput && (
                    <FormItem> <UILabel>Units</UILabel> <Input value={currentParameter.units ?? ''} onChange={(e) => setCurrentParameter(prev => ({...prev, units: e.target.value}))} placeholder="e.g., g/dL, mg/dL" /> </FormItem>
                )}
                {showNumericRangeInputs && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end pt-2">
                      <FormItem> <UILabel>Range - Min</UILabel> <Input type="number" step="any" value={currentParameter.rangeLow ?? ''} onChange={(e) => setCurrentParameter(prev => ({...prev, rangeLow: e.target.value === '' ? null : parseFloat(e.target.value) }))} placeholder="Minimum value"/> </FormItem>
                      <FormItem> <UILabel>Range - Max</UILabel> <Input type="number" step="any" value={currentParameter.rangeHigh ?? ''} onChange={(e) => setCurrentParameter(prev => ({...prev, rangeHigh: e.target.value === '' ? null : parseFloat(e.target.value) }))} placeholder="Maximum value"/> </FormItem>
                  </div>
                )}
                {showTextualRangeInput && currentParameter.fieldType === 'Text' && (
                     <FormItem> <UILabel>Expected Value / Textual Range</UILabel> <Input value={currentParameter.rangeText ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentParameter(prev => ({...prev, rangeText: e.target.value}))} placeholder="e.g., < 150, Negative, Normal"/> <FormDesc className="text-xs">Use if Min/Max not applicable or for descriptive ranges.</FormDesc></FormItem>
                )}
                 {showTextualRangeInput && (currentParameter.fieldType === 'Numeric' || currentParameter.fieldType === 'Formula' || currentParameter.fieldType === 'Numeric Unbounded') && (
                     <FormItem> <UILabel>Textual Range / Display Range</UILabel> <Input value={currentParameter.rangeText ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentParameter(prev => ({...prev, rangeText: e.target.value}))} placeholder="e.g., 10 - 20 mg/dL or < 150"/> <FormDesc className="text-xs">Overrides Min/Max display if set. For Numeric Unbounded, this is the primary range.</FormDesc></FormItem>
                )}
                {showTestMethodInput && (
                     <FormItem> <UILabel>Test Method</UILabel> <Input value={currentParameter.testMethod ?? ''} onChange={(e) => setCurrentParameter(prev => ({...prev, testMethod: e.target.value}))} placeholder="e.g., HPLC" /> </FormItem>
                )}
                {showOptionsInput && (
                     <FormItem> <UILabel>Options (one per line) *</UILabel> <Textarea value={currentParameterOptionsInput} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCurrentParameterOptionsInput(e.target.value)} placeholder="Option A\nOption B\nOption C"/> </FormItem>
                )}
                {showFormulaStringInput && (
                    <FormItem>
                      <UILabel className="flex items-center"> <Sigma className="mr-1.5 h-4 w-4" /> Formula String * </UILabel>
                      <Input value={currentParameter.formulaString ?? ''} onChange={(e) => setCurrentParameter(prev => ({...prev, formulaString: e.target.value}))} placeholder="e.g., (PARAM_NAME_1 / PARAM_NAME_2) * 10" />
                      <FormDesc className="text-xs">Define calculation using other parameter <strong className="font-semibold">Names</strong> (e.g., (Total Leucocyte Count *  Neutrophils)/100).</FormDesc>
                    </FormItem>
                )}
                <Button type="button" onClick={handleAddParameter} variant="outline" size="sm"> <PlusCircle className="mr-2 h-4 w-4" /> Add Parameter to Test </Button>
              </div>
              {parameterFields.length > 0 && (
                <div className="space-y-3 mt-6">
                  <h4 className="text-md font-medium">Current Parameters ({parameterFields.length})</h4>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr_1fr_1fr_auto] items-center p-2 bg-muted text-sm font-medium">
                        <span className="px-2"><GripVertical className="h-4 w-4 text-muted-foreground" /></span>
                        <span>Name</span> <span>Parent Group</span> <span>Type</span> <span>Units/Formula/Default</span> <span>Range</span> <span>Method</span> <span>Order</span> <span>Action</span>
                    </div>
                    {parameterFields.map((field, index) => {
                       const displayParentName = field._displayParentName || 'N/A';
                       let unitsOrFormulaDisplay = field.units ?? '';
                       if (field.fieldType === 'Formula') unitsOrFormulaDisplay = field.formulaString ?? 'N/A';
                       else if (field.fieldType === 'Text Editor') {
                         unitsOrFormulaDisplay = field.options && typeof field.options === 'string' && field.options.trim() !== '' && field.options.trim() !== '<p></p>' ? "[Has Default Content]" : "[No Default]";
                       }
                       else if (['Group', 'Numeric Unbounded', 'Text', 'Option List'].includes(field.fieldType) && field.fieldType !== 'Numeric') unitsOrFormulaDisplay = 'N/A';

                       let rangeDisplay = field.rangeText ?? '';
                       if (!rangeDisplay && typeof field.rangeLow === 'number' && typeof field.rangeHigh === 'number') rangeDisplay = `${field.rangeLow} - ${field.rangeHigh}`;
                       else if (!rangeDisplay && (field.fieldType === 'Numeric' || field.fieldType === 'Formula')) rangeDisplay = 'N/A';
                       if(['Group', 'Text Editor', 'Text', 'Option List'].includes(field.fieldType)) rangeDisplay = 'N/A';
                       if(field.fieldType === 'Numeric Unbounded') rangeDisplay = field.rangeText || 'N/A';


                      const methodDisplay = (['Group', 'Text Editor', 'Formula'].includes(field.fieldType)) ? 'N/A' : field.testMethod || 'N/A';

                      return (
                        <div key={field.id} className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr_1fr_1fr_auto] items-center p-2 border-t gap-2">
                          <span className="px-2"><GripVertical className="h-4 w-4 text-muted-foreground" /></span>
                          <Controller control={form.control} name={`parameters.${index}.name` as const} render={({ field: controllerField }) => <Input {...controllerField} className="text-xs h-8" />} />
                           <span className="text-xs px-1 h-8 flex items-center">{displayParentName}</span>
                          <Controller control={form.control} name={`parameters.${index}.fieldType` as const} render={({ field: controllerField }) => (
                              <Select onValueChange={(value) => {
                                  controllerField.onChange(value); const newParams = [...form.getValues('parameters')];
                                  const targetParam = newParams[index];
                                  targetParam.fieldType = value as ParameterFieldType;
                                  if (value !== 'Formula') targetParam.isFormula = false; else targetParam.isFormula = true;
                                  if (value !== 'Option List' && value !== 'Text Editor') targetParam.options = null;

                                  const nonApplicableForUnits = ['Group', 'Text Editor'];
                                  const nonApplicableForNumericRanges = ['Group', 'Text Editor', 'Numeric Unbounded', 'Text', 'Option List'];
                                  const nonApplicableForTestMethod = ['Group', 'Text Editor']; // Formula can have test method

                                  if (nonApplicableForUnits.includes(value)) targetParam.units = null;
                                  if (nonApplicableForNumericRanges.includes(value)) {targetParam.rangeLow = null; targetParam.rangeHigh = null; }
                                  if (value !== 'Numeric Unbounded' && value !== 'Text' && value !== 'Numeric' && value !== 'Formula' ) targetParam.rangeText = null;
                                  if (nonApplicableForTestMethod.includes(value)) targetParam.testMethod = null;
                                  if (value !== 'Formula') targetParam.formulaString = null;

                                  updateParameter(index, targetParam);
                                }} value={controllerField.value} >
                                  <SelectTrigger className="text-xs h-8"><SelectValue /></SelectTrigger>
                                  <SelectContent>{parameterFieldTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                              </Select>
                          )} />
                          <div className="text-xs px-1 h-8 flex items-center truncate">
                            {field.fieldType === 'Text Editor' ? (
                                <Button
                                type="button"
                                variant="link"
                                size="sm"
                                className="p-0 h-auto text-xs"
                                onClick={() => handleOpenTemplateEditor(index)}
                                >
                                {field.options && typeof field.options === 'string' && field.options.trim() !== '' && field.options.trim() !== '<p></p>'
                                    ? 'View/Edit Template'
                                    : 'Set Default Template'}
                                </Button>
                            ) : (
                                <span title={unitsOrFormulaDisplay}>{unitsOrFormulaDisplay}</span>
                            )}
                          </div>
                          <span className="text-xs px-1 h-8 flex items-center truncate" title={rangeDisplay}>{rangeDisplay}</span>
                          <span className="text-xs px-1 h-8 flex items-center truncate" title={methodDisplay}>{methodDisplay}</span>
                           <Controller control={form.control} name={`parameters.${index}.order` as const} render={({ field: controllerField }) => <Input type="number" {...controllerField} value={controllerField.value ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => controllerField.onChange(e.target.value === '' ? null : +e.target.value)} className="text-xs h-8 w-16 text-center" />} />
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeParameter(index)} className="h-8 w-8 text-destructive"> <X className="h-4 w-4" /> </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
               {parameterFields.length === 0 && ( <p className="text-sm text-muted-foreground text-center py-4">No parameters added yet. Use the form above to add them.</p> )}
            </CardContent>
          </Card>
          <CardFooter className="flex justify-end gap-3 border-t pt-6">
            <Button type="button" variant="outline" onClick={() => router.push(`/tests/${categoryId}`)} disabled={isSubmitting}> Cancel </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting || !form.formState.isDirty}> {isSubmitting ? ( <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Updating...</> ) : ( <><Save className="mr-2 h-5 w-5" />Update Test</> )} </Button>
          </CardFooter>
        </form>
      </Form>
      <Dialog open={isTemplateEditorOpen} onOpenChange={(isOpen) => {
        if (!isOpen) {
          setEditingTemplateForParamIndex(null);
        }
        setIsTemplateEditorOpen(isOpen);
      }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Default Content for Text Editor Parameter</DialogTitle>
            <DialogDescription>
              Define the default HTML template for the parameter: {editingTemplateForParamIndex !== null && parameterFields[editingTemplateForParamIndex] ? parameterFields[editingTemplateForParamIndex].name : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isTemplateEditorOpen && editingTemplateForParamIndex !== null && (
              <TiptapEditor
                key={`dialog-editor-edit-${editingTemplateForParamIndex}`}
                content={currentDialogEditorContent}
                onChange={setCurrentDialogEditorContent}
                className="min-h-[300px] border-input"
              />
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
              setIsTemplateEditorOpen(false);
              setEditingTemplateForParamIndex(null);
            }}>Cancel</Button>
            <Button type="button" onClick={handleSaveTemplateFromDialog}>Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    
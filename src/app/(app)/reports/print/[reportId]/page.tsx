
'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Loader2, Sigma } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { ReportStatusType } from '@/backend/models/Report';
import { cn } from '@/lib/utils';
import type { TestParameterFieldType as BackendParameterFieldType } from '@/backend/models/TestParameter'; // Use backend type

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const LAB_NAME_SETTING_KEY = 'LAB_NAME';
const LAB_ADDRESS_SETTING_KEY = 'LAB_ADDRESS';
const DEFAULT_LAB_NAME = 'QuantumHook Diagnostics';
const DEFAULT_LAB_ADDRESS = '123 Lab Lane, Science City, ST 54321\nPhone: (555) 123-4567 | Email: contact@quantumhook.dev';


interface PatientInfo {
  id?: number;
  patientId?: string;
  fullName?: string;
  age?: number;
  gender?: string;
  title?: string;
  firstName?: string;
  lastName?: string;
}

interface DoctorInfo {
  id?: number;
  fullName?: string;
  specialty?: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  doctorID?: string;
}

interface BillInfo {
  id?: number;
  billNumber?: string;
}

interface ReportParameterResultPrint {
  id?: number;
  testParameterId: number;
  resultValue?: string | null;
  isAbnormal?: boolean | null;
  notes?: string | null;
}

interface TestParameterPrint {
  id: number; // This is TestParameter.id from DB
  name: string;
  fieldType: BackendParameterFieldType; // Use backend's definition
  units?: string | null;
  rangeText?: string | null;
  rangeLow?: number | null;
  rangeHigh?: number | null;
  options?: string[] | string | null; // string for Text Editor default HTML, string[] for Option List
  isFormula?: boolean;
  formulaString?: string | null;
  parentId?: number | null;
  testMethod?: string | null;
}


interface TestDetailsPrint {
  id: number; // This is Test.id from DB
  name: string;
  parameters?: TestParameterPrint[];
}

interface ReportItemPrint {
  id: number; // This is ReportItem.id from DB
  itemName: string;
  itemType: 'Test' | 'Package';
  originalItemId: number | null; // This is Test.id or TestPackage.id
  testDetails?: TestDetailsPrint | null;
}

interface FullReportPrintData {
  id: number;
  reportIdNumber: string;
  reportDate: string;
  status: ReportStatusType;
  notes?: string | null; // Overall report notes (can be HTML)
  patient?: PatientInfo;
  doctor?: DoctorInfo;
  bill?: BillInfo;
  items?: ReportItemPrint[];
  parameterResults?: ReportParameterResultPrint[];
}

export default function PrintReportPage() {
  const router = useRouter();
  const params = useParams();
  const reportId = params.reportId as string;
  const [reportData, setReportData] = React.useState<FullReportPrintData | null>(null);
  const [labName, setLabName] = React.useState(DEFAULT_LAB_NAME);
  const [labAddress, setLabAddress] = React.useState(DEFAULT_LAB_ADDRESS);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const printTriggered = React.useRef(false);
  const [authToken, setAuthToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    setAuthToken(localStorage.getItem('authToken'));
  }, []);

  React.useEffect(() => {
    if (reportId && authToken) {
      const fetchReportAndLabSettings = async () => {
        setIsLoading(true);
        setError(null);

        if (!authToken) {
          setError("Authentication required. Please log in.");
          setIsLoading(false);
          return;
        }

        try {
          try {
             const [labNameResponse, labAddressResponse] = await Promise.all([
              fetch(`${BACKEND_API_URL}/settings/${LAB_NAME_SETTING_KEY}`, {
                headers: { 'Authorization': `Bearer ${authToken}` },
              }),
              fetch(`${BACKEND_API_URL}/settings/${LAB_ADDRESS_SETTING_KEY}`, {
                headers: { 'Authorization': `Bearer ${authToken}` },
              })
            ]);

            if (labNameResponse.ok) {
              const labNameResult = await labNameResponse.json();
              if (labNameResult.success && labNameResult.data?.value) {
                setLabName(labNameResult.data.value);
              }
            }
             if (labAddressResponse.ok) {
              const labAddressResult = await labAddressResponse.json();
              console.log("PRINT PAGE: Fetched Lab Address Setting:", labAddressResult); 
              if (labAddressResult.success && labAddressResult.data?.value) {
                setLabAddress(labAddressResult.data.value);
                console.log("PRINT PAGE: Lab Address State Updated To:", labAddressResult.data.value); 
              } else {
                console.log("PRINT PAGE: Lab Address not updated from fetch, using default. Reason:", labAddressResult.message || "No value returned"); 
                setLabAddress(DEFAULT_LAB_ADDRESS);
              }
            } else {
                console.error("PRINT PAGE: Failed to fetch lab address setting, status:", labAddressResponse.status); 
                setLabAddress(DEFAULT_LAB_ADDRESS);
            }
          } catch (labSettingsError) {
            console.warn("PRINT PAGE: Could not fetch custom lab settings, using defaults:", labSettingsError);
            setLabName(DEFAULT_LAB_NAME);
            setLabAddress(DEFAULT_LAB_ADDRESS);
          }

          const response = await fetch(`${BACKEND_API_URL}/reports/${reportId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
          });
          if (!response.ok) {
            const errData = await response.json().catch(() => ({ message: 'Failed to fetch report data' }));
            throw new Error(errData.message || `Error ${response.status}`);
          }
          const result = await response.json();
          if (result.success && result.data) {
            const fetchedReport = result.data as FullReportPrintData;
            if (fetchedReport.patient && !fetchedReport.patient.fullName && fetchedReport.patient.firstName && fetchedReport.patient.lastName) {
                fetchedReport.patient.fullName = `${fetchedReport.patient.title || ''} ${fetchedReport.patient.firstName} ${fetchedReport.patient.lastName}`.trim();
            }
             if (fetchedReport.doctor && !fetchedReport.doctor.fullName && fetchedReport.doctor.firstName && fetchedReport.doctor.lastName) {
                fetchedReport.doctor.fullName = `${fetchedReport.doctor.title || ''} ${fetchedReport.doctor.firstName} ${fetchedReport.doctor.lastName}`.trim();
            }
            setReportData(fetchedReport);
          } else {
            throw new Error(result.message || 'Report data not found.');
          }
        } catch (err: any) {
          console.error('Error fetching report for printing:', err);
          setError(err.message || 'Could not load report data for printing.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchReportAndLabSettings();
    }
  }, [reportId, authToken]);

  React.useEffect(() => {
    if (reportData && !isLoading && !error && !printTriggered.current) {
      const timer = setTimeout(() => {
        window.print();
        printTriggered.current = true;
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [reportData, isLoading, error]);

  const getParameterResult = (paramId: number) => {
    return reportData?.parameterResults?.find(pr => pr.testParameterId === paramId);
  };

  const getFlag = (param: TestParameterPrint, resultValueStr?: string | null): string => {
    if (!param || resultValueStr === null || resultValueStr === undefined || String(resultValueStr).trim() === '' || param.isFormula || param.fieldType === 'Formula' || param.fieldType === 'Group' || param.fieldType === 'Text Editor' || param.fieldType === 'Numeric Unbounded') return '';

    const paramResult = getParameterResult(param.id);
    if (paramResult?.isAbnormal) return '*';

    const resultValue = parseFloat(String(resultValueStr));
    if (isNaN(resultValue)) return '';

    const low = param.rangeLow;
    const high = param.rangeHigh;

    if (typeof low === 'number' && typeof high === 'number') {
      if (resultValue < low) return 'L';
      if (resultValue > high) return 'H';
    }
    return '';
  };

  if (isLoading) {
    return (
      <div className="print-container p-8 space-y-6">
        <div className="flex justify-between items-center print-hide-controls mb-6">
          <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
          <h1 className="text-2xl font-bold text-primary">Loading Report...</h1>
          <Button onClick={() => window.print()} disabled><Printer className="mr-2 h-4 w-4" /> Print</Button>
        </div>
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="print-container p-8 text-center">
        <div className="print-hide-controls mb-6 flex justify-start">
            <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
        </div>
        <h2 className="text-xl font-semibold text-destructive mb-2">Error Loading Report</h2>
        <p className="text-destructive-foreground">{error}</p>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="print-container p-8 text-center">
         <div className="print-hide-controls mb-6 flex justify-start">
            <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
        </div>
        <p>Report data could not be loaded.</p>
      </div>
    );
  }

  return (
    <div className="print-container bg-white text-black p-4 sm:p-6 md:p-8 print:p-2">
      <div className="print-hide-controls mb-6 flex justify-between items-center">
        <Button variant="outline" onClick={() => router.back()} size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        {/* The "QuantumHook LMS" title is removed as it's handled by browser default print settings */}
        <Button onClick={() => window.print()} size="sm">
          <Printer className="mr-2 h-4 w-4" /> Print
        </Button>
      </div>

      {/* No digital letterhead elements (logo, lab name/address) will be rendered here */}
      
      {/* Patient and Report Info Section - will be printed */}
      <section className="py-3 text-sm"> 
        <h2 className="text-xl font-bold text-center mb-4">LABORATORY TEST REPORT</h2>
        <table className="w-full">
          <tbody>
            <tr>
              <td className="w-1/2 pr-2 align-top">
                <p><strong>Patient Name:</strong> {reportData.patient?.fullName || `${reportData.patient?.title || ''} ${reportData.patient?.firstName || ''} ${reportData.patient?.lastName || ''}`.trim() || 'N/A'}</p>
                <p><strong>Patient ID:</strong> {reportData.patient?.patientId || `DB_ID: ${reportData.patient?.id || 'N/A'}`}</p>
                <p><strong>Age/Gender:</strong> {reportData.patient?.age || 'N/A'} / {reportData.patient?.gender || 'N/A'}</p>
              </td>
              <td className="w-1/2 pl-2 align-top">
                <p><strong>Report ID:</strong> {reportData.reportIdNumber}</p>
                <p><strong>Bill No:</strong> {reportData.bill?.billNumber || 'N/A'}</p>
                <p><strong>Report Date:</strong> {format(new Date(reportData.reportDate), 'PPPpp')}</p>
                {reportData.doctor && <p><strong>Referred By:</strong> Dr. {reportData.doctor.fullName || `${reportData.doctor?.title || ''} ${reportData.doctor?.firstName || ''} ${reportData.doctor?.lastName || ''}`.trim() || 'N/A'}</p>}
              </td>
            </tr>
          </tbody>
        </table>
      </section>
      <hr className="border-gray-300 mb-2"/>

      <main className="py-2 flex-grow document-content">
        {reportData.items?.map((item, index) => {
          const tabularParameters = item.testDetails?.parameters?.filter(p => p.fieldType !== 'Group' && p.fieldType !== 'Text Editor') || [];
          const nonTabularParameters = item.testDetails?.parameters?.filter(p => p.fieldType === 'Group' || p.fieldType === 'Text Editor') || [];

          return (
            <div key={`test-section-${item.testDetails?.id || item.originalItemId || item.id}-${index}`} className="mb-6 last:mb-0 test-section">
              <h3 className="text-lg font-bold bg-gray-100 print:bg-transparent p-2 rounded-t-md -mx-2 print:-mx-0 text-center">
                {item.itemName} {item.itemType === 'Package' && !item.testDetails && <Badge variant="secondary" className="ml-2 align-middle">Package</Badge>}
              </h3>

              {nonTabularParameters.map(param => {
                if (!param || param.id === undefined || param.id === null) return null;
                const resultEntry = getParameterResult(param.id);
                const isParamActuallyAbnormal = resultEntry?.isAbnormal;

                if (param.fieldType === 'Group') {
                  return (
                    <div key={`param-group-${param.id}-${item.testDetails?.id}`} className="mt-3 mb-1">
                      <h4 className="text-md font-semibold text-gray-700 print:text-gray-700 underline">{param.name}</h4>
                    </div>
                  );
                }
                if (param.fieldType === 'Text Editor') {
                  return (
                    <div key={`param-text-editor-${param.id}-${item.testDetails?.id}`} className="mt-2 mb-4">
                      <h4 className="text-md font-semibold">{param.name}:</h4>
                      <div
                        className={cn("text-editor-content whitespace-pre-wrap print:text-xs", isParamActuallyAbnormal && 'text-red-600 print:text-red-600')}
                        dangerouslySetInnerHTML={{ __html: resultEntry?.resultValue || param.options || 'N/A' }}
                      />
                    </div>
                  );
                }
                return null;
              })}

              {tabularParameters.length > 0 && (
                <table className="w-full text-sm border-collapse mt-2">
                  <thead>
                    <tr className="bg-gray-50 print:bg-transparent">
                      <th className="text-left p-1.5 border">Parameter</th>
                      <th className="text-center p-1.5 border">Result</th>
                      <th className="text-center p-1.5 border print:hidden">Flag</th>
                      <th className="text-left p-1.5 border">Units</th>
                      <th className="text-left p-1.5 border">Reference Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tabularParameters.map(param => {
                      if (!param || param.id === undefined || param.id === null) return null;
                      const resultEntry = getParameterResult(param.id);
                      const flag = getFlag(param, resultEntry?.resultValue);
                      const isParamActuallyAbnormal = resultEntry?.isAbnormal || (flag === 'L' || flag === 'H' || flag === '*');

                      return (
                        <tr key={`param-${param.id}-${item.testDetails?.id}`} className={cn(isParamActuallyAbnormal && 'font-semibold')}>
                          <td className={cn("p-1.5 border", param.parentId && "pl-6 print:pl-4")}>
                            {param.name} {param.fieldType === 'Formula' && <Sigma className="inline h-3 w-3 ml-1 text-blue-600" />}
                          </td>
                          <td className={cn("p-1.5 border text-center", isParamActuallyAbnormal && 'text-red-600 print:text-red-600 font-bold')}>
                            {resultEntry?.resultValue || 'N/A'}
                          </td>
                          <td className="p-1.5 border text-center print:hidden">
                            {flag && <Badge variant={isParamActuallyAbnormal ? "destructive" : "outline"} className="text-xs px-1 py-0.5">{flag}</Badge>}
                          </td>
                          <td className="p-1.5 border">{param.units || 'N/A'}</td>
                          <td className="p-1.5 border">{param.rangeText || (param.rangeLow !== null && param.rangeHigh !== null && typeof param.rangeLow === 'number' && typeof param.rangeHigh === 'number' ? `${param.rangeLow} - ${param.rangeHigh}` : 'N/A')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              {item.testDetails && tabularParameters.length === 0 && nonTabularParameters.length === 0 && (
                <p className="text-xs text-gray-600 p-2">No displayable parameters for this test in the report.</p>
              )}
            </div>
          );
        })}
      </main>

      {/* Conditionally render this section only if notes exist, and hide it for print */}
      {reportData.notes && (
        <section className="mb-6 border-t pt-4 print:hidden">
            <h3 className="text-md font-semibold mb-1">Overall Report Notes / Interpretation:</h3>
            <div className="text-sm whitespace-pre-wrap prose prose-sm max-w-none print:text-xs print:prose-xs text-editor-content" dangerouslySetInnerHTML={{ __html: reportData.notes }} />
        </section>
      )}

      {/* <footer className="mt-8 pt-4 border-t text-center text-xs text-gray-500 print:text-gray-500">
        <p>** End of Report **</p>
        <p className="mt-1">This report is for informational purposes only and should be interpreted by a qualified healthcare professional.</p>
        <p>Printed on: {format(new Date(), 'PPPpp')}</p>
      </footer> */}

      <style jsx global>{`
        @media print {
          html, body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important; /* Standard property */
            background: white !important; /* Ensure white background */
            font-size: 9pt; 
            color: black !important;
          }
          .print-hide-controls { display: none !important; }
          
          .print-container {
            padding: 1in 0.75in 0.75in 0.75in; /* Margins for content area on letterhead */
            width: auto !important; 
            min-height: auto !important;
            height: auto !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background-color: transparent !important; /* Ensure container itself has no bg */
          }

          .document-content {
             height: auto !important;
             overflow: visible !important;
          }
          
          section, .test-section, .text-editor-content { page-break-inside: auto; }
          
          table, .text-editor-content table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-top: 0.3em !important;
            margin-bottom: 0.3em !important;
            font-size: 8pt !important; 
            page-break-inside: auto !important;
            background-color: transparent !important;
          }
          th, td, .text-editor-content th, .text-editor-content td {
            border: 1px solid #888 !important; 
            padding: 3px 4px !important;
            text-align: left;
            vertical-align: top;
            word-wrap: break-word;
            overflow-wrap: break-word;
            background-color: transparent !important;
            color: black !important; /* Ensure text is black */
          }
          th, .text-editor-content th {
            font-weight: bold !important;
            background-color: transparent !important; /* No background for table headers */
          }
          .text-editor-content {
            overflow: visible !important;
            height: auto !important;
            max-width: none !important;
            page-break-inside: auto !important; 
            font-size: 8pt !important;
            line-height: 1.35 !important;
            background-color: transparent !important;
            color: black !important; /* Ensure rich text content is black */
          }
          .text-editor-content p,
          .text-editor-content div:not(table):not(th):not(td), 
          .text-editor-content ul,
          .text-editor-content ol,
          .text-editor-content li {
            font-size: 8pt !important;
            margin-top: 0.1em !important;
            margin-bottom: 0.1em !important;
            page-break-inside: auto !important; 
            line-height: 1.35 !important;
            background-color: transparent !important;
            color: black !important;
          }
           .text-editor-content ul, .text-editor-content ol {
             padding-left: 14px !important; 
          }
          
          .text-red-600 { color: #c00 !important; } /* Keep abnormal flags red */
          hr { border-color: #999 !important; margin-left: 0 !important; margin-right: 0 !important; }

          /* Ensure Tailwind background utility classes are overridden for print */
          .bg-gray-100, .bg-gray-50, .bg-muted\\/50, .bg-secondary\\/30, .bg-card {
            background-color: transparent !important;
          }
          .text-gray-700, .text-muted-foreground, .text-primary, .text-blue-600 { /* Example of text color overrides if needed */
             color: black !important;
          }
        }
      `}</style>
    </div>
  );
}


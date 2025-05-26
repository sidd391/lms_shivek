
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
  phone?: string; 
  email?: string; 
}

interface DoctorInfo {
  id?: number;
  fullName?: string;
  specialty?: string;
  title?: string;
  firstName?: string;
  lastName?:string;
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
  id: number; 
  name: string;
  fieldType: BackendParameterFieldType; 
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


interface TestDetailsPrint {
  id: number; 
  name: string;
  parameters?: TestParameterPrint[];
}

interface ReportItemPrint {
  id: number; 
  itemName: string;
  itemType: 'Test' | 'Package';
  originalItemId: number | null; 
  testDetails?: TestDetailsPrint | null;
}

interface FullReportPrintData {
  id: number;
  reportIdNumber: string;
  reportDate: string;
  status: ReportStatusType;
  notes?: string | null; 
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
            const labNameResponse = await fetch(`${BACKEND_API_URL}/settings/${LAB_NAME_SETTING_KEY}`, {
                headers: { 'Authorization': `Bearer ${authToken}` },
            });
            if (labNameResponse.ok) {
              const labNameResult = await labNameResponse.json();
              if (labNameResult.success && labNameResult.data?.value) {
                setLabName(labNameResult.data.value); 
              } else {
                setLabName(DEFAULT_LAB_NAME); 
              }
            } else {
                 setLabName(DEFAULT_LAB_NAME);
            }
            const labAddressResponse = await fetch(`${BACKEND_API_URL}/settings/${LAB_ADDRESS_SETTING_KEY}`, {
                headers: { 'Authorization': `Bearer ${authToken}` },
            });
            if (labAddressResponse.ok) {
                const labAddressResult = await labAddressResponse.json();
                // console.log("PRINT PAGE: Fetched Lab Address Setting:", labAddressResult);
                if (labAddressResult.success && labAddressResult.data?.value) {
                    setLabAddress(labAddressResult.data.value);
                    // console.log("PRINT PAGE: Lab Address State Updated To:", labAddressResult.data.value);
                } else {
                    // console.log("PRINT PAGE: Lab Address not updated from fetch, using default. Reason:", labAddressResult.message || "No value returned");
                    setLabAddress(DEFAULT_LAB_ADDRESS);
                }
            } else {
                // console.error("PRINT PAGE: Failed to fetch lab address setting, status:", labAddressResponse.status);
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
  }, [reportId, authToken, router]); 

  React.useEffect(() => {
    if (reportData && !isLoading && !error && !printTriggered.current) {
      const timer = setTimeout(() => {
        window.print();
        printTriggered.current = true;
      }, 1000); 
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
        <div className="print-hide-controls mb-6 flex justify-between items-center">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-24" />
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
        <Button onClick={() => window.print()} className="mt-4"><Printer className="mr-2 h-4 w-4" /> Try Print Anyway</Button>
      </div>
    );
  }
  if (!reportData) { 
    return (
      <div className="print-container p-8 text-center">
        <div className="print-hide-controls mb-6 flex justify-start">
          <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
        </div>
        <p>No report data available or report not found.</p>
      </div>
    );
  }

  const patientFullName = reportData.patient?.fullName || `${reportData.patient?.title || ''} ${reportData.patient?.firstName || ''} ${reportData.patient?.lastName || ''}`.trim() || 'N/A';
  const doctorFullName = reportData.doctor?.fullName || `${reportData.doctor?.title || ''} ${reportData.doctor?.firstName || ''} ${reportData.doctor?.lastName || ''}`.trim() || 'N/A';

  return (
    <div className="print-container bg-white text-black p-0 m-0 relative font-sans">
      <div
        className="fixed top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 transform -rotate-90 text-8xl font-bold text-gray-100 print:text-gray-100 select-none z-0"
        style={{ marginLeft: '5%', letterSpacing: '0.2em', whiteSpace: 'nowrap' }}
      >
        WITH US QUALITY COMES FIRST
      </div>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 print:opacity-10 select-none z-0">
        <img 
          src="/Ldl_logo.png" 
          alt="Lavcon Diagnostics Watermark" 
          data-ai-hint="faded lab logo red cross" 
          className="w-96 h-auto"
        />
      </div>
      <div className="relative z-10 min-h-screen flex flex-col">
        <div className="print-hide-controls p-4 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-sm z-50">
          <Button variant="outline" onClick={() => router.back()} size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <h1 className="text-lg font-semibold text-primary">Print Preview</h1>
          <Button onClick={() => window.print()} size="sm">
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
        </div>
        <header className="px-8 pt-6 pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <img 
                src="/Ldl_logo.png" 
                alt="Lavcon Diagnostics Logo" 
                data-ai-hint="lab logo red cross" 
                className="h-[100px] w-auto mr-3"
              />
            </div>
            <div className="relative w-[36px] h-[36px]"> {/* Container for the pattern elements */}
              {/* Layer 1: Largest, Light Grey (at the back) - HTML order determines stacking for absolute elements without z-index */}
              <div
                className="absolute bg-gray-300 transform rotate-45 opacity-60"
                style={{
                  width: '32px', height: '32px',
                  top: '4px', right: '4px', 
                  borderRadius: '3px'
                }}
              ></div>
              {/* Layer 2: Medium, Blue (on top of grey) */}
              <div
                className="absolute bg-blue-500 transform rotate-45 opacity-75"
                style={{
                  width: '26px', height: '26px',
                  top: '2px', right: '2px', 
                  borderRadius: '2.5px'
                }}
              ></div>
              {/* Layer 3: Smallest, Darker Blue (on top of medium blue) */}
              <div
                className="absolute bg-blue-700 transform rotate-45 opacity-90"
                style={{
                  width: '20px', height: '20px',
                  top: '0px', right: '0px', 
                  borderRadius: '2px'
                }}
              ></div>
            </div>
          </div>
          <div className="text-center my-2">
            <span className="inline-block px-6 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-full tracking-wider">
              LABORATORY TEST REPORT
            </span>
          </div>
        </header>
        <hr className="mx-8 border-gray-300"/>
        <section className="px-8 py-3 text-sm">
          <table className="w-full">
            <tbody>
              <tr>
                <td className="w-1/2 pr-2 align-top">
                  <p><strong>Patient Name:</strong> {patientFullName}</p>
                  <p><strong>Patient ID:</strong> {reportData.patient?.patientId || `DB_ID: ${reportData.patient?.id || 'N/A'}`}</p>
                  <p><strong>Age/Gender:</strong> {reportData.patient?.age || 'N/A'} / {reportData.patient?.gender || 'N/A'}</p>
                  <p><strong>Contact:</strong> {reportData.patient?.phone || 'N/A'}</p>
                </td>
                <td className="w-1/2 pl-2 align-top">
                  <p><strong>Report ID:</strong> {reportData.reportIdNumber}</p>
                  <p><strong>Bill No:</strong> {reportData.bill?.billNumber || 'N/A'}</p>
                  <p><strong>Report Date:</strong> {format(new Date(reportData.reportDate || Date.now()), 'dd-MMM-yyyy hh:mm a')}</p>
                  {reportData.doctor && <p><strong>Referred By:</strong> Dr. {doctorFullName}</p>}
                </td>
              </tr>
            </tbody>
          </table>
        </section>
        <hr className="mx-8 border-gray-300 mb-2"/>
        <main className="px-8 py-2 flex-grow document-content">
          {reportData.items?.map((item, index) => {
            const tabularParameters = item.testDetails?.parameters?.filter(p => p.fieldType !== 'Group' && p.fieldType !== 'Text Editor') || [];
            const nonTabularParameters = item.testDetails?.parameters?.filter(p => p.fieldType === 'Group' || p.fieldType === 'Text Editor') || [];

            return (
              <div key={`test-section-${item.testDetails?.id || item.originalItemId || item.id}-${index}`} className="mb-3 test-section">
                <h3 className="text-md font-bold bg-gray-100 print:bg-gray-100 p-1.5 rounded-t-sm -mx-1 print:-mx-0 text-center">
                  {item.itemName} {item.itemType === 'Package' && !item.testDetails && <Badge variant="secondary" className="ml-2 align-middle">Package</Badge>}
                </h3>

                {nonTabularParameters.map(param => {
                  if (!param || param.id === undefined || param.id === null) return null;
                  const resultEntry = getParameterResult(param.id);
                  const isParamActuallyAbnormal = resultEntry?.isAbnormal;

                  if (param.fieldType === 'Group') {
                    return (
                      <div key={`param-group-${param.id}-${item.testDetails?.id}`} className="mt-2 mb-1">
                        <h4 className="text-sm font-semibold text-gray-800 print:text-gray-800 underline decoration-gray-400 decoration-1 underline-offset-2">{param.name}</h4>
                      </div>
                    );
                  }
                  if (param.fieldType === 'Text Editor') {
                    return (
                      <div key={`param-text-editor-${param.id}-${item.testDetails?.id}`} className="mt-1 mb-2">
                        <h4 className="text-sm font-semibold">{param.name}:</h4>
                        <div
                          className={cn("text-editor-content whitespace-pre-wrap print:text-xs", isParamActuallyAbnormal && 'text-red-600 print:text-red-600')}
                          dangerouslySetInnerHTML={{ __html: resultEntry?.resultValue || (typeof param.options === 'string' ? param.options : '') || 'N/A' }}
                        />
                      </div>
                    );
                  }
                  return null;
                })}

                {tabularParameters.length > 0 && (
                  <table className="w-full text-xs border-collapse mt-1">
                    <thead>
                      <tr className="bg-gray-50 print:bg-gray-50">
                        <th className="text-left p-1 border font-semibold w-[35%]">Parameter</th>
                        <th className="text-center p-1 border font-semibold w-[15%]">Result</th>
                        <th className="text-center p-1 border font-semibold w-[10%] print:hidden">Flag</th>
                        <th className="text-left p-1 border font-semibold w-[15%]">Units</th>
                        <th className="text-left p-1 border font-semibold w-[25%]">Reference Range</th>
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
                            <td className={cn("p-1 border", param.parentId && "pl-4 print:pl-3")}>
                              {param.name} {param.fieldType === 'Formula' && <Sigma className="inline h-2.5 w-2.5 ml-0.5 text-blue-600" />}
                            </td>
                            <td className={cn("p-1 border text-center", isParamActuallyAbnormal && 'text-red-600 print:text-red-600 font-bold')}>
                              {resultEntry?.resultValue || 'N/A'}
                            </td>
                            <td className="p-1 border text-center print:hidden">
                              {flag && <Badge variant={isParamActuallyAbnormal ? "destructive" : "outline"} className="text-xs px-1 py-0.5">{flag}</Badge>}
                            </td>
                            <td className="p-1 border">{param.units || 'N/A'}</td>
                            <td className="p-1 border">{param.rangeText || (param.rangeLow !== null && param.rangeHigh !== null && typeof param.rangeLow === 'number' && typeof param.rangeHigh === 'number' ? `${param.rangeLow} - ${param.rangeHigh}` : 'N/A')}</td>
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

          {reportData.notes && (
            <section className="mt-3 pt-2 border-t border-gray-300">
                <h3 className="text-sm font-bold mb-0.5">Overall Report Notes / Interpretation:</h3>
                <div className="text-xs whitespace-pre-wrap text-editor-content" dangerouslySetInnerHTML={{ __html: reportData.notes }} />
            </section>
          )}
        </main>
        <footer className="px-8 pt-2 pb-4 mt-auto border-t border-gray-900 print:border-gray-900">
          <div className="flex justify-between items-end text-xs">
            <div className="w-3/5">
              <p className="font-bold whitespace-pre-line">{labAddress}</p> 
              <p className="mt-1 text-[0.6rem] leading-tight">
                All tests have technical limitations, correlation with clinical features and other
                investigation are mandatory to arrive at a final diagnosis.
                This report is a professional opinion and not a diagnosis, not for medico legal purpose.
              </p>
            </div>
            <div className="w-2/5 relative flex justify-end items-end text-right -mb-4 -mr-8 print:-mb-4 print:-mr-8">
              <div className="absolute bottom-0 right-0 h-24 w-full overflow-hidden">
                <div 
                  className="absolute -bottom-12 -right-12 w-64 h-64 bg-blue-600 opacity-90"
                  style={{ borderRadius: '60% 40% 30% 70% / 50% 60% 40% 50%'}}
                ></div>
              </div>
              <div className="relative z-10 p-2 text-white">
                 <img 
                    src="/Ldl_logo.png" 
                    alt="Home Sample Collection" 
                    data-ai-hint="delivery scooter medical"
                    className="inline-block h-8 w-8 mb-0.5"
                  />
                <p className="font-semibold text-[0.65rem] leading-tight">Home Sample Collection Available</p>
                <p className="text-[0.6rem] leading-tight">Mobile No.: +91-9220833620</p>
              </div>
            </div>
          </div>
          <div className="text-center text-[0.6rem] text-gray-600 print:text-gray-600 mt-2">
            Printed on: {format(new Date(), 'dd-MMM-yyyy hh:mm a')} ** End of Report **
          </div>
        </footer>
      </div> 
      <style jsx global>{`
        @media print {
          html, body {
            height: auto !important;
            overflow: visible !important;
            margin: 0 !important; 
            padding: 0 !important;
            font-size: 9pt;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .print-container {
            width: 210mm; 
            min-height: 297mm; 
            height: auto !important; 
            overflow: visible !important; 
            margin: 0 auto; 
            padding: 0.5cm 0.7cm; 
            box-shadow: none !important;
            border: none !important;
          }
          .print-hide-controls { display: none !important; }
          .document-content {
             height: auto !important;
             overflow: visible !important;
          }
          header, footer {
            width: 100%;
          }
          section { page-break-inside: avoid; }
          .test-section { page-break-inside: auto; } 
          
          table, .text-editor-content table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-top: 0.25em !important;
            margin-bottom: 0.25em !important;
            font-size: 8pt !important;
            page-break-inside: auto !important;
          }
          th, td, .text-editor-content th, .text-editor-content td {
            border: 1px solid #999 !important; 
            padding: 2px 3px !important;
            text-align: left;
            vertical-align: top;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          th, .text-editor-content th {
            font-weight: bold !important;
            background-color: #f0f0f0 !important;
          }
          .text-editor-content {
            overflow: visible !important;
            height: auto !important;
            max-width: none !important;
            page-break-inside: auto !important; 
            font-size: 8.5pt !important;
            line-height: 1.3 !important;
          }
          .text-editor-content p,
          .text-editor-content div:not(table):not(th):not(td), 
          .text-editor-content ul,
          .text-editor-content ol,
          .text-editor-content li {
            font-size: 8.5pt !important;
            margin-top: 0.1em !important;
            margin-bottom: 0.1em !important;
            page-break-inside: auto !important; 
            line-height: 1.3 !important;
          }
           .text-editor-content ul, .text-editor-content ol {
             padding-left: 12px !important; 
          }
          .bg-gray-100, .bg-gray-50 { background-color: #f0f0f0 !important; }
          .text-red-600 { color: #cc0000 !important; } 
        }
        .print-container { font-family: 'Arial', 'Helvetica Neue', Helvetica, sans-serif; }
      `}</style>
    </div>
  );
}

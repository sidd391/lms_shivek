
'use server';

import dotenv from 'dotenv';
import path from 'path';
// Ensure .env variables are loaded if this module is accessed before server.ts configures it.
// This path assumes notificationService.ts is in src/backend/services/
dotenv.config({ path: path.resolve(__dirname, '../../../.env') }); // Corrected path to root .env

import axios from 'axios'; // For making HTTP requests to Meta API
import FormData from 'form-data'; // For constructing multipart/form-data for media uploads

// These will now attempt to read from process.env, which should be populated.
const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v22.0';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const YOUR_LAB_NAME = process.env.LAB_NAME_FOR_NOTIFICATIONS || "QuantumHook Diagnostics";
const REPORT_MESSAGE_TEMPLATE_NAME = process.env.WHATSAPP_REPORT_TEMPLATE_NAME || "lab_report_notification_v3";

// Placeholder for actual PDF generation logic
async function generateReportPdf(reportId: string, reportData: { patientName: string }): Promise<Buffer> {
  console.log(`[NotificationService] PDF GENERATION: Simulating PDF generation for report ID ${reportId}, Patient: ${reportData.patientName}`);
  const dummyPdfContent = `Report ID: ${reportId}\nPatient: ${reportData.patientName}\n\nThis is a simulated PDF report.`;
  return Buffer.from(dummyPdfContent);
}

// Function to upload media (PDF) to WhatsApp servers
async function uploadMediaToWhatsApp(pdfBuffer: Buffer, reportId: string): Promise<string | null> {
  // DEBUG LOGS for uploadMediaToWhatsApp
  console.log(`[NotificationService DEBUG] uploadMediaToWhatsApp called. WHATSAPP_PHONE_NUMBER_ID: "${WHATSAPP_PHONE_NUMBER_ID}"`);
  console.log(`[NotificationService DEBUG] WHATSAPP_ACCESS_TOKEN (first 10 chars): "${WHATSAPP_ACCESS_TOKEN ? WHATSAPP_ACCESS_TOKEN.substring(0, 10) + '...' : 'NOT LOADED'}"`);
  console.log(`[NotificationService DEBUG] WHATSAPP_API_VERSION: "${WHATSAPP_API_VERSION}"`);


  if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
    console.error('[NotificationService] WHATSAPP (Meta): WhatsApp API Phone Number ID or Access Token is not configured. Ensure they are set in your .env file.');
    return null;
  }

  const mediaUploadUrl = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/media`;
  const formData = new FormData();
  formData.append('messaging_product', 'whatsapp');
  formData.append('file', pdfBuffer, {
    filename: `LabReport_${reportId}.pdf`,
    contentType: 'application/pdf',
  });

  try {
    console.log(`[NotificationService] WHATSAPP (Meta): Uploading PDF for report ${reportId} to Meta... URL: ${mediaUploadUrl}`);
    const response = await axios.post(mediaUploadUrl, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      },
    });

    if (response.data && response.data.id) {
      console.log(`[NotificationService] WHATSAPP (Meta): PDF uploaded successfully. Media ID: ${response.data.id}`);
      return response.data.id;
    }
    console.error('[NotificationService] WHATSAPP (Meta): Media upload failed. Response:', response.data);
    return null;
  } catch (error: any) {
    console.error('[NotificationService] WHATSAPP (Meta): Error uploading media:', error.response?.data || error.message);
    return null;
  }
}

export async function sendReportViaWhatsApp(
  phoneNumber: string,
  reportId: string,
  reportData: { patientName: string; /* other data for template variables */ }
): Promise<{ success: boolean; message: string }> {
  // DEBUG LOGS for sendReportViaWhatsApp
  console.log(`[NotificationService DEBUG] sendReportViaWhatsApp called. Target Phone: ${phoneNumber}, Report ID: ${reportId}`);
  console.log(`[NotificationService DEBUG] WHATSAPP_PHONE_NUMBER_ID (sending from): "${WHATSAPP_PHONE_NUMBER_ID}"`);
  console.log(`[NotificationService DEBUG] WHATSAPP_ACCESS_TOKEN (first 10 chars): "${WHATSAPP_ACCESS_TOKEN ? WHATSAPP_ACCESS_TOKEN.substring(0, 10) + '...' : 'NOT LOADED'}"`);
  console.log(`[NotificationService DEBUG] WHATSAPP_REPORT_TEMPLATE_NAME: "${REPORT_MESSAGE_TEMPLATE_NAME}"`);
  console.log(`[NotificationService DEBUG] WHATSAPP_API_VERSION: "${WHATSAPP_API_VERSION}"`);
  console.log(`[NotificationService DEBUG] YOUR_LAB_NAME (for template): "${YOUR_LAB_NAME}"`);


  console.log(`[NotificationService] WHATSAPP (Meta): Attempting to send report ${reportId} to ${phoneNumber}`);


  if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN || !REPORT_MESSAGE_TEMPLATE_NAME) {
    const missing = [
      !WHATSAPP_PHONE_NUMBER_ID && "Phone Number ID",
      !WHATSAPP_ACCESS_TOKEN && "Access Token",
      !REPORT_MESSAGE_TEMPLATE_NAME && "Template Name"
    ].filter(Boolean).join(', ');
    const errorMessage = `WhatsApp API configuration (${missing}) missing. Please check environment variables.`;
    console.error(`[NotificationService] WHATSAPP (Meta): ${errorMessage}`);
    return { success: false, message: `Configuration error: ${errorMessage}` };
  }
  
  let pdfBuffer;
  try {
    pdfBuffer = await generateReportPdf(reportId, reportData);
  } catch (pdfError: any) {
    console.error(`[NotificationService] WHATSAPP (Meta): Failed to generate PDF for report ${reportId}:`, pdfError);
    return { success: false, message: "Failed to generate report PDF." };
  }

  const mediaId = await uploadMediaToWhatsApp(pdfBuffer, reportId);
  if (!mediaId) {
    return { success: false, message: "Failed to upload report PDF to WhatsApp." };
  }

  const messageSendUrl = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  
  const messagePayload = {
    messaging_product: "whatsapp",
    to: phoneNumber, 
    type: "template",
    template: {
      name: REPORT_MESSAGE_TEMPLATE_NAME,
      language: {
        code: "en_US" 
      },
      components: [
        {
          type: "header",
          parameters: [
            {
              type: "document",
              document: {
                id: mediaId,
                filename: `LabReport_${reportId}.pdf` 
              }
            }
          ]
        },
        {
          type: "body",
          parameters: [
            { type: "text", text: reportData.patientName || "Valued Patient" }, 
            { type: "text", text: reportId },                                 
            { type: "text", text: YOUR_LAB_NAME }                              
          ]
        }
      ]
    }
  };

  try {
    console.log(`[NotificationService] WHATSAPP (Meta): Sending message template for report ${reportId} to ${phoneNumber} with payload:`, JSON.stringify(messagePayload, null, 2));
    const response = await axios.post(messageSendUrl, messagePayload, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data && response.data.messages && response.data.messages[0]?.id) {
      console.log(`[NotificationService] WHATSAPP (Meta): Message sent successfully for report ${reportId}. Message ID: ${response.data.messages[0].id}`);
      return { success: true, message: `Report sent via WhatsApp to: ${phoneNumber}` };
    } else {
      console.error(`[NotificationService] WHATSAPP (Meta): Failed to send message for report ${reportId}. API Response:`, response.data);
      return { success: false, message: `Failed to send report via WhatsApp. API response: ${JSON.stringify(response.data)}` };
    }
  } catch (error: any) {
    console.error(`[NotificationService] WHATSAPP (Meta): Error sending message for report ${reportId} to ${phoneNumber}:`, error.response?.data || error.message);
    const apiError = error.response?.data?.error;
    const errorMessage = apiError ? `API Error: ${apiError.message} (Code: ${apiError.code}, Type: ${apiError.type})` : error.message;
    return { success: false, message: `Failed to send report via WhatsApp. ${errorMessage}` };
  }
}

export async function sendReportViaEmail(emailAddress: string, reportId: string, reportData: any): Promise<{ success: boolean; message: string }> {
  console.log(`[NotificationService] EMAIL: Attempting to send report ${reportId} to ${emailAddress}`);
  try {
    const pdfContent = await generateReportPdf(reportId, reportData);
    console.log(`[NotificationService] EMAIL: (Simulated) PDF content for report ${reportId}: First 100 chars: ${pdfContent.toString().substring(0,100)}...`);
    return { success: true, message: `Report (simulated) sent to Email: ${emailAddress}` };
  } catch (error: any) {
    console.error(`[NotificationService] EMAIL: Error sending report ${reportId} to ${emailAddress}:`, error);
    return { success: false, message: error.message || 'Failed to send report via Email.' };
  }
}

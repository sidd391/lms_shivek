"use server";

import dotenv from "dotenv";
import path from "path";
// Ensure .env variables are loaded if this module is accessed before server.ts configures it.
dotenv.config({ path: path.resolve(__dirname, "../../../.env") }); // Path to root .env
import defaultGlobalSequelize from '../config/database';
import { initModels } from "../models";
import axios from "axios";
import FormData from "form-data";
import nodemailer from "nodemailer"; // Import nodemailer
import puppeteer from "puppeteer";
import type { Browser } from "puppeteer"; // Import puppeteer for PDF generation
// WhatsApp Configuration
const { Report } = initModels(defaultGlobalSequelize);

const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || "v22.0";
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const YOUR_LAB_NAME =
  process.env.LAB_NAME_FOR_NOTIFICATIONS || "QuantumHook Diagnostics";
const REPORT_MESSAGE_TEMPLATE_NAME =
  process.env.WHATSAPP_REPORT_TEMPLATE_NAME || "lab_report_notification_v3";

// Email Configuration
const EMAIL_SMTP_HOST = process.env.EMAIL_SMTP_HOST;
const EMAIL_SMTP_PORT = parseInt(process.env.EMAIL_SMTP_PORT || "587", 10);
const EMAIL_SMTP_SECURE = process.env.EMAIL_SMTP_SECURE === "true"; // true for 465, false for other ports
const EMAIL_SMTP_USER = process.env.EMAIL_SMTP_USER;
const EMAIL_SMTP_PASS = process.env.EMAIL_SMTP_PASS;
const EMAIL_FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS;

// Placeholder for actual PDF generation logic
async function generateReportPdf(
  reportId: string,
  reportData: { patientName: string }
): Promise<Buffer> {
  // Find the report by reportIdNumber
   const report = await Report.findOne({ where: { reportIdNumber: reportId } });
  if (!report) throw new Error("Report not found");

  const dbId = report.id; 

  const reportPrintUrl = `${
  process.env.FRONTEND_BASE_URL || "http://localhost:9002"
}/reports/print/${dbId}`;
  console.log(
    `[NotificationService] PDF GENERATION: Rendering URL: ${reportPrintUrl}`
  );

  // Fetch the latest access token from your internal API
  const { data } = await axios.get(
    `${
      process.env.FRONTEND_BASE_URL || "http://localhost:9002"
    }/api/internal/latest-token`,
    { headers: { "x-api-key": process.env.INTERNAL_API_KEY || "shiv21345@" } }
  );
  const ACCESS_TOKEN_VALUE = data.accessToken;

  let browser: Browser | null = null;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1240, height: 1754 });

    // Go to your app's base URL to set localStorage
    await page.goto(process.env.FRONTEND_BASE_URL || "http://localhost:9002", {
      waitUntil: "domcontentloaded",
    });
    await page.evaluate((token) => {
      localStorage.setItem("accessToken", token);
    }, ACCESS_TOKEN_VALUE);

    // Now go to the print page (authenticated)
    const response = await page.goto(reportPrintUrl, {
      waitUntil: ["networkidle0", "domcontentloaded"],
      timeout: 60000,
    });

    if (!response || !response.ok()) {
      throw new Error(
        `Failed to load report print page. Status: ${
          response ? response.status() : "unknown"
        }`
      );
    }

    // Wait for your main content to appear (adjust selector if needed)
    try {
      await page.waitForSelector(".document-content", { timeout: 20000 });
    } catch (e) {
      console.warn(
        "[NotificationService] PDF GENERATION: .document-content not found, proceeding anyway."
      );
    }

    // Wait a bit more for any client-side rendering
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Optional: Force all text to black for print
    await page.addStyleTag({
      content: `
      * { color: #000 !important; }
      body { background: #fff !important; }
    `,
    });

    // Generate the PDF
    const pdfBuffer = Buffer.from(
      await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "1cm", right: "1cm", bottom: "1cm", left: "1cm" },
      })
    );

    console.log(
      `[NotificationService] PDF GENERATION: PDF generated for report ${reportId}, size: ${pdfBuffer.length} bytes`
    );
    return pdfBuffer;
  } catch (error: any) {
    console.error(
      `[NotificationService] PDF GENERATION: Error generating PDF for report ${reportId}:`,
      error
    );
    throw new Error(`Failed to generate PDF: ${error.message}`);
  } finally {
    if (browser) await browser.close();
  }
}
// Function to upload media (PDF) to WhatsApp servers
async function uploadMediaToWhatsApp(
  pdfBuffer: Buffer,
  reportId: string
): Promise<string | null> {
  console.log(
    `[NotificationService DEBUG] uploadMediaToWhatsApp called. WHATSAPP_PHONE_NUMBER_ID: "${WHATSAPP_PHONE_NUMBER_ID}"`
  );
  console.log(
    `[NotificationService DEBUG] WHATSAPP_ACCESS_TOKEN (first 10 chars): "${
      WHATSAPP_ACCESS_TOKEN
        ? WHATSAPP_ACCESS_TOKEN.substring(0, 10) + "..."
        : "NOT LOADED"
    }"`
  );
  console.log(
    `[NotificationService DEBUG] WHATSAPP_API_VERSION: "${WHATSAPP_API_VERSION}"`
  );

  if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
    console.error(
      "[NotificationService] WHATSAPP (Meta): WhatsApp API Phone Number ID or Access Token is not configured. Ensure they are set in your .env file."
    );
    return null;
  }

  const mediaUploadUrl = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/media`;
  const formData = new FormData();
  formData.append("messaging_product", "whatsapp");
  formData.append("file", pdfBuffer, {
    filename: `LabReport_${reportId}.pdf`,
    contentType: "application/pdf",
  });

  try {
    console.log(
      `[NotificationService] WHATSAPP (Meta): Uploading PDF for report ${reportId} to Meta... URL: ${mediaUploadUrl}`
    );
    const response = await axios.post(mediaUploadUrl, formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      },
    });

    if (response.data && response.data.id) {
      console.log(
        `[NotificationService] WHATSAPP (Meta): PDF uploaded successfully. Media ID: ${response.data.id}`
      );
      return response.data.id;
    }
    console.error(
      "[NotificationService] WHATSAPP (Meta): Media upload failed. Response:",
      response.data
    );
    return null;
  } catch (error: any) {
    console.error(
      "[NotificationService] WHATSAPP (Meta): Error uploading media:",
      error.response?.data || error.message
    );
    return null;
  }
}

export async function sendReportViaWhatsApp(
  phoneNumber: string,
  reportId: string,
  reportData: { patientName: string /* other data for template variables */ }
): Promise<{ success: boolean; message: string }> {
  console.log(
    `[NotificationService DEBUG] sendReportViaWhatsApp called. Target Phone: ${phoneNumber}, Report ID: ${reportId}`
  );
  console.log(
    `[NotificationService DEBUG] WHATSAPP_PHONE_NUMBER_ID (sending from): "${WHATSAPP_PHONE_NUMBER_ID}"`
  );
  console.log(
    `[NotificationService DEBUG] WHATSAPP_ACCESS_TOKEN (first 10 chars): "${
      WHATSAPP_ACCESS_TOKEN
        ? WHATSAPP_ACCESS_TOKEN.substring(0, 10) + "..."
        : "NOT LOADED"
    }"`
  );
  console.log(
    `[NotificationService DEBUG] WHATSAPP_REPORT_TEMPLATE_NAME: "${REPORT_MESSAGE_TEMPLATE_NAME}"`
  );
  console.log(
    `[NotificationService DEBUG] WHATSAPP_API_VERSION: "${WHATSAPP_API_VERSION}"`
  );
  console.log(
    `[NotificationService DEBUG] YOUR_LAB_NAME (for template): "${YOUR_LAB_NAME}"`
  );

  console.log(
    `[NotificationService] WHATSAPP (Meta): Attempting to send report ${reportId} to ${phoneNumber}`
  );

  if (
    !WHATSAPP_PHONE_NUMBER_ID ||
    !WHATSAPP_ACCESS_TOKEN ||
    !REPORT_MESSAGE_TEMPLATE_NAME
  ) {
    const missing = [
      !WHATSAPP_PHONE_NUMBER_ID && "Phone Number ID",
      !WHATSAPP_ACCESS_TOKEN && "Access Token",
      !REPORT_MESSAGE_TEMPLATE_NAME && "Template Name",
    ]
      .filter(Boolean)
      .join(", ");
    const errorMessage = `WhatsApp API configuration (${missing}) missing. Please check environment variables.`;
    console.error(`[NotificationService] WHATSAPP (Meta): ${errorMessage}`);
    return { success: false, message: `Configuration error: ${errorMessage}` };
  }

  let pdfBuffer;
  try {
    pdfBuffer = await generateReportPdf(reportId, reportData);
  } catch (pdfError: any) {
    console.error(
      `[NotificationService] WHATSAPP (Meta): Failed to generate PDF for report ${reportId}:`,
      pdfError
    );
    return { success: false, message: "Failed to generate report PDF." };
  }

  const mediaId = await uploadMediaToWhatsApp(pdfBuffer, reportId);
  if (!mediaId) {
    return {
      success: false,
      message: "Failed to upload report PDF to WhatsApp.",
    };
  }

  const messageSendUrl = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const messagePayload = {
    messaging_product: "whatsapp",
    to: phoneNumber,
    type: "template",
    template: {
      name: REPORT_MESSAGE_TEMPLATE_NAME,
      language: {
        code: "en_US",
      },
      components: [
        {
          type: "header",
          parameters: [
            {
              type: "document",
              document: {
                id: mediaId,
                filename: `LabReport_${reportId}.pdf`,
              },
            },
          ],
        },
        {
          type: "body",
          parameters: [
            { type: "text", text: reportData.patientName || "Valued Patient" },
            { type: "text", text: reportId },
            { type: "text", text: YOUR_LAB_NAME },
          ],
        },
      ],
    },
  };

  try {
    console.log(
      `[NotificationService] WHATSAPP (Meta): Sending message template for report ${reportId} to ${phoneNumber} with payload:`,
      JSON.stringify(messagePayload, null, 2)
    );
    const response = await axios.post(messageSendUrl, messagePayload, {
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (
      response.data &&
      response.data.messages &&
      response.data.messages[0]?.id
    ) {
      console.log(
        `[NotificationService] WHATSAPP (Meta): Message sent successfully for report ${reportId}. Message ID: ${response.data.messages[0].id}`
      );
      return {
        success: true,
        message: `Report sent via WhatsApp to: ${phoneNumber}`,
      };
    } else {
      console.error(
        `[NotificationService] WHATSAPP (Meta): Failed to send message for report ${reportId}. API Response:`,
        response.data
      );
      return {
        success: false,
        message: `Failed to send report via WhatsApp. API response: ${JSON.stringify(
          response.data
        )}`,
      };
    }
  } catch (error: any) {
    console.error(
      `[NotificationService] WHATSAPP (Meta): Error sending message for report ${reportId} to ${phoneNumber}:`,
      error.response?.data || error.message
    );
    const apiError = error.response?.data?.error;
    const errorMessage = apiError
      ? `API Error: ${apiError.message} (Code: ${apiError.code}, Type: ${apiError.type})`
      : error.message;
    return {
      success: false,
      message: `Failed to send report via WhatsApp. ${errorMessage}`,
    };
  }
}

export async function sendReportViaEmail(
  emailAddress: string,
  reportId: string,
  reportData: { patientName: string /* other data for email content */ }
): Promise<{ success: boolean; message: string }> {
  console.log(
    `[NotificationService] EMAIL: Attempting to send report ${reportId} to ${emailAddress}`
  );

  if (
    !EMAIL_SMTP_HOST ||
    !EMAIL_SMTP_USER ||
    !EMAIL_SMTP_PASS ||
    !EMAIL_FROM_ADDRESS
  ) {
    const missing = [
      !EMAIL_SMTP_HOST && "SMTP Host",
      !EMAIL_SMTP_USER && "SMTP User",
      !EMAIL_SMTP_PASS && "SMTP Pass",
      !EMAIL_FROM_ADDRESS && "From Address",
    ]
      .filter(Boolean)
      .join(", ");
    const errorMessage = `Email SMTP configuration (${missing}) missing. Please check environment variables.`;
    console.error(`[NotificationService] EMAIL: ${errorMessage}`);
    return { success: false, message: `Configuration error: ${errorMessage}` };
  }

  let pdfBuffer;
  try {
    pdfBuffer = await generateReportPdf(reportId, reportData);
  } catch (pdfError: any) {
    console.error(
      `[NotificationService] EMAIL: Failed to generate PDF for report ${reportId}:`,
      pdfError
    );
    return { success: false, message: "Failed to generate report PDF." };
  }

  const transporter = nodemailer.createTransport({
    host: EMAIL_SMTP_HOST,
    port: EMAIL_SMTP_PORT,
    secure: EMAIL_SMTP_SECURE, // true for 465, false for other ports
    auth: {
      user: EMAIL_SMTP_USER,
      pass: EMAIL_SMTP_PASS,
    },
    tls: {
      // do not fail on invalid certs for testing/dev with some providers
      rejectUnauthorized: false, // SET TO `true` or remove for production with valid certs!
    },
  });

  const mailOptions = {
    from: `"${YOUR_LAB_NAME}" <${EMAIL_FROM_ADDRESS}>`,
    to: emailAddress,
    subject: `Your Lab Report (ID: ${reportId}) from ${YOUR_LAB_NAME}`,
    html: `
      <p>Dear ${reportData.patientName || "Patient"},</p>
      <p>Please find your lab report (ID: ${reportId}) attached with this email.</p>
      <p>If you have any questions, please don't hesitate to contact us.</p>
      <p>Thank you,<br/>The Team at ${YOUR_LAB_NAME}</p>
    `,
    attachments: [
      {
        filename: `LabReport_${reportId}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  };

  try {
    console.log(
      `[NotificationService] EMAIL: Sending email for report ${reportId} to ${emailAddress}...`
    );
    const info = await transporter.sendMail(mailOptions);
    console.log(
      "[NotificationService] EMAIL: Message sent: %s",
      info.messageId
    );
    return { success: true, message: `Report sent to Email: ${emailAddress}` };
  } catch (error: any) {
    console.error(
      `[NotificationService] EMAIL: Error sending email for report ${reportId} to ${emailAddress}:`,
      error
    );
    return {
      success: false,
      message: error.message || "Failed to send report via Email.",
    };
  }
}

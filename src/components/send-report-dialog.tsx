
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Send, Mail, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel as RHFFormLabel, FormMessage } from '@/components/ui/form';


const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface SendReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: number;
  reportNumber: string;
  patientName: string;
  defaultRecipient: string;
  sendChannel: 'whatsapp' | 'email';
}

const formSchema = z.object({
  recipient: z.string().min(1, "Recipient is required."),
});
type FormValues = z.infer<typeof formSchema>;


export function SendReportDialog({
  isOpen,
  onClose,
  reportId,
  reportNumber,
  patientName,
  defaultRecipient,
  sendChannel,
}: SendReportDialogProps) {
  const { toast } = useToast();
  const [isSending, setIsSending] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipient: defaultRecipient,
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset({ recipient: defaultRecipient });
    }
  }, [isOpen, defaultRecipient, form]);


  const handleSubmit = async (data: FormValues) => {
    setIsSending(true);
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      toast({ title: "Authentication Error", description: "Please login.", variant: "destructive" });
      setIsSending(false);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_API_URL}/reports/${reportId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          channel: sendChannel,
          recipient: data.recipient,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Report Sent (Simulated)",
          description: result.message || `Report ${reportNumber} has been sent to ${data.recipient} via ${sendChannel}.`,
        });
        onClose();
      } else {
        toast({
          title: `Failed to Send Report via ${sendChannel}`,
          description: result.message || "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Network Error",
        description: error.message || `Could not connect to server to send report via ${sendChannel}.`,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const capitalizedChannel = sendChannel.charAt(0).toUpperCase() + sendChannel.slice(1);
  const Icon = sendChannel === 'whatsapp' ? MessageSquare : Mail;
  const inputType = sendChannel === 'email' ? 'email' : 'tel';
  const placeholder = sendChannel === 'email' ? 'patient@example.com' : '+1234567890';


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Icon className="mr-2 h-5 w-5 text-primary" /> Send Report via {capitalizedChannel}
          </DialogTitle>
          <DialogDescription>
            Sending report <strong>{reportNumber}</strong> for patient <strong>{patientName}</strong>.
            Please confirm or update the {sendChannel === 'whatsapp' ? 'phone number' : 'email address'}.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
                <FormField
                control={form.control}
                name="recipient"
                render={({ field }) => (
                    <FormItem>
                    <RHFFormLabel htmlFor="recipientInput">
                        {sendChannel === 'whatsapp' ? 'WhatsApp Number' : 'Email Address'}
                    </RHFFormLabel>
                    <FormControl>
                        <Input 
                            id="recipientInput"
                            type={inputType} 
                            placeholder={placeholder} 
                            {...field} 
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <DialogFooter className="sm:justify-end">
                    <DialogClose asChild>
                        <Button type="button" variant="outline" disabled={isSending}>
                        Cancel
                        </Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSending} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        {isSending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                        </>
                        ) : (
                        <>
                            <Send className="mr-2 h-4 w-4" /> Send Report
                        </>
                        )}
                    </Button>
                </DialogFooter>
            </form>
        </Form>

      </DialogContent>
    </Dialog>
  );
}

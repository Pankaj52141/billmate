import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SimpleInvoiceData } from '@/components/SimpleInvoiceForm';
import { useToast } from '@/hooks/use-toast';

export interface StoredInvoice {
  id: string;
  company_type: string;
  invoice_no: string;
  invoice_date: string;
  customer_name: string;
  hsn: string;
  gstin: string;
  vehicle_no: string | null;
  permit_no: string | null;
  shipping_address: string | null;
  state: string;
  state_code: string;
  items: any;
  subtotal: number;
  cgst: number | null;
  sgst: number | null;
  igst: number | null;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<StoredInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchInvoices = async (companyType?: string) => {
    setLoading(true);
    try {
      let query = supabase.from('invoices').select('*').order('created_at', { ascending: false });
      
      if (companyType) {
        query = query.eq('company_type', companyType);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        title: "Error",
        description: "Failed to fetch invoices",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Get next invoice number for a company (format: INV/0001)
  const getNextInvoiceNo = async (companyType: string): Promise<string> => {
    const { data, error } = await supabase
      .from('invoices')
      .select('invoice_no, created_at')
      .eq('company_type', companyType)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching last invoice:', error);
      // fallback to first invoice number
      return 'INV/0001';
    }

    if (!data || data.length === 0) {
      return 'INV/0001';
    }

    const last = data[0]?.invoice_no || 'INV/0000';
    const match = /^(.*?)(\d+)$/.exec(last.replace(/[^0-9]+(\d+)/, '$1'));
    // Simple parse for INV/0001 pattern
    const numeric = parseInt((last.split('/')[1] || '0').replace(/[^0-9]/g, ''), 10) || 0;
    const next = numeric + 1;
    const padded = next.toString().padStart(4, '0');
    return `INV/${padded}`;
  };

  const saveInvoice = async (invoiceData: SimpleInvoiceData, totals: any) => {
    try {
      const buildPayload = (invoiceNo: string) => ({
        company_type: invoiceData.company,
        invoice_no: invoiceNo,
        invoice_date: invoiceData.invoiceDate,
        customer_name: invoiceData.customerName,
        hsn: invoiceData.hsn,
        gstin: invoiceData.gstin,
        vehicle_no: invoiceData.vehicleNo || null,
        permit_no: invoiceData.permitNo || null,
        shipping_address: invoiceData.shippingAddress || null,
        state: invoiceData.state,
        state_code: invoiceData.stateCode,
        items: JSON.stringify(invoiceData.items),
        subtotal: totals.subtotal,
        cgst: totals.cgst || null,
        sgst: totals.sgst || null,
        igst: totals.igst || null,
        total_amount: totals.total
      });

      // First try with provided invoice number, else compute next
      let desiredNo = invoiceData.invoiceNo && invoiceData.invoiceNo.trim() ? invoiceData.invoiceNo : await getNextInvoiceNo(invoiceData.company);

      const tryInsert = async (no: string) => {
        return await supabase.from('invoices').insert(buildPayload(no)).select();
      };

      let insertResult = await tryInsert(desiredNo);
      if (insertResult.error) {
        const code = (insertResult.error as any).code;
        const message = insertResult.error.message || '';
        // Unique violation or duplicate: compute next and retry once
        if (code === '23505' || /unique|duplicate/i.test(message)) {
          const nextNo = await getNextInvoiceNo(invoiceData.company);
          // Avoid infinite retry if same
          if (nextNo !== desiredNo) {
            insertResult = await tryInsert(nextNo);
          }
        }
      }

      if (insertResult.error) throw insertResult.error;

      const data = insertResult.data as any[];

      toast({
        title: "Success",
        description: "Invoice saved successfully!",
      });

      return data[0] as StoredInvoice;
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast({
        title: "Error",
        description: "Failed to save invoice",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteInvoice = async (id: string) => {
    try {
      const { error } = await supabase.from('invoices').delete().eq('id', id);
      
      if (error) throw error;
      
      setInvoices(prev => prev.filter(invoice => invoice.id !== id));
      
      toast({
        title: "Success",
        description: "Invoice deleted successfully!",
      });
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast({
        title: "Error",
        description: "Failed to delete invoice",
        variant: "destructive"
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  return {
    invoices,
    loading,
    saveInvoice,
    getNextInvoiceNo,
    deleteInvoice,
    fetchInvoices,
    refetch: fetchInvoices
  };
};
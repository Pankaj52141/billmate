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

  const saveInvoice = async (invoiceData: SimpleInvoiceData, totals: any) => {
    try {
      // Check for existing invoice to prevent duplicates
      const existing = await supabase
        .from('invoices')
        .select('*')
        .eq('company_type', invoiceData.company)
        .eq('invoice_no', invoiceData.invoiceNo)
        .limit(1);

      if (existing.error) throw existing.error;
      if (existing.data && existing.data.length > 0) {
        toast({
          title: "Already Saved",
          description: "This invoice is already in history.",
        });
        return existing.data[0];
      }

      const { data, error } = await supabase.from('invoices').insert({
        company_type: invoiceData.company,
        invoice_no: invoiceData.invoiceNo,
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
      }).select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invoice saved successfully!",
      });

      return data[0];
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
    deleteInvoice,
    fetchInvoices,
    refetch: fetchInvoices
  };
};
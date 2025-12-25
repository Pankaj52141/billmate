import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AddressRow {
  id: string;
  label: string;
  customer_name: string | null;
  address: string;
  state: string | null;
  state_code: string | null;
  gstin: string | null;
  created_at: string;
  updated_at: string;
}

export const useAddresses = () => {
  const [addresses, setAddresses] = useState<AddressRow[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .order('label', { ascending: true });
      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast({ title: 'Error', description: 'Failed to fetch saved addresses', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const saveAddress = async (payload: Omit<AddressRow, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (!payload.address?.trim()) {
        toast({ title: 'Address required', description: 'Please enter an address to save.' });
        return null;
      }
      const { data, error } = await supabase
        .from('addresses')
        .insert({
          label: payload.label,
          customer_name: payload.customer_name ?? null,
          address: payload.address,
          state: payload.state ?? null,
          state_code: payload.state_code ?? null,
          gstin: payload.gstin ?? null,
        })
        .select();
      if (error) throw error;
      toast({ title: 'Saved', description: 'Address saved for quick reuse.' });
      await fetchAddresses();
      return data?.[0] ?? null;
    } catch (error) {
      console.error('Error saving address:', error);
      toast({ title: 'Error', description: 'Failed to save address', variant: 'destructive' });
      return null;
    }
  };

  useEffect(() => { fetchAddresses(); }, []);

  return { addresses, loading, fetchAddresses, saveAddress };
};

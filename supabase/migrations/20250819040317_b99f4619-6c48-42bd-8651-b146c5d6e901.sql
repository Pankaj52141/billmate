-- Create invoices table to store generated invoices for both companies
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_type TEXT NOT NULL CHECK (company_type IN ('maa-durga', 'bhagwati')),
  invoice_no TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  customer_name TEXT NOT NULL,
  hsn TEXT NOT NULL,
  gstin TEXT NOT NULL,
  vehicle_no TEXT,
  permit_no TEXT,
  shipping_address TEXT,
  state TEXT NOT NULL,
  state_code TEXT NOT NULL,
  items JSONB NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  cgst DECIMAL(10,2) DEFAULT 0,
  sgst DECIMAL(10,2) DEFAULT 0,
  igst DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since we have passkey protection)
CREATE POLICY "Allow all operations on invoices" 
ON public.invoices 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_invoices_company_type ON public.invoices(company_type);
CREATE INDEX idx_invoices_invoice_no ON public.invoices(invoice_no);
CREATE INDEX idx_invoices_created_at ON public.invoices(created_at DESC);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Enforce uniqueness of invoice number per company to prevent duplicates
ALTER TABLE public.invoices
ADD CONSTRAINT invoices_unique_company_invoice UNIQUE (company_type, invoice_no);

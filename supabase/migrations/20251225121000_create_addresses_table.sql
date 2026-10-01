-- Addresses catalog for quick selection during invoice generation
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL, -- human-friendly name (e.g., customer or site)
  customer_name TEXT,
  address TEXT NOT NULL,
  state TEXT,
  state_code TEXT,
  gstin TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all ops on addresses" ON public.addresses FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_addresses_label ON public.addresses(label);

CREATE OR REPLACE FUNCTION public.update_addresses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_addresses_updated_at
BEFORE UPDATE ON public.addresses
FOR EACH ROW EXECUTE FUNCTION public.update_addresses_updated_at();

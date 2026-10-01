# BillMate

Professional GST Invoice Generator for **MAA DURGA STONE WORKS** & **M/S BHAGWATI STONE WORKS**.

## Features

- Create GST-compliant tax invoices (CGST/SGST for intra-state, IGST for inter-state)
- Download invoices as PDF
- Export individual or bulk invoices to Excel
- Monthly GST reports for CA filing (B2B, B2C, HSN summary)
- Invoice history with search & filter
- Saved address book for quick reuse
- Passkey-protected access via Supabase

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (dark glassmorphism theme)
- **UI Components**: shadcn/ui (only the components actually used)
- **Backend**: Supabase (PostgreSQL)
- **PDF**: jsPDF + html2canvas
- **Excel**: SheetJS (xlsx)

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
# Create a .env file with:
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Start development server
npm run dev
```

## Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui primitives (button, input, select, etc.)
│   ├── SimpleInvoiceForm.tsx   # Main invoice creation form
│   ├── InvoicePreview.tsx      # Invoice preview & PDF layout
│   ├── InvoiceHistory.tsx      # Saved invoice history
│   ├── GSTReports.tsx          # Monthly GST report generator
│   └── PasskeyForm.tsx         # Authentication gate
├── hooks/
│   ├── useInvoices.ts   # Supabase CRUD for invoices
│   ├── useAddresses.ts  # Supabase CRUD for saved addresses
│   └── use-toast.ts     # Toast notification hook
├── utils/
│   └── exportUtils.ts   # PDF download & Excel export logic
├── integrations/
│   └── supabase/        # Supabase client & typed schema
├── pages/
│   ├── Index.tsx
│   └── NotFound.tsx
├── App.tsx
├── main.tsx
└── index.css            # Global styles & glass theme tokens
```
import { Card, CardContent } from "@/components/ui/card";
import { SimpleInvoiceData } from "./SimpleInvoiceForm";

interface InvoicePreviewProps {
  invoiceData: SimpleInvoiceData;
}

const companyData = {
  "maa-durga": {
    name: "MAA DURGA STONE WORKS",
    proprietor: "Laxmi Narayan Prasad",
    address: "MATIACHWA(PAKURIA)",
    city: "PAKUR",
    state: "JHARKHAND",
    pin: "816117",
    Email: "laxmiprasad9470@gmail.com",
    gstin: "20BDOPP7141M1Z8"
  },
  "bhagwati": {
    name: "M/S BHAGWATI STONE WORKS",
    proprietor: "",
    address: "MOUZA:Khaksa(Pakuria)",
    city: "PAKUR",
    state: "JHARKHAND", 
    pin: "816117",
    Email: "stonebhagwati97@gmail.com",
    gstin: "20BMAPB5737J1ZH"
  }
};

export const InvoicePreview = ({ invoiceData }: InvoicePreviewProps) => {
  const company = companyData[invoiceData.company];
  const { 
    invoiceNo, 
    invoiceDate, 
    customerName, 
    hsn, 
    gstin, 
    vehicleNo, 
    permitNo, 
    shippingAddress, 
    state, 
    stateCode, 
    items 
  } = invoiceData;
  
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  
  // If state code is 20 (Jharkhand), use CGST + SGST, otherwise use IGST
  const isJharkhand = stateCode === "20";
  
  let cgst = 0, sgst = 0, igst = 0;
  
  if (isJharkhand) {
    cgst = subtotal * 0.025; // 2.5%
    sgst = subtotal * 0.025; // 2.5%
  } else {
    igst = subtotal * 0.05; // 5%
  }
  
  const totalAmount = subtotal + cgst + sgst + igst;

  return (
    <Card className="max-w-4xl mx-auto shadow-invoice">
      <CardContent className="p-8 bg-invoice-bg">
        {/* Header */}
        <div className="text-center border-b-2 border-invoice-border pb-4 mb-6">
          <h1 className="text-2xl font-bold text-invoice-header mb-2">Tax Invoice</h1>
          <h2 className="text-xl font-bold text-invoice-header">{company.name}</h2>
          <p className="text-sm text-muted-foreground">Proprietor: {company.proprietor}</p>
          <p className="text-sm text-muted-foreground mt-1">{company.address}</p>
          <p className="text-sm text-muted-foreground">{company.city}, {company.state} - {company.pin}</p>
          <p className="text-sm text-muted-foreground">Email: {company.Email}</p>
          <p className="text-sm text-muted-foreground font-semibold">GSTIN: {company.gstin}</p>
        </div>

        {/* Invoice Details Grid */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Left Column */}
          <div className="space-y-2">
            <div className="border border-invoice-border rounded-lg">
              <div className="p-2 border-b border-invoice-border">
                <span className="text-sm font-medium">Invoice No: </span>
                <span className="font-semibold">{invoiceNo}</span>
              </div>
              <div className="p-2">
                <span className="text-sm font-medium">Invoice Date: </span>
                <span className="font-semibold">{new Date(invoiceDate).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="border border-invoice-border rounded-lg p-2">
              <span className="text-sm font-medium">Customer: </span>
              <span className="font-semibold">{customerName}</span>
            </div>
            
            <div className="border border-invoice-border rounded-lg p-2">
              <span className="text-sm font-medium">HSN: </span>
              <span className="font-semibold">{hsn}</span>
            </div>
            
            <div className="border border-invoice-border rounded-lg p-2">
              <span className="text-sm font-medium">GSTIN: </span>
              <span className="font-semibold">{gstin}</span>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="border border-invoice-border rounded-lg p-2">
                <span className="text-sm font-medium">Vehicle No: </span>
                <span className="font-semibold">{vehicleNo}</span>
              </div>
              <div className="border border-invoice-border rounded-lg p-2">
                <span className="text-sm font-medium">Permit No: </span>
                <span className="font-semibold">{permitNo}</span>
              </div>
            </div>
            
            <div className="border border-invoice-border rounded-lg p-3">
              <div className="text-sm font-medium mb-1">Shipping Address:</div>
              <div className="text-sm">{shippingAddress}</div>
            </div>
          </div>
        </div>

        {/* State Info */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <div className="border border-invoice-border rounded-lg p-2">
            <span className="text-sm font-medium">State: </span>
            <span className="font-semibold">{state}</span>
          </div>
          <div className="border border-invoice-border rounded-lg p-2">
            <span className="text-sm font-medium">State Code: </span>
            <span className="font-semibold">{stateCode}</span>
          </div>
        </div>

        {/* Itemized List Header */}
        <div className="mb-3">
          <h3 className="font-bold text-invoice-header">Itemized List:</h3>
        </div>

        {/* Items Table */}
        <div className="border border-invoice-border rounded-lg overflow-hidden mb-6">
          <div className="bg-table-header p-2 border-b border-invoice-border">
            <div className="grid grid-cols-4 gap-4 font-semibold text-sm">
              <span>Product</span>
              <span>Qty</span>
              <span>Rate</span>
              <span>Amount</span>
            </div>
          </div>
          {items.map((item) => (
            <div key={item.id} className="p-2 border-b border-invoice-border last:border-b-0">
              <div className="grid grid-cols-4 gap-4 text-sm">
                <span>{item.product}</span>
                <span>{item.quantity} {item.unit}</span>
                <span>Rs.{item.rate}</span>
                <span>Rs.{(item.quantity * item.rate).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Tax Calculations */}
        <div className="mb-6 space-y-2">
          {isJharkhand ? (
            <>
              <div className="border border-invoice-border rounded-lg p-2">
                <div className="flex justify-between">
                  <span className="font-medium">CGST (2.5%):</span>
                  <span className="font-semibold">Rs.{cgst.toFixed(2)}</span>
                </div>
              </div>
              <div className="border border-invoice-border rounded-lg p-2">
                <div className="flex justify-between">
                  <span className="font-medium">SGST (2.5%):</span>
                  <span className="font-semibold">Rs.{sgst.toFixed(2)}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="border border-invoice-border rounded-lg p-2">
              <div className="flex justify-between">
                <span className="font-medium">IGST (5%):</span>
                <span className="font-semibold">Rs.{igst.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Total Amount */}
        <div className="border border-invoice-border rounded-lg p-3 bg-table-header mb-8">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold">Total Amount:</span>
            <span className="text-xl font-bold">Rs.{totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Signature */}
        <div className="text-right">
          <div className="inline-block">
            <div className="w-48 h-16 border-b border-invoice-border mb-2"></div>
            <p className="text-sm font-medium">Authorized Signature</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
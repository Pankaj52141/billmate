import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { InvoicePreview } from "./InvoicePreview";
import { InvoiceHistory } from "./InvoiceHistory";
import { FileText, Plus, Trash2, RotateCcw, Sparkles, Calculator, Download, FileSpreadsheet, Save, History, LogOut, X } from "lucide-react";
import { downloadPDF, exportToExcel } from "@/utils/exportUtils";
import { useInvoices, StoredInvoice } from "@/hooks/useInvoices";
import { useAddresses } from "@/hooks/useAddresses";
import { useToast } from "@/hooks/use-toast";

export interface InvoiceItem {
  id: string;
  product: string;
  quantity: number;
  unit: string;
  rate: number;
}

export interface SimpleInvoiceData {
  company: "maa-durga" | "bhagwati";
  invoiceNo: string;
  invoiceDate: string;
  customerName: string;
  hsn: string;
  gstin: string;
  vehicleNo: string;
  permitNo: string;
  shippingAddress: string;
  state: string;
  stateCode: string;
  items: InvoiceItem[];
}

const SimpleInvoiceForm = () => {
  const [showPreview, setShowPreview] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [invoiceCounter, setInvoiceCounter] = useState(1);
  const [viewingInvoice, setViewingInvoice] = useState<StoredInvoice | null>(null);
  const { saveInvoice } = useInvoices();
  const { toast } = useToast();
  const { addresses, saveAddress, deleteAddress } = useAddresses();
  const [selectedAddressId, setSelectedAddressId] = useState<string | "manual" | "">("");

  const handleLogout = () => {
    localStorage.removeItem("invoice-passkey");
    window.location.reload();
  };
  const [formData, setFormData] = useState<SimpleInvoiceData>({
    company: "maa-durga",
    invoiceNo: "",
    invoiceDate: new Date().toISOString().split('T')[0],
    customerName: "",
    hsn: "25171010",
    gstin: "",
    vehicleNo: "",
    permitNo: "",
    shippingAddress: "",
    state: "",
    stateCode: "",
    items: [
      { id: "1", product: "product name", quantity: 0, unit: "CFT", rate: 0 }
    ]
  });

  // Auto-generate invoice number
  useEffect(() => {
    const paddedNumber = invoiceCounter.toString().padStart(4, '0');
    setFormData(prev => ({
      ...prev,
      invoiceNo: `INV/${paddedNumber}`
    }));
  }, [invoiceCounter]);

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      product: "",
      quantity: 0,
      unit: "CFT",
      rate: 0
    };
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const removeItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const updateFormField = (field: keyof SimpleInvoiceData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSelectSavedAddress = (id: string | "manual") => {
    setSelectedAddressId(id);
    if (id === "manual") return;
    const addr = addresses.find(a => a.id === id);
    if (!addr) return;
    setFormData(prev => ({
      ...prev,
      shippingAddress: addr.address,
      state: addr.state || prev.state,
      stateCode: addr.state_code || prev.stateCode,
      gstin: addr.gstin || prev.gstin,
      customerName: addr.customer_name || prev.customerName,
    }));
  };

  const resetInvoiceNumber = () => {
    setInvoiceCounter(1);
  };

  const generateNewInvoice = () => {
    setInvoiceCounter(prev => prev + 1);
    setFormData(prev => ({
      ...prev,
      customerName: "",
      hsn: "",
      gstin: "N/A",
      vehicleNo: "",
      permitNo: "",
      shippingAddress: "",
      state: "Jharkhand",
      stateCode: "20",
      items: [{ id: Date.now().toString(), product: "", quantity: 0, unit: "CFT", rate: 0 }]
    }));
    setShowPreview(false);
    setIsSaved(false);
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    
    // If state code is 20 (Jharkhand), use CGST + SGST, otherwise use IGST
    const isJharkhand = formData.stateCode === "20";
    
    let cgst = 0, sgst = 0, igst = 0;
    
    if (isJharkhand) {
      cgst = subtotal * 0.025; // 2.5%
      sgst = subtotal * 0.025; // 2.5%
    } else {
      igst = subtotal * 0.05; // 5%
    }
    
    const total = subtotal + cgst + sgst + igst;
    return { subtotal, cgst, sgst, igst, total, isJharkhand };
  };

  const { subtotal, cgst, sgst, igst, total, isJharkhand } = calculateTotals();

  const handleSaveInvoice = async () => {
    try {
      const totals = { subtotal, cgst, sgst, igst, total };
      const saved = await saveInvoice(formData, totals);
      if (saved) {
        setIsSaved(true);
        setViewingInvoice(saved);
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
    }
  };

  const handleDownloadPDF = async () => {
    if (!isSaved && !viewingInvoice) {
      toast({
        title: "Save Required",
        description: "Please save the invoice first before downloading PDF.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await downloadPDF('invoice-preview', `${formData.invoiceNo.replace('/', '_')}_${formData.customerName.replace(/\s+/g, '_')}.pdf`);
      toast({
        title: "Success",
        description: "PDF downloaded successfully!",
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Error",
        description: "Failed to download PDF",
        variant: "destructive"
      });
    }
  };

  const handleExportExcel = () => {
    if (!isSaved && !viewingInvoice) {
      toast({
        title: "Save Required",
        description: "Please save the invoice first before exporting to Excel.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const totals = { subtotal, cgst, sgst, igst, total };
      exportToExcel(formData, totals);
      toast({
        title: "Success",
        description: "Excel file exported successfully!",
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: "Error",
        description: "Failed to export to Excel",
        variant: "destructive"
      });
    }
  };

  const handleViewStoredInvoice = (invoice: StoredInvoice) => {
    // Convert stored invoice back to form data format
    const invoiceData: SimpleInvoiceData = {
      company: invoice.company_type as "maa-durga" | "bhagwati",
      invoiceNo: invoice.invoice_no,
      invoiceDate: invoice.invoice_date,
      customerName: invoice.customer_name,
      hsn: invoice.hsn,
      gstin: invoice.gstin,
      vehicleNo: invoice.vehicle_no || "",
      permitNo: invoice.permit_no || "",
      shippingAddress: invoice.shipping_address || "",
      state: invoice.state,
      stateCode: invoice.state_code,
      items: typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items
    };
    
    setFormData(invoiceData);
    setViewingInvoice(invoice);
    setShowHistory(false);
    setShowPreview(true);
  };

  if (showHistory) {
    return <InvoiceHistory onViewInvoice={handleViewStoredInvoice} />;
  }

  if (showPreview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background p-4">
        <div className="max-w-4xl mx-auto space-y-6 px-2">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 bg-card/80 backdrop-blur-sm p-4 md:p-6 rounded-2xl shadow-elegant border">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Invoice Preview
              </h1>
              <p className="text-muted-foreground mt-1">Review your professional invoice</p>
            </div>
            <div className="flex flex-wrap gap-2 md:gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowPreview(false);
                  setViewingInvoice(null);
                }}
                className="hover:bg-accent transition-all duration-300 flex-shrink-0"
                size="sm"
              >
                {viewingInvoice ? 'Back to History' : 'Edit Invoice'}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowHistory(true)}
                className="hover:bg-accent transition-all duration-300 flex-shrink-0"
                size="sm"
              >
                <History className="h-4 w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">View </span>History
              </Button>
              {!viewingInvoice && (
                <Button 
                  onClick={handleSaveInvoice}
                  disabled={isSaved}
                  className="bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:shadow-lg hover:from-blue-700 hover:to-blue-600 transition-all duration-300 flex-shrink-0"
                  size="sm"
                >
                  <Save className="h-4 w-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Save </span>Invoice
                </Button>
              )}
              <Button 
                onClick={handleDownloadPDF}
                className="bg-gradient-to-r from-success to-success/80 hover:shadow-lg transition-all duration-300 flex-shrink-0"
                size="sm"
              >
                <Download className="h-4 w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Download </span>PDF
              </Button>
              <Button 
                onClick={handleExportExcel}
                className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow transition-all duration-300 flex-shrink-0"
                size="sm"
              >
                <FileSpreadsheet className="h-4 w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Export </span>Excel
              </Button>
              {!viewingInvoice && (
                <Button 
                  onClick={generateNewInvoice}
                  className="bg-gradient-to-r from-warning to-warning/80 hover:shadow-lg transition-all duration-300 flex-shrink-0"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">New </span>Invoice
                </Button>
              )}
            </div>
          </div>
          <div id="invoice-preview">
            <InvoicePreview invoiceData={formData} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-background p-4">
      {/* Header with logout button */}
      <div className="flex justify-between items-center mb-6 max-w-5xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Professional Tax Invoice Generator
        </h1>
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 hover:bg-destructive/10 hover:border-destructive hover:text-destructive transition-all duration-300"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
      
      <div className="max-w-5xl mx-auto">
        {/* Hero Header */}
        <div className="text-center mb-8 bg-gradient-to-r from-card via-accent/30 to-card backdrop-blur-sm p-8 rounded-3xl shadow-elegant border">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-primary to-primary-glow rounded-2xl shadow-glow">
              <FileText className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-primary-glow to-accent-foreground bg-clip-text text-transparent">
              Tax Invoice Generator
            </h1>
          </div>
          <p className="text-muted-foreground text-xl">
            Create professional GST invoices for any company
          </p>
          <div className="flex items-center justify-center gap-6 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Welcome to Easy_Work
            </div>
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              Smart Tax Calculations
            </div>
          </div>
        </div>

        <Card className="shadow-elegant border-0 bg-gradient-to-br from-card to-accent/20 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary-glow/5 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                Invoice Details
              </CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowHistory(true)}
                  className="hover:bg-primary/10 hover:border-primary hover:text-primary transition-all duration-300"
                >
                  <History className="h-4 w-4 mr-2" />
                  View History
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={resetInvoiceNumber}
                  className="hover:bg-warning/10 hover:border-warning hover:text-warning transition-all duration-300"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Counter
                </Button>
                <div className="px-4 py-2 bg-primary/10 rounded-lg border border-primary/20">
                  <span className="text-sm font-medium text-primary">
                    Invoice: {formData.invoiceNo}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            {/* Company Selection */}
            <div className="bg-gradient-to-r from-primary/5 to-primary-glow/5 p-6 rounded-2xl border border-primary/20">
              <h3 className="text-lg font-semibold mb-4 text-invoice-header">Company Selection</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant={formData.company === "maa-durga" ? "default" : "outline"}
                  onClick={() => updateFormField("company", "maa-durga")}
                  className="h-16 text-left justify-start p-4"
                >
                  <div>
                    <div className="font-semibold">MAA DURGA STONE WORKS</div>
                    <div className="text-sm opacity-70">Select this company</div>
                  </div>
                </Button>
                <Button
                  variant={formData.company === "bhagwati" ? "default" : "outline"}
                  onClick={() => updateFormField("company", "bhagwati")}
                  className="h-16 text-left justify-start p-4"
                >
                  <div>
                    <div className="font-semibold">M/S BHAGWATI STONE WORKS</div>
                    <div className="text-sm opacity-70">Select this company</div>
                  </div>
                </Button>
              </div>
            </div>

            {/* Basic Invoice Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="invoiceDate" className="text-base font-medium">Invoice Date</Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(e) => updateFormField("invoiceDate", e.target.value)}
                  className="h-12 transition-all duration-300 focus:shadow-md"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleNo" className="text-base font-medium">Vehicle Number</Label>
                <Input
                  id="vehicleNo"
                  value={formData.vehicleNo}
                  onChange={(e) => updateFormField("vehicleNo", e.target.value)}
                  placeholder="Enter Vehicle Number"
                  className="h-12 transition-all duration-300 focus:shadow-md"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="permitNo" className="text-base font-medium">Permit Number</Label>
                <Input
                  id="permitNo"
                  value={formData.permitNo}
                  onChange={(e) => updateFormField("permitNo", e.target.value)}
                  placeholder="Enter permit number"
                  className="h-12 transition-all duration-300 focus:shadow-md"
                />
              </div>
            </div>

            {/* Customer Details */}
            <div className="bg-gradient-to-r from-accent/30 to-transparent p-6 rounded-2xl border border-border/50">
              <h3 className="text-lg font-semibold mb-4 text-invoice-header">Customer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="customerName" className="text-base font-medium">Customer Name</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => updateFormField("customerName", e.target.value)}
                    className="h-12 transition-all duration-300 focus:shadow-md"
                    placeholder="Enter customer name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hsn" className="text-base font-medium">HSN Code</Label>
                  <Input
                    id="hsn"
                    value={formData.hsn}
                    onChange={(e) => updateFormField("hsn", e.target.value)}
                    className="h-12 transition-all duration-300 focus:shadow-md"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gstin" className="text-base font-medium">GSTIN</Label>
                  <Input
                    id="gstin"
                    value={formData.gstin}
                    onChange={(e) => updateFormField("gstin", e.target.value)}
                    className="h-12 transition-all duration-300 focus:shadow-md"
                    placeholder="Optional"
                  />
                </div>
              </div>

              {/* Saved Address Selector */}
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-base font-medium">Saved Shipping Address</Label>
                    <Select value={selectedAddressId ?? ""} onValueChange={(v) => handleSelectSavedAddress(v as any)}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select a saved address (or choose Manual)" />
                      </SelectTrigger>
                      <SelectContent>
                        {addresses.map(addr => (
                          <SelectItem key={addr.id} value={addr.id}>{addr.label}</SelectItem>
                        ))}
                        <SelectItem value="manual">Manual Entry</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex md:justify-end">
                    <Button
                      variant="outline"
                      className="h-12 hover:bg-primary/10 hover:border-primary hover:text-primary transition-all"
                      onClick={async () => {
                        const saved = await saveAddress({
                          label: formData.customerName || `Address ${new Date().toLocaleString()}`,
                          customer_name: formData.customerName || null,
                          address: formData.shippingAddress,
                          state: formData.state || null,
                          state_code: formData.stateCode || null,
                          gstin: formData.gstin || null,
                        });
                        if (saved) {
                          toast({ title: "Saved", description: "Address stored. Select it next time." });
                          setSelectedAddressId(saved.id);
                        }
                      }}
                      disabled={!formData.shippingAddress}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save This Address
                    </Button>
                  </div>
                </div>

                {/* Manage Saved Addresses */}
                {addresses.length > 0 && (
                  <div className="bg-muted/30 rounded-xl p-4 space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Manage Saved Addresses</Label>
                    <div className="flex flex-wrap gap-2">
                      {addresses.map(addr => (
                        <div key={addr.id} className="flex items-center gap-1 bg-card border rounded-lg px-3 py-2 text-sm hover:shadow-md transition-all">
                          <span className="font-medium">{addr.label}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 ml-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={async () => {
                              if (selectedAddressId === addr.id) {
                                setSelectedAddressId("");
                              }
                              await deleteAddress(addr.id);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-2">
                <Label htmlFor="shippingAddress" className="text-base font-medium">Shipping Address</Label>
                <Textarea
                  id="shippingAddress"
                  value={formData.shippingAddress}
                  onChange={(e) => updateFormField("shippingAddress", e.target.value)}
                  rows={3}
                  className="transition-all duration-300 focus:shadow-md resize-none"
                  placeholder="Enter shipping address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-base font-medium">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => updateFormField("state", e.target.value)}
                    className="h-12 transition-all duration-300 focus:shadow-md"
                    placeholder="Enter state"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stateCode" className="text-base font-medium">State Code</Label>
                  <Input
                    id="stateCode"
                    value={formData.stateCode}
                    onChange={(e) => updateFormField("stateCode", e.target.value)}
                    className="h-12 transition-all duration-300 focus:shadow-md"
                    placeholder="Enter state code (20 for Jharkhand)"
                  />
                </div>
              </div>
            </div>

            {/* Items Section */}
            <div className="bg-gradient-to-r from-accent/20 to-transparent p-6 rounded-2xl border border-border/50">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-invoice-header">Invoice Items</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={addItem}
                  className="hover:bg-primary/10 hover:border-primary hover:text-primary transition-all duration-300"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div key={item.id} className="bg-card p-6 rounded-xl border border-border/30 shadow-card hover:shadow-elegant transition-all duration-300">
                    <div className="grid grid-cols-12 gap-4 items-end">
                      <div className="col-span-4 space-y-2">
                        <Label className="text-sm font-medium">Product</Label>
                        <Input
                          value={item.product}
                          onChange={(e) => updateItem(item.id, "product", e.target.value)}
                          placeholder="Product name"
                          className="h-11 transition-all duration-300 focus:shadow-md"
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label className="text-sm font-medium">Quantity</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))}
                          className="h-11 transition-all duration-300 focus:shadow-md"
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label className="text-sm font-medium">Unit</Label>
                        <Input
                          value={item.unit}
                          onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                          className="h-11 transition-all duration-300 focus:shadow-md"
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label className="text-sm font-medium">Rate (₹)</Label>
                        <Input
                          type="number"
                          value={item.rate}
                          onChange={(e) => updateItem(item.id, "rate", Number(e.target.value))}
                          className="h-11 transition-all duration-300 focus:shadow-md"
                        />
                      </div>
                      <div className="col-span-1 space-y-2">
                        <Label className="text-sm font-medium">Amount</Label>
                        <div className="h-11 flex items-center justify-center text-sm font-semibold bg-primary/5 rounded-lg border">
                          ₹{(item.quantity * item.rate).toLocaleString()}
                        </div>
                      </div>
                      <div className="col-span-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          disabled={formData.items.length === 1}
                          className="h-11 w-full text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tax Summary */}
              <div className="mt-8 bg-gradient-to-r from-primary/5 to-primary-glow/5 p-6 rounded-xl border border-primary/20">
                <h4 className="text-lg font-semibold mb-4 text-invoice-header">Tax Calculation Summary</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-base">
                    <span>Subtotal:</span>
                    <span className="font-semibold">₹{subtotal.toLocaleString()}</span>
                  </div>
                  
                  {isJharkhand ? (
                    <>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>CGST (2.5%):</span>
                        <span>₹{cgst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>SGST (2.5%):</span>
                        <span>₹{sgst.toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>IGST (5%):</span>
                      <span>₹{igst.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="border-t pt-3 flex justify-between text-xl font-bold">
                    <span>Total Amount:</span>
                    <span className="text-primary">₹{total.toFixed(2)}</span>
                  </div>
                  
                  <div className="text-center mt-4">
                    <span className="text-xs text-muted-foreground bg-accent/50 px-3 py-1 rounded-full">
                      {isJharkhand ? "Intra-state transaction (CGST + SGST)" : "Inter-state transaction (IGST)"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-3">
                <Button 
                  onClick={() => setShowPreview(true)}
                  className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow transition-all duration-300"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Preview Invoice
                </Button>
                <Button 
                  onClick={handleSaveInvoice}
                  disabled={isSaved}
                  className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Invoice
                </Button>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  Total: ₹{total.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  Subtotal: ₹{subtotal.toLocaleString()} | Tax: ₹{(cgst + sgst + igst).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Removed duplicate full-width preview button for cleaner UX */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SimpleInvoiceForm;
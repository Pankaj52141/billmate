import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { InvoicePreview } from "./InvoicePreview";
import { InvoiceHistory } from "./InvoiceHistory";
import GSTReports from "./GSTReports";
import { FileText, Plus, Trash2, RotateCcw, Calculator, Download, FileSpreadsheet, Save, History, LogOut, X, Loader2, Building2 } from "lucide-react";
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

const INDIA_STATES = [
  { name: "Andaman and Nicobar Islands", code: "35" },
  { name: "Andhra Pradesh", code: "37" },
  { name: "Arunachal Pradesh", code: "12" },
  { name: "Assam", code: "18" },
  { name: "Bihar", code: "10" },
  { name: "Chandigarh", code: "04" },
  { name: "Chhattisgarh", code: "22" },
  { name: "Dadra and Nagar Haveli and Daman and Diu", code: "26" },
  { name: "Delhi", code: "07" },
  { name: "Goa", code: "30" },
  { name: "Gujarat", code: "24" },
  { name: "Haryana", code: "06" },
  { name: "Himachal Pradesh", code: "02" },
  { name: "Jammu and Kashmir", code: "01" },
  { name: "Jharkhand", code: "20" },
  { name: "Karnataka", code: "29" },
  { name: "Kerala", code: "32" },
  { name: "Ladakh", code: "38" },
  { name: "Lakshadweep", code: "31" },
  { name: "Madhya Pradesh", code: "23" },
  { name: "Maharashtra", code: "27" },
  { name: "Manipur", code: "14" },
  { name: "Meghalaya", code: "17" },
  { name: "Mizoram", code: "15" },
  { name: "Nagaland", code: "13" },
  { name: "Odisha", code: "21" },
  { name: "Puducherry", code: "34" },
  { name: "Punjab", code: "03" },
  { name: "Rajasthan", code: "08" },
  { name: "Sikkim", code: "11" },
  { name: "Tamil Nadu", code: "33" },
  { name: "Telangana", code: "36" },
  { name: "Tripura", code: "16" },
  { name: "Uttar Pradesh", code: "09" },
  { name: "Uttarakhand", code: "05" },
  { name: "West Bengal", code: "19" }
];


const SimpleInvoiceForm = () => {
  const [showPreview, setShowPreview] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showGSTReports, setShowGSTReports] = useState(false);
  const [invoiceCounter, setInvoiceCounter] = useState(1);
  const [viewingInvoice, setViewingInvoice] = useState<StoredInvoice | null>(null);
  const { saveInvoice, getNextInvoiceNo } = useInvoices();
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
      { id: "1", product: "", quantity: "" as any, unit: "CFT", rate: "" as any }
    ]
  });

  useEffect(() => {
    const paddedNumber = invoiceCounter.toString().padStart(4, '0');
    setFormData(prev => ({ ...prev, invoiceNo: `INV/${paddedNumber}` }));
  }, [invoiceCounter]);

  useEffect(() => {
    (async () => {
      try {
        const nextNo = await getNextInvoiceNo(formData.company);
        const numeric = parseInt((nextNo.split('/')[1] || '1').replace(/[^0-9]/g, ''), 10) || 1;
        setInvoiceCounter(numeric);
        setFormData(prev => ({ ...prev, invoiceNo: nextNo }));
      } catch (e) { /* fallback */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.company]);

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now().toString(), product: "", quantity: "" as any, unit: "CFT", rate: "" as any }]
    }));
  };

  const removeItem = (id: string) => {
    setFormData(prev => ({ ...prev, items: prev.items.filter(item => item.id !== id) }));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setFormData(prev => ({ ...prev, items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item) }));
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

  const resetInvoiceNumber = async () => {
    try {
      const nextNo = await getNextInvoiceNo(formData.company);
      const numeric = parseInt((nextNo.split('/')[1] || '1').replace(/[^0-9]/g, ''), 10) || 1;
      setInvoiceCounter(numeric);
      setFormData(prev => ({ ...prev, invoiceNo: nextNo }));
    } catch { setInvoiceCounter(1); setFormData(prev => ({ ...prev, invoiceNo: 'INV/0001' })); }
  };

  const generateNewInvoice = () => {
    setFormData(prev => ({
      ...prev, customerName: "", hsn: "25171010", gstin: "", vehicleNo: "", permitNo: "",
      shippingAddress: "", state: "", stateCode: "",
      items: [{ id: Date.now().toString(), product: "", quantity: "" as any, unit: "CFT", rate: "" as any }]
    }));
    setShowPreview(false); setIsSaved(false); setViewingInvoice(null); setSelectedAddressId("");
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const isJharkhand = formData.stateCode === "20";
    let cgst = 0, sgst = 0, igst = 0;
    if (isJharkhand) { cgst = subtotal * 0.025; sgst = subtotal * 0.025; }
    else { igst = subtotal * 0.05; }
    return { subtotal, cgst, sgst, igst, total: subtotal + cgst + sgst + igst, isJharkhand };
  };

  const { subtotal, cgst, sgst, igst, total, isJharkhand } = calculateTotals();

  const handleSaveInvoice = async () => {
    try {
      setIsSaving(true);
      const saved = await saveInvoice(formData, { subtotal, cgst, sgst, igst, total });
      if (saved) {
        setIsSaved(true); setViewingInvoice(saved);
        if (saved.invoice_no && saved.invoice_no !== formData.invoiceNo) {
          const numeric = parseInt((saved.invoice_no.split('/')[1] || '1').replace(/[^0-9]/g, ''), 10) || invoiceCounter + 1;
          setInvoiceCounter(numeric);
          setFormData(prev => ({ ...prev, invoiceNo: saved.invoice_no }));
        }
        setInvoiceCounter(prev => prev + 1);
      }
    } catch (error) { console.error('Error saving invoice:', error); }
    finally { setIsSaving(false); }
  };

  const handleDownloadPDF = async () => {
    if (!isSaved && !viewingInvoice) { toast({ title: "Save Required", description: "Save first before downloading.", variant: "destructive" }); return; }
    try {
      setIsDownloading(true);
      await downloadPDF('invoice-preview', `${formData.invoiceNo.replace('/', '_')}_${formData.customerName.replace(/\s+/g, '_')}.pdf`);
      toast({ title: "Success", description: "PDF downloaded!" });
    } catch { toast({ title: "Error", description: "Failed to download PDF", variant: "destructive" }); }
    finally { setIsDownloading(false); }
  };

  const handleExportExcel = () => {
    if (!isSaved && !viewingInvoice) { toast({ title: "Save Required", description: "Save first before exporting.", variant: "destructive" }); return; }
    try {
      setIsExporting(true);
      exportToExcel(formData, { subtotal, cgst, sgst, igst, total });
      toast({ title: "Success", description: "Excel exported!" });
    } catch { toast({ title: "Error", description: "Failed to export", variant: "destructive" }); }
    finally { setIsExporting(false); }
  };

  const handleViewStoredInvoice = (invoice: StoredInvoice) => {
    const invoiceData: SimpleInvoiceData = {
      company: invoice.company_type as "maa-durga" | "bhagwati",
      invoiceNo: invoice.invoice_no, invoiceDate: invoice.invoice_date,
      customerName: invoice.customer_name, hsn: invoice.hsn, gstin: invoice.gstin,
      vehicleNo: invoice.vehicle_no || "", permitNo: invoice.permit_no || "",
      shippingAddress: invoice.shipping_address || "", state: invoice.state, stateCode: invoice.state_code,
      items: typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items
    };
    setFormData(invoiceData); setViewingInvoice(invoice); setShowHistory(false); setShowPreview(true);
  };

  // ── GST Reports ──
  if (showGSTReports) return <GSTReports onBack={() => setShowGSTReports(false)} />;

  // ── History ──
  if (showHistory) return <InvoiceHistory onViewInvoice={handleViewStoredInvoice} onBack={() => setShowHistory(false)} />;

  // ── Preview ──
  if (showPreview) {
    return (
      <div className="min-h-screen min-h-[100dvh] p-3 md:p-6 safe-area-bottom pb-24 md:pb-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Header */}
          <div className="glass-card-strong rounded-2xl p-4 md:p-5">
            <h1 className="text-lg md:text-2xl font-semibold text-foreground mb-3">Invoice Preview</h1>
            {/* Desktop actions */}
            <div className="hidden md:flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => { setShowPreview(false); setViewingInvoice(null); }} className="rounded-xl h-9 text-sm border-white/10 hover:bg-white/5">
                {viewingInvoice ? "Back" : "Edit"}
              </Button>
              <Button variant="outline" onClick={() => setShowHistory(true)} className="rounded-xl h-9 text-sm border-white/10 hover:bg-white/5">
                <History className="h-3.5 w-3.5 mr-1.5" />History
              </Button>
              {!viewingInvoice && (
                <Button onClick={handleSaveInvoice} disabled={isSaved || isSaving} className="rounded-xl h-9 text-sm bg-primary hover:bg-primary/90">
                  {isSaving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              )}
              <Button onClick={handleDownloadPDF} disabled={(!isSaved && !viewingInvoice) || isDownloading} className="rounded-xl h-9 text-sm bg-success hover:bg-success/90">
                {isDownloading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-1.5" />}PDF
              </Button>
              <Button onClick={handleExportExcel} disabled={(!isSaved && !viewingInvoice) || isExporting} className="rounded-xl h-9 text-sm bg-primary hover:bg-primary/90">
                {isExporting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />}Excel
              </Button>
              {!viewingInvoice && (
                <Button onClick={generateNewInvoice} variant="outline" className="rounded-xl h-9 text-sm border-white/10 hover:bg-white/5">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />New
                </Button>
              )}
            </div>
          </div>

          <div id="invoice-preview"><InvoicePreview invoiceData={formData} /></div>
        </div>

        {/* Mobile bottom bar */}
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bottom-nav">
          <div className="flex items-center gap-2 p-3 overflow-x-auto">
            <Button variant="outline" size="sm" onClick={() => { setShowPreview(false); setViewingInvoice(null); }} className="shrink-0 h-10 rounded-xl text-xs border-white/10">{viewingInvoice ? "Back" : "Edit"}</Button>
            {!viewingInvoice && <Button size="sm" onClick={handleSaveInvoice} disabled={isSaved || isSaving} className="shrink-0 h-10 rounded-xl text-xs bg-primary">{isSaving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}Save</Button>}
            <Button size="sm" onClick={handleDownloadPDF} disabled={(!isSaved && !viewingInvoice) || isDownloading} className="shrink-0 h-10 rounded-xl text-xs bg-success">{isDownloading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-1" />}PDF</Button>
            <Button size="sm" onClick={handleExportExcel} disabled={(!isSaved && !viewingInvoice) || isExporting} className="shrink-0 h-10 rounded-xl text-xs bg-primary">{isExporting ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />}Excel</Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Form ──
  return (
    <div className="min-h-screen min-h-[100dvh] p-3 md:p-4 safe-area-bottom pb-24 md:pb-8">
      <div className="max-w-5xl mx-auto space-y-4 md:space-y-5">
        {/* Header Bar */}
        <div className="glass-card-strong rounded-2xl p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-white/[0.07]">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg md:text-xl font-semibold text-foreground truncate">BillMate</h1>
                <p className="text-[11px] text-muted-foreground">GST Invoice Generator</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:block px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/10 text-xs font-mono text-muted-foreground">{formData.invoiceNo}</span>
              <div className="hidden md:flex gap-1.5">
                <Button variant="ghost" size="sm" onClick={() => setShowHistory(true)} className="h-8 rounded-lg text-xs hover:bg-white/[0.06]">
                  <History className="h-3.5 w-3.5 mr-1.5" />History
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowGSTReports(true)} className="h-8 rounded-lg text-xs hover:bg-white/[0.06]">
                  <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />GST
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="h-8 rounded-lg text-xs text-destructive hover:bg-destructive/10">
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="glass-card rounded-2xl overflow-hidden">
          {/* Header — glass, not solid */}
          <div className="glass-header p-4 md:p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="h-4.5 w-4.5 text-primary" />
                <span className="text-base md:text-lg font-medium text-foreground">Invoice Details</span>
              </div>
              <div className="flex gap-2 items-center">
                <Button variant="ghost" size="sm" onClick={resetInvoiceNumber} className="h-7 rounded-lg text-[11px] text-muted-foreground hover:bg-white/[0.06]">
                  <RotateCcw className="h-3 w-3 mr-1" />Reset
                </Button>
                <span className="px-2.5 py-1 rounded-lg bg-white/[0.06] text-xs font-mono text-muted-foreground">{formData.invoiceNo}</span>
              </div>
            </div>
          </div>

          <div className="p-4 md:p-6 space-y-6">
            {/* Company Selection */}
            <div className="space-y-3">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />Company
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {[
                  { key: "maa-durga" as const, name: "MAA DURGA STONE WORKS", gstin: "20BDOPP7141M1Z8" },
                  { key: "bhagwati" as const, name: "M/S BHAGWATI STONE WORKS", gstin: "20BMAPB5737J1ZH" }
                ].map(co => (
                  <button key={co.key} onClick={() => updateFormField("company", co.key)}
                    className={`rounded-xl p-3.5 text-left transition-all duration-200 border ${
                      formData.company === co.key
                        ? "bg-primary/10 border-primary/30"
                        : "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12]"
                    }`}>
                    <div className={`font-medium text-sm ${formData.company === co.key ? "text-primary" : "text-foreground"}`}>{co.name}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">{co.gstin}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Basic Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Invoice Date</Label>
                <Input type="date" value={formData.invoiceDate} onChange={(e) => updateFormField("invoiceDate", e.target.value)} className="h-11 rounded-xl glass-input" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Vehicle Number</Label>
                <Input value={formData.vehicleNo} onChange={(e) => updateFormField("vehicleNo", e.target.value)} placeholder="JH 01 AB 1234" className="h-11 rounded-xl glass-input" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Permit Number</Label>
                <Input value={formData.permitNo} onChange={(e) => updateFormField("permitNo", e.target.value)} placeholder="Enter permit no" className="h-11 rounded-xl glass-input" />
              </div>
            </div>

            {/* Customer Section */}
            <div className="glass-card-subtle rounded-xl p-4 space-y-4">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer Information</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Customer Name</Label>
                  <Input value={formData.customerName} onChange={(e) => updateFormField("customerName", e.target.value)} placeholder="Enter name" className="h-11 rounded-xl glass-input" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">HSN Code</Label>
                  <Input value={formData.hsn} onChange={(e) => updateFormField("hsn", e.target.value)} className="h-11 rounded-xl glass-input" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">GSTIN</Label>
                  <Input value={formData.gstin} onChange={(e) => updateFormField("gstin", e.target.value)} placeholder="Optional" className="h-11 rounded-xl glass-input" />
                </div>
              </div>

              {/* Saved Addresses */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs font-medium text-muted-foreground">Saved Address</Label>
                    <Select value={selectedAddressId ?? ""} onValueChange={(v) => handleSelectSavedAddress(v as any)}>
                      <SelectTrigger className="h-11 rounded-xl glass-input"><SelectValue placeholder="Select a saved address" /></SelectTrigger>
                      <SelectContent>
                        {addresses.map(addr => <SelectItem key={addr.id} value={addr.id}>{addr.label}</SelectItem>)}
                        <SelectItem value="manual">Manual Entry</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" className="h-11 rounded-xl border-white/10 hover:bg-white/[0.06]" disabled={!formData.shippingAddress}
                    onClick={async () => {
                      const saved = await saveAddress({ label: formData.customerName || `Address ${new Date().toLocaleString()}`, customer_name: formData.customerName || null, address: formData.shippingAddress, state: formData.state || null, state_code: formData.stateCode || null, gstin: formData.gstin || null });
                      if (saved) { toast({ title: "Saved", description: "Address stored." }); setSelectedAddressId(saved.id); }
                    }}>
                    <Save className="h-3.5 w-3.5 mr-1.5" />Save Address
                  </Button>
                </div>

                {addresses.length > 0 && (
                  <div className="bg-white/[0.03] rounded-lg p-2.5 space-y-1.5">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Manage Saved</span>
                    <div className="flex flex-wrap gap-1.5">
                      {addresses.map(addr => (
                        <div key={addr.id} className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] bg-white/[0.05] border border-white/[0.08]">
                          <span>{addr.label}</span>
                          <button className="ml-1 text-destructive hover:text-destructive/80" onClick={async () => { if (selectedAddressId === addr.id) setSelectedAddressId(""); await deleteAddress(addr.id); }}>
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Shipping Address</Label>
                <Textarea value={formData.shippingAddress} onChange={(e) => updateFormField("shippingAddress", e.target.value)} rows={3} className="rounded-xl glass-input resize-none" placeholder="Enter shipping address" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">State</Label>
                  <Select 
                    value={formData.stateCode || ""} 
                    onValueChange={(code) => {
                      const stateName = INDIA_STATES.find(s => s.code === code)?.name || "";
                      setFormData(prev => ({ ...prev, stateCode: code, state: stateName }));
                    }}
                  >
                    <SelectTrigger className="h-11 rounded-xl glass-input">
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {INDIA_STATES.map(state => (
                        <SelectItem key={state.code} value={state.code}>
                          {state.name} ({state.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">State Code (Auto)</Label>
                  <Input value={formData.stateCode} readOnly className="h-11 rounded-xl glass-input opacity-70 cursor-not-allowed bg-white/[0.02]" placeholder="Auto-filled code" />
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Calculator className="h-3.5 w-3.5" />Items
                </label>
                <Button variant="outline" size="sm" onClick={addItem} className="rounded-lg h-8 text-xs border-white/10 hover:bg-white/[0.06]">
                  <Plus className="h-3 w-3 mr-1" />Add Item
                </Button>
              </div>

              <div className="space-y-2.5">
                {formData.items.map((item, index) => (
                  <div key={item.id} className="rounded-xl p-3.5 bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.12] transition-colors">
                    {/* Mobile */}
                    <div className="space-y-2.5 md:hidden">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-muted-foreground">Item {index + 1}</span>
                        <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)} disabled={formData.items.length === 1} className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <Input value={item.product} onChange={(e) => updateItem(item.id, "product", e.target.value)} placeholder="Product name" className="h-10 rounded-lg glass-input" />
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1"><Label className="text-[10px] text-muted-foreground">Qty</Label><Input type="number" value={item.quantity} onWheel={(e) => e.currentTarget.blur()} onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))} className="h-9 rounded-lg glass-input text-sm appearance-none" /></div>
                        <div className="space-y-1"><Label className="text-[10px] text-muted-foreground">Unit</Label><Input value={item.unit} onChange={(e) => updateItem(item.id, "unit", e.target.value)} className="h-9 rounded-lg glass-input text-sm" /></div>
                        <div className="space-y-1"><Label className="text-[10px] text-muted-foreground">Rate</Label><Input type="number" value={item.rate} onWheel={(e) => e.currentTarget.blur()} onChange={(e) => updateItem(item.id, "rate", Number(e.target.value))} className="h-9 rounded-lg glass-input text-sm appearance-none" /></div>
                      </div>
                      <div className="text-right"><span className="px-2.5 py-1 rounded-lg bg-primary/10 text-xs font-medium text-primary">₹{(item.quantity * item.rate).toLocaleString() || "0"}</span></div>
                    </div>

                    {/* Desktop */}
                    <div className="hidden md:grid md:grid-cols-12 gap-2.5 items-end">
                      <div className="col-span-4 space-y-1"><Label className="text-[11px] text-muted-foreground">Product</Label><Input value={item.product} onChange={(e) => updateItem(item.id, "product", e.target.value)} placeholder="Product name" className="h-10 rounded-lg glass-input" /></div>
                      <div className="col-span-2 space-y-1"><Label className="text-[11px] text-muted-foreground">Qty</Label><Input type="number" value={item.quantity} onWheel={(e) => e.currentTarget.blur()} onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))} className="h-10 rounded-lg glass-input appearance-none" /></div>
                      <div className="col-span-2 space-y-1"><Label className="text-[11px] text-muted-foreground">Unit</Label><Input value={item.unit} onChange={(e) => updateItem(item.id, "unit", e.target.value)} className="h-10 rounded-lg glass-input" /></div>
                      <div className="col-span-2 space-y-1"><Label className="text-[11px] text-muted-foreground">Rate (₹)</Label><Input type="number" value={item.rate} onWheel={(e) => e.currentTarget.blur()} onChange={(e) => updateItem(item.id, "rate", Number(e.target.value))} className="h-10 rounded-lg glass-input appearance-none" /></div>
                      <div className="col-span-1"><div className="h-10 flex items-center justify-center text-sm font-medium bg-white/[0.04] rounded-lg border border-white/[0.08]">₹{(item.quantity * item.rate).toLocaleString()}</div></div>
                      <div className="col-span-1"><Button variant="ghost" onClick={() => removeItem(item.id)} disabled={formData.items.length === 1} className="h-10 w-full rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></Button></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tax Summary */}
              <div className="rounded-xl p-4 bg-white/[0.04] border border-white/[0.1]">
                <h4 className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Calculator className="h-3.5 w-3.5" />Tax Summary
                </h4>
                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">₹{subtotal.toLocaleString()}</span></div>
                  {isJharkhand ? (<>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">CGST (2.5%)</span><span>₹{cgst.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">SGST (2.5%)</span><span>₹{sgst.toFixed(2)}</span></div>
                  </>) : (
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">IGST (5%)</span><span>₹{igst.toFixed(2)}</span></div>
                  )}
                  <div className="border-t border-white/[0.08] pt-2.5 flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="text-lg font-bold text-primary">₹{total.toFixed(2)}</span>
                  </div>
                  <div className="text-center"><span className="text-[10px] text-muted-foreground bg-white/[0.04] px-2.5 py-0.5 rounded-full">{isJharkhand ? "Intra-state (CGST + SGST)" : "Inter-state (IGST)"}</span></div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={() => setShowPreview(true)} className="h-11 rounded-xl bg-primary hover:bg-primary/90">
                  <FileText className="h-4 w-4 mr-2" />Preview Invoice
                </Button>
                <Button onClick={handleSaveInvoice} disabled={isSaved || isSaving} className="h-11 rounded-xl bg-success hover:bg-success/90">
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  {isSaving ? "Saving..." : "Save Invoice"}
                </Button>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-primary">₹{total.toLocaleString()}</div>
                <div className="text-[11px] text-muted-foreground">Subtotal: ₹{subtotal.toLocaleString()} • Tax: ₹{(cgst + sgst + igst).toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bottom-nav">
        <div className="flex items-center justify-around py-2 px-4">
          <button className="flex flex-col items-center gap-0.5 text-primary py-1 px-3">
            <FileText className="h-5 w-5" /><span className="text-[10px] font-medium">Create</span>
          </button>
          <button onClick={() => setShowHistory(true)} className="flex flex-col items-center gap-0.5 text-muted-foreground py-1 px-3 active:text-primary transition-colors">
            <History className="h-5 w-5" /><span className="text-[10px] font-medium">History</span>
          </button>
          <button onClick={() => setShowGSTReports(true)} className="flex flex-col items-center gap-0.5 text-muted-foreground py-1 px-3 active:text-primary transition-colors">
            <FileSpreadsheet className="h-5 w-5" /><span className="text-[10px] font-medium">GST</span>
          </button>
          <button onClick={handleLogout} className="flex flex-col items-center gap-0.5 text-muted-foreground py-1 px-3 active:text-destructive transition-colors">
            <LogOut className="h-5 w-5" /><span className="text-[10px] font-medium">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleInvoiceForm;
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building2, Calendar, Download, FileSpreadsheet, IndianRupee, TrendingUp, FileCheck, Loader2, BarChart3 } from "lucide-react";
import { useInvoices } from "@/hooks/useInvoices";
import { exportMonthlyGSTExcel } from "@/utils/exportUtils";
import { useToast } from "@/hooks/use-toast";

interface GSTReportsProps { onBack: () => void; }

const companyInfo = {
  "maa-durga": { name: "MAA DURGA STONE WORKS", gstin: "20BDOPP7141M1Z8" },
  "bhagwati": { name: "M/S BHAGWATI STONE WORKS", gstin: "20BMAPB5737J1ZH" },
};

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const GSTReports = ({ onBack }: GSTReportsProps) => {
  const [selectedCompany, setSelectedCompany] = useState<"maa-durga" | "bhagwati">("maa-durga");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isExporting, setIsExporting] = useState(false);
  const { invoices, loading } = useInvoices();
  const { toast } = useToast();

  const years = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - i);

  const filteredInvoices = useMemo(() => invoices.filter(inv => {
    if (inv.company_type !== selectedCompany) return false;
    const d = new Date(inv.invoice_date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  }), [invoices, selectedCompany, selectedMonth, selectedYear]);

  const summary = useMemo(() => {
    const sub = filteredInvoices.reduce((s, i) => s + i.subtotal, 0);
    const c = filteredInvoices.reduce((s, i) => s + (i.cgst || 0), 0);
    const sg = filteredInvoices.reduce((s, i) => s + (i.sgst || 0), 0);
    const ig = filteredInvoices.reduce((s, i) => s + (i.igst || 0), 0);
    const tot = filteredInvoices.reduce((s, i) => s + i.total_amount, 0);
    return { sub, c, sg, ig, tax: c + sg + ig, tot, count: filteredInvoices.length };
  }, [filteredInvoices]);

  const handleExport = async () => {
    if (!summary.count) { toast({ title: "No invoices", description: "No invoices for this period.", variant: "destructive" }); return; }
    try {
      setIsExporting(true);
      const co = companyInfo[selectedCompany];
      exportMonthlyGSTExcel(filteredInvoices, co.name, co.gstin, selectedMonth, selectedYear);
      toast({ title: "Success", description: `GST Excel for ${MONTHS[selectedMonth]} ${selectedYear} downloaded!` });
    } catch { toast({ title: "Error", description: "Failed to export", variant: "destructive" }); }
    finally { setIsExporting(false); }
  };

  const stats = [
    { label: "Invoices", value: summary.count.toString(), icon: FileCheck, bg: "bg-blue-50 text-blue-600" },
    { label: "Taxable Value", value: `₹${summary.sub.toLocaleString()}`, icon: TrendingUp, bg: "bg-emerald-50 text-emerald-600" },
    { label: "Total Tax", value: `₹${summary.tax.toFixed(2)}`, icon: BarChart3, bg: "bg-amber-50 text-amber-600" },
    { label: "Total Value", value: `₹${summary.tot.toLocaleString()}`, icon: IndianRupee, bg: "bg-violet-50 text-violet-600" },
  ];

  return (
    <div className="min-h-screen min-h-[100dvh] p-3 md:p-6 safe-area-bottom pb-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="glass-card-strong rounded-2xl p-4 md:p-5">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0 h-10 w-10 p-0 rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="p-2 bg-primary/10 rounded-xl shrink-0">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-semibold text-foreground">GST Reports</h1>
              <p className="text-xs text-muted-foreground">Generate monthly reports for your CA</p>
            </div>
          </div>
        </div>

        {/* Company Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(Object.entries(companyInfo) as [("maa-durga"|"bhagwati"), typeof companyInfo["maa-durga"]][]).map(([key, info]) => (
            <button key={key} onClick={() => setSelectedCompany(key)}
              className={`glass-card rounded-xl p-4 text-left transition-all duration-200 ${
                selectedCompany === key ? "border-primary/40 ring-1 ring-primary/20" : ""
              }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${selectedCompany === key ? "bg-primary/10" : "bg-muted"}`}>
                  <Building2 className={`h-4 w-4 ${selectedCompany === key ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className={`font-medium text-sm ${selectedCompany === key ? "text-primary" : ""}`}>{info.name}</p>
                  <p className="text-[11px] text-muted-foreground font-mono">{info.gstin}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Period */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Select Period</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="flex-1 h-10 glass-input rounded-xl text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={i.toString()}>{m}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-full sm:w-28 h-10 glass-input rounded-xl text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>{years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {MONTHS[selectedMonth]} {selectedYear} • {companyInfo[selectedCompany].name}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" /></div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {stats.map(s => (
                <div key={s.label} className="glass-card rounded-xl p-3.5">
                  <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
                    <s.icon className="h-4 w-4" />
                  </div>
                  <p className="text-base md:text-lg font-bold truncate">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Tax Breakdown */}
            {summary.count > 0 && (
              <div className="glass-card rounded-xl p-4">
                <h3 className="text-sm font-medium mb-3">Tax Breakdown</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-muted/50 rounded-lg p-3"><p className="text-[11px] text-muted-foreground">CGST @2.5%</p><p className="text-sm font-bold">₹{summary.c.toFixed(2)}</p></div>
                  <div className="bg-muted/50 rounded-lg p-3"><p className="text-[11px] text-muted-foreground">SGST @2.5%</p><p className="text-sm font-bold">₹{summary.sg.toFixed(2)}</p></div>
                  <div className="bg-muted/50 rounded-lg p-3"><p className="text-[11px] text-muted-foreground">IGST @5%</p><p className="text-sm font-bold">₹{summary.ig.toFixed(2)}</p></div>
                </div>
              </div>
            )}

            {/* Invoice List */}
            {summary.count > 0 && (
              <div className="glass-card rounded-xl overflow-hidden">
                <div className="p-3.5 border-b border-border/50">
                  <h3 className="text-sm font-medium">{summary.count} invoices in {MONTHS[selectedMonth]} {selectedYear}</h3>
                </div>
                <div className="p-2.5 space-y-1">
                  {filteredInvoices.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/30 transition-colors">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{inv.invoice_no}</span>
                          <span className="text-[11px] text-muted-foreground">{new Date(inv.invoice_date).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{inv.customer_name}</p>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-sm font-semibold">₹{inv.total_amount.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">Tax: ₹{((inv.cgst||0)+(inv.sgst||0)+(inv.igst||0)).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {summary.count === 0 && (
              <div className="glass-card rounded-xl p-8 text-center">
                <FileSpreadsheet className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="font-medium text-muted-foreground">No invoices found</p>
                <p className="text-sm text-muted-foreground/70 mt-1">No data for {MONTHS[selectedMonth]} {selectedYear}</p>
              </div>
            )}

            {/* Export Button */}
            <Button onClick={handleExport} disabled={!summary.count || isExporting}
              className="w-full h-12 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
              {isExporting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</> : <><Download className="h-4 w-4 mr-2" />Download GST Excel — {MONTHS[selectedMonth]} {selectedYear}</>}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default GSTReports;

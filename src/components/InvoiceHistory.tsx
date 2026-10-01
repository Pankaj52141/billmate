import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileSpreadsheet, Trash2, Eye, History, Building, Calendar, IndianRupee, FileDown, ArrowLeft, RefreshCw } from "lucide-react";
import { useInvoices, StoredInvoice } from "@/hooks/useInvoices";
import { exportToExcel, exportAllInvoicesToExcel } from "@/utils/exportUtils";
import { SimpleInvoiceData } from "./SimpleInvoiceForm";

interface InvoiceHistoryProps {
  onViewInvoice: (invoice: StoredInvoice) => void;
  onBack?: () => void;
}

export const InvoiceHistory = ({ onViewInvoice, onBack }: InvoiceHistoryProps) => {
  const { invoices, loading, deleteInvoice, fetchInvoices } = useInvoices();
  const [companyFilter, setCompanyFilter] = useState<string>("all");

  const filteredInvoices = companyFilter === "all" ? invoices : invoices.filter(inv => inv.company_type === companyFilter);

  const uniqueInvoices = filteredInvoices.filter((inv, idx, arr) => {
    const key = `${inv.company_type}|${inv.invoice_no}`;
    return arr.findIndex(i => `${i.company_type}|${i.invoice_no}` === key) === idx;
  });

  const handleDelete = async (id: string) => { await deleteInvoice(id); };

  const handleExportExcel = (invoice: StoredInvoice) => {
    const data: SimpleInvoiceData = {
      company: invoice.company_type as any, invoiceNo: invoice.invoice_no, invoiceDate: invoice.invoice_date,
      customerName: invoice.customer_name, hsn: invoice.hsn, gstin: invoice.gstin,
      vehicleNo: invoice.vehicle_no || "", permitNo: invoice.permit_no || "",
      shippingAddress: invoice.shipping_address || "", state: invoice.state, stateCode: invoice.state_code, items: invoice.items
    };
    exportToExcel(data, { subtotal: invoice.subtotal, cgst: invoice.cgst || 0, sgst: invoice.sgst || 0, igst: invoice.igst || 0, total: invoice.total_amount });
  };

  const formatCompanyName = (t: string) => t === 'maa-durga' ? 'MAA DURGA' : 'BHAGWATI';

  return (
    <div className="min-h-screen min-h-[100dvh] p-3 md:p-6 safe-area-bottom pb-6">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="glass-card-strong rounded-2xl p-4 md:p-5">
          <div className="flex items-center gap-3 mb-4">
            {onBack && <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0 h-10 w-10 p-0 rounded-xl hover:bg-white/[0.06]"><ArrowLeft className="h-5 w-5" /></Button>}
            <div className="p-2 rounded-xl bg-white/[0.07]"><History className="h-5 w-5 text-primary" /></div>
            <div>
              <h1 className="text-lg md:text-2xl font-semibold">Invoice History</h1>
              <p className="text-xs text-muted-foreground">View and manage saved invoices</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className="w-full sm:w-52 h-10 rounded-xl glass-input text-sm"><SelectValue placeholder="Filter" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                <SelectItem value="maa-durga">MAA DURGA STONE WORKS</SelectItem>
                <SelectItem value="bhagwati">M/S BHAGWATI STONE WORKS</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => fetchInvoices()} className="flex-1 sm:flex-none h-10 rounded-xl text-sm border-white/10 hover:bg-white/[0.06]"><RefreshCw className="h-3.5 w-3.5 mr-1.5" />Refresh</Button>
              {filteredInvoices.length > 0 && (
                <Button onClick={() => exportAllInvoicesToExcel(filteredInvoices)} className="flex-1 sm:flex-none h-10 rounded-xl bg-success hover:bg-success/90 text-sm"><FileDown className="h-3.5 w-3.5 mr-1.5" />Export All</Button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/[0.08]">
            <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><Building className="h-4 w-4" />{uniqueInvoices.length} invoice{uniqueInvoices.length !== 1 ? 's' : ''}</h2>
          </div>
          <div className="p-3 md:p-4">
            {loading ? (
              <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" /></div>
            ) : uniqueInvoices.length === 0 ? (
              <div className="text-center py-12">
                <History className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="font-medium text-muted-foreground">No invoices found</p>
                <p className="text-sm text-muted-foreground/60">Create your first invoice to see it here</p>
              </div>
            ) : (<>
              {/* Mobile Cards */}
              <div className="space-y-2 md:hidden">
                {uniqueInvoices.map(inv => (
                  <div key={inv.id} className="rounded-xl p-3.5 bg-white/[0.04] border border-white/[0.08] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{inv.invoice_no}</span>
                      <Badge variant="secondary" className="text-[10px]">{formatCompanyName(inv.company_type)}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground truncate mr-2">{inv.customer_name}</span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(inv.invoice_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-0.5 font-bold text-base text-primary"><IndianRupee className="h-3.5 w-3.5" />{inv.total_amount.toLocaleString()}</div>
                      <div className="flex gap-1.5">
                        <Button variant="outline" size="sm" onClick={() => onViewInvoice(inv)} className="h-8 w-8 p-0 rounded-lg border-white/10"><Eye className="h-3.5 w-3.5" /></Button>
                        <Button variant="outline" size="sm" onClick={() => handleExportExcel(inv)} className="h-8 w-8 p-0 rounded-lg border-white/10"><FileSpreadsheet className="h-3.5 w-3.5" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg border-white/10 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"><Trash2 className="h-3.5 w-3.5" /></Button></AlertDialogTrigger>
                          <AlertDialogContent className="mx-4 rounded-2xl"><AlertDialogHeader><AlertDialogTitle>Delete Invoice</AlertDialogTitle><AlertDialogDescription>Delete {inv.invoice_no}? Cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(inv.id)} className="bg-destructive hover:bg-destructive/90 rounded-xl">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop Table */}
              <div className="hidden md:block rounded-xl border border-white/[0.08] overflow-hidden">
                <Table>
                  <TableHeader><TableRow className="bg-white/[0.03] border-b border-white/[0.08]"><TableHead>Invoice No</TableHead><TableHead>Company</TableHead><TableHead>Customer</TableHead><TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {uniqueInvoices.map(inv => (
                      <TableRow key={inv.id} className="hover:bg-white/[0.03] border-b border-white/[0.05]">
                        <TableCell className="font-medium">{inv.invoice_no}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-xs">{formatCompanyName(inv.company_type)}</Badge></TableCell>
                        <TableCell>{inv.customer_name}</TableCell>
                        <TableCell><span className="flex items-center gap-1.5 text-muted-foreground"><Calendar className="h-3.5 w-3.5" />{new Date(inv.invoice_date).toLocaleDateString()}</span></TableCell>
                        <TableCell><span className="flex items-center gap-0.5 font-semibold"><IndianRupee className="h-3.5 w-3.5" />{inv.total_amount.toLocaleString()}</span></TableCell>
                        <TableCell>
                          <div className="flex gap-1.5">
                            <Button variant="outline" size="sm" onClick={() => onViewInvoice(inv)} className="h-8 w-8 p-0 border-white/10"><Eye className="h-3.5 w-3.5" /></Button>
                            <Button variant="outline" size="sm" onClick={() => handleExportExcel(inv)} className="h-8 w-8 p-0 border-white/10"><FileSpreadsheet className="h-3.5 w-3.5" /></Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild><Button variant="outline" size="sm" className="h-8 w-8 p-0 border-white/10 hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></AlertDialogTrigger>
                              <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Invoice</AlertDialogTitle><AlertDialogDescription>Delete {inv.invoice_no}? Cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(inv.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>)}
          </div>
        </div>
      </div>
    </div>
  );
};
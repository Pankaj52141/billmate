import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Download, 
  FileSpreadsheet, 
  Trash2, 
  Eye, 
  History,
  Building,
  Calendar,
  IndianRupee,
  FileDown
} from "lucide-react";
import { useInvoices, StoredInvoice } from "@/hooks/useInvoices";
import { downloadPDF, exportToExcel, exportAllInvoicesToExcel } from "@/utils/exportUtils";
import { SimpleInvoiceData } from "./SimpleInvoiceForm";

interface InvoiceHistoryProps {
  onViewInvoice: (invoice: StoredInvoice) => void;
}

export const InvoiceHistory = ({ onViewInvoice }: InvoiceHistoryProps) => {
  const { invoices, loading, deleteInvoice, fetchInvoices } = useInvoices();
  const [companyFilter, setCompanyFilter] = useState<string>("all");

  const filteredInvoices = companyFilter === "all" 
    ? invoices 
    : invoices.filter(invoice => invoice.company_type === companyFilter);

  const handleDelete = async (id: string) => {
    await deleteInvoice(id);
  };

  const handleExportExcel = (invoice: StoredInvoice) => {
    try {
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
        items: invoice.items
      };

      const totals = {
        subtotal: invoice.subtotal,
        cgst: invoice.cgst || 0,
        sgst: invoice.sgst || 0,
        igst: invoice.igst || 0,
        total: invoice.total_amount
      };

      exportToExcel(invoiceData, totals);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    }
  };

  const formatCompanyName = (companyType: string) => {
    return companyType === 'maa-durga' ? 'MAA DURGA STONE WORKS' : 'BHAGWATI STONE WORK';
  };

  const handleExportAllExcel = () => {
    try {
      exportAllInvoicesToExcel(filteredInvoices);
    } catch (error) {
      console.error('Error exporting all invoices to Excel:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-card via-accent/30 to-card backdrop-blur-sm p-6 rounded-3xl shadow-elegant border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-primary to-primary-glow rounded-2xl shadow-glow">
                <History className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  Invoice History
                </h1>
                <p className="text-muted-foreground">View and manage all your saved invoices</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  <SelectItem value="maa-durga">MAA DURGA STONE WORKS</SelectItem>
                  <SelectItem value="bhagwati">BHAGWATI STONE WORK</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                onClick={() => fetchInvoices()}
                className="hover:bg-primary/10 transition-all duration-300"
              >
                Refresh
              </Button>
              {filteredInvoices.length > 0 && (
                <Button 
                  onClick={handleExportAllExcel}
                  className="bg-gradient-to-r from-success to-success/80 hover:shadow-lg transition-all duration-300"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Export All to Excel
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <Card className="shadow-elegant border-0 bg-gradient-to-br from-card to-accent/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              Saved Invoices ({filteredInvoices.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No invoices found</p>
                <p className="text-sm">Create your first invoice to see it here</p>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Invoice No</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => (
                      <TableRow key={invoice.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium">
                          {invoice.invoice_no}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {formatCompanyName(invoice.company_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>{invoice.customer_name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {new Date(invoice.invoice_date).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 font-semibold">
                            <IndianRupee className="h-4 w-4" />
                            {invoice.total_amount.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onViewInvoice(invoice)}
                              className="hover:bg-primary/10 transition-all duration-300"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleExportExcel(invoice)}
                              className="hover:bg-success/10 transition-all duration-300"
                            >
                              <FileSpreadsheet className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="hover:bg-destructive/10 hover:border-destructive hover:text-destructive transition-all duration-300"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete invoice {invoice.invoice_no}? 
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(invoice.id)}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { SimpleInvoiceData } from '@/components/SimpleInvoiceForm';
import { StoredInvoice } from '@/hooks/useInvoices';

export const downloadPDF = async (elementId: string, filename: string = 'invoice.pdf') => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(filename);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const exportToExcel = (invoiceData: SimpleInvoiceData, totals: any) => {
  try {
    const workbook = XLSX.utils.book_new();
    
    // Create comprehensive invoice data for Excel
    const invoiceInfo = [
      ['INVOICE DETAILS', '', '', '', '', '', '', '', '', ''],
      ['Invoice No', invoiceData.invoiceNo, 'Company', invoiceData.company.toUpperCase(), 'Date', invoiceData.invoiceDate, '', '', '', ''],
      ['Customer Name', invoiceData.customerName, 'HSN Code', invoiceData.hsn, 'GSTIN', invoiceData.gstin, '', '', '', ''],
      ['Vehicle No', invoiceData.vehicleNo, 'Permit No', invoiceData.permitNo, 'State', invoiceData.state, 'State Code', invoiceData.stateCode, '', ''],
      ['Shipping Address', invoiceData.shippingAddress, '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', ''],
      ['ITEMIZED BREAKDOWN', '', '', '', '', '', '', '', '', ''],
      ['S.No', 'Product Name', 'Quantity', 'Unit', 'Rate (₹)', 'Amount (₹)', 'HSN', 'Tax Rate', 'Tax Amount', 'Total'],
    ];
    
    // Add items with detailed breakdown
    invoiceData.items.forEach((item, index) => {
      const itemAmount = item.quantity * item.rate;
      const taxRate = invoiceData.stateCode === "20" ? "2.5% CGST + 2.5% SGST" : "5% IGST";
      const taxAmount = itemAmount * 0.05;
      const itemTotal = itemAmount + taxAmount;
      
      invoiceInfo.push([
        (index + 1).toString(),
        item.product,
        item.quantity.toString(),
        item.unit,
        `₹${item.rate.toLocaleString()}`,
        `₹${itemAmount.toLocaleString()}`,
        invoiceData.hsn,
        taxRate,
        `₹${taxAmount.toFixed(2)}`,
        `₹${itemTotal.toFixed(2)}`
      ]);
    });
    
    // Add summary section
    invoiceInfo.push(['', '', '', '', '', '', '', '', '', '']);
    invoiceInfo.push(['TAX SUMMARY', '', '', '', '', '', '', '', '', '']);
    invoiceInfo.push(['Subtotal (Before Tax)', `₹${totals.subtotal.toFixed(2)}`, '', '', '', '', '', '', '', '']);
    
    if (totals.cgst > 0) {
      invoiceInfo.push(['CGST (2.5%)', `₹${totals.cgst.toFixed(2)}`, '', '', '', '', '', '', '', '']);
      invoiceInfo.push(['SGST (2.5%)', `₹${totals.sgst.toFixed(2)}`, '', '', '', '', '', '', '', '']);
    }
    if (totals.igst > 0) {
      invoiceInfo.push(['IGST (5%)', `₹${totals.igst.toFixed(2)}`, '', '', '', '', '', '', '', '']);
    }
    
    invoiceInfo.push(['GRAND TOTAL', `₹${totals.total.toFixed(2)}`, '', '', '', '', '', '', '', '']);
    invoiceInfo.push(['', '', '', '', '', '', '', '', '', '']);
    invoiceInfo.push(['Export Date', new Date().toLocaleString(), '', '', '', '', '', '', '', '']);
    
    const worksheet = XLSX.utils.aoa_to_sheet(invoiceInfo);
    
    // Set column widths for better formatting
    worksheet['!cols'] = [
      { width: 8 },   // S.No
      { width: 25 },  // Product Name
      { width: 10 },  // Quantity
      { width: 8 },   // Unit
      { width: 12 },  // Rate
      { width: 12 },  // Amount
      { width: 12 },  // HSN
      { width: 20 },  // Tax Rate
      { width: 12 },  // Tax Amount
      { width: 12 }   // Total
    ];
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoice Details');
    
    const filename = `${invoiceData.invoiceNo.replace('/', '_')}_${invoiceData.customerName.replace(/\s+/g, '_')}_detailed.xlsx`;
    XLSX.writeFile(workbook, filename);
    
    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw error;
  }
};

export const exportAllInvoicesToExcel = (invoices: StoredInvoice[]) => {
  try {
    const workbook = XLSX.utils.book_new();
    
    // Create summary sheet
    const summaryData = [
      ['ALL INVOICES SUMMARY', '', '', '', '', '', '', '', '', '', '', ''],
      ['Export Date', new Date().toLocaleString(), '', '', '', '', '', '', '', '', '', ''],
      ['Total Invoices', invoices.length.toString(), '', '', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', '', '', ''],
      ['S.No', 'Invoice No', 'Company', 'Date', 'Customer', 'Vehicle No', 'State', 'Subtotal', 'Tax', 'Total Amount', 'Created On', 'Status']
    ];
    
    // Add all invoices to summary
    invoices.forEach((invoice, index) => {
      const totalTax = (invoice.cgst || 0) + (invoice.sgst || 0) + (invoice.igst || 0);
      const companyName = invoice.company_type === 'maa-durga' ? 'MAA DURGA STONE WORKS' : 'BHAGWATI STONE WORK';
      
      summaryData.push([
        (index + 1).toString(),
        invoice.invoice_no,
        companyName,
        new Date(invoice.invoice_date).toLocaleDateString(),
        invoice.customer_name,
        invoice.vehicle_no || 'N/A',
        `${invoice.state} (${invoice.state_code})`,
        `₹${invoice.subtotal.toLocaleString()}`,
        `₹${totalTax.toFixed(2)}`,
        `₹${invoice.total_amount.toLocaleString()}`,
        new Date(invoice.created_at).toLocaleDateString(),
        'Completed'
      ]);
    });
    
    // Add totals row
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
    const totalSubtotal = invoices.reduce((sum, inv) => sum + inv.subtotal, 0);
    const totalTax = invoices.reduce((sum, inv) => sum + ((inv.cgst || 0) + (inv.sgst || 0) + (inv.igst || 0)), 0);
    
    summaryData.push(['', '', '', '', '', '', '', '', '', '', '', '']);
    summaryData.push(['TOTALS', '', '', '', '', '', '', `₹${totalSubtotal.toLocaleString()}`, `₹${totalTax.toFixed(2)}`, `₹${totalAmount.toLocaleString()}`, '', '']);
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Set column widths for summary sheet
    summarySheet['!cols'] = [
      { width: 6 },   // S.No
      { width: 15 },  // Invoice No
      { width: 25 },  // Company
      { width: 12 },  // Date
      { width: 20 },  // Customer
      { width: 12 },  // Vehicle No
      { width: 18 },  // State
      { width: 12 },  // Subtotal
      { width: 10 },  // Tax
      { width: 12 },  // Total Amount
      { width: 12 },  // Created On
      { width: 10 }   // Status
    ];
    
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    
    // Create detailed sheets for each company
    const maaDurgaInvoices = invoices.filter(inv => inv.company_type === 'maa-durga');
    const bhagwatiInvoices = invoices.filter(inv => inv.company_type === 'bhagwati');
    
    // Create MAA DURGA sheet if there are invoices
    if (maaDurgaInvoices.length > 0) {
      const maaDurgaData = createDetailedInvoiceSheet(maaDurgaInvoices, 'MAA DURGA STONE WORKS');
      const maaDurgaSheet = XLSX.utils.aoa_to_sheet(maaDurgaData);
      maaDurgaSheet['!cols'] = getDetailedColumnWidths();
      XLSX.utils.book_append_sheet(workbook, maaDurgaSheet, 'MAA DURGA');
    }
    
    // Create BHAGWATI sheet if there are invoices
    if (bhagwatiInvoices.length > 0) {
      const bhagwatiData = createDetailedInvoiceSheet(bhagwatiInvoices, 'BHAGWATI STONE WORK');
      const bhagwatiSheet = XLSX.utils.aoa_to_sheet(bhagwatiData);
      bhagwatiSheet['!cols'] = getDetailedColumnWidths();
      XLSX.utils.book_append_sheet(workbook, bhagwatiSheet, 'BHAGWATI');
    }
    
    const filename = `All_Invoices_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
    
    return true;
  } catch (error) {
    console.error('Error exporting all invoices to Excel:', error);
    throw error;
  }
};

const createDetailedInvoiceSheet = (invoices: StoredInvoice[], companyName: string) => {
  const data = [
    [`${companyName} - DETAILED INVOICE REPORT`, '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['Export Date', new Date().toLocaleString(), '', '', '', '', '', '', '', '', '', '', '', ''],
    ['Total Invoices', invoices.length.toString(), '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['Invoice No', 'Date', 'Customer', 'HSN', 'GSTIN', 'Vehicle No', 'Permit No', 'State', 'State Code', 'Items Count', 'Subtotal', 'CGST', 'SGST', 'IGST', 'Total', 'Created On']
  ];
  
  invoices.forEach(invoice => {
    const items = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items;
    const itemsCount = Array.isArray(items) ? items.length : 0;
    
    data.push([
      invoice.invoice_no,
      new Date(invoice.invoice_date).toLocaleDateString(),
      invoice.customer_name,
      invoice.hsn,
      invoice.gstin,
      invoice.vehicle_no || 'N/A',
      invoice.permit_no || 'N/A',
      invoice.state,
      invoice.state_code,
      itemsCount.toString(),
      `₹${invoice.subtotal.toLocaleString()}`,
      `₹${(invoice.cgst || 0).toFixed(2)}`,
      `₹${(invoice.sgst || 0).toFixed(2)}`,
      `₹${(invoice.igst || 0).toFixed(2)}`,
      `₹${invoice.total_amount.toLocaleString()}`,
      new Date(invoice.created_at).toLocaleDateString()
    ]);
    
    // Add items breakdown for each invoice
    if (Array.isArray(items)) {
      data.push(['ITEMS BREAKDOWN:', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
      items.forEach((item: any, index: number) => {
        data.push([
          `  ${index + 1}. ${item.product}`,
          `Qty: ${item.quantity}`,
          `${item.unit}`,
          `Rate: ₹${item.rate}`,
          `Amount: ₹${(item.quantity * item.rate).toLocaleString()}`,
          '', '', '', '', '', '', '', '', '', '', ''
        ]);
      });
      data.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
    }
  });
  
  return data;
};

const getDetailedColumnWidths = () => [
  { width: 15 }, // Invoice No
  { width: 12 }, // Date
  { width: 20 }, // Customer
  { width: 12 }, // HSN
  { width: 18 }, // GSTIN
  { width: 12 }, // Vehicle No
  { width: 12 }, // Permit No
  { width: 15 }, // State
  { width: 8 },  // State Code
  { width: 10 }, // Items Count
  { width: 12 }, // Subtotal
  { width: 10 }, // CGST
  { width: 10 }, // SGST
  { width: 10 }, // IGST
  { width: 12 }, // Total
  { width: 12 }  // Created On
];
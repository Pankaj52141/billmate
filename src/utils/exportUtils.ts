import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { SimpleInvoiceData } from '@/components/SimpleInvoiceForm';
import { StoredInvoice } from '@/hooks/useInvoices';

export const downloadPDF = async (elementId: string, filename: string = 'invoice.pdf') => {
  let exportElement: HTMLElement | null = null;
  let exportStyle: HTMLStyleElement | null = null;

  try {
    const sourceElement = document.getElementById(elementId);
    if (!sourceElement) {
      throw new Error('Element not found');
    }

    await document.fonts?.ready;

    // Capture a fixed, white invoice surface so mobile breakpoints and the dark app theme
    // cannot change the document while html2canvas is rendering it.
    exportElement = sourceElement.cloneNode(true) as HTMLElement;
    exportElement.classList.add('invoice-export-surface');
    exportElement.style.cssText = [
      'position: absolute',
      'left: -100000px',
      'top: 0',
      'width: 794px',
      'max-width: none',
      'background: #ffffff',
      'color: #111827',
      'opacity: 1',
      'visibility: visible',
      'z-index: -1'
    ].join(';');
    document.body.appendChild(exportElement);

    exportStyle = document.createElement('style');
    exportStyle.textContent = `
      .invoice-export-surface,
      .invoice-export-surface * {
        box-shadow: none !important;
        text-shadow: none !important;
      }
      .invoice-export-surface {
        background-color: #ffffff !important;
      }
    `;
    document.head.appendChild(exportStyle);

    const canvas = await html2canvas(exportElement, {
      scale: Math.min(2, window.devicePixelRatio || 1.5),
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 1024,
      width: 794
    });

    const pdfWidth = 210; // A4 width in mm
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    // Create PDF with dynamic height matching the content
    const pdf = new jsPDF('p', 'mm', [pdfWidth, pdfHeight]);
    
    pdf.addImage(
      canvas.toDataURL('image/jpeg', 0.95),
      'JPEG',
      0,
      0,
      pdfWidth,
      pdfHeight
    );

    const blob = pdf.output('blob');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  } finally {
    exportElement?.remove();
    exportStyle?.remove();
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
      const companyName = invoice.company_type === 'maa-durga' ? 'MAA DURGA STONE WORKS' : 'M/S BHAGWATI STONE WORKS';
      
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
      const bhagwatiData = createDetailedInvoiceSheet(bhagwatiInvoices, 'M/S BHAGWATI STONE WORKS');
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

// ═══════════════════════════════════════════════════════════════
// MONTHLY GST EXCEL EXPORT — CA-Ready Format
// ═══════════════════════════════════════════════════════════════

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export const exportMonthlyGSTExcel = (
  invoices: StoredInvoice[],
  companyName: string,
  gstin: string,
  month: number, // 0-indexed
  year: number
) => {
  try {
    const workbook = XLSX.utils.book_new();
    const monthName = MONTH_NAMES[month];
    const period = `${monthName} ${year}`;

    // ── Calculations ──
    const totalSubtotal = invoices.reduce((s, i) => s + i.subtotal, 0);
    const totalCGST = invoices.reduce((s, i) => s + (i.cgst || 0), 0);
    const totalSGST = invoices.reduce((s, i) => s + (i.sgst || 0), 0);
    const totalIGST = invoices.reduce((s, i) => s + (i.igst || 0), 0);
    const totalTax = totalCGST + totalSGST + totalIGST;
    const totalAmount = invoices.reduce((s, i) => s + i.total_amount, 0);

    // Separate B2B (with GSTIN) and B2C (without GSTIN)
    const b2bInvoices = invoices.filter(inv => inv.gstin && inv.gstin.trim().length > 0);
    const b2cInvoices = invoices.filter(inv => !inv.gstin || inv.gstin.trim().length === 0);

    // ═══ SHEET 1: GST Summary ═══
    const summaryData: (string | number)[][] = [
      ['GST MONTHLY SUMMARY REPORT'],
      [''],
      ['Company Name', companyName],
      ['GSTIN', gstin],
      ['Period', period],
      ['Report Generated', new Date().toLocaleString()],
      [''],
      ['SALES SUMMARY'],
      [''],
      ['Particulars', 'Amount (₹)'],
      ['Total Number of Invoices', invoices.length],
      ['Total Taxable Value', totalSubtotal],
      [''],
      ['TAX BREAK-UP'],
      ['CGST @2.5%', totalCGST],
      ['SGST @2.5%', totalSGST],
      ['IGST @5%', totalIGST],
      ['Total Tax Collected', totalTax],
      [''],
      ['Total Invoice Value', totalAmount],
      [''],
      ['CATEGORY-WISE BREAK-UP'],
      ['B2B Invoices (with GSTIN)', b2bInvoices.length],
      ['B2B Taxable Value', b2bInvoices.reduce((s, i) => s + i.subtotal, 0)],
      ['B2C Invoices (without GSTIN)', b2cInvoices.length],
      ['B2C Taxable Value', b2cInvoices.reduce((s, i) => s + i.subtotal, 0)],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [{ width: 30 }, { width: 20 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'GST Summary');

    // ═══ SHEET 2: B2B Sales ═══
    const b2bData: (string | number)[][] = [
      [`B2B SALES — ${companyName}`],
      [`Period: ${period}`, '', '', '', '', '', '', '', '', '', '', '', ''],
      [''],
      [
        'S.No', 'Invoice No', 'Invoice Date', 'Customer Name', 'Customer GSTIN',
        'HSN Code', 'Taxable Value (₹)', 'CGST Rate (%)', 'CGST Amount (₹)',
        'SGST Rate (%)', 'SGST Amount (₹)', 'IGST Rate (%)', 'IGST Amount (₹)', 'Total (₹)'
      ]
    ];

    b2bInvoices.forEach((inv, idx) => {
      const isIntraState = inv.state_code === '20';
      b2bData.push([
        idx + 1,
        inv.invoice_no,
        new Date(inv.invoice_date).toLocaleDateString('en-IN'),
        inv.customer_name,
        inv.gstin,
        inv.hsn,
        inv.subtotal,
        isIntraState ? 2.5 : 0,
        inv.cgst || 0,
        isIntraState ? 2.5 : 0,
        inv.sgst || 0,
        isIntraState ? 0 : 5,
        inv.igst || 0,
        inv.total_amount
      ]);
    });

    // B2B Totals Row
    if (b2bInvoices.length > 0) {
      b2bData.push([]);
      b2bData.push([
        '', '', '', '', '', 'TOTAL',
        b2bInvoices.reduce((s, i) => s + i.subtotal, 0),
        '', b2bInvoices.reduce((s, i) => s + (i.cgst || 0), 0),
        '', b2bInvoices.reduce((s, i) => s + (i.sgst || 0), 0),
        '', b2bInvoices.reduce((s, i) => s + (i.igst || 0), 0),
        b2bInvoices.reduce((s, i) => s + i.total_amount, 0)
      ]);
    }

    const b2bSheet = XLSX.utils.aoa_to_sheet(b2bData);
    b2bSheet['!cols'] = [
      { width: 6 }, { width: 14 }, { width: 14 }, { width: 22 }, { width: 18 },
      { width: 12 }, { width: 16 }, { width: 12 }, { width: 14 },
      { width: 12 }, { width: 14 }, { width: 12 }, { width: 14 }, { width: 14 }
    ];
    XLSX.utils.book_append_sheet(workbook, b2bSheet, 'B2B Sales');

    // ═══ SHEET 3: B2C Sales ═══
    const b2cData: (string | number)[][] = [
      [`B2C SALES — ${companyName}`],
      [`Period: ${period}`, '', '', '', '', '', '', '', '', '', ''],
      [''],
      [
        'S.No', 'Invoice No', 'Invoice Date', 'Customer Name',
        'HSN Code', 'Taxable Value (₹)', 'CGST Rate (%)', 'CGST Amount (₹)',
        'SGST Rate (%)', 'SGST Amount (₹)', 'IGST Rate (%)', 'IGST Amount (₹)', 'Total (₹)'
      ]
    ];

    b2cInvoices.forEach((inv, idx) => {
      const isIntraState = inv.state_code === '20';
      b2cData.push([
        idx + 1,
        inv.invoice_no,
        new Date(inv.invoice_date).toLocaleDateString('en-IN'),
        inv.customer_name,
        inv.hsn,
        inv.subtotal,
        isIntraState ? 2.5 : 0,
        inv.cgst || 0,
        isIntraState ? 2.5 : 0,
        inv.sgst || 0,
        isIntraState ? 0 : 5,
        inv.igst || 0,
        inv.total_amount
      ]);
    });

    // B2C Totals Row
    if (b2cInvoices.length > 0) {
      b2cData.push([]);
      b2cData.push([
        '', '', '', '', 'TOTAL',
        b2cInvoices.reduce((s, i) => s + i.subtotal, 0),
        '', b2cInvoices.reduce((s, i) => s + (i.cgst || 0), 0),
        '', b2cInvoices.reduce((s, i) => s + (i.sgst || 0), 0),
        '', b2cInvoices.reduce((s, i) => s + (i.igst || 0), 0),
        b2cInvoices.reduce((s, i) => s + i.total_amount, 0)
      ]);
    }

    const b2cSheet = XLSX.utils.aoa_to_sheet(b2cData);
    b2cSheet['!cols'] = [
      { width: 6 }, { width: 14 }, { width: 14 }, { width: 22 },
      { width: 12 }, { width: 16 }, { width: 12 }, { width: 14 },
      { width: 12 }, { width: 14 }, { width: 12 }, { width: 14 }, { width: 14 }
    ];
    XLSX.utils.book_append_sheet(workbook, b2cSheet, 'B2C Sales');

    // ═══ SHEET 4: HSN Summary ═══
    const hsnMap = new Map<string, {
      qty: number; unit: string; taxableValue: number;
      cgst: number; sgst: number; igst: number; totalTax: number;
    }>();

    invoices.forEach(inv => {
      const items = typeof inv.items === 'string' ? JSON.parse(inv.items) : inv.items;
      if (!Array.isArray(items)) return;

      const isIntraState = inv.state_code === '20';
      items.forEach((item: any) => {
        const amount = (item.quantity || 0) * (item.rate || 0);
        const itemCGST = isIntraState ? amount * 0.025 : 0;
        const itemSGST = isIntraState ? amount * 0.025 : 0;
        const itemIGST = isIntraState ? 0 : amount * 0.05;

        const existing = hsnMap.get(inv.hsn) || {
          qty: 0, unit: item.unit || 'CFT', taxableValue: 0,
          cgst: 0, sgst: 0, igst: 0, totalTax: 0
        };

        existing.qty += item.quantity || 0;
        existing.taxableValue += amount;
        existing.cgst += itemCGST;
        existing.sgst += itemSGST;
        existing.igst += itemIGST;
        existing.totalTax += itemCGST + itemSGST + itemIGST;

        hsnMap.set(inv.hsn, existing);
      });
    });

    const hsnData: (string | number)[][] = [
      [`HSN SUMMARY — ${companyName}`],
      [`Period: ${period}`],
      [''],
      ['HSN Code', 'UQC (Unit)', 'Total Quantity', 'Total Taxable Value (₹)', 'CGST (₹)', 'SGST (₹)', 'IGST (₹)', 'Total Tax (₹)']
    ];

    let grandTaxableValue = 0, grandCGST = 0, grandSGST = 0, grandIGST = 0, grandTotalTax = 0;

    hsnMap.forEach((data, hsn) => {
      hsnData.push([
        hsn,
        data.unit,
        data.qty,
        Math.round(data.taxableValue * 100) / 100,
        Math.round(data.cgst * 100) / 100,
        Math.round(data.sgst * 100) / 100,
        Math.round(data.igst * 100) / 100,
        Math.round(data.totalTax * 100) / 100
      ]);
      grandTaxableValue += data.taxableValue;
      grandCGST += data.cgst;
      grandSGST += data.sgst;
      grandIGST += data.igst;
      grandTotalTax += data.totalTax;
    });

    hsnData.push([]);
    hsnData.push([
      'TOTAL', '',  '',
      Math.round(grandTaxableValue * 100) / 100,
      Math.round(grandCGST * 100) / 100,
      Math.round(grandSGST * 100) / 100,
      Math.round(grandIGST * 100) / 100,
      Math.round(grandTotalTax * 100) / 100
    ]);

    const hsnSheet = XLSX.utils.aoa_to_sheet(hsnData);
    hsnSheet['!cols'] = [
      { width: 14 }, { width: 12 }, { width: 14 }, { width: 22 },
      { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }
    ];
    XLSX.utils.book_append_sheet(workbook, hsnSheet, 'HSN Summary');

    // ═══ Generate File ═══
    const safeCompanyName = companyName.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
    const filename = `GST_${safeCompanyName}_${monthName}_${year}.xlsx`;
    XLSX.writeFile(workbook, filename);

    return true;
  } catch (error) {
    console.error('Error exporting monthly GST Excel:', error);
    throw error;
  }
};

// ── Helper Functions ──

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
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
    email: "laxmiprasad9470@gmail.com",
    gstin: "20BDOPP7141M1Z8"
  },
  "bhagwati": {
    name: "M/S BHAGWATI STONE WORKS",
    proprietor: "",
    address: "MOUZA:Khaksa(Pakuria)",
    city: "PAKUR",
    state: "JHARKHAND",
    pin: "816117",
    email: "stonebhagwati97@gmail.com",
    gstin: "20BMAPB5737J1ZH"
  }
};

export const InvoicePreview = ({ invoiceData }: InvoicePreviewProps) => {
  const company = companyData[invoiceData.company];
  const {
    invoiceNo, invoiceDate, customerName, hsn, gstin,
    vehicleNo, permitNo, shippingAddress, state, stateCode, items
  } = invoiceData;

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const isJharkhand = stateCode === "20";
  let cgst = 0, sgst = 0, igst = 0;
  if (isJharkhand) { cgst = subtotal * 0.025; sgst = subtotal * 0.025; }
  else { igst = subtotal * 0.05; }
  const totalAmount = subtotal + cgst + sgst + igst;

  return (
    <div
      className="mx-auto bg-white text-gray-900 shadow-lg"
      style={{
        width: "100%",
        maxWidth: "794px",
        fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
        fontSize: "13px",
        lineHeight: "1.4",
        padding: "0",
        boxSizing: "border-box",
      }}
    >
      <div style={{ padding: "40px 44px 30px", display: "flex", flexDirection: "column" }}>

        {/* ═══ HEADER ═══ */}
        <div className="invoice-header" style={{ textAlign: "center", borderBottom: "2px solid #1a1a2e", paddingBottom: "16px", marginBottom: "20px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#1a1a2e", margin: "0 0 4px", letterSpacing: "0.5px" }}>
            Tax Invoice
          </h1>
          <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#1a1a2e", margin: "0 0 6px" }}>
            {company.name}
          </h2>
          {company.proprietor && (
            <p style={{ fontSize: "11px", color: "#555", margin: "0 0 2px" }}>
              Proprietor: {company.proprietor}
            </p>
          )}
          <p style={{ fontSize: "11px", color: "#555", margin: "0 0 1px" }}>
            {company.address}, {company.city}, {company.state} - {company.pin}
          </p>
          <p style={{ fontSize: "11px", color: "#555", margin: "0 0 1px" }}>
            Email: {company.email}
          </p>
          <p style={{ fontSize: "12px", color: "#1a1a2e", fontWeight: 600, margin: "4px 0 0" }}>
            GSTIN: {company.gstin}
          </p>
        </div>

        {/* ═══ INVOICE DETAILS TABLE ═══ */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "18px", tableLayout: "fixed" }}>
          <tbody>
            {/* Row 1: Invoice No, Date, Vehicle No, Permit No */}
            <tr>
              <td style={cellStyle} colSpan={2}>
                <span style={labelStyle}>Invoice No:</span>{" "}
                <span style={valueStyle}>{invoiceNo}</span>
              </td>
              <td style={cellStyle}>
                <span style={labelStyle}>Vehicle No:</span>{" "}
                <span style={valueStyle}>{vehicleNo || "—"}</span>
              </td>
              <td style={cellStyle}>
                <span style={labelStyle}>Permit No:</span>{" "}
                <span style={valueStyle}>{permitNo || "—"}</span>
              </td>
            </tr>
            <tr>
              <td style={cellStyle} colSpan={2}>
                <span style={labelStyle}>Date:</span>{" "}
                <span style={valueStyle}>{new Date(invoiceDate).toLocaleDateString("en-IN")}</span>
              </td>
              <td style={cellStyle} colSpan={2} rowSpan={2}>
                <span style={labelStyle}>Shipping Address:</span>
                <div style={{ ...valueStyle, marginTop: "4px", wordBreak: "break-word", whiteSpace: "pre-wrap" }}>
                  {shippingAddress || "—"}
                </div>
              </td>
            </tr>
            {/* Row 3: Customer */}
            <tr>
              <td style={cellStyle} colSpan={2}>
                <span style={labelStyle}>Customer:</span>{" "}
                <span style={{ ...valueStyle, wordBreak: "break-word" }}>{customerName || "—"}</span>
              </td>
            </tr>
            {/* Row 4: HSN, GSTIN */}
            <tr>
              <td style={cellStyle} colSpan={2}>
                <span style={labelStyle}>HSN:</span>{" "}
                <span style={valueStyle}>{hsn}</span>
              </td>
              <td style={cellStyle} colSpan={2}>
                <span style={labelStyle}>GSTIN:</span>{" "}
                <span style={valueStyle}>{gstin || "—"}</span>
              </td>
            </tr>
            {/* Row 5: State, State Code */}
            <tr>
              <td style={cellStyle} colSpan={2}>
                <span style={labelStyle}>State:</span>{" "}
                <span style={valueStyle}>{state || "—"}</span>
              </td>
              <td style={cellStyle} colSpan={2}>
                <span style={labelStyle}>State Code:</span>{" "}
                <span style={valueStyle}>{stateCode || "—"}</span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ═══ ITEMIZED LIST ═══ */}
        <div style={{ marginBottom: "18px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a2e", margin: "0 0 8px" }}>Itemized List:</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f3f4f6" }}>
                <th style={thStyle}>S.No</th>
                <th style={{ ...thStyle, textAlign: "left", width: "35%" }}>Product</th>
                <th style={thStyle}>Qty</th>
                <th style={thStyle}>Unit</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Rate (₹)</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id}>
                  <td style={{ ...tdStyle, textAlign: "center" }}>{idx + 1}</td>
                  <td style={{ ...tdStyle, textAlign: "left", wordBreak: "break-word" }}>{item.product}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>{item.quantity}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>{item.unit}</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>₹{item.rate.toLocaleString("en-IN")}</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>₹{(item.quantity * item.rate).toLocaleString("en-IN")}</td>
                </tr>
              ))}

            </tbody>
          </table>
        </div>

        {/* ═══ TAX SUMMARY ═══ */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "18px" }}>
          <tbody>
            <tr>
              <td style={{ ...summaryLabelCell, borderTop: "1px solid #d1d5db" }}>Subtotal</td>
              <td style={{ ...summaryValueCell, borderTop: "1px solid #d1d5db" }}>₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            </tr>
            {isJharkhand ? (
              <>
                <tr>
                  <td style={summaryLabelCell}>CGST (2.5%)</td>
                  <td style={summaryValueCell}>₹{cgst.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={summaryLabelCell}>SGST (2.5%)</td>
                  <td style={summaryValueCell}>₹{sgst.toFixed(2)}</td>
                </tr>
              </>
            ) : (
              <tr>
                <td style={summaryLabelCell}>IGST (5%)</td>
                <td style={summaryValueCell}>₹{igst.toFixed(2)}</td>
              </tr>
            )}
            <tr>
              <td style={{
                ...summaryLabelCell,
                borderTop: "2px solid #1a1a2e",
                fontSize: "14px",
                fontWeight: 700,
                color: "#1a1a2e",
                paddingTop: "10px",
              }}>
                Total Amount
              </td>
              <td style={{
                ...summaryValueCell,
                borderTop: "2px solid #1a1a2e",
                fontSize: "15px",
                fontWeight: 700,
                color: "#1a1a2e",
                paddingTop: "10px",
              }}>
                ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ═══ SIGNATURE ═══ */}
        <div style={{ textAlign: "right", marginTop: "60px" }}>
          <div style={{ display: "inline-block", textAlign: "center" }}>
            <div style={{ width: "180px", borderBottom: "1px solid #9ca3af", marginBottom: "6px", height: "50px" }} />
            <p style={{ fontSize: "11px", fontWeight: 600, color: "#555", margin: 0 }}>Authorized Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══ Inline style constants for the table-based layout ═══ */

const cellStyle: React.CSSProperties = {
  border: "1px solid #d1d5db",
  padding: "8px 10px",
  verticalAlign: "top",
  fontSize: "12px",
  lineHeight: "1.5",
};

const labelStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  color: "#6b7280",
};

const valueStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 600,
  color: "#111827",
};

const thStyle: React.CSSProperties = {
  border: "1px solid #d1d5db",
  padding: "8px 10px",
  fontSize: "12px",
  fontWeight: 700,
  color: "#374151",
  textAlign: "center",
};

const tdStyle: React.CSSProperties = {
  border: "1px solid #d1d5db",
  padding: "7px 10px",
  fontSize: "12px",
  color: "#111827",
};

const summaryLabelCell: React.CSSProperties = {
  textAlign: "right",
  padding: "6px 14px",
  fontSize: "12px",
  fontWeight: 500,
  color: "#374151",
  border: "none",
};

const summaryValueCell: React.CSSProperties = {
  textAlign: "right",
  padding: "6px 14px",
  fontSize: "13px",
  fontWeight: 600,
  color: "#111827",
  width: "160px",
  border: "none",
};
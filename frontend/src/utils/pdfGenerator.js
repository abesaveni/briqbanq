/**
 * BrickBanq Professional PDF Generator
 * Shared utility for all PDF downloads across the platform.
 * Uses jsPDF + jspdf-autotable with BrickBanq branding.
 */
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Brand colours
const BRAND = {
  navy: [29, 35, 117],
  indigo: [79, 70, 229],
  dark: [17, 24, 39],
  gray: [107, 114, 128],
  lightGray: [243, 244, 246],
  white: [255, 255, 255],
  green: [16, 185, 129],
  amber: [245, 158, 11],
};

// No fallback image — PDFs only use real property images attached to the case
const FALLBACK_PROPERTY_IMAGE = null;

/** Load a remote image URL and return a data-URL string via canvas. */
async function loadImageAsDataUrl(url) {
  try {
    const proxyUrl = url.startsWith("http") ? url : `${window.location.origin}${url}`;
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = proxyUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || 800;
    canvas.height = img.naturalHeight || 450;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.85);
  } catch {
    return null;
  }
}

/** Draw the BrickBanq branded header strip at the top of a page. */
function drawHeader(doc, pageWidth) {
  // Navy top bar
  doc.setFillColor(...BRAND.navy);
  doc.rect(0, 0, pageWidth, 18, "F");

  // Logo text
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND.white);
  doc.text("BRICKBANQ", 14, 12);

  // Tagline
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 210, 255);
  doc.text("Regulated Financial Workflow Platform", 60, 12);

  // Right-side generation date
  const now = new Date().toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  doc.setTextColor(200, 210, 255);
  doc.setFontSize(7);
  doc.text(`Generated: ${now}`, pageWidth - 14, 12, { align: "right" });
}

/** Draw a thin footer with page number and confidentiality notice. */
function drawFooter(doc, pageWidth, pageHeight, pageNum, totalPages) {
  const y = pageHeight - 8;
  doc.setDrawColor(...BRAND.lightGray);
  doc.setLineWidth(0.3);
  doc.line(14, y - 2, pageWidth - 14, y - 2);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.gray);
  doc.text("CONFIDENTIAL — For authorised recipients only. BrickBanq Pty Ltd.", 14, y + 2);
  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 14, y + 2, { align: "right" });
}

/**
 * Add a section heading inside the PDF.
 * Returns the new Y position after the heading.
 */
function addSectionHeading(doc, title, y, pageWidth) {
  doc.setFillColor(...BRAND.lightGray);
  doc.rect(14, y, pageWidth - 28, 8, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND.navy);
  doc.text(title.toUpperCase(), 18, y + 5.5);
  return y + 12;
}

/**
 * Add a key-value info block (2-column grid).
 * Returns the new Y position.
 */
function addInfoGrid(doc, items, startY, pageWidth) {
  let y = startY;
  const col1X = 14;
  const col2X = pageWidth / 2 + 7;
  const lineH = 8;

  for (let i = 0; i < items.length; i += 2) {
    const left = items[i];
    const right = items[i + 1];

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND.gray);
    doc.text(left.label, col1X, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BRAND.dark);
    doc.text(String(left.value ?? "—"), col1X, y + 4);

    if (right) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...BRAND.gray);
      doc.text(right.label, col2X, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...BRAND.dark);
      doc.text(String(right.value ?? "—"), col2X, y + 4);
    }

    y += lineH + 2;
  }
  return y + 4;
}

/**
 * Core function — creates a new jsPDF document with BrickBanq styling.
 *
 * @param {object} opts
 * @param {string}   opts.title         - Main document title (e.g. "Investment Memorandum")
 * @param {string}   opts.subtitle      - Subtitle line (e.g. property address)
 * @param {string}  [opts.imageUrl]     - Property hero image URL (loaded and embedded)
 * @param {Array}   [opts.sections]     - Array of { heading, rows: [[col1, col2, ...]] } for tables
 * @param {Array}   [opts.infoItems]    - Flat array of { label, value } pairs for grid layout
 * @param {string}  [opts.description]  - Optional narrative paragraph
 * @param {string}  [opts.fileName]     - Output filename (defaults to "brickbanq-report.pdf")
 */
export async function generateBrandedPDF({
  title,
  subtitle = "",
  imageUrl = null,
  sections = [],
  infoItems = [],
  description = "",
  fileName = "brickbanq-report.pdf",
}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentLeft = 14;
  const contentRight = pageWidth - 14;
  const contentWidth = contentRight - contentLeft;

  // ── Page 1: Cover with property image ─────────────────────────────────────
  drawHeader(doc, pageWidth);

  let curY = 25;

  // Only embed the real property image — no stock/fallback images
  const imgData = imageUrl ? await loadImageAsDataUrl(imageUrl) : null;
  const imgH = 70; // height in mm

  if (imgData) {
    doc.addImage(imgData, "JPEG", contentLeft, curY, contentWidth, imgH, "", "FAST");
    // Overlay gradient-like dark strip at bottom of image for text readability
    doc.setFillColor(17, 24, 39);
    doc.setGState(new doc.GState({ opacity: 0.65 }));
    doc.rect(contentLeft, curY + imgH - 28, contentWidth, 28, "F");
    doc.setGState(new doc.GState({ opacity: 1 }));

    // Title over image
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND.white);
    doc.text(title, contentLeft + 4, curY + imgH - 16);

    if (subtitle) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 215, 255);
      doc.text(subtitle, contentLeft + 4, curY + imgH - 8);
    }

    curY += imgH + 8;
  } else {
    // No image — text-only cover block
    doc.setFillColor(...BRAND.navy);
    doc.rect(contentLeft, curY, contentWidth, 36, "F");
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND.white);
    doc.text(title, contentLeft + 6, curY + 16);
    if (subtitle) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 215, 255);
      doc.text(subtitle, contentLeft + 6, curY + 27);
    }
    curY += 44;
  }

  // Optional narrative paragraph
  if (description) {
    const lines = doc.splitTextToSize(description, contentWidth);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BRAND.dark);
    doc.text(lines, contentLeft, curY);
    curY += lines.length * 5 + 6;
  }

  // Info grid
  if (infoItems.length > 0) {
    curY = addSectionHeading(doc, "Key Details", curY, pageWidth);
    curY = addInfoGrid(doc, infoItems, curY, pageWidth);
  }

  // ── Sections with tables ───────────────────────────────────────────────────
  for (const section of sections) {
    if (!section.rows || section.rows.length === 0) continue;

    // Check remaining space; add new page if needed
    if (curY > pageHeight - 60) {
      doc.addPage();
      drawHeader(doc, pageWidth);
      curY = 25;
    }

    curY = addSectionHeading(doc, section.heading, curY, pageWidth);

    autoTable(doc, {
      startY: curY,
      head: section.head ? [section.head] : undefined,
      body: section.rows,
      theme: "grid",
      margin: { left: contentLeft, right: 14 },
      headStyles: {
        fillColor: BRAND.navy,
        textColor: BRAND.white,
        fontSize: 8,
        fontStyle: "bold",
        cellPadding: 3,
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 3,
        textColor: BRAND.dark,
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      tableLineColor: [229, 231, 235],
      tableLineWidth: 0.2,
    });

    curY = doc.lastAutoTable.finalY + 10;
  }

  // ── Paginate footers ───────────────────────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, pageWidth, pageHeight, i, totalPages);
  }

  doc.save(fileName);
}

// ── Convenience wrappers ──────────────────────────────────────────────────────

/** Generate Investment Memorandum PDF for a deal/case. */
export async function generateInvestmentMemorandumPDF(deal) {
  const fmtCurrency = (v) =>
    v != null && v !== 0
      ? new Intl.NumberFormat("en-AU", {
          style: "currency",
          currency: "AUD",
          maximumFractionDigits: 0,
        }).format(v)
      : "—";

  const safeFileName = `${(deal.address || deal.title || "Investment-Memorandum").replace(/[^a-z0-9]/gi, "-")}-IM.pdf`;

  // Resolve nested or flat financial data
  const fin = deal.financials || {};
  const met = deal.metrics || {};
  const pd = deal.propertyDetails || {};

  const propertyValue = fin.propertyValuation || deal.propertyValue || deal.property_value || deal.estimated_value || 0;
  const outstandingDebt = fin.outstandingDebt || deal.outstandingDebt || deal.outstanding_debt || 0;
  const lvr = deal.lvr ?? met.lvr ?? (propertyValue > 0 ? Math.round((outstandingDebt / propertyValue) * 100) : null);
  const interestRate = deal.interestRate ?? met.interestRate ?? deal.interest_rate ?? null;
  const defaultRate = deal.defaultRate ?? met.defaultRate ?? null;
  const expectedROI = fin.expectedROI ?? deal.returnRate ?? deal.expectedROI ?? null;
  const equityAvailable = fin.equityAvailable ?? (propertyValue > 0 && outstandingDebt > 0 ? propertyValue - outstandingDebt : null);

  const firstDocImage = (deal.documents || []).find(d =>
    (d.document_type === 'Property Image' || d.type === 'Property Image') && d.file_url
  )?.file_url;

  const imageUrl = deal.image || deal.images?.[0] || firstDocImage || deal.property_image || null;
  const address = deal.address || deal.property_address || deal.location || "";
  const location = [deal.suburb, deal.state, deal.postcode].filter(Boolean).join(', ') || deal.location || "";

  await generateBrandedPDF({
    title: "INVESTMENT MEMORANDUM",
    subtitle: address || location,
    imageUrl,
    fileName: safeFileName,
    description:
      `This Investment Memorandum presents a secured lending opportunity backed by a ${
        (deal.type || deal.propertyType || "residential").toLowerCase()
      } property${deal.suburb ? ` in ${deal.suburb}` : ""}. The loan is secured by first mortgage${lvr != null ? ` at a conservative LVR of ${lvr}%` : ""}, providing significant equity protection for investors.`,
    infoItems: [
      { label: "Property Address", value: address || "—" },
      { label: "Location", value: location || "—" },
      { label: "Property Value", value: fmtCurrency(propertyValue) },
      { label: "Outstanding Debt", value: fmtCurrency(outstandingDebt) },
      { label: "LVR", value: lvr != null ? `${lvr}%` : "—" },
      { label: "Equity Buffer", value: fmtCurrency(equityAvailable) },
      { label: "Interest Rate", value: interestRate != null ? `${interestRate}% p.a.` : "—" },
      { label: "Default Rate", value: defaultRate != null ? `${defaultRate}% p.a.` : "—" },
      { label: "Expected Return", value: expectedROI != null ? `${expectedROI}%` : "—" },
      { label: "Property Type", value: deal.type || deal.propertyType || "Residential" },
      { label: "Auction Status", value: deal.status || "—" },
      { label: "Auction End Date", value: deal.auctionEndDate || deal.scheduled_end ? new Date(deal.auctionEndDate || deal.scheduled_end).toLocaleDateString("en-AU") : "—" },
    ],
    sections: [
      {
        heading: "Property Specifications",
        head: ["Attribute", "Value"],
        rows: [
          ["Property Type", deal.type || deal.propertyType || pd.propertyType || "—"],
          ["Address", address || "—"],
          ["Suburb / State", location || "—"],
          ["Bedrooms", `${pd.bedrooms ?? deal.bedrooms ?? "—"}`],
          ["Bathrooms", `${pd.bathrooms ?? deal.bathrooms ?? "—"}`],
          ["Parking Spaces", `${pd.parking ?? deal.parking ?? "—"}`],
          ["Land Size", pd.landSize ?? deal.landSize ?? "—"],
        ],
      },
      {
        heading: "Financial Summary",
        head: ["Metric", "Value"],
        rows: [
          ["Property Valuation", fmtCurrency(propertyValue)],
          ["Outstanding Debt", fmtCurrency(outstandingDebt)],
          ["Equity Buffer", fmtCurrency(equityAvailable)],
          ["Loan to Value Ratio (LVR)", lvr != null ? `${lvr}%` : "—"],
          ["Interest Rate (Original)", interestRate != null ? `${interestRate}% p.a.` : "—"],
          ["Default Interest Rate", defaultRate != null ? `${defaultRate}% p.a.` : "—"],
          ["Expected Return (IRR)", expectedROI != null ? `${expectedROI}%` : "—"],
          ["Auction Start", deal.auctionStartDate || "—"],
          ["Auction End", deal.auctionEndDate || "—"],
        ],
      },
      {
        heading: "Bid Activity",
        head: ["Metric", "Value"],
        rows: [
          ["Starting Price", fmtCurrency(deal.starting_price || deal.outstandingDebt)],
          ["Current Highest Bid", fmtCurrency(fin.currentHighestBid || deal.current_highest_bid || deal.currentBid)],
          ["Total Bidders", `${fin.bidderCount ?? deal.bid_count ?? 0}`],
          ["Time to Settlement", fin.timeToSettlement || "45 Days"],
          ["Risk Level", fin.riskLevel || met.riskLevel || "Moderate"],
        ],
      },
    ],
  });
}

/** Generate a Reports PDF (for investor/lender/admin reports pages). */
export async function generateReportPDF({
  reportTitle = "Reports",
  role = "Platform",
  dateRange = "Last 30 Days",
  summary = {},
  sections = [],
  propertyImageUrl = null,
  fileName = null,
}) {
  const timestamp = new Date().toISOString().split("T")[0];
  const safeFile = fileName || `brickbanq-${role.toLowerCase()}-report-${timestamp}.pdf`;

  const infoItems = [
    { label: "Report Type", value: reportTitle },
    { label: "Date Range", value: dateRange },
    { label: "Generated By", value: `${role} Portal` },
    { label: "Generated At", value: new Date().toLocaleString("en-AU") },
    ...(summary.totalRevenue ? [{ label: "Total Revenue", value: summary.totalRevenue }] : []),
    ...(summary.totalCases ? [{ label: "Total Cases", value: summary.totalCases }] : []),
    ...(summary.activeCases ? [{ label: "Active Cases", value: summary.activeCases }] : []),
    ...(summary.successRate ? [{ label: "Success Rate", value: summary.successRate }] : []),
  ];

  await generateBrandedPDF({
    title: `${role.toUpperCase()} ${reportTitle.toUpperCase()}`,
    subtitle: `Period: ${dateRange}`,
    imageUrl: propertyImageUrl,
    fileName: safeFile,
    infoItems,
    sections,
  });
}

/** Generate a cases/portfolio table PDF. */
export async function generateCasesTablePDF({
  title = "Portfolio Report",
  role = "Lender",
  cases = [],
  dateRange = null,
  fileName = null,
}) {
  const timestamp = new Date().toISOString().split("T")[0];
  const safeFile = fileName || `brickbanq-${role.toLowerCase()}-portfolio-${timestamp}.pdf`;

  const rows = cases.map((c) => [
    c.id || "—",
    c.title || c.property || c.address || "—",
    c.borrower || "—",
    c.status || "—",
    c.value != null
      ? new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(c.value)
      : c.loanAmount != null
      ? new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(c.loanAmount)
      : "—",
    c.lvr != null ? `${c.lvr}%` : "—",
  ]);

  await generateBrandedPDF({
    title: title.toUpperCase(),
    subtitle: `${role} Portal — ${new Date().toLocaleDateString("en-AU")}`,
    imageUrl: cases[0]?.image || cases[0]?.property_image || null,
    fileName: safeFile,
    infoItems: [
      { label: "Total Cases", value: cases.length },
      { label: "Generated", value: new Date().toLocaleString("en-AU") },
      { label: "Portal", value: `${role} Dashboard` },
      { label: "Date Range", value: dateRange || "All time" },
    ],
    sections: [
      {
        heading: "Cases Overview",
        head: ["Case ID", "Property", "Borrower", "Status", "Value", "LVR"],
        rows,
      },
    ],
  });
}

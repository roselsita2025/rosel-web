import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Helper function to auto-fit column widths in Excel sheet
 * @param {Array} data - 2D array of sheet data
 * @param {Object} worksheet - XLSX worksheet object
 */
const autofitColumns = (data, worksheet) => {
  const colWidths = [];
  
  // Calculate max width for each column
  data.forEach(row => {
    row.forEach((cell, colIndex) => {
      const cellValue = cell?.toString() || '';
      const cellLength = cellValue.length;
      
      if (!colWidths[colIndex] || cellLength > colWidths[colIndex]) {
        colWidths[colIndex] = cellLength;
      }
    });
  });
  
  // Set column widths (add some padding)
  worksheet['!cols'] = colWidths.map(width => ({ wch: Math.min(width + 2, 50) }));
};

/**
 * Helper function to set cell style (bold, merge, etc.)
 * @param {Object} worksheet - XLSX worksheet object
 * @param {string} cell - Cell reference (e.g., 'A1')
 * @param {Object} style - Style object
 */
const setCellStyle = (worksheet, cell, style) => {
  if (!worksheet[cell]) return;
  if (!worksheet[cell].s) worksheet[cell].s = {};
  
  if (style.bold) {
    worksheet[cell].s.font = { bold: true };
  }
};

/**
 * Export sales data to CSV format
 * @param {Object} data - All sales report data
 * @param {Object} dateRange - Start and end dates
 * @param {string} dataSource - Data source filter
 */
export const exportToCSV = async (data, dateRange, dataSource) => {
  try {
    const {
      salesCount,
      revenueSum,
      costDerived,
      profitDerived,
      discountsUsedSum,
      discrepancyCostImpact,
      dailyData,
      topProducts,
      paymentGatewayData,
      couponsDiscounts,
      discrepancyTrends
    } = data;

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Sheet 1: Summary
    const summaryData = [
      ['ROSEL SITA - SALES REPORT', ''],
      [`Date Range: ${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()}`, ''],
      [`Data Source: ${dataSource === 'combined' ? 'All' : dataSource === 'orders' ? 'Online Orders' : 'POS'}`, ''],
      [`Generated: ${new Date().toLocaleString()}`, ''],
      ['', ''],
      ['SUMMARY METRICS', ''],
      ['Metric', 'Value'],
      ['Total Sales', salesCount],
      ['Total Revenue', `₱${Math.round(revenueSum).toLocaleString()}`],
      ['Total Cost', `₱${Math.round(costDerived).toLocaleString()}`],
      ['Total Profit', `₱${Math.round(profitDerived).toLocaleString()}`],
      ['Discounts Used', `₱${Math.round(discountsUsedSum).toLocaleString()}`],
      ['Discrepancies Cost Impact', `₱${Math.round(discrepancyCostImpact).toLocaleString()}`],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Set column widths
    ws1['!cols'] = [{ wch: 20 }, { wch: 11 }];
    
    // Merge cells for rows 1-4 and row 6
    ws1['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }, // Row 1 (A1:B1)
      { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } }, // Row 2 (A2:B2)
      { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } }, // Row 3 (A3:B3)
      { s: { r: 3, c: 0 }, e: { r: 3, c: 1 } }, // Row 4 (A4:B4)
      { s: { r: 5, c: 0 }, e: { r: 5, c: 1 } }, // Row 6 (A6:B6)
    ];
    
    // Apply bold formatting
    ['A1', 'A2', 'A3', 'A4', 'A6', 'A7', 'B7'].forEach(cell => {
      if (ws1[cell]) {
        ws1[cell].s = { font: { bold: true } };
      }
    });
    
    XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

    // Sheet 2: Daily Sales Data
    const dailySalesData = [
      ['DAILY SALES DATA'],
      [],
      ['Date/Period', 'Target Sales', 'Actual Sales', 'Target Revenue', 'Actual Revenue', 'Target Profit', 'Actual Profit'],
      ...dailyData.map(d => [
        d.date,
        d.targetSales,
        d.actualSales,
        `₱${Math.round(d.targetRevenue || 0).toLocaleString()}`,
        `₱${Math.round(d.actualRevenue || 0).toLocaleString()}`,
        `₱${Math.round((d.targetRevenue || 0) * (data.PRODUCT_MARKUP || 0.10)).toLocaleString()}`,
        `₱${Math.round((d.actualRevenue || 0) * (data.PRODUCT_MARKUP || 0.10)).toLocaleString()}`
      ])
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(dailySalesData);
    autofitColumns(dailySalesData, ws2);
    
    // Make title and column headers bold
    if (ws2['A1']) ws2['A1'].s = { font: { bold: true } };
    ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3'].forEach(cell => {
      if (ws2[cell]) ws2[cell].s = { font: { bold: true } };
    });
    
    XLSX.utils.book_append_sheet(wb, ws2, 'Daily Sales');

    // Sheet 3: Top Products
    const topProductsData = [
      ['TOP SELLING PRODUCTS'],
      [],
      ['Product Name', 'Quantity Sold', 'Revenue'],
      ...topProducts.map(p => [
        p.productName,
        p.quantitySold,
        `₱${Number(p.revenue || 0).toLocaleString()}`
      ])
    ];
    const ws3 = XLSX.utils.aoa_to_sheet(topProductsData);
    autofitColumns(topProductsData, ws3);
    
    // Make title and column headers bold
    if (ws3['A1']) ws3['A1'].s = { font: { bold: true } };
    ['A3', 'B3', 'C3'].forEach(cell => {
      if (ws3[cell]) ws3[cell].s = { font: { bold: true } };
    });
    
    XLSX.utils.book_append_sheet(wb, ws3, 'Top Products');

    // Sheet 4: Payment Gateway
    const paymentData = [
      ['PAYMENT GATEWAY PERFORMANCE'],
      [],
      ['Date/Period', 'Cash', 'Bank', 'Online'],
      ...paymentGatewayData.map(p => [
        p.day,
        `₱${Number(p.cash || 0).toLocaleString()}`,
        `₱${Number(p.bank || 0).toLocaleString()}`,
        `₱${Number(p.online || 0).toLocaleString()}`
      ])
    ];
    const ws4 = XLSX.utils.aoa_to_sheet(paymentData);
    autofitColumns(paymentData, ws4);
    
    // Make title and column headers bold
    if (ws4['A1']) ws4['A1'].s = { font: { bold: true } };
    ['A3', 'B3', 'C3', 'D3'].forEach(cell => {
      if (ws4[cell]) ws4[cell].s = { font: { bold: true } };
    });
    
    XLSX.utils.book_append_sheet(wb, ws4, 'Payment Gateway');

    // Sheet 5: Discounts Used
    const discountsData = [
      ['DISCOUNTS USED'],
      [],
      ['Code', 'Date', 'Amount'],
      ...couponsDiscounts.map(c => [
        c.code,
        c.date.toLocaleDateString(),
        `₱${c.amount.toLocaleString()}`
      ])
    ];
    const ws5 = XLSX.utils.aoa_to_sheet(discountsData);
    autofitColumns(discountsData, ws5);
    
    // Make title and column headers bold
    if (ws5['A1']) ws5['A1'].s = { font: { bold: true } };
    ['A3', 'B3', 'C3'].forEach(cell => {
      if (ws5[cell]) ws5[cell].s = { font: { bold: true } };
    });
    
    XLSX.utils.book_append_sheet(wb, ws5, 'Discounts');

    // Sheet 6: Discrepancy Trends
    const discrepancyData = [
      ['DISCREPANCY TRENDS'],
      [],
      ['Date', 'Quantity', 'Cost Impact'],
      ...discrepancyTrends.map(d => [
        d.date,
        d.quantity,
        `₱${Math.round(d.cost || 0).toLocaleString()}`
      ])
    ];
    const ws6 = XLSX.utils.aoa_to_sheet(discrepancyData);
    autofitColumns(discrepancyData, ws6);
    
    // Make title and column headers bold
    if (ws6['A1']) ws6['A1'].s = { font: { bold: true } };
    ['A3', 'B3', 'C3'].forEach(cell => {
      if (ws6[cell]) ws6[cell].s = { font: { bold: true } };
    });
    
    XLSX.utils.book_append_sheet(wb, ws6, 'Discrepancies');

    // Generate file
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const fileName = `Sales_Report_${dateRange.start}_to_${dateRange.end}.xlsx`;
    saveAs(blob, fileName);

    return { success: true, fileName };
  } catch (error) {
    console.error('CSV Export Error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Export sales report to PDF with charts and analysis
 * @param {Object} data - All sales report data
 * @param {Object} dateRange - Start and end dates
 * @param {string} dataSource - Data source filter
 */
export const exportToPDF = async (data, dateRange, dataSource) => {
  try {
    const {
      salesCount,
      revenueSum,
      costDerived,
      profitDerived,
      discountsUsedSum,
      discrepancyCostImpact,
      dailyData,
      topProducts,
      paymentGatewayData,
      couponsDiscounts,
      discrepancyTrends,
      PRODUCT_MARKUP,
      chartImages
    } = data;

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPos = 20;

    // Helper function to check if we need a new page
    const checkPageBreak = (neededSpace) => {
      if (yPos + neededSpace > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
        return true;
      }
      return false;
    };

    // ====== PAGE 1: COVER PAGE ======
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(134, 8, 9); // #860809
    doc.text('SALES REPORT', pageWidth / 2, 60, { align: 'center' });

    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('Rosel Sita', pageWidth / 2, 80, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`Date Range: ${new Date(dateRange.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${new Date(dateRange.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`, pageWidth / 2, 95, { align: 'center' });
    
    doc.text(`Data Source: ${dataSource === 'combined' ? 'All Sources' : dataSource === 'orders' ? 'Online Orders' : 'POS'}`, pageWidth / 2, 105, { align: 'center' });
    
    doc.text(`Generated: ${new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, pageWidth / 2, 115, { align: 'center' });

    // Add decorative line
    doc.setDrawColor(134, 8, 9);
    doc.setLineWidth(0.5);
    doc.line(40, 130, pageWidth - 40, 130);

    // ====== PAGE 2: EXECUTIVE SUMMARY ======
    doc.addPage();
    yPos = 20;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(134, 8, 9);
    doc.text('EXECUTIVE SUMMARY', 20, yPos);
    yPos += 15;

    // Key Metrics Cards
    const metrics = [
      { label: 'Total Sales', value: salesCount.toLocaleString() },
      { label: 'Total Revenue', value: `P${Math.round(revenueSum).toLocaleString()}` },
      { label: 'Total Cost', value: `P${Math.round(costDerived).toLocaleString()}` },
      { label: 'Total Profit', value: `P${Math.round(profitDerived).toLocaleString()}` },
      { label: 'Discounts Used', value: `P${Math.round(discountsUsedSum).toLocaleString()}` },
      { label: 'Discrepancies', value: `P${Math.round(discrepancyCostImpact).toLocaleString()}` },
    ];

    const cardWidth = (pageWidth - 50) / 3;
    const cardHeight = 25;
    let cardX = 20;
    let cardY = yPos;

    metrics.forEach((metric, index) => {
      if (index === 3) {
        cardY += cardHeight + 5;
        cardX = 20;
      }

      // Draw card background
      doc.setFillColor(255, 254, 252);
      doc.setDrawColor(200, 200, 200);
      doc.roundedRect(cardX, cardY, cardWidth - 5, cardHeight, 2, 2, 'FD');

      // Add metric label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(134, 8, 9);
      doc.text(metric.label, cardX + 5, cardY + 8);

      // Add metric value
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(metric.value, cardX + 5, cardY + 18);

      cardX += cardWidth;
    });

    yPos = cardY + cardHeight + 15;

    // Descriptive Analysis
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(134, 8, 9);
    doc.text('DESCRIPTIVE ANALYSIS', 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    const profitMargin = ((profitDerived / revenueSum) * 100).toFixed(2);
    const avgDailyRevenue = (revenueSum / dailyData.filter(d => d.actualRevenue > 0).length).toFixed(2);
    const discountRate = ((discountsUsedSum / revenueSum) * 100).toFixed(2);

    const execSummaryLines = [
      `Profit Margin: The business achieved a ${profitMargin}% profit margin during this period,`,
      `with a product markup of ${(PRODUCT_MARKUP * 100).toFixed(0)}%.`,
      '',
      `Average Daily Revenue: P${Number(avgDailyRevenue).toLocaleString()} per active sales day.`,
      '',
      `Discount Impact: ${discountRate}% of revenue was discounted, totaling`,
      `P${Math.round(discountsUsedSum).toLocaleString()}.`,
      '',
      `Top Product Performance: The highest revenue product generated`,
      `P${Number(topProducts[0]?.revenue || 0).toLocaleString()}.`,
      '',
      `Operational Efficiency: Discrepancies resulted in P${Math.round(discrepancyCostImpact).toLocaleString()}`,
      `cost impact during this period.`,
    ];

    execSummaryLines.forEach(line => {
      if (line.startsWith('Profit') || line.startsWith('Average') || line.startsWith('Discount') || line.startsWith('Top') || line.startsWith('Operational')) {
        doc.setFont('helvetica', 'bold');
        const parts = line.split(':');
        doc.text(parts[0] + ':', 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(parts[1] || '', 75, yPos);
      } else if (line === '') {
        // Empty line
      } else {
        doc.text(line, 20, yPos);
      }
      yPos += 6;
    });

    // Calculate metrics for all forecast pages
    const currentSales = dailyData.reduce((sum, d) => sum + d.actualSales, 0);
    const targetSales = dailyData.reduce((sum, d) => sum + d.targetSales, 0);
    const salesGrowth = targetSales > 0 ? (((currentSales - targetSales) / targetSales) * 100).toFixed(2) : 0;

    const currentRevenue = dailyData.reduce((sum, d) => sum + d.actualRevenue, 0);
    const targetRevenue = dailyData.reduce((sum, d) => sum + d.targetRevenue, 0);
    const revenueGrowth = targetRevenue > 0 ? (((currentRevenue - targetRevenue) / targetRevenue) * 100).toFixed(2) : 0;

    const currentProfit = profitDerived;
    const targetProfit = targetRevenue * PRODUCT_MARKUP;
    const profitGrowth = targetProfit > 0 ? (((currentProfit - targetProfit) / targetProfit) * 100).toFixed(2) : 0;

    // ====== PAGE 3: SALES FORECAST ======
    doc.addPage();
    yPos = 20;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(134, 8, 9);
    doc.text('SALES FORECAST', 20, yPos);
    yPos += 10;

    // Add chart image if available
    if (chartImages && chartImages['sales-forecast-chart']) {
      doc.addImage(chartImages['sales-forecast-chart'], 'PNG', 20, yPos, pageWidth - 40, 70);
      yPos += 75;
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('[Sales Forecast Chart - Target vs Actual]', pageWidth / 2, yPos + 5, { align: 'center' });
      yPos += 80;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(134, 8, 9);
    doc.text('DESCRIPTIVE ANALYSIS', 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`Current Period Sales: ${currentSales} units`, 20, yPos);
    yPos += 6;
    doc.text(`Target Sales: ${targetSales} units`, 20, yPos);
    yPos += 6;
    doc.text(`Variance: ${(currentSales - targetSales)} units (${salesGrowth}%)`, 20, yPos);
    yPos += 12;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(134, 8, 9);
    doc.text('FORECAST ANALYSIS', 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    const salesAnalysisLines = [
      `Performance vs Target: Current sales are ${Math.abs(salesGrowth)}% ${salesGrowth >= 0 ? 'above' : 'below'}`,
      `the target based on previous year performance.`,
      '',
      `Trend: ${currentSales > targetSales ? 'Positive momentum observed with sales exceeding targets.' : 'Sales are below target.'}`,
      `${currentSales > targetSales ? 'Continue current strategies to maintain growth.' : 'Consider promotional campaigns or inventory optimization.'}`,
      '',
      `Recommendation: ${salesGrowth >= 0 ? 'Maintain current sales strategies and expand market reach.' : 'Analyze customer feedback and adjust product offerings.'}`,
    ];

    salesAnalysisLines.forEach(line => {
      if (line === '') {
        yPos += 3;
      } else {
        doc.text(line, 20, yPos, { maxWidth: pageWidth - 40 });
        yPos += 6;
      }
    });

    // ====== PAGE 4: PROFIT FORECAST ======
    doc.addPage();
    yPos = 20;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(134, 8, 9);
    doc.text('PROFIT FORECAST', 20, yPos);
    yPos += 10;

    // Add chart image if available
    if (chartImages && chartImages['profit-forecast-chart']) {
      doc.addImage(chartImages['profit-forecast-chart'], 'PNG', 20, yPos, pageWidth - 40, 70);
      yPos += 75;
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('[Profit Forecast Chart - Target Bar vs Actual Line]', pageWidth / 2, yPos + 5, { align: 'center' });
      yPos += 80;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(134, 8, 9);
    doc.text('DESCRIPTIVE ANALYSIS', 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`Current Period Profit: P${Math.round(currentProfit).toLocaleString()}`, 20, yPos);
    yPos += 6;
    doc.text(`Target Profit: P${Math.round(targetProfit).toLocaleString()}`, 20, yPos);
    yPos += 6;
    doc.text(`Profit Margin: ${profitMargin}%`, 20, yPos);
    yPos += 6;
    doc.text(`Variance: P${Math.round(currentProfit - targetProfit).toLocaleString()} (${profitGrowth}%)`, 20, yPos);
    yPos += 12;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(134, 8, 9);
    doc.text('FORECAST ANALYSIS', 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    const profitAnalysisLines = [
      `Profitability Outlook: With current profit margin of ${profitMargin}%, the business`,
      `${parseFloat(profitMargin) > 20 ? 'demonstrates strong profitability.' : 'has room for margin improvement through cost optimization.'}`,
      '',
      `Trend: Profit has ${profitGrowth >= 0 ? 'increased' : 'decreased'} by ${Math.abs(profitGrowth)}%`,
      `compared to the target period.`,
      '',
      `Recommendation: ${parseFloat(profitMargin) < 15 ? 'Focus on reducing operational costs and optimizing pricing.' : 'Maintain current profit margins while exploring growth opportunities.'}`,
    ];

    profitAnalysisLines.forEach(line => {
      if (line === '') {
        yPos += 3;
      } else {
        doc.text(line, 20, yPos, { maxWidth: pageWidth - 40 });
        yPos += 6;
      }
    });

    // ====== PAGE 5: REVENUE FORECAST ======
    doc.addPage();
    yPos = 20;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(134, 8, 9);
    doc.text('REVENUE FORECAST', 20, yPos);
    yPos += 10;

    // Add chart image if available
    if (chartImages && chartImages['revenue-forecast-chart']) {
      doc.addImage(chartImages['revenue-forecast-chart'], 'PNG', 20, yPos, pageWidth - 40, 70);
      yPos += 75;
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('[Revenue Forecast Chart - Revenue & Cost Bars, Target Line]', pageWidth / 2, yPos + 5, { align: 'center' });
      yPos += 80;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(134, 8, 9);
    doc.text('DESCRIPTIVE ANALYSIS', 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`Current Period Revenue: P${Math.round(currentRevenue).toLocaleString()}`, 20, yPos);
    yPos += 6;
    doc.text(`Target Revenue: P${Math.round(targetRevenue).toLocaleString()}`, 20, yPos);
    yPos += 6;
    doc.text(`Total Cost: P${Math.round(costDerived).toLocaleString()}`, 20, yPos);
    yPos += 6;
    doc.text(`Variance: P${Math.round(currentRevenue - targetRevenue).toLocaleString()} (${revenueGrowth}%)`, 20, yPos);
    yPos += 12;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(134, 8, 9);
    doc.text('FORECAST ANALYSIS', 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    const revenueAnalysisLines = [
      `Revenue Growth: Revenue has ${revenueGrowth >= 0 ? 'increased' : 'decreased'} by ${Math.abs(revenueGrowth)}%`,
      `compared to the same period last year.`,
      '',
      `Trend: ${currentRevenue > targetRevenue ? 'Strong revenue growth indicates successful business strategies.' : 'Revenue is below target, requiring strategic adjustments.'}`,
      '',
      `Recommendation: ${revenueGrowth >= 0 ? 'Continue current revenue strategies and explore upselling opportunities.' : 'Review pricing strategy and expand customer base.'}`,
    ];

    revenueAnalysisLines.forEach(line => {
      if (line === '') {
        yPos += 3;
      } else {
        doc.text(line, 20, yPos, { maxWidth: pageWidth - 40 });
        yPos += 6;
      }
    });

    // ====== PAGE 6: TOP SELLING PRODUCTS ======
    doc.addPage();
    yPos = 20;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(134, 8, 9);
    doc.text('TOP SELLING PRODUCTS', 20, yPos);
    yPos += 10;

    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Product Name', 'Quantity Sold', 'Revenue']],
      body: topProducts.map((p, index) => [
        index + 1,
        p.productName,
        p.quantitySold,
        `P${Number(p.revenue || 0).toLocaleString()}`
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: [134, 8, 9],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [0, 0, 0]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { halign: 'left', cellWidth: 80 },
        2: { halign: 'center', cellWidth: 35 },
        3: { halign: 'right', cellWidth: 40 }
      },
      margin: { left: 20, right: 20 },
      didDrawPage: function(data) {
        yPos = data.cursor.y;
      }
    });

    yPos += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(134, 8, 9);
    doc.text('DESCRIPTIVE ANALYSIS', 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    const topProductAnalysis = [
      `Best Performer: ${topProducts[0]?.productName || 'N/A'} generated P${Number(topProducts[0]?.revenue || 0).toLocaleString()}`,
      `in revenue with ${topProducts[0]?.quantitySold || 0} units sold.`,
      '',
      `Product Diversity: ${topProducts.length} different products contributed to sales during`,
      `this period.`,
      '',
      `Recommendation: Focus inventory on top-performing products while monitoring`,
      `slow-moving items for potential promotions or discontinuation.`,
    ];

    topProductAnalysis.forEach(line => {
      if (line === '') {
        yPos += 3;
      } else {
        doc.text(line, 20, yPos, { maxWidth: pageWidth - 40 });
        yPos += 6;
      }
    });

    // ====== PAGE 7: PAYMENT GATEWAY PERFORMANCE ======
    doc.addPage();
    yPos = 20;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(134, 8, 9);
    doc.text('PAYMENT GATEWAY PERFORMANCE', 20, yPos);
    yPos += 10;

    // Add chart image if available
    if (chartImages && chartImages['payment-gateway-chart']) {
      doc.addImage(chartImages['payment-gateway-chart'], 'PNG', 20, yPos, pageWidth - 40, 70);
      yPos += 75;
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('[Payment Gateway Performance Chart - Cash, Bank, Online by Day]', pageWidth / 2, yPos + 5, { align: 'center' });
      yPos += 80;
    }

    const cashTotal = paymentGatewayData.reduce((sum, p) => sum + (p.cash || 0), 0);
    const bankTotal = paymentGatewayData.reduce((sum, p) => sum + (p.bank || 0), 0);
    const onlineTotal = paymentGatewayData.reduce((sum, p) => sum + (p.online || 0), 0);
    const totalPayments = cashTotal + bankTotal + onlineTotal;

    autoTable(doc, {
      startY: yPos,
      head: [['Payment Method', 'Total Amount', 'Percentage']],
      body: [
        ['Cash', `P${Math.round(cashTotal).toLocaleString()}`, `${((cashTotal / totalPayments) * 100).toFixed(2)}%`],
        ['Bank', `P${Math.round(bankTotal).toLocaleString()}`, `${((bankTotal / totalPayments) * 100).toFixed(2)}%`],
        ['Online', `P${Math.round(onlineTotal).toLocaleString()}`, `${((onlineTotal / totalPayments) * 100).toFixed(2)}%`],
        ['TOTAL', `P${Math.round(totalPayments).toLocaleString()}`, '100%']
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [134, 8, 9],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 10
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 80 },
        1: { halign: 'right', cellWidth: 50 },
        2: { halign: 'center', cellWidth: 40 }
      },
      footStyles: {
        fillColor: [240, 240, 240],
        fontStyle: 'bold'
      },
      margin: { left: 20, right: 20 },
      didDrawPage: function(data) {
        yPos = data.cursor.y;
      }
    });

    yPos += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(134, 8, 9);
    doc.text('DESCRIPTIVE ANALYSIS', 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    const dominantMethod = cashTotal > bankTotal && cashTotal > onlineTotal ? 'Cash' : 
                           bankTotal > onlineTotal ? 'Bank' : 'Online';
    const dominantPercentage = ((Math.max(cashTotal, bankTotal, onlineTotal) / totalPayments) * 100).toFixed(2);

    const paymentAnalysis = [
      `Payment Distribution: ${dominantMethod} is the most preferred payment method,`,
      `accounting for ${dominantPercentage}% of total transactions.`,
      '',
      `Cash Transactions: P${Math.round(cashTotal).toLocaleString()} (${((cashTotal / totalPayments) * 100).toFixed(2)}%)`,
      `Bank Transfers: P${Math.round(bankTotal).toLocaleString()} (${((bankTotal / totalPayments) * 100).toFixed(2)}%)`,
      `Online Payments: P${Math.round(onlineTotal).toLocaleString()} (${((onlineTotal / totalPayments) * 100).toFixed(2)}%)`,
      '',
      `Recommendation: ${cashTotal > totalPayments * 0.7 ? 'Consider promoting digital payment methods for better tracking and security.' : 'Payment methods are well-distributed across different channels.'}`,
    ];

    paymentAnalysis.forEach(line => {
      if (line === '') {
        yPos += 3;
      } else {
        doc.text(line, 20, yPos, { maxWidth: pageWidth - 40 });
        yPos += 6;
      }
    });

    // ====== PAGE 8: DISCREPANCY TRENDS ======
    doc.addPage();
    yPos = 20;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(134, 8, 9);
    doc.text('DISCREPANCY TRENDS', 20, yPos);
    yPos += 10;

    // Add chart image if available
    if (chartImages && chartImages['discrepancy-trends-chart']) {
      doc.addImage(chartImages['discrepancy-trends-chart'], 'PNG', 20, yPos, pageWidth - 40, 70);
      yPos += 75;
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('[Discrepancy Trends Chart - Daily Discrepancies]', pageWidth / 2, yPos + 5, { align: 'center' });
      yPos += 80;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(134, 8, 9);
    doc.text('DESCRIPTIVE ANALYSIS', 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    const totalDiscrepancyQuantity = discrepancyTrends.reduce((sum, d) => sum + (d.quantity || 0), 0);
    const discrepancyAnalysis = [
      `Total Cost Impact: P${Math.round(discrepancyCostImpact).toLocaleString()} in losses due to ${totalDiscrepancyQuantity} discrepancies.`,
      '',
      `Impact: Discrepancies represent actual financial losses from write-offs, damaged goods,`,
      `and approved replacement requests. This directly affects profitability.`,
      '',
      `Trend: ${discrepancyCostImpact > 5000 ? 'Cost impact exceeds recommended threshold. Immediate attention required.' : 'Cost impact is within acceptable range.'}`,
      '',
      `Recommendation: ${discrepancyCostImpact > 5000 ? 'Implement stricter inventory controls, quality checks, and staff training programs.' : 'Maintain current inventory management practices.'}`,
    ];

    discrepancyAnalysis.forEach(line => {
      if (line === '') {
        yPos += 3;
      } else {
        doc.text(line, 20, yPos, { maxWidth: pageWidth - 40 });
        yPos += 6;
      }
    });

    // ====== PAGE 9: DISCOUNTS USED ======
    doc.addPage();
    yPos = 20;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(134, 8, 9);
    doc.text('DISCOUNTS USED', 20, yPos);
    yPos += 10;

    if (couponsDiscounts.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [['Code', 'Date', 'Amount']],
        body: couponsDiscounts.slice(0, 50).map(c => [
          c.code,
          c.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          `P${c.amount.toLocaleString()}`
        ]),
        theme: 'striped',
        headStyles: {
          fillColor: [134, 8, 9],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 9
        },
        columnStyles: {
          0: { halign: 'left', cellWidth: 60 },
          1: { halign: 'center', cellWidth: 50 },
          2: { halign: 'right', cellWidth: 60 }
        },
        margin: { left: 20, right: 20 },
        didDrawPage: function(data) {
          yPos = data.cursor.y;
        }
      });

      yPos += 10;

      if (couponsDiscounts.length > 50) {
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Showing top 50 of ${couponsDiscounts.length} total discounts.`, 20, yPos);
        yPos += 6;
      }
    } else {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('No discounts were used during this period.', 20, yPos);
      yPos += 10;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(134, 8, 9);
    doc.text('DESCRIPTIVE ANALYSIS', 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    const discountAnalysis = [
      `Total Discounts: P${Math.round(discountsUsedSum).toLocaleString()} in discounts were applied`,
      `during this period.`,
      '',
      `Discount Rate: ${discountRate}% of total revenue was discounted.`,
      '',
      `Impact: ${discountRate > 15 ? 'High discount rate may be affecting profit margins.' : 'Discount strategy is balanced and sustainable.'}`,
      '',
      `Recommendation: ${discountRate > 15 ? 'Consider reducing discount frequency or amounts to improve net revenue.' : 'Continue current discount strategy to maintain customer satisfaction.'}`,
    ];

    discountAnalysis.forEach(line => {
      if (line === '') {
        yPos += 3;
      } else {
        doc.text(line, 20, yPos, { maxWidth: pageWidth - 40 });
        yPos += 6;
      }
    });

    // ====== FOOTER ON EACH PAGE ======
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      doc.text('Confidential - Rosel Sita', 20, pageHeight - 10);
      doc.text(new Date().toLocaleDateString(), pageWidth - 20, pageHeight - 10, { align: 'right' });
    }

    // Save the PDF
    const fileName = `Sales_Report_${dateRange.start}_to_${dateRange.end}.pdf`;
    doc.save(fileName);

    return { success: true, fileName };
  } catch (error) {
    console.error('PDF Export Error:', error);
    return { success: false, error: error.message };
  }
};


const PDFDocument = require("pdfkit");

const PAGE_WIDTH = 420;
const PAGE_HEIGHT = 470;
const MARGIN = 28;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const RED = "#c4122f";
const INK = "#1c1f26";
const MUTED = "#8a8f98";
const RULE = "#dfe1e6";
const SEAT_FILL = "#fdecee";

const label = (doc, text, x, y, options = {}) =>
  doc
    .font("Helvetica")
    .fontSize(7.5)
    .fillColor(MUTED)
    .text(text.toUpperCase(), x, y, { characterSpacing: 1, ...options });

const value = (doc, text, x, y, options = {}) =>
  doc.font("Helvetica-Bold").fontSize(12).fillColor(INK).text(text, x, y, options);

const buildTicketPdf = (ticket) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: [PAGE_WIDTH, PAGE_HEIGHT],
      margin: 0,
      info: { Title: `Ticket ${ticket.code}`, Author: "BookMyShow" },
    });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill("#ffffff");

    doc.rect(0, 0, PAGE_WIDTH, 54).fill(RED);
    doc.font("Helvetica-Bold").fontSize(16).fillColor("#ffffff").text("BookMyShow", MARGIN, 19);
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .text("E-TICKET", MARGIN, 23, { width: CONTENT_WIDTH, align: "right", characterSpacing: 2 });

    let y = 78;
    doc.font("Helvetica-Bold").fontSize(22).fillColor(INK).text(ticket.movieTitle, MARGIN, y, {
      width: CONTENT_WIDTH,
    });
    y = doc.y + 4;
    doc.font("Helvetica").fontSize(10).fillColor(MUTED).text(ticket.movieInfo, MARGIN, y);

    const columnWidth = CONTENT_WIDTH / 2;
    const rightColumn = MARGIN + columnWidth;
    y = doc.y + 22;
    label(doc, "Theatre", MARGIN, y);
    label(doc, "Date", rightColumn, y);
    value(doc, ticket.theatreName, MARGIN, y + 12, { width: columnWidth - 10 });
    const theatreBottom = doc.y;
    doc.font("Helvetica").fontSize(10).fillColor(MUTED).text(ticket.theatreCity, MARGIN, theatreBottom + 2);
    value(doc, ticket.date, rightColumn, y + 12, { width: columnWidth });

    y = Math.max(doc.y, theatreBottom + 14) + 18;
    label(doc, "Time", MARGIN, y);
    label(doc, "Tickets", rightColumn, y);
    value(doc, ticket.time, MARGIN, y + 12);
    value(doc, ticket.ticketsLine, rightColumn, y + 12);

    y += 48;
    label(doc, "Seats", MARGIN, y);
    let seatX = MARGIN;
    let seatY = y + 14;
    doc.font("Helvetica-Bold").fontSize(11);
    for (const seat of ticket.seats) {
      const chipWidth = doc.widthOfString(seat) + 18;
      if (seatX + chipWidth > MARGIN + CONTENT_WIDTH) {
        seatX = MARGIN;
        seatY += 28;
      }
      doc.roundedRect(seatX, seatY, chipWidth, 22, 5).fill(SEAT_FILL);
      doc.fillColor(RED).text(seat, seatX, seatY + 6, { width: chipWidth, align: "center" });
      seatX += chipWidth + 6;
    }

    y = seatY + 46;
    doc.circle(0, y, 12).fill("#f2f3f5");
    doc.circle(PAGE_WIDTH, y, 12).fill("#f2f3f5");
    doc
      .moveTo(MARGIN - 6, y)
      .lineTo(PAGE_WIDTH - MARGIN + 6, y)
      .dash(5, { space: 4 })
      .lineWidth(1.5)
      .strokeColor(RULE)
      .stroke()
      .undash();

    y += 24;
    label(doc, "Booking ID", MARGIN, y);
    label(doc, "Amount paid", MARGIN, y, { width: CONTENT_WIDTH, align: "right" });
    doc.font("Courier-Bold").fontSize(17).fillColor(INK).text(ticket.code, MARGIN, y + 12, {
      characterSpacing: 1,
    });
    doc.font("Helvetica-Bold").fontSize(17).fillColor(INK).text(ticket.amount, MARGIN, y + 12, {
      width: CONTENT_WIDTH,
      align: "right",
    });

    y += 50;
    label(doc, "Booked by", MARGIN, y);
    label(doc, "Booked on", rightColumn, y);
    doc.font("Helvetica").fontSize(10).fillColor(INK).text(ticket.bookedBy, MARGIN, y + 12, {
      width: columnWidth - 10,
    });
    doc.text(ticket.bookedOn, rightColumn, y + 12, { width: columnWidth });

    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor(MUTED)
      .text(
        "Show this ticket at the entrance. Please arrive 15 minutes before the show.",
        MARGIN,
        PAGE_HEIGHT - 40,
        { width: CONTENT_WIDTH, align: "center" },
      );

    doc.end();
  });

module.exports = { buildTicketPdf };

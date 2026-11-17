from __future__ import annotations

import re
import sys
from datetime import datetime
from decimal import Decimal
from pathlib import Path

from openpyxl import load_workbook
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image as RLImage,
    KeepTogether,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


NAVY = colors.HexColor("#101B31")
SLATE = colors.HexColor("#37465E")
MUTED = colors.HexColor("#64748B")
LINE = colors.HexColor("#CBD5E1")
SOFT = colors.HexColor("#F1F5F9")
ACCENT = colors.HexColor("#14B8A6")
WHITE = colors.white


def money(value: object) -> str:
    amount = Decimal(str(value or 0)).quantize(Decimal("0.01"))
    return f"INR {amount:,.2f}"


def words_under_1000(n: int) -> str:
    ones = [
        "Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen",
        "Eighteen", "Nineteen",
    ]
    tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
    parts: list[str] = []
    if n >= 100:
        parts.extend([ones[n // 100], "Hundred"])
        n %= 100
    if n >= 20:
        parts.append(tens[n // 10])
        n %= 10
    if n:
        parts.append(ones[n])
    return " ".join(parts)


def indian_amount_words(value: object) -> str:
    n = int(Decimal(str(value or 0)).quantize(Decimal("1")))
    if n == 0:
        return "Zero Rupees Only"
    parts: list[str] = []
    for divisor, name in ((10_000_000, "Crore"), (100_000, "Lakh"), (1_000, "Thousand")):
        if n >= divisor:
            q, n = divmod(n, divisor)
            parts.extend([words_under_1000(q), name])
    if n:
        parts.append(words_under_1000(n))
    return "Rupees " + " ".join(parts) + " Only"


def clean(value: object) -> str:
    return " ".join(str(value or "").split())


def get_after_label(value: object, label: str) -> str:
    text = clean(value)
    match = re.search(re.escape(label) + r"\s*[:\-]?\s*(.+)$", text, re.IGNORECASE)
    return match.group(1).strip() if match else text


def load_invoice(path: Path) -> dict:
    wb = load_workbook(path, data_only=True)
    ws = wb[wb.sheetnames[0]]
    provider_blob = str(ws["A3"].value or "")
    address_match = re.search(r"ADDRESS\s*:\s*(.+?)\s+PH-#", provider_blob, re.IGNORECASE | re.DOTALL)
    phone_match = re.search(r"PH-#\s*:\s*([\d ]+)", provider_blob, re.IGNORECASE)
    name_match = re.search(r"NAME\s*:\s*(.+?)(?:\.|$)", provider_blob, re.IGNORECASE | re.DOTALL)
    date_text = get_after_label(ws["A13"].value, "Dated")
    try:
        invoice_date = datetime.strptime(date_text, "%d-%m-%Y")
    except ValueError:
        invoice_date = None

    description = clean(ws["B17"].value)
    quantity_match = re.search(r"\((\d+)\s*days?\)", description, re.IGNORECASE)
    return {
        "provider": clean(ws["A1"].value),
        "provider_address": clean(address_match.group(1) if address_match else provider_blob),
        "provider_phone": clean(phone_match.group(1) if phone_match else ""),
        "provider_name": clean(name_match.group(1) if name_match else "Sahil Yadav"),
        "provider_gstin": get_after_label(ws["A4"].value, "GSTIN/UIN"),
        "invoice_no": clean(ws["D5"].value),
        "customer": clean(ws["D6"].value),
        "customer_address": clean(ws["D7"].value),
        "customer_gstin": clean(ws["D8"].value),
        "customer_pan": clean(ws["D9"].value),
        "category": clean(ws["D10"].value),
        "customer_phone": clean(ws["D11"].value),
        "invoice_date": invoice_date,
        "date_text": date_text,
        "total": ws["D21"].value or ws["D13"].value or 0,
        "service_date": clean(ws["A17"].value).replace("From ", "").strip(),
        "description": description,
        "quantity": int(quantity_match.group(1)) if quantity_match else 1,
        "unit_price": ws["C17"].value or 0,
        "service_amount": ws["D17"].value or 0,
        "gst_label": clean(ws["C19"].value) or "GST (18%)",
        "gst_amount": ws["D19"].value or 0,
        "bank_name": clean(ws["A28"].value),
        "branch": get_after_label(ws["A29"].value, "Branch"),
        "account_no": get_after_label(ws["A31"].value, "Account No"),
        "ifsc": get_after_label(ws["A32"].value, "IFSC Code"),
    }


def make_logo(path: Path) -> RLImage:
    logo = RLImage(str(path), width=145, height=56.2)
    logo.hAlign = "LEFT"
    return logo


def build_pdf(invoice: dict, output_path: Path, logo_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    page_w, page_h = A4
    left = right = 17 * mm
    top = 13 * mm
    bottom = 17 * mm

    styles = getSampleStyleSheet()
    base = ParagraphStyle(
        "Base", parent=styles["Normal"], fontName="Helvetica", fontSize=8.3, leading=11,
        textColor=NAVY, spaceAfter=0,
    )
    small = ParagraphStyle("Small", parent=base, fontSize=7.4, leading=9.3)
    tiny = ParagraphStyle("Tiny", parent=base, fontSize=6.8, leading=8.4, textColor=MUTED)
    section = ParagraphStyle(
        "Section", parent=base, fontName="Helvetica-Bold", fontSize=8.0, leading=10,
        textColor=NAVY,
    )
    title = ParagraphStyle(
        "Title", parent=base, fontName="Helvetica-Bold", fontSize=23, leading=25,
        textColor=NAVY, alignment=TA_RIGHT,
    )
    kicker = ParagraphStyle(
        "Kicker", parent=base, fontName="Helvetica-Bold", fontSize=8, leading=10,
        textColor=SLATE, alignment=TA_RIGHT,
    )
    right_style = ParagraphStyle("Right", parent=base, alignment=TA_RIGHT)
    right_bold = ParagraphStyle("RightBold", parent=right_style, fontName="Helvetica-Bold")
    bold = ParagraphStyle("Bold", parent=base, fontName="Helvetica-Bold")
    center_small = ParagraphStyle("CenterSmall", parent=small, alignment=TA_CENTER)

    def p(text: object, style: ParagraphStyle = base) -> Paragraph:
        return Paragraph(str(text or ""), style)

    def info_line(label: str, value: object, style: ParagraphStyle = base) -> Paragraph:
        return p(f"<b>{label}:</b> {value}", style)

    def section_bar(label: str) -> Table:
        tbl = Table([[p(label.upper(), section)]], colWidths=[usable])
        tbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), SOFT),
            ("BOX", (0, 0), (-1, -1), 0.6, LINE),
            ("LEFTPADDING", (0, 0), (-1, -1), 7),
            ("RIGHTPADDING", (0, 0), (-1, -1), 7),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        return tbl

    def on_page(canvas, doc):
        canvas.saveState()
        y = 10.5 * mm
        canvas.setStrokeColor(colors.HexColor("#E2E8F0"))
        canvas.setLineWidth(0.55)
        canvas.line(left, y + 8, page_w - right, y + 8)
        canvas.setFont("Helvetica", 6.8)
        canvas.setFillColor(MUTED)
        canvas.drawString(left, y, f"{invoice['provider']} - Invoice {invoice['invoice_no']}")
        page_label = f"Page {doc.page} of 1"
        canvas.drawRightString(page_w - right, y, page_label)
        canvas.restoreState()

    doc = BaseDocTemplate(
        str(output_path), pagesize=A4, leftMargin=left, rightMargin=right,
        topMargin=top, bottomMargin=bottom, title=f"Invoice {invoice['invoice_no']} - {invoice['provider']}",
        author=invoice["provider"],
    )
    frame = Frame(left, bottom, page_w - left - right, page_h - top - bottom, id="main", showBoundary=0)
    doc.addPageTemplates([PageTemplate(id="invoice", frames=[frame], onPage=on_page)])

    usable = page_w - left - right
    story = []

    brand = Table([[make_logo(logo_path)]], colWidths=[215])
    brand.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    heading = Table([[p("TAX INVOICE", title)], [p("ORIGINAL FOR RECIPIENT", kicker)]], colWidths=[usable - 215])
    heading.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
    ]))
    header = Table([[brand, heading]], colWidths=[215, usable - 215])
    header.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LINEBELOW", (0, 0), (-1, -1), 1.5, NAVY),
        ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.extend([header, Spacer(1, 8)])

    provider_details = Table([
        [p(f"<b>{invoice['provider']}</b><br/><b>ADDRESS:</b> {invoice['provider_address']}<br/><b>GSTIN/UIN:</b> {invoice['provider_gstin']}", small),
         p(f"<b>NAME:</b> {invoice['provider_name'].upper()}<br/><b>PH-#:</b> {invoice['provider_phone']}", small)]
    ], colWidths=[usable * 0.62, usable * 0.38])
    provider_details.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.6, LINE), ("INNERGRID", (0, 0), (-1, -1), 0.6, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.extend([section_bar("Provider Details"), provider_details, Spacer(1, 7)])

    date_display = invoice["invoice_date"].strftime("%d-%m-%Y") if invoice["invoice_date"] else invoice["date_text"]
    metadata = p(
        f"<b>Invoice No.:</b> {invoice['invoice_no']}<br/>"
        f"<b>Dated:</b> {date_display}<br/>"
        f"<b>Payment Terms:</b> Due upon receipt<br/>"
        f"<b>Service TAX Category:</b> {invoice['category']}<br/><br/>"
        f"<b>Total Amount Due: {money(invoice['total'])}</b><br/>"
        f"<b>Amount Paid:</b> {money(0)}",
        small,
    )
    customer_lines = [
        f"<b>Bill To:</b> <b>{invoice['customer']}</b>",
        f"<b>Address:</b> {invoice['customer_address']}",
        f"<b>GSTIN:</b> {invoice['customer_gstin']}",
    ]
    if invoice["customer_pan"]:
        customer_lines.append(f"<b>PAN:</b> {invoice['customer_pan']}")
    customer_lines.append(f"<b>Phone:</b> {invoice['customer_phone']}")
    meta_table = Table(
        [[p("INVOICE &amp; PAYMENT METADATA", section), p("BILL TO (CUSTOMER DETAILS)", section)],
         [metadata, p("<br/>".join(customer_lines), small)]],
        colWidths=[usable * 0.45, usable * 0.55],
    )
    meta_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), SOFT),
        ("BOX", (0, 0), (-1, -1), 0.6, LINE), ("INNERGRID", (0, 0), (-1, -1), 0.6, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.extend([meta_table, Spacer(1, 7)])

    service_date = invoice["invoice_date"].strftime("%d %b %Y") if invoice["invoice_date"] else invoice["service_date"]
    item_table = Table([
        [p("Date", ParagraphStyle("TH", parent=section, textColor=WHITE)),
         p("Description", ParagraphStyle("TH2", parent=section, textColor=WHITE)),
         p("Qty", ParagraphStyle("TH3", parent=section, textColor=WHITE, alignment=TA_CENTER)),
         p("Unit Price / Rate", ParagraphStyle("TH4", parent=section, textColor=WHITE, alignment=TA_RIGHT)),
         p("Amount", ParagraphStyle("TH5", parent=section, textColor=WHITE, alignment=TA_RIGHT))],
        [p(service_date, small), p(f"<b>{invoice['description']}</b>", small), p(invoice["quantity"], center_small),
         p(f"{Decimal(str(invoice['unit_price'])):,.2f}", right_style), p(money(invoice["service_amount"]), right_style)],
        ["", p(invoice["gst_label"], small), "", p("18%", right_style), p(money(invoice["gst_amount"]), right_style)],
        ["", p("Subtotal (Service Charges with GST)", bold), "", "", p(money(invoice["total"]), right_bold)],
        ["", p("Total Amount Due", ParagraphStyle("Total", parent=base, fontName="Helvetica-Bold", fontSize=10.2, leading=12)), "", "",
         p(money(invoice["total"]), ParagraphStyle("TotalR", parent=right_bold, fontSize=10.2, leading=12))],
    ], colWidths=[67, 234, 34, 90, usable - 425], repeatRows=1)
    item_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("BACKGROUND", (0, -1), (-1, -1), SOFT),
        ("BOX", (0, 0), (-1, -1), 0.75, NAVY),
        ("INNERGRID", (0, 0), (-1, -2), 0.55, LINE),
        ("SPAN", (1, 2), (1, 2)),
        ("SPAN", (1, 3), (3, 3)),
        ("SPAN", (1, 4), (3, 4)),
        ("LINEABOVE", (0, -1), (-1, -1), 1.3, NAVY),
        ("LINEBELOW", (0, -1), (-1, -1), 1.3, NAVY),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6), ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, 0), 7), ("BOTTOMPADDING", (0, 0), (-1, 0), 7),
        ("TOPPADDING", (0, 1), (-1, -1), 6), ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
    ]))
    story.extend([item_table, Spacer(1, 7)])

    payment = Table([
        [p("PAYMENT &amp; SETTLEMENT SUMMARY", section), ""],
        [p("Total Amount (In Words):", bold), p(indian_amount_words(invoice["total"]), bold)],
        [p("Bank Name:", bold), p(invoice["bank_name"], base)],
        [p("Branch:", bold), p(invoice["branch"], base)],
        [p("Account No:", bold), p(invoice["account_no"], base)],
        [p("IFSC Code:", bold), p(invoice["ifsc"], base)],
    ], colWidths=[usable * 0.32, usable * 0.68])
    payment.setStyle(TableStyle([
        ("SPAN", (0, 0), (1, 0)), ("BACKGROUND", (0, 0), (-1, 0), SOFT),
        ("BOX", (0, 0), (-1, -1), 0.6, LINE), ("INNERGRID", (0, 1), (-1, -1), 0.55, LINE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.extend([payment, Spacer(1, 9), p("Thanks for letting us serve you!", ParagraphStyle(
        "Thanks", parent=base, alignment=TA_CENTER, fontName="Helvetica-Oblique", fontSize=9.3,
        leading=11, textColor=SLATE,
    ))])

    doc.build(story)


def main() -> None:
    source = Path(sys.argv[1])
    output = Path(sys.argv[2])
    logo = Path(sys.argv[3])
    build_pdf(load_invoice(source), output, logo)
    print(output.resolve())


if __name__ == "__main__":
    main()

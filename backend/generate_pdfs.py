import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def txt_to_pdf(txt_path: str, pdf_path: str):
    with open(txt_path, "r", encoding="utf-8") as f:
        text = f.read()

    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#0F172A'),
        fontName='Helvetica-Bold'
    )
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#1E293B'),
        fontName='Helvetica'
    )

    story = []
    lines = text.split("\n")
    for line in lines:
        stripped = line.strip()
        if not stripped:
            story.append(Spacer(1, 8))
        elif stripped.startswith("===") or stripped.startswith("---"):
            continue
        elif any(stripped.startswith(f"{i}.") for i in range(1, 10)) or stripped.isupper():
            story.append(Spacer(1, 6))
            story.append(Paragraph(stripped, title_style))
            story.append(Spacer(1, 4))
        else:
            story.append(Paragraph(stripped, body_style))

    doc.build(story)
    print(f"Generated PDF: {pdf_path}")

def generate_all():
    reports_dir = os.path.join(os.path.dirname(__file__), "data", "sample_reports")
    for f in os.listdir(reports_dir):
        if f.endswith(".txt"):
            pdf_name = f.replace(".txt", ".pdf")
            txt_to_pdf(
                os.path.join(reports_dir, f),
                os.path.join(reports_dir, pdf_name)
            )

if __name__ == "__main__":
    generate_all()

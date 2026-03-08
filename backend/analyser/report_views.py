"""
PDF report views for project analysis.
Generates professional document-style reports with textual and chart sections.
"""

from io import BytesIO
from datetime import datetime

from django.http import HttpResponse, JsonResponse
from django.utils.text import slugify
from django.views.decorators.http import require_GET
from graphql_jwt.shortcuts import get_user_by_token
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.shapes import Drawing, String, Rect, Circle

from .models import Project


def _get_authenticated_user(request):
    """Authenticate user from Bearer JWT token in Authorization header."""
    auth_header = request.META.get("HTTP_AUTHORIZATION", "")
    if not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split(" ", 1)[1].strip()
    if not token:
        return None

    try:
        user = get_user_by_token(token)
        if user and user.is_authenticated:
            return user
    except Exception:
        return None

    return None


def _create_branded_logo_drawing():
    """Create a vector-based branded logo for the PDF header."""
    drawing = Drawing(140, 32)
    
    # Microscope icon (stylized circle + bar)
    drawing.add(Circle(8, 16, 6, fillColor=colors.HexColor("#0B84F3"), strokeColor=None))
    drawing.add(Rect(5, 10, 6, 2, fillColor=colors.HexColor("#2563EB"), strokeColor=None))
    
    # App name text
    drawing.add(
        String(
            20,
            18,
            "AI Project Analyser",
            fontSize=11,
            fontName="Helvetica-Bold",
            fillColor=colors.HexColor("#0F172A"),
        )
    )
    drawing.add(
        String(
            20,
            6,
            "Professional Code Quality Report",
            fontSize=6.5,
            fontName="Helvetica",
            fillColor=colors.HexColor("#64748B"),
        )
    )
    
    return drawing


class BrandedDocTemplate(SimpleDocTemplate):
    """Custom document template with branded header and footer on every page."""

    def __init__(self, *args, **kwargs):
        self.project_name = kwargs.pop("project_name", "Unknown Project")
        super().__init__(*args, **kwargs)

    def _draw_header_footer(self, canvas_obj, doc):
        """Draw branded header and footer on each page."""
        canvas_obj.saveState()
        
        # Header
        canvas_obj.setStrokeColor(colors.HexColor("#E2E8F0"))
        canvas_obj.setLineWidth(0.5)
        canvas_obj.line(doc.leftMargin, A4[1] - 35, A4[0] - doc.rightMargin, A4[1] - 35)
        
        # Logo/brand in header
        logo_drawing = _create_branded_logo_drawing()
        logo_drawing.drawOn(canvas_obj, doc.leftMargin, A4[1] - 32)
        
        # Project name in header (right side)
        canvas_obj.setFont("Helvetica", 8)
        canvas_obj.setFillColor(colors.HexColor("#475569"))
        canvas_obj.drawRightString(
            A4[0] - doc.rightMargin,
            A4[1] - 20,
            f"Project: {self.project_name[:40]}"
        )
        
        # Footer
        canvas_obj.setStrokeColor(colors.HexColor("#E2E8F0"))
        canvas_obj.line(doc.leftMargin, 30, A4[0] - doc.rightMargin, 30)
        
        # Footer left: generation date
        canvas_obj.setFont("Helvetica", 7)
        canvas_obj.setFillColor(colors.HexColor("#64748B"))
        canvas_obj.drawString(
            doc.leftMargin,
            18,
            f"Generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}"
        )
        
        # Footer center: copyright
        canvas_obj.drawCentredString(
            A4[0] / 2,
            18,
            "© 2026 AI Project Analyser - Powered by Advanced Analytics"
        )
        
        # Footer right: page number
        canvas_obj.drawRightString(
            A4[0] - doc.rightMargin,
            18,
            f"Page {doc.page}"
        )
        
        canvas_obj.restoreState()

    def handle_pageBegin(self):
        """Override to draw header/footer on page start."""
        super().handle_pageBegin()
        self._draw_header_footer(self.canv, self)


def _build_dimension_bar_chart(metrics):
    """Create a bar chart for dimension scores."""
    labels = [m.get_dimension_display() for m in metrics]
    values = [float(m.normalised_score or 0) for m in metrics]

    drawing = Drawing(460, 220)
    chart = VerticalBarChart()
    chart.x = 45
    chart.y = 40
    chart.height = 145
    chart.width = 380
    chart.data = [values]
    chart.valueAxis.valueMin = 0
    chart.valueAxis.valueMax = 100
    chart.valueAxis.valueStep = 20
    chart.categoryAxis.categoryNames = labels
    chart.categoryAxis.labels.angle = 25
    chart.categoryAxis.labels.boxAnchor = "ne"
    chart.categoryAxis.labels.dy = -2
    chart.barWidth = 18
    chart.groupSpacing = 8
    chart.barSpacing = 4
    chart.bars[0].fillColor = colors.HexColor("#0B84F3")
    chart.bars[0].strokeColor = colors.HexColor("#0763B8")
    drawing.add(chart)
    drawing.add(String(45, 198, "Dimension Score Distribution (0-100)", fontSize=10, fillColor=colors.HexColor("#1E293B")))
    return drawing


def _build_grade_pie_chart(metrics):
    """Create a pie chart for grade distribution across dimensions."""
    grade_counts = {"A": 0, "B": 0, "C": 0, "D": 0, "F": 0}
    for metric in metrics:
        grade = (metric.grade or "").upper()
        if grade in grade_counts:
            grade_counts[grade] += 1

    labels = []
    data = []
    for grade, count in grade_counts.items():
        if count > 0:
            labels.append(f"{grade} ({count})")
            data.append(count)

    if not data:
        labels = ["No Grades"]
        data = [1]

    drawing = Drawing(460, 220)
    pie = Pie()
    pie.x = 90
    pie.y = 25
    pie.width = 150
    pie.height = 150
    pie.data = data
    pie.labels = labels
    pie.slices.strokeWidth = 0.5

    palette = [
        colors.HexColor("#16A34A"),
        colors.HexColor("#3B82F6"),
        colors.HexColor("#F59E0B"),
        colors.HexColor("#F97316"),
        colors.HexColor("#DC2626"),
    ]
    for idx in range(len(data)):
        pie.slices[idx].fillColor = palette[idx % len(palette)]

    drawing.add(pie)
    drawing.add(String(45, 198, "Grade Distribution", fontSize=10, fillColor=colors.HexColor("#1E293B")))
    return drawing


@require_GET
def download_project_report_pdf(request, project_id):
    """Download a comprehensive PDF report for a project."""
    user = _get_authenticated_user(request)
    if not user:
        return JsonResponse({"error": "Authentication required."}, status=401)

    # Check subscription - PDF reports available for Basic and Premium plans only
    try:
        subscription = user.subscription
        if not subscription or not subscription.plan or subscription.plan.name == "free":
            return JsonResponse({
                "error": "PDF report download is available for Basic and Premium subscribers only.",
                "upgradeRequired": True
            }, status=403)
    except Exception:
        return JsonResponse({
            "error": "No active subscription found. Please subscribe to access PDF reports.",
            "upgradeRequired": True
        }, status=403)

    try:
        project = Project.objects.get(id=project_id, user=user)
    except Project.DoesNotExist:
        return JsonResponse({"error": "Project not found."}, status=404)

    latest_run = project.analysis_runs.filter(status="completed").order_by("-completed_at").first()
    metrics = list(latest_run.metrics.all().order_by("dimension")) if latest_run else []

    buffer = BytesIO()
    document = BrandedDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=16 * mm,
        leftMargin=16 * mm,
        topMargin=45 * mm,  # Increased for header
        bottomMargin=38 * mm,  # Increased for footer
        title=f"Project Report - {project.name}",
        author="AI Project Analyser",
        project_name=project.name,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#0F172A"),
        spaceAfter=10,
    )
    heading_style = ParagraphStyle(
        "ReportHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#1E3A8A"),
        spaceBefore=8,
        spaceAfter=6,
    )
    body_style = ParagraphStyle(
        "ReportBody",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#334155"),
    )

    story = [
        Paragraph("Project Analysis Report", title_style),
        Spacer(1, 4),
        Paragraph(f"<b>Project Name:</b> {project.name}", body_style),
        Paragraph(f"<b>Description:</b> {project.description or 'Not provided'}", body_style),
        Paragraph(f"<b>Repository URL:</b> {project.repo_url or 'Not provided'}", body_style),
        Paragraph(
            f"<b>Report Generated:</b> {datetime.now().strftime('%B %d, %Y at %I:%M %p')}",
            body_style
        ),
        Spacer(1, 12),
    ]

    if latest_run:
        story.extend([
            Paragraph("Executive Summary", heading_style),
            Paragraph(
                (
                    f"The latest completed analysis scored <b>{latest_run.overall_score:.1f}/100</b> "
                    f"with an overall grade of <b>{latest_run.overall_grade}</b>. "
                    "This report includes both descriptive findings and graphical views of key metrics."
                ),
                body_style,
            ),
            Spacer(1, 8),
        ])

        story.append(Paragraph("Detailed Metrics", heading_style))
        table_data = [["Dimension", "Metric", "Raw Value", "Score", "Grade"]]
        for metric in metrics:
            raw_value = f"{metric.raw_value:.2f}{metric.unit or ''}" if metric.raw_value is not None else "N/A"
            table_data.append([
                metric.get_dimension_display(),
                metric.metric_name,
                raw_value,
                f"{metric.normalised_score:.1f}/100" if metric.normalised_score is not None else "N/A",
                metric.grade or "N/A",
            ])

        metrics_table = Table(table_data, colWidths=[85, 130, 90, 70, 50])
        metrics_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0B84F3")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8.5),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CBD5E1")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#F8FAFC"), colors.HexColor("#EEF2FF")]),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ])
        )
        story.extend([metrics_table, Spacer(1, 12)])

        if metrics:
            story.append(Paragraph("Pictorial Insights", heading_style))
            story.extend([
                _build_dimension_bar_chart(metrics),
                Spacer(1, 10),
                _build_grade_pie_chart(metrics),
            ])
    else:
        story.extend([
            Paragraph("Executive Summary", heading_style),
            Paragraph(
                "No completed analysis run is available for this project yet. Run analysis to generate a full document and charts.",
                body_style,
            ),
        ])

    document.build(story)
    pdf_data = buffer.getvalue()
    buffer.close()

    filename = f"{slugify(project.name) or 'project'}-analysis-report.pdf"
    response = HttpResponse(pdf_data, content_type="application/pdf")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response

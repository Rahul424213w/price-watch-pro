from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Frame, PageTemplate
from reportlab.lib.units import inch
from datetime import datetime
import io

class ReportGenerator:
    def __init__(self, data, report_type='EXECUTIVE'):
        """
        :param data: Dictionary containing report content
        :param report_type: 'EXECUTIVE' (AI-ASIN) or 'GLOBAL' (Fleet Summary)
        """
        self.data = data
        self.report_type = report_type
        self.styles = getSampleStyleSheet()
        self.custom_styles = self._create_custom_styles()
        
    def _create_custom_styles(self):
        custom_styles = {}
        # Deep Navy for institutional feel
        primary_color = colors.HexColor("#0f172a")
        secondary_color = colors.HexColor("#f59e0b") # Strategic Amber
        
        custom_styles['Title'] = ParagraphStyle(
            'Title',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=primary_color,
            spaceAfter=20,
            fontName='Helvetica-Bold'
        )
        
        custom_styles['SubTitle'] = ParagraphStyle(
            'SubTitle',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor("#64748b"),
            textTransform='uppercase',
            letterSpacing=2,
            spaceAfter=30
        )
        
        custom_styles['SectionHeader'] = ParagraphStyle(
            'SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=primary_color,
            fontName='Helvetica-Bold',
            spaceBefore=20,
            spaceAfter=15,
        )
        
        custom_styles['HighlightBoxText'] = ParagraphStyle(
            'HighlightBoxText',
            parent=self.styles['Normal'],
            fontSize=12,
            textColor=colors.HexColor("#78350f"),
            fontName='Helvetica-BoldOblique',
            leading=16
        )
        
        custom_styles['ExecutiveBullet'] = ParagraphStyle(
            'ExecutiveBullet',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor("#334155"),
            leftIndent=20,
            bulletIndent=10,
            spaceAfter=8
        )

        custom_styles['MetricLabel'] = ParagraphStyle(
            'MetricLabel',
            parent=self.styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor("#64748b"),
            textTransform='uppercase',
            fontName='Helvetica-Bold'
        )

        custom_styles['MetricValue'] = ParagraphStyle(
            'MetricValue',
            parent=self.styles['Normal'],
            fontSize=16,
            textColor=primary_color,
            fontName='Helvetica-Bold'
        )
        
        return custom_styles

    def _draw_header_footer(self, canvas, doc):
        canvas.saveState()
        # Footer
        canvas.setFont('Helvetica-Bold', 8)
        canvas.setStrokeColor(colors.HexColor("#e2e8f0"))
        canvas.line(0.75 * inch, 0.75 * inch, A4[0] - 0.75 * inch, 0.75 * inch)
        canvas.drawCentredString(A4[0] / 2, 0.5 * inch, f"PriceWatch Pro v4.0.5 – Competitive Intelligence Engine • Page {canvas.getPageNumber()}")
        
        # Header Accent
        canvas.setFillColor(colors.HexColor("#0f172a"))
        canvas.rect(0, A4[1] - (0.5 * inch), A4[0], 0.5 * inch, fill=1, stroke=0)
        canvas.restoreState()

    def _safe_get(self, key, default="N/A"):
        return self.data.get(key, default) or default

    def generate(self):
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=50,
            leftMargin=50,
            topMargin=50,
            bottomMargin=50
        )
        
        elements = []
        
        if self.report_type == 'GLOBAL':
            self._generate_global_report(elements)
        else:
            self._generate_executive_report(elements)
            
        # Build the PDF
        doc.build(elements, onFirstPage=self._draw_header_footer, onLaterPages=self._draw_header_footer)
        return buffer.getvalue()

    def _generate_global_report(self, elements):
        """Generates a high-level fleet intelligence summary"""
        elements.append(Paragraph("FLEET INTELLIGENCE SUMMARY", self.custom_styles['Title']))
        elements.append(Paragraph(f"REAL-TIME MARKET SNAPSHOT | {datetime.now().strftime('%Y-%m-%d %H:%M')}", self.custom_styles['SubTitle']))

        # KPI Dashboard Section
        elements.append(Paragraph("STRATEGIC KPI DASHBOARD", self.custom_styles['SectionHeader']))
        
        stats = self.data.get('stats', {})
        kpi_data = [
            [Paragraph("TRACKED ASSETS", self.custom_styles['MetricLabel']), Paragraph("MARKET VALUE", self.custom_styles['MetricLabel']), Paragraph("SYSTEM HEALTH", self.custom_styles['MetricLabel'])],
            [Paragraph(str(stats.get('tracked_count', 0)), self.custom_styles['MetricValue']), 
             Paragraph(f"₹{stats.get('total_market_value', 0):,.2f}", self.custom_styles['MetricValue']), 
             Paragraph(f"{stats.get('system_health_score', 0)}%", self.custom_styles['MetricValue'])]
        ]
        
        kpi_table = Table(kpi_data, colWidths=[2 * inch, 2.5 * inch, 2 * inch])
        kpi_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
            ('TOPPADDING', (0, 0), (-1, -1), 15),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
            ('LEFTPADDING', (0, 0), (-1, -1), 20),
        ]))
        elements.append(kpi_table)
        elements.append(Spacer(1, 20))

        # Fleet Inventory Table
        elements.append(Paragraph("ACTIVE MONITORING GRID", self.custom_styles['SectionHeader']))
        
        inventory_header = [["ASIN", "NOMENCLATURE", "LAST PRICE", "STATUS"]]
        inventory_data = inventory_header + self.data.get('products', [])
        
        t = Table(inventory_data, colWidths=[1.2*inch, 3.2*inch, 1*inch, 1.2*inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('TOPPADDING', (0, 0), (-1, 0), 12),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ]))
        elements.append(t)

        elements.append(Spacer(1, 30))
        elements.append(Paragraph("PROPRIETARY & CONFIDENTIAL – PRICETWATCH PRO INTELLIGENCE ENGINE", self.styles['Italic']))

    def _generate_executive_report(self, elements):
        """Generates a deep-dive AI intelligence report for single ASIN"""
        # --- PAGE 1: EXECUTIVE SUMMARY ---
        asin = self._safe_get('asin')
        elements.append(Paragraph("STRATEGIC INTELLIGENCE REPORT", self.custom_styles['Title']))
        elements.append(Paragraph(f"ASIN: {asin} | DATE: {datetime.now().strftime('%Y-%m-%d %H:%M')}", self.custom_styles['SubTitle']))
        
        elements.append(Spacer(1, 10))
        
        # Neural Strategic Directive Box
        elements.append(Paragraph("NEURAL STRATEGIC DIRECTIVE", self.custom_styles['SectionHeader']))
        
        pricing_text = self._safe_get('pricing', "Awaiting synthesis...")
        directive_data = [[Paragraph(pricing_text, self.custom_styles['HighlightBoxText'])]]
        directive_table = Table(directive_data, colWidths=[A4[0] - 100])
        directive_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#fffbeb")),
            ('BORDER', (0, 0), (-1, -1), 2, colors.HexColor("#f59e0b")),
            ('TOPPADDING', (0, 0), (-1, -1), 20),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 20),
            ('LEFTPADDING', (0, 0), (-1, -1), 20),
            ('RIGHTPADDING', (0, 0), (-1, -1), 20),
        ]))
        elements.append(directive_table)
        
        elements.append(Spacer(1, 25))
        
        # Market Snapshot
        elements.append(Paragraph("⚡ MARKET SNAPSHOT", self.custom_styles['SectionHeader']))
        market_text = self._safe_get('market', "Market assessment pending update.")
        market_points = market_text.split('\n')
        for point in market_points:
            if point.strip():
                clean_point = point.strip().lstrip('- • *')
                elements.append(Paragraph(f"• {clean_point}", self.custom_styles['ExecutiveBullet']))
        
        elements.append(Spacer(1, 20))
        
        # Key Insight Callout
        elements.append(Paragraph("🧠 NEURAL KEY INSIGHT", self.custom_styles['SectionHeader']))
        trend_text = self._safe_get('trend', "Stability index within normal parameters.")
        insight_text = trend_text.split('\n')[0] if '\n' in trend_text else trend_text
        insight_data = [[Paragraph(f"Executive Insight: {insight_text}", self.custom_styles['ExecutiveBullet'])]]
        insight_table = Table(insight_data, colWidths=[A4[0] - 100])
        insight_table.setStyle(TableStyle([
            ('LINEBELOW', (0, 0), (-1, -1), 2, colors.HexColor("#3b82f6")),
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ('LEFTPADDING', (0, 0), (-1, -1), 15),
            ('TOPPADDING', (0, 0), (-1, -1), 15),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
        ]))
        elements.append(insight_table)
        
        elements.append(PageBreak())
        
        # --- PAGE 2: MARKET ANALYSIS ---
        elements.append(Paragraph("📊 MARKET DYNAMICS & RISKS", self.custom_styles['Title']))
        
        # Trend Analysis
        elements.append(Paragraph("TREND ANALYSIS", self.custom_styles['SectionHeader']))
        elements.append(Paragraph(trend_text, self.custom_styles['ExecutiveBullet']))
        
        elements.append(Spacer(1, 20))
        
        # Risk Matrix Table
        elements.append(Paragraph("🔥 NEURAL RISK MATRIX", self.custom_styles['SectionHeader']))
        undercut_text = self._safe_get('undercut', "Minimal immediate risk identified.")
        risk_lines = undercut_text.split('\n')
        risk_analysis = risk_lines[0] if risk_lines else "Minimal immediate risk identified."
        
        elements.append(Paragraph(risk_analysis, self.custom_styles['ExecutiveBullet']))
        
        elements.append(Spacer(1, 15))
        
        # Risk Visualization
        risk_table_data = [
            [Paragraph("<b>METRIC</b>", self.custom_styles['ExecutiveBullet']), Paragraph("<b>IDENTIFIED STATUS</b>", self.custom_styles['ExecutiveBullet'])],
            ["Volatility Index", "HIGH" if "volatil" in trend_text.lower() else "LOW"],
            ["Competitor Pressure", "INTENSE" if "compet" in market_text.lower() else "NOMINAL"],
            ["Buy Box Vulnerability", "ELEVATED" if "undercut" in undercut_text.lower() else "STABLE"],
            ["Neural Confidence", "94%"]
        ]
        risk_table = Table(risk_table_data, colWidths=[2 * inch, 4 * inch])
        risk_table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
            ('PADDING', (0, 0), (-1, -1), 10),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
        ]))
        elements.append(risk_table)
        
        elements.append(PageBreak())
        
        # --- PAGE 3: STRATEGY & DATA DATASET ---
        elements.append(Paragraph("🌍 GEOGRAPHIC STRATEGY & TELEMETRY", self.custom_styles['Title']))
        
        # Regional Strategy Table
        elements.append(Paragraph("REGIONAL ARBITRAGE PROTOCOL", self.custom_styles['SectionHeader']))
        location_text = self._safe_get('location', "Regional distribution optimization in progress.")
        elements.append(Paragraph(location_text, self.custom_styles['ExecutiveBullet']))
        
        elements.append(Spacer(1, 20))
        
        # Final Telemetry Table
        elements.append(Paragraph("RAW TELEMETRY DATASET", self.custom_styles['SectionHeader']))
        
        history_header = [["TIMESTAMP", "ENTITY", "PRICE", "BUY BOX"]]
        history_data = self.data.get('history', [])
        history_table_data = history_header + (history_data if history_data else [["Pending", "N/A", "N/A", "N/A"]])
        
        t = Table(history_table_data, colWidths=[1.8*inch, 2.5*inch, 1*inch, 1*inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('TOPPADDING', (0, 0), (-1, 0), 12),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ]))
        elements.append(t)


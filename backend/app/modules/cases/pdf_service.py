import io
from datetime import datetime
from jinja2 import Environment, FileSystemLoader
from xhtml2pdf import pisa
import os

class CasePDFService:
    def __init__(self):
        # Set up template directory
        template_dir = os.path.join(os.path.dirname(__file__), "templates")
        self.jinja_env = Environment(loader=FileSystemLoader(template_dir))

    def generate_case_report(self, case_data: dict) -> io.BytesIO:
        """
        Generates a PDF report for a case.
        
        Args:
            case_data: Dictionary containing case details.
            
        Returns:
            io.BytesIO: The generated PDF as a byte stream.
        """
        template = self.jinja_env.get_template("report_template.html")
        
        # Prepare context
        context = {
            "case": case_data,
            "generated_at": datetime.now().strftime("%d %b %Y, %H:%M:%S")
        }
        
        html_content = template.render(context)
        
        # Create a byte stream for the PDF
        pdf_stream = io.BytesIO()
        
        # Convert HTML to PDF
        pisa_status = pisa.CreatePDF(
            io.StringIO(html_content),
            dest=pdf_stream
        )
        
        if pisa_status.err:
            raise Exception("Failed to generate PDF report")
            
        # Reset stream position to the beginning
        pdf_stream.seek(0)
        return pdf_stream

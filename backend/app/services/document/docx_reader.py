import io
import docx


def extract_text_from_docx(file_bytes: bytes) -> str:
    """
    Extracts readable plain text paragraphs from a binary DOCX document.
    """
    doc = docx.Document(io.BytesIO(file_bytes))
    paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
    return "\n".join(paragraphs)

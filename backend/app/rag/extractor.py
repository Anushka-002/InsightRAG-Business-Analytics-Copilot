import os
from pathlib import Path
from typing import List, Dict, Any
from pypdf import PdfReader

class ExtractedPage:
    def __init__(self, page_number: int, text: str, char_count: int):
        self.page_number = page_number
        self.text = text
        self.char_count = char_count

class ExtractedDocument:
    def __init__(self, filename: str, filepath: str, file_type: str, pages: List[ExtractedPage]):
        self.filename = filename
        self.filepath = filepath
        self.file_type = file_type
        self.pages = pages
        self.total_pages = len(pages)
        self.total_characters = sum(p.char_count for p in pages)

def extract_text_from_file(file_path: Path) -> ExtractedDocument:
    """
    Extracts structured text from PDF and TXT files, preserving exact page numbers and metadata.
    """
    if not file_path.exists():
        raise FileNotFoundError(f"Document not found at {file_path}")

    filename = file_path.name
    file_ext = file_path.suffix.lower()

    if file_ext == ".pdf":
        return _extract_pdf(file_path)
    elif file_ext in (".txt", ".md", ".csv"):
        return _extract_txt(file_path)
    else:
        raise ValueError(f"Unsupported file type '{file_ext}'. Supported formats: .pdf, .txt, .md")

def _extract_pdf(file_path: Path) -> ExtractedDocument:
    reader = PdfReader(str(file_path))
    pages: List[ExtractedPage] = []
    
    for idx, page in enumerate(reader.pages):
        raw_text = page.extract_text() or ""
        clean_text = raw_text.strip()
        pages.append(ExtractedPage(
            page_number=idx + 1,
            text=clean_text,
            char_count=len(clean_text)
        ))
        
    return ExtractedDocument(
        filename=file_path.name,
        filepath=str(file_path),
        file_type="pdf",
        pages=pages
    )

def _extract_txt(file_path: Path) -> ExtractedDocument:
    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        content = f.read()

    pages = [
        ExtractedPage(
            page_number=1,
            text=content.strip(),
            char_count=len(content.strip())
        )
    ]
    return ExtractedDocument(
        filename=file_path.name,
        filepath=str(file_path),
        file_type="txt",
        pages=pages
    )

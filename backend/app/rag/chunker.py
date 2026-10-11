from typing import List, Dict, Any
from app.rag.extractor import ExtractedDocument

class DocumentChunk:
    def __init__(
        self,
        chunk_id: str,
        doc_filename: str,
        page_number: int,
        content: str,
        start_char: int,
        end_char: int
    ):
        self.chunk_id = chunk_id
        self.doc_filename = doc_filename
        self.page_number = page_number
        self.content = content
        self.start_char = start_char
        self.end_char = end_char

    def to_dict(self) -> Dict[str, Any]:
        return {
            "chunk_id": self.chunk_id,
            "doc_filename": self.doc_filename,
            "page_number": self.page_number,
            "content": self.content,
            "char_count": len(self.content),
            "start_char": self.start_char,
            "end_char": self.end_char
        }

def chunk_document(
    doc: ExtractedDocument,
    chunk_size: int = 600,
    chunk_overlap: int = 100
) -> List[DocumentChunk]:
    """
    Splits document pages into overlapping passages while preserving page numbers and source metadata.
    Avoids chunk boundary splits across single words where possible.
    """
    chunks: List[DocumentChunk] = []
    chunk_counter = 0

    step = max(50, chunk_size - chunk_overlap)

    for page in doc.pages:
        text = page.text
        text_len = len(text)
        if text_len == 0:
            continue

        # If page is shorter than chunk size, use single chunk
        if text_len <= chunk_size:
            chunk_counter += 1
            chunks.append(DocumentChunk(
                chunk_id=f"{doc.filename}-p{page.page_number}-c{chunk_counter}",
                doc_filename=doc.filename,
                page_number=page.page_number,
                content=text,
                start_char=0,
                end_char=text_len
            ))
            continue

        start = 0
        while start < text_len:
            end = min(start + chunk_size, text_len)
            
            # Snap to whitespace boundary if not at end of text
            if end < text_len:
                next_space = text.rfind(" ", start, end)
                if next_space > start + (chunk_size // 2):
                    end = next_space

            sub_text = text[start:end].strip()
            if len(sub_text) > 30: # discard trivial scraps
                chunk_counter += 1
                chunks.append(DocumentChunk(
                    chunk_id=f"{doc.filename}-p{page.page_number}-c{chunk_counter}",
                    doc_filename=doc.filename,
                    page_number=page.page_number,
                    content=sub_text,
                    start_char=start,
                    end_char=end
                ))

            start += step
            if start >= text_len:
                break

    return chunks

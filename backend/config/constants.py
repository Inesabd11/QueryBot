from typing import Dict, List, Set
from pathlib import Path

# File type configurations
SUPPORTED_FILE_TYPES: Dict[str, Set[str]] = {
    'documents': {
        '.txt', '.rtf', '.md', '.log',
        '.doc', '.docx', '.xlsx', '.xls', '.pptx', '.ppt',
        '.pdf', '.odt', '.ods', '.odp',
    },
    'data_files': {
        '.csv', '.json', '.xml', '.yaml', '.yml',
        '.sql', '.db', '.ini', '.conf',
    },
    'technical': {
        '.dxf', '.dwg', '.stl', '.obj',
        '.gcode', '.step', '.stp',
    },
    'images': {
        '.png', '.jpg', '.jpeg', '.tiff', '.bmp',
        '.svg', '.eps', '.tif', '.webp',
    }
}

# Flatten all supported extensions
ALL_SUPPORTED_EXTENSIONS: Set[str] = {
    ext.lower() 
    for types in SUPPORTED_FILE_TYPES.values() 
    for ext in types
}

# Maximum file size (10MB)
MAX_FILE_SIZE: int = 10 * 1024 * 1024

def validate_file(file_path: Path) -> bool:
    """Validate file extension and size"""
    if not file_path.suffix.lower() in ALL_SUPPORTED_EXTENSIONS:
        raise ValueError(
            f"Unsupported file type. Supported types: {', '.join(ALL_SUPPORTED_EXTENSIONS)}"
        )
    
    if file_path.stat().st_size > MAX_FILE_SIZE:
        raise ValueError(f"File too large. Maximum size: {MAX_FILE_SIZE/1024/1024}MB")
    
    return True
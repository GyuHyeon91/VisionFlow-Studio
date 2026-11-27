"""문서의 프로젝트 경로를 새 위치로 일괄 교체."""
from pathlib import Path

OLD = r"C:\Users\mbc\Documents\Default Project\visionflow-studio"
NEW = r"C:\Users\mbc\Desktop\학생방\박규현\visionflow-studio"
root = Path(__file__).resolve().parents[1]

for path in [root / "README.md", root / "docs" / "ISOLATION.md",
             root / "docs" / "WORKLOG.md", root / "docs" / "WORKLOG_SUMMARY.md"]:
    if not path.exists():
        continue
    text = path.read_text(encoding="utf-8")
    if OLD in text:
        path.write_text(text.replace(OLD, NEW), encoding="utf-8")
        print("updated", path.name)

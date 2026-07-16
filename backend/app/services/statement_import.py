"""MT4 / MT5 broker-statement parsing (stdlib only).

Both MetaTrader export formats are rigid header+rows tables, so one
header-driven parser covers MT4 HTML statements, MT5 HTML reports and MT5 CSV
exports: find the row whose cells name a ticket/position, a type and a profit
column, map indices by header keyword, then read trade rows until the table
shape breaks. Non-trade rows (balance ops, summaries) are skipped.
"""

import csv
import io
import re
from html.parser import HTMLParser

# Broker symbol → the desk's Yahoo-style symbols.
_SYMBOL_MAP = {
    "XAUUSD": "XAU=F",
    "GOLD": "XAU=F",
    "XAGUSD": "XAG=F",
    "SILVER": "XAG=F",
    "BTCUSD": "BTC-USD",
    "US500": "^GSPC",
    "SPX500": "^GSPC",
    "USOIL": "CL=F",
    "WTI": "CL=F",
    "DXY": "DX-Y.NYB",
}

_DATE_RE = re.compile(r"(\d{4})[.\-/](\d{2})[.\-/](\d{2})")
_TICKET_RE = re.compile(r"^\d{3,}$")


def normalize_symbol(raw: str) -> str:
    """Map a broker ticker (XAUUSD, EURUSD.m, gbpusd-pro) to a desk symbol."""
    base = re.split(r"[.\-#_]", raw.strip().upper())[0]
    if base in _SYMBOL_MAP:
        return _SYMBOL_MAP[base]
    if len(base) == 6 and base.isalpha():
        return f"{base}=X"
    return base


def _to_float(cell: str) -> float | None:
    cleaned = cell.replace("\xa0", "").replace(" ", "").replace(",", "")
    try:
        return float(cleaned)
    except ValueError:
        return None


def _to_date(cell: str) -> str | None:
    m = _DATE_RE.search(cell)
    return f"{m.group(1)}-{m.group(2)}-{m.group(3)}" if m else None


class _TableParser(HTMLParser):
    """Flatten every <tr> in the document into a list of cell-text rows."""

    def __init__(self) -> None:
        super().__init__()
        self.rows: list[list[str]] = []
        self._row: list[str] | None = None
        self._cell: list[str] | None = None

    def handle_starttag(self, tag: str, attrs) -> None:
        if tag == "tr":
            self._row = []
        elif tag in ("td", "th") and self._row is not None:
            self._cell = []

    def handle_endtag(self, tag: str) -> None:
        if tag in ("td", "th") and self._row is not None and self._cell is not None:
            self._row.append(" ".join("".join(self._cell).split()))
            self._cell = None
        elif tag == "tr" and self._row is not None:
            if self._row:
                self.rows.append(self._row)
            self._row = None

    def handle_data(self, data: str) -> None:
        if self._cell is not None:
            self._cell.append(data)


def _header_indices(row: list[str]) -> dict[str, int] | None:
    """Column indices when `row` looks like a MT trade-table header."""
    lower = [c.strip().lower() for c in row]
    idx: dict[str, int] = {}
    for i, cell in enumerate(lower):
        if cell in ("ticket", "position", "deal", "order") and "ticket" not in idx:
            idx["ticket"] = i
        elif cell == "type" and "type" not in idx:
            idx["type"] = i
        elif cell in ("item", "symbol") and "symbol" not in idx:
            idx["symbol"] = i
        elif cell == "profit" and "profit" not in idx:
            idx["profit"] = i
        elif cell.startswith("close") and "time" in cell:
            idx["close_time"] = i
        elif cell == "time":
            # MT5 has two "Time" columns (open, close) — keep the last one.
            idx["close_time"] = i
    return idx if {"ticket", "type", "symbol", "profit"} <= idx.keys() else None


def _rows_to_trades(rows: list[list[str]]) -> tuple[list[dict], list[str]]:
    trades: list[dict] = []
    errors: list[str] = []
    header: dict[str, int] | None = None
    for row in rows:
        found = _header_indices(row)
        if found:
            header = found
            continue
        if header is None or len(row) <= max(header.values()):
            continue
        ticket = row[header["ticket"]].strip()
        side = row[header["type"]].strip().lower()
        if not _TICKET_RE.match(ticket):
            continue
        if side not in ("buy", "sell"):
            continue  # balance / credit / summary rows
        symbol_raw = row[header["symbol"]].strip()
        profit = _to_float(row[header["profit"]])
        if not symbol_raw or profit is None:
            errors.append(f"ticket {ticket}: unparseable symbol/profit")
            continue
        close_date = _to_date(row[header["close_time"]]) if "close_time" in header else None
        trades.append(
            {
                "ticket": ticket,
                "symbol": normalize_symbol(symbol_raw),
                "direction": "LONG" if side == "buy" else "SHORT",
                "pnl": profit,
                "close_date": close_date,
            }
        )
    return trades, errors


def _parse_csv(text: str) -> list[list[str]]:
    try:
        dialect = csv.Sniffer().sniff(text[:2048], delimiters=";,\t")
    except csv.Error:
        dialect = csv.excel
    return [row for row in csv.reader(io.StringIO(text), dialect) if any(c.strip() for c in row)]


def parse_statement(content: bytes) -> tuple[list[dict], list[str]]:
    """Parse an MT4/MT5 statement (HTML or CSV) into normalized trade dicts.

    Returns (trades, row_errors). Raises ValueError when no trade table is
    recognizable at all — the caller maps that to a 422.
    """
    text = content.decode("utf-8-sig", errors="replace")
    if "<table" in text.lower() or "<tr" in text.lower():
        parser = _TableParser()
        parser.feed(text)
        rows = parser.rows
    else:
        rows = _parse_csv(text)
    trades, errors = _rows_to_trades(rows)
    if not trades and not errors:
        raise ValueError("no recognizable MT4/MT5 trade table in this file")
    return trades, errors

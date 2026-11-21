#!/usr/bin/env python3
"""Build an HTML report of how the flashcards in content/private changed over time.

Walks every commit on the first-parent history of a branch that touched
content/private, parses the flashcard files at each commit, and writes a
self-contained HTML page with:

- a stacked bar chart per month, by review interval,
- a stacked bar chart per month, by belt,
- a scatter plot of every card (belt x interval) with a time slider.

Usage:
    python3 scripts/flashcard-history/build.py [OUTPUT.html] [--ref main]

The report is built from private notes, so write it outside the repo or
don't commit it. Needs the full git history: run `git fetch --unshallow`
first in a shallow clone.
"""

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
PRIVATE = "content/private"
BELTS = ["Yellow", "Orange", "Purple", "Blue", "Green", "Brown", "Black"]
SR = re.compile(r"<!--SR:!\d{4}-\d\d-\d\d,(\d+),\d+")
TITLE = re.compile(r"\[\[([^\]|#]+)")


def git(*args):
    return subprocess.run(
        ["git", "-C", str(REPO), "-c", "core.quotepath=off", *args],
        capture_output=True, text=True, check=True,
    ).stdout


def belt_of(text):
    return next((b for b in BELTS if b in text), None)


def is_flashcard_file(path):
    name = path.rsplit("/", 1)[-1]
    # Sync-conflict copies (e.g. "…_Pixel 7a_May-30-1259-2024_1.md") duplicate real files.
    return (
        name.endswith(".md")
        and re.search("flash", name, re.I)
        and "_Pixel" not in name
        and "conflict" not in name.lower()
    )


def parse_cards(text, file_belt):
    """Return (title, belt or None, interval or None) for each `?` card.

    The belt comes from the file name; the old combined Flashcards.md used
    belt headings instead. A card without an SR comment is new (None).
    """
    cards, belt = [], file_belt
    lines = text.splitlines()
    for i, line in enumerate(lines):
        if line.startswith("#") and not file_belt and belt_of(line):
            belt = belt_of(line)
        if line.strip() != "?":
            continue
        interval = None
        for nxt in lines[i + 1 : i + 15]:
            if nxt.strip() == "?":
                break
            m = SR.search(nxt)
            if m:
                interval = int(m.group(1))
                break
        t = TITLE.search(lines[i - 1]) if i else None
        cards.append((t.group(1).strip() if t else "", belt, interval))
    return cards


def snapshots(ref):
    """Cards per day: the last commit of each day wins."""
    log = git("log", "--first-parent", ref, "--reverse", "--format=%H %ad", "--date=short", "--", PRIVATE)
    snaps = {}
    for line in log.splitlines():
        sha, day = line.split()
        files = [f for f in git("ls-tree", "-r", "--name-only", sha, PRIVATE).splitlines() if is_flashcard_file(f)]
        cards = []
        for f in files:
            cards += parse_cards(git("show", f"{sha}:{f}"), belt_of(f.rsplit("/", 1)[-1]))
        if cards:
            snaps[day] = cards
    # Early cards had no belt: take it from the same title in any other snapshot.
    known = {t: b for cards in snaps.values() for t, b, _ in cards if b}
    return {
        day: [(t, b or known.get(t, "Unknown"), iv) for t, b, iv in cards]
        for day, cards in snaps.items()
    }


def interval_bin(days):
    if days is None:
        return "New"
    for limit, name in [(7, "≤1 wk"), (30, "1 wk–1 mo"), (90, "1–3 mo"), (365, "3–12 mo")]:
        if days <= limit:
            return name
    return ">1 yr"


def monthly(snaps):
    """One entry per month: the latest snapshot on or before that month."""
    days = sorted(snaps)
    y, m = map(int, days[0][:7].split("-"))
    end = days[-1][:7]
    out, i, last = [], 0, None
    while f"{y}-{m:02d}" <= end:
        month = f"{y}-{m:02d}"
        while i < len(days) and days[i][:7] <= month:
            last = days[i]
            i += 1
        belt, interval = {}, {}
        for _, b, iv in snaps[last]:
            belt[b] = belt.get(b, 0) + 1
            k = interval_bin(iv)
            interval[k] = interval.get(k, 0) + 1
        out.append({"m": month, "belt": belt, "interval": interval, "total": len(snaps[last]), "asof": last})
        y, m = (y + 1, 1) if m == 12 else (y, m + 1)
    return out


def scatter(snaps):
    """Per snapshot, every card's interval (-1 = new, None = not present), keyed by title."""
    belts = {}
    for cards in snaps.values():
        for t, b, _ in cards:
            belts[t] = b
    titles = list(belts)
    index = {t: i for i, t in enumerate(titles)}
    rows = []
    for day, cards in snaps.items():
        row = [None] * len(titles)
        for t, _, iv in cards:
            row[index[t]] = -1 if iv is None else iv
        rows.append({"d": day, "v": row})
    return {"titles": titles, "belts": [belts[t] for t in titles], "snaps": rows}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("output", nargs="?", default="flashcard-history.html")
    ap.add_argument("--ref", default="main", help="branch or commit to walk (default: main)")
    args = ap.parse_args()

    if git("rev-parse", "--is-shallow-repository").strip() == "true":
        sys.exit("Shallow clone: run `git fetch --unshallow` first, or the history is cut short.")

    snaps = snapshots(args.ref)
    if not snaps:
        sys.exit(f"No flashcards found under {PRIVATE} on {args.ref}.")

    dump = lambda o: json.dumps(o, ensure_ascii=False, separators=(",", ":"))
    html = (HERE / "template.html").read_text(encoding="utf-8")
    html = html.replace("__DATA__", dump(monthly(snaps))).replace("__SCATTER__", dump(scatter(snaps)))
    Path(args.output).write_text(html, encoding="utf-8")
    last = max(snaps)
    print(f"Wrote {args.output}: {len(snaps)} snapshots, {len(snaps[last])} cards on {last}.")


if __name__ == "__main__":
    main()

# Flashcard history report

Builds a self-contained HTML page showing how the flashcards in `content/private/` changed over the git history:

- stacked bars per month by review interval (from each card's `<!--SR:…-->` marker),
- stacked bars per month by belt,
- a scatter plot of every card by belt and interval, with a time slider.

```sh
git fetch --unshallow   # only in a shallow clone; the script refuses to run without the full history
python3 scripts/flashcard-history/build.py /path/to/report.html
```

Python 3 standard library only. `--ref` picks the branch to walk (default `main`); without an output path it writes `flashcard-history.html` in the current directory, which is gitignored. The report contains your private notes, so don't commit it.

How it reads the files:

- a card is a `?` line; its title is the first `[[link]]` on the line above;
- the belt comes from the file name, or from the belt headings in the old combined `Flashcards.md`; cards from before those headings existed get their belt from the same title in a later snapshot;
- sync-conflict copies (`…_Pixel 7a_…`) are skipped;
- a card without an SR marker counts as New;
- cards are matched across snapshots by title, so a renamed technique shows as one dot fading out and another fading in.

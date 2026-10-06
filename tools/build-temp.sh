#!/bin/sh
# Builds a clean copy of the site for the TEMP GitHub repo, in ~/TEMP (or the folder you pass).
#   sh tools/build-temp.sh            -> ~/TEMP
#   sh tools/build-temp.sh ~/Desktop/TEMP
# Includes the old folio images (_extracted/images) so the placeholders show online.
# Leaves out the source video, 4K masters, check sheets and Mac/Office clutter.
# Safe to re-run: it updates the copy and removes files you've deleted here (it keeps ~/TEMP/.git).

set -e
SRC="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$HOME/TEMP}"
mkdir -p "$OUT"

rsync -a --delete \
  --exclude ".git/" \
  --exclude "_source/" \
  --exclude ".claude/" \
  --exclude ".DS_Store" \
  --exclude ".~lock.*" \
  --exclude ".gitignore" \
  "$SRC/" "$OUT/"

# The local .gitignore hides the folio images; the TEMP repo needs them, so it gets its own.
printf '.DS_Store\n' > "$OUT/.gitignore"

echo "Built $OUT ($(du -sh "$OUT" | cut -f1), $(find "$OUT" -type f -not -path '*/.git/*' | wc -l | tr -d ' ') files)"
echo "Files over 25 MB (too big for GitHub's drag-and-drop uploader; fine with GitHub Desktop or git):"
find "$OUT" -type f -size +24400k -not -path '*/.git/*' | sed "s|$OUT/|  |"

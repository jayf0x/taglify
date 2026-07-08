#!/usr/bin/env bash
# Print the N most recent releases from changelog.md (level-2 "## " sections). Default 2.
# changelog.md is newest-first (publish-npm.sh inserts each release at the top), so "most
# recent" = the first N sections in the file, not the last.
# Used by repokit README sync for the <!-- CHANGELOG --> block. Tweak freely; it's synced like any file.
n="${1:-2}"
[ -f changelog.md ] || { echo "_no changelog.md yet_"; exit 0; }
awk -v n="$n" '
  /^## /   { i++; if (i > n) exit; s[i]=$0"\n"; next }
  i && i<=n { s[i]=s[i]$0"\n" }
  END      { for (j=1; j<=i && j<=n; j++) printf "%s", s[j] }
' changelog.md

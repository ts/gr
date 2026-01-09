#!/usr/bin/env bash
set -euo pipefail

# Hard-wired repo (per your request)
OWNER="ts"
REPO="gr"

# Branch Tampermonkey should pull from
BRANCH="${1:-main}"

RAW_BASE="https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}"

# Monotonic version: commit count (always increases)
COUNT="$(git rev-list --count HEAD 2>/dev/null || echo 0)"
VERSION="0.0.${COUNT}"

# Find all tracked userscripts dynamically (no filenames needed)
FILES=()
while IFS= read -r f; do
  FILES+=("$f")
done < <(git ls-files '*.user.js')

if [[ ${#FILES[@]} -eq 0 ]]; then
  echo "No *.user.js files tracked by git."
  exit 0
fi

for f in "${FILES[@]}"; do
  url="${RAW_BASE}/${f}"

  # Stamp only within the ==UserScript== block.
  perl -0777 -i -pe '
    my ($ver, $u) = @ARGV;

    # Ensure header exists
    if (!m{//\s*==UserScript==.*?//\s*==/UserScript==}s) {
      die "Missing UserScript header (// ==UserScript== ... // ==/UserScript==)\n";
    }

    # Extract the header block
    s{
      (//\s*==UserScript==\s*\n)      # $1 start
      (.*?)                           # $2 body
      (//\s*==/UserScript==)          # $3 end
    }{
      my ($start, $body, $end) = ($1, $2, $3);

      # Helper: set or insert a directive line
      my $set_line = sub {
        my ($key, $val) = @_;
        if ($body =~ s/^(\s*\/\/\s*\@$key\s+).*$/$1$val/m) {
          # replaced
        } else {
          # insert near top (after start)
          $body = "// \@$key      $val\n" . $body;
        }
      };

      $set_line->("version",     $ver);
      $set_line->("updateURL",   $u);
      $set_line->("downloadURL", $u);

      $start . $body . $end
    }gsex;
  ' "$VERSION" "$url" "$f"

  echo "Stamped: $f -> v${VERSION}"
done

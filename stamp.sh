#!/usr/bin/env bash
set -euo pipefail

OWNER="ts"
REPO="gr"
BRANCH="${1:-main}"

RAW_BASE="https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}"

COUNT="$(git rev-list --count HEAD 2>/dev/null || echo 0)"
VERSION="0.0.${COUNT}"

FILES=()
while IFS= read -r f; do
  FILES+=("$f")
done < <(git ls-files '*.user.js')

if [[ ${#FILES[@]} -eq 0 ]]; then
  echo "No *.user.js files tracked by git."
  exit 0
fi

for f in "${FILES[@]}"; do
  # URL-encode spaces (critical)
  ENCODED_PATH="${f// /%20}"
  URL="${RAW_BASE}/${ENCODED_PATH}"

  VERSION_ENV="$VERSION" URL_ENV="$URL" \
  perl -0777 -i -pe '
    my $ver = $ENV{VERSION_ENV};
    my $url = $ENV{URL_ENV};

    # Extract userscript header
    if (!s{
      (//\s*==UserScript==\s*\n)
      (.*?)
      (//\s*==/UserScript==)
    }{
      my ($start, $body, $end) = ($1, $2, $3);

      my %seen;

      # Remove existing version/update/download lines
      my @lines = grep {
        if (/^\s*\/\/\s*\@(version|updateURL|downloadURL)\b/i) {
          $seen{lc $1} = 1;
          0;
        } else {
          1;
        }
      } split /\n/, $body;

      # Build clean header body
      my @new = (
        "// \@version      $ver",
        "// \@updateURL    $url",
        "// \@downloadURL  $url",
      );

      $start
      . join("\n", @new, @lines)
      . "\n"
      . $end
    }gsex) {
      die "Missing or malformed UserScript header\n";
    }
  ' "$f"

  echo "Stamped: $f -> v${VERSION}"
done
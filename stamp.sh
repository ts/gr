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

# If filenames were passed in (from the hook), stamp only those.
# Otherwise fall back to all tracked *.user.js.
FILES=()
if [[ $# -gt 1 ]]; then
  shift # remove BRANCH arg
  FILES=("$@")
else
  while IFS= read -r f; do
    FILES+=("$f")
  done < <(git ls-files '*.user.js')
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
      . join("\n", @lines, @new)
      . "\n"
      . $end
    }gsex) {
      die "Missing or malformed UserScript header\n";
    }
  ' "$f"

  echo "Stamped: $f -> v${VERSION}"
done
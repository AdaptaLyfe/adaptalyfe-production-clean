#!/usr/bin/env bash
set -Eeuo pipefail

REMOTE="${REMOTE:-origin}"
SOURCE_BRANCH="${SOURCE_BRANCH:-ai-staging}"
TARGET_BRANCH="${TARGET_BRANCH:-main}"
MODE="${1:---dry-run}"

usage() {
  cat <<'USAGE'
Usage:
  bash promote-staging-to-production.sh [--dry-run|--promote]

Defaults to --dry-run. --promote pushes a merge of the remote staging branch
to the remote production branch after displaying the diff and requiring a
typed confirmation.

Optional environment overrides:
  REMOTE=origin
  SOURCE_BRANCH=ai-staging
  TARGET_BRANCH=main
USAGE
}

case "$MODE" in
  --dry-run|--promote) ;;
  -h|--help)
    usage
    exit 0
    ;;
  *)
    usage >&2
    exit 2
    ;;
esac

ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "Run this script from inside the Git repository." >&2
  exit 1
}
cd "$ROOT"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Note: local uncommitted changes are not included; promotion uses fetched remote branches only."
fi

if ! git remote get-url "$REMOTE" >/dev/null 2>&1; then
  echo "Git remote '$REMOTE' was not found." >&2
  exit 1
fi

echo "Fetching current branch refs from '$REMOTE'..."
git fetch "$REMOTE" --prune

SOURCE_REF="$REMOTE/$SOURCE_BRANCH"
TARGET_REF="$REMOTE/$TARGET_BRANCH"

if ! git show-ref --verify --quiet "refs/remotes/$SOURCE_REF"; then
  echo "Remote source branch '$SOURCE_REF' was not found." >&2
  exit 1
fi
if ! git show-ref --verify --quiet "refs/remotes/$TARGET_REF"; then
  echo "Remote target branch '$TARGET_REF' was not found." >&2
  exit 1
fi
if ! git merge-base "$TARGET_REF" "$SOURCE_REF" >/dev/null; then
  echo "The source and target branches have no common history; refusing promotion." >&2
  exit 1
fi

read -r TARGET_ONLY SOURCE_ONLY < <(
  git rev-list --left-right --count "$TARGET_REF...$SOURCE_REF"
)

echo
echo "Promotion: $SOURCE_REF -> $TARGET_REF"
echo "Commits only on target: $TARGET_ONLY"
echo "Commits only on source: $SOURCE_ONLY"

if [[ "$SOURCE_ONLY" -eq 0 ]]; then
  echo "There are no staging commits to promote."
  exit 0
fi

echo
echo "Commits to include:"
git log --oneline --no-decorate "$TARGET_REF..$SOURCE_REF"

echo
echo "Changed-file summary:"
git diff --stat "$TARGET_REF...$SOURCE_REF"

MIGRATION_FILES="$(
  git diff --name-only "$TARGET_REF...$SOURCE_REF" |
    grep -E '(^|/)(migrations?(/|$)|[^/]+\.sql$)' || true
)"

if [[ -n "$MIGRATION_FILES" ]]; then
  echo
  echo "WARNING: SQL migration files are included:"
  printf '%s\n' "$MIGRATION_FILES" | sed 's/^/  /'
  echo "This script does not apply or validate production database migrations."
fi

if [[ "$MODE" == "--dry-run" ]]; then
  echo
  echo "Preview only; no merge or push was performed."
  echo "After reviewing the diff and production deployment settings, run:"
  echo "  bash promote-staging-to-production.sh --promote"
  exit 0
fi

echo
echo "This will push a merge commit to '$REMOTE/$TARGET_BRANCH'."
echo "If production deploys from '$TARGET_BRANCH', this may release all listed changes."
read -r -p "Type PROMOTE $TARGET_BRANCH to continue: " CONFIRMATION
if [[ "$CONFIRMATION" != "PROMOTE $TARGET_BRANCH" ]]; then
  echo "Confirmation did not match; nothing was pushed."
  exit 1
fi

TEMP_WORKTREE="$(mktemp -d "${TMPDIR:-/tmp}/adaptalyfe-promotion.XXXXXX")"
WORKTREE_ADDED=0
cleanup() {
  if [[ "$WORKTREE_ADDED" -eq 1 ]]; then
    git -C "$ROOT" worktree remove --force "$TEMP_WORKTREE" >/dev/null 2>&1 || true
  fi
  rmdir "$TEMP_WORKTREE" 2>/dev/null || true
}
trap cleanup EXIT

git worktree add --detach "$TEMP_WORKTREE" "$TARGET_REF"
WORKTREE_ADDED=1

git -C "$TEMP_WORKTREE" merge --no-ff --no-edit "$SOURCE_REF"
MERGE_COMMIT="$(git -C "$TEMP_WORKTREE" rev-parse HEAD)"

echo
echo "Pushing merge commit $MERGE_COMMIT to $REMOTE/$TARGET_BRANCH..."
git -C "$TEMP_WORKTREE" push "$REMOTE" "HEAD:refs/heads/$TARGET_BRANCH"

echo
echo "Promotion push succeeded."
echo "Check the production deployment and database migration status separately."
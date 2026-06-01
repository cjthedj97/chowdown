#!/usr/bin/env python3

from __future__ import annotations

import argparse
import datetime as dt
from pathlib import Path
import re
import subprocess
import sys


FRONTMATTER_RE = re.compile(r"^---\n(.*?)\n---\n", re.DOTALL)
DATE_ADDED_RE = re.compile(r"^date_added:\s*.*$", re.MULTILINE)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Backfill date_added in recipe frontmatter from git history or mtime."
    )
    parser.add_argument(
        "--recipes-dir",
        default="_recipes",
        help="Recipe directory (default: _recipes)",
    )
    parser.add_argument(
        "--write",
        action="store_true",
        help="Write changes to files (default is dry run).",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Overwrite existing date_added values.",
    )
    parser.add_argument(
        "--allow-all-today",
        action="store_true",
        help="Allow writing even if all derived dates equal today.",
    )
    parser.add_argument(
        "--source",
        choices=["auto", "git", "mtime"],
        default="auto",
        help="Date source: auto (prefer git), git, or mtime. Default: auto.",
    )
    return parser.parse_args()


def inject_date_added(frontmatter: str, date_value: str, overwrite: bool) -> tuple[str, bool]:
    if DATE_ADDED_RE.search(frontmatter):
        if not overwrite:
            return frontmatter, False
        updated = DATE_ADDED_RE.sub(f"date_added: {date_value}", frontmatter, count=1)
        return updated, True

    lines = frontmatter.splitlines()
    insert_at = len(lines)

    for i, line in enumerate(lines):
        if line.strip().startswith("ingredients:"):
            insert_at = i
            break

    lines.insert(insert_at, f"date_added: {date_value}")
    return "\n".join(lines), True


def get_git_added_date(repo_root: Path, recipe_file: Path) -> str | None:
    if recipe_file.is_absolute():
        rel_path = str(recipe_file.relative_to(repo_root))
    else:
        rel_path = recipe_file.as_posix()
    cmd = [
        "git",
        "log",
        "--diff-filter=A",
        "--follow",
        "--format=%cs",
        "-1",
        "--",
        rel_path,
    ]

    result = subprocess.run(
        cmd,
        cwd=repo_root,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        return None

    date_value = result.stdout.strip()
    if not date_value:
        return None

    return date_value


def derive_date(source: str, repo_root: Path, recipe_file: Path) -> tuple[str, str]:
    mtime_date = dt.datetime.fromtimestamp(recipe_file.stat().st_mtime).date().isoformat()
    if source == "mtime":
        return mtime_date, "mtime"

    git_date = get_git_added_date(repo_root, recipe_file)
    if source == "git":
        if git_date is None:
            return mtime_date, "mtime-fallback"
        return git_date, "git"

    if git_date is not None:
        return git_date, "git"
    return mtime_date, "mtime-fallback"


def main() -> int:
    args = parse_args()
    recipes_dir = Path(args.recipes_dir)

    if not recipes_dir.exists():
        print(f"ERROR: directory not found: {recipes_dir}", file=sys.stderr)
        return 1

    recipe_files = sorted(recipes_dir.glob("*.md"))
    if not recipe_files:
        print(f"ERROR: no recipe files found in {recipes_dir}", file=sys.stderr)
        return 1

    repo_root = Path.cwd()
    today = dt.date.today().isoformat()
    derived_dates = []
    planned_updates: list[tuple[Path, str, str]] = []
    skipped_no_frontmatter = 0
    source_counts = {"git": 0, "mtime": 0, "mtime-fallback": 0}

    for recipe_file in recipe_files:
        text = recipe_file.read_text(encoding="utf-8")
        match = FRONTMATTER_RE.match(text)
        if not match:
            skipped_no_frontmatter += 1
            continue

        derived_date, used_source = derive_date(args.source, repo_root, recipe_file)
        derived_dates.append(derived_date)
        source_counts[used_source] = source_counts.get(used_source, 0) + 1

        current_frontmatter = match.group(1)
        new_frontmatter, changed = inject_date_added(
            current_frontmatter, derived_date, args.overwrite
        )
        if not changed:
            continue

        new_text = f"---\n{new_frontmatter}\n---\n" + text[match.end() :]
        planned_updates.append((recipe_file, derived_date, new_text))

    unique_dates = set(derived_dates)
    all_today = bool(unique_dates) and unique_dates == {today}

    print(f"Scanned: {len(recipe_files)} files")
    print(f"Planned updates: {len(planned_updates)}")
    print(f"Skipped (no frontmatter): {skipped_no_frontmatter}")
    print(
        "Source usage: "
        f"git={source_counts['git']}, "
        f"mtime={source_counts['mtime']}, "
        f"mtime-fallback={source_counts['mtime-fallback']}"
    )
    print(f"Unique derived dates: {len(unique_dates)}")
    if unique_dates:
        preview = ", ".join(sorted(unique_dates)[:6])
        print(f"Date preview: {preview}{' ...' if len(unique_dates) > 6 else ''}")

    if all_today and not args.allow_all_today:
        print(
            "\nSAFETY STOP: all file mtimes resolve to today. "
            "This usually means timestamps were reset (copy/checkout/sync).",
            file=sys.stderr,
        )
        print(
            "No files written. Re-run with --allow-all-today only if this is expected.",
            file=sys.stderr,
        )
        return 2

    if not args.write:
        print("\nDry run only. Re-run with --write to apply changes.")
        return 0

    for recipe_file, _, new_text in planned_updates:
        recipe_file.write_text(new_text, encoding="utf-8")

    print(f"\nWrote date_added updates to {len(planned_updates)} files.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

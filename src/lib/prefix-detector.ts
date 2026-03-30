const MIN_GROUP_SIZE = 5;

export function detectPrefixes(
  filenames: string[]
): Map<string, string[]> {
  const namesByFirstSeg = new Map<string, string[]>();
  const namesByTwoSeg = new Map<string, string[]>();

  for (const fn of filenames) {
    const parts = fn.split(/[-_]/);
    if (parts.length < 2) continue;

    const first = parts[0].toLowerCase();
    if (!first) continue;

    if (!namesByFirstSeg.has(first)) namesByFirstSeg.set(first, []);
    namesByFirstSeg.get(first)!.push(fn);

    if (parts.length >= 3) {
      const two = `${first}-${parts[1].toLowerCase()}`;
      if (!namesByTwoSeg.has(two)) namesByTwoSeg.set(two, []);
      namesByTwoSeg.get(two)!.push(fn);
    }
  }

  const groups = new Map<string, string[]>();
  const assigned = new Set<string>();

  // Check if a 2-segment prefix dominates a 1-segment prefix (>= 80%)
  for (const [firstSeg, firstSegFiles] of namesByFirstSeg) {
    let promoted = false;

    for (const [twoSeg, twoSegFiles] of namesByTwoSeg) {
      if (!twoSeg.startsWith(firstSeg + "-")) continue;
      if (
        twoSegFiles.length >= MIN_GROUP_SIZE &&
        twoSegFiles.length >= firstSegFiles.length * 0.8
      ) {
        groups.set(twoSeg, twoSegFiles);
        for (const fn of twoSegFiles) assigned.add(fn);
        promoted = true;
      }
    }

    if (!promoted && firstSegFiles.length >= MIN_GROUP_SIZE) {
      // Only add files not already assigned to a 2-segment group
      const remaining = firstSegFiles.filter((fn) => !assigned.has(fn));
      if (remaining.length >= MIN_GROUP_SIZE) {
        groups.set(firstSeg, remaining);
        for (const fn of remaining) assigned.add(fn);
      }
    }
  }

  // Collect unassigned into "other"
  const other = filenames.filter((fn) => !assigned.has(fn));
  if (other.length > 0) {
    groups.set("other", other);
  }

  return groups;
}

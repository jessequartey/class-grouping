import type { Member, GroupConfig, GroupResult } from './types';

/**
 * Main function to create groups from members
 * Priority: Sector first, then location within sectors
 */
export function createGroups(members: Member[], config: GroupConfig): GroupResult[] {
  if (members.length === 0) {
    return [];
  }

  // Handle edge case: if total members < min group size, create one group anyway
  if (members.length < config.minGroupSize) {
    return [
      {
        name: 'Group 1',
        members,
      },
    ];
  }

  // Step 1: Group by sector
  const sectorMap = groupBySector(members);

  // Step 2: Within each sector, sub-group by location
  const subgroups = groupByLocation(sectorMap);

  // Step 3: Balance groups respecting constraints
  const balancedGroups = balanceGroups(subgroups, config);

  // Step 4: Name the groups
  return balancedGroups.map((members, index) => ({
    name: `Group ${index + 1}`,
    members,
  }));
}

/**
 * Group members by sector
 */
function groupBySector(members: Member[]): Map<string, Member[]> {
  const sectorMap = new Map<string, Member[]>();

  for (const member of members) {
    const sector = member.sector.trim().toLowerCase();
    if (!sectorMap.has(sector)) {
      sectorMap.set(sector, []);
    }
    sectorMap.get(sector)!.push(member);
  }

  return sectorMap;
}

/**
 * Within each sector, sub-group by location
 */
function groupByLocation(sectorMap: Map<string, Member[]>): Member[][] {
  const subgroups: Member[][] = [];

  for (const sectorMembers of sectorMap.values()) {
    const locationMap = new Map<string, Member[]>();

    for (const member of sectorMembers) {
      const location = member.location.trim().toLowerCase();
      if (!locationMap.has(location)) {
        locationMap.set(location, []);
      }
      locationMap.get(location)!.push(member);
    }

    // Each sector-location combination becomes a subgroup
    for (const locationGroup of locationMap.values()) {
      subgroups.push(locationGroup);
    }
  }

  return subgroups;
}

/**
 * Balance subgroups into final groups respecting constraints
 */
function balanceGroups(subgroups: Member[][], config: GroupConfig): Member[][] {
  const { maxGroups, minGroupSize, maxGroupSize } = config;

  // Sort subgroups by size (largest first) for better distribution
  subgroups.sort((a, b) => b.length - a.length);

  const groups: Member[][] = [];

  for (const subgroup of subgroups) {
    if (groups.length === 0) {
      // First subgroup always creates a new group
      groups.push([...subgroup]);
      continue;
    }

    // Try to add to existing group that has space and won't exceed max size
    let added = false;

    for (const group of groups) {
      if (group.length + subgroup.length <= maxGroupSize) {
        group.push(...subgroup);
        added = true;
        break;
      }
    }

    // Create new group if needed and allowed
    if (!added && groups.length < maxGroups) {
      groups.push([...subgroup]);
    } else if (!added) {
      // Max groups reached, distribute members to existing groups
      distributeMembers(subgroup, groups, maxGroupSize);
    }
  }

  // Validate and rebalance if groups are too small
  const finalGroups = validateAndRebalance(groups, config);

  return finalGroups;
}

/**
 * Distribute overflow members to existing groups
 */
function distributeMembers(
  members: Member[],
  existingGroups: Member[][],
  maxGroupSize: number
): void {
  // Sort groups by current size (smallest first)
  const sortedGroups = [...existingGroups].sort((a, b) => a.length - b.length);

  for (const member of members) {
    // Find first group with space
    for (const group of sortedGroups) {
      if (group.length < maxGroupSize) {
        group.push(member);
        // Re-sort after adding
        sortedGroups.sort((a, b) => a.length - b.length);
        break;
      }
    }
  }
}

/**
 * Validate and rebalance groups to meet minimum size requirements
 */
function validateAndRebalance(
  groups: Member[][],
  config: GroupConfig
): Member[][] {
  const { minGroupSize, maxGroupSize } = config;

  // Separate valid groups from groups that are too small
  const validGroups: Member[][] = [];
  const orphans: Member[] = [];

  for (const group of groups) {
    if (group.length >= minGroupSize) {
      validGroups.push(group);
    } else {
      orphans.push(...group);
    }
  }

  // If no valid groups but we have orphans, create one group anyway
  if (validGroups.length === 0 && orphans.length > 0) {
    return [orphans];
  }

  // Redistribute orphans to valid groups
  if (orphans.length > 0 && validGroups.length > 0) {
    distributeMembers(orphans, validGroups, maxGroupSize);
  }

  return validGroups;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateClassCreation(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Class name is required');
  } else if (data.name.length > 100) {
    errors.push('Class name must be 100 characters or less');
  }

  if (!Number.isInteger(data.maxGroups) || data.maxGroups < 1) {
    errors.push('Max groups must be a positive integer');
  } else if (data.maxGroups > 100) {
    errors.push('Max groups cannot exceed 100');
  }

  if (!Number.isInteger(data.minGroupSize) || data.minGroupSize < 1) {
    errors.push('Min group size must be a positive integer');
  }

  if (!Number.isInteger(data.maxGroupSize) || data.maxGroupSize < 1) {
    errors.push('Max group size must be a positive integer');
  }

  if (data.maxGroupSize < data.minGroupSize) {
    errors.push('Max group size must be greater than or equal to min group size');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateMemberRegistration(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Name is required');
  } else if (data.name.length > 100) {
    errors.push('Name must be 100 characters or less');
  }

  if (!data.location || typeof data.location !== 'string' || data.location.trim().length === 0) {
    errors.push('Location is required');
  } else if (data.location.length > 100) {
    errors.push('Location must be 100 characters or less');
  }

  if (!data.sector || typeof data.sector !== 'string' || data.sector.trim().length === 0) {
    errors.push('Sector is required');
  } else if (data.sector.length > 50) {
    errors.push('Sector must be 50 characters or less');
  }

  if (data.notes && typeof data.notes === 'string' && data.notes.length > 500) {
    errors.push('Notes must be 500 characters or less');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateGroupUpdate(data: any, classConfig: { minGroupSize: number; maxGroupSize: number }): ValidationResult {
  const errors: string[] = [];

  if (!Array.isArray(data.groups)) {
    errors.push('Groups must be an array');
    return { valid: false, errors };
  }

  for (const group of data.groups) {
    if (!group.id || typeof group.id !== 'string') {
      errors.push('Each group must have a valid ID');
    }

    if (!group.name || typeof group.name !== 'string' || group.name.trim().length === 0) {
      errors.push(`Group ${group.id || 'unknown'} must have a name`);
    }

    if (!Array.isArray(group.memberIds)) {
      errors.push(`Group ${group.id || 'unknown'} must have memberIds array`);
    } else {
      const memberCount = group.memberIds.length;

      if (memberCount < classConfig.minGroupSize) {
        errors.push(`Group "${group.name}" has ${memberCount} members, minimum is ${classConfig.minGroupSize}`);
      }

      if (memberCount > classConfig.maxGroupSize) {
        errors.push(`Group "${group.name}" has ${memberCount} members, maximum is ${classConfig.maxGroupSize}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

import { classes, members, groups, groupMembers } from '@/db/schema';

// Infer types from Drizzle schema
export type Class = typeof classes.$inferSelect;
export type NewClass = typeof classes.$inferInsert;

export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;

export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;

export type GroupMember = typeof groupMembers.$inferSelect;
export type NewGroupMember = typeof groupMembers.$inferInsert;

// Extended types for API responses
export interface GroupWithMembers extends Group {
  members: Member[];
}

export interface ClassWithDetails extends Class {
  isAdmin?: boolean;
  memberCount?: number;
  groupCount?: number;
}

export interface MemberWithGroup extends Member {
  groupId?: string | null;
  groupName?: string | null;
}

// Grouping algorithm types
export interface GroupConfig {
  maxGroups: number;
  minGroupSize: number;
  maxGroupSize: number;
}

export interface GroupResult {
  name: string;
  members: Member[];
}

// API Request/Response types
export interface CreateClassRequest {
  name: string;
  maxGroups: number;
  minGroupSize: number;
  maxGroupSize: number;
}

export interface CreateClassResponse {
  classId: string;
  adminToken: string;
  adminUrl: string;
}

export interface CreateMemberRequest {
  name: string;
  location: string;
  sector: string;
  notes?: string;
}

export interface CreateMemberResponse {
  memberId: string;
  success: boolean;
}

export interface AutoGroupResponse {
  groups: GroupWithMembers[];
  success: boolean;
}

export interface UpdateGroupsRequest {
  groups: Array<{
    id: string;
    name: string;
    position: number;
    memberIds: string[];
  }>;
}

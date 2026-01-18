import { sqliteTable, text, integer, index, unique } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const classes = sqliteTable('classes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  maxGroups: integer('max_groups').notNull(),
  minGroupSize: integer('min_group_size').notNull(),
  maxGroupSize: integer('max_group_size').notNull(),
  adminToken: text('admin_token').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  groupsCreated: integer('groups_created', { mode: 'boolean' }).default(false),
}, (table) => ({
  createdAtIdx: index('idx_classes_created_at').on(table.createdAt),
}));

export const members = sqliteTable('members', {
  id: text('id').primaryKey(),
  classId: text('class_id').notNull().references(() => classes.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  location: text('location').notNull(),
  sector: text('sector').notNull(),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  classIdIdx: index('idx_members_class_id').on(table.classId),
  sectorIdx: index('idx_members_sector').on(table.classId, table.sector),
  locationIdx: index('idx_members_location').on(table.classId, table.location),
}));

export const groups = sqliteTable('groups', {
  id: text('id').primaryKey(),
  classId: text('class_id').notNull().references(() => classes.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  position: integer('position').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  classIdIdx: index('idx_groups_class_id').on(table.classId),
  classPositionUnique: unique('idx_groups_class_position').on(table.classId, table.position),
}));

export const groupMembers = sqliteTable('group_members', {
  id: text('id').primaryKey(),
  groupId: text('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  memberId: text('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  groupIdIdx: index('idx_group_members_group_id').on(table.groupId),
  memberIdIdx: index('idx_group_members_member_id').on(table.memberId),
  uniqueGroupMember: unique('idx_group_members_unique').on(table.groupId, table.memberId),
}));

// Relations for easier queries
export const classesRelations = relations(classes, ({ many }) => ({
  members: many(members),
  groups: many(groups),
}));

export const membersRelations = relations(members, ({ one, many }) => ({
  class: one(classes, {
    fields: [members.classId],
    references: [classes.id],
  }),
  groupAssignments: many(groupMembers),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  class: one(classes, {
    fields: [groups.classId],
    references: [classes.id],
  }),
  members: many(groupMembers),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, {
    fields: [groupMembers.groupId],
    references: [groups.id],
  }),
  member: one(members, {
    fields: [groupMembers.memberId],
    references: [members.id],
  }),
}));

CREATE TABLE `classes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`max_groups` integer NOT NULL,
	`min_group_size` integer NOT NULL,
	`max_group_size` integer NOT NULL,
	`admin_token` text NOT NULL,
	`created_at` integer NOT NULL,
	`groups_created` integer DEFAULT false
);
--> statement-breakpoint
CREATE INDEX `idx_classes_created_at` ON `classes` (`created_at`);--> statement-breakpoint
CREATE TABLE `group_members` (
	`id` text PRIMARY KEY NOT NULL,
	`group_id` text NOT NULL,
	`member_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_group_members_group_id` ON `group_members` (`group_id`);--> statement-breakpoint
CREATE INDEX `idx_group_members_member_id` ON `group_members` (`member_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_group_members_unique` ON `group_members` (`group_id`,`member_id`);--> statement-breakpoint
CREATE TABLE `groups` (
	`id` text PRIMARY KEY NOT NULL,
	`class_id` text NOT NULL,
	`name` text NOT NULL,
	`position` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_groups_class_id` ON `groups` (`class_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_groups_class_position` ON `groups` (`class_id`,`position`);--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`class_id` text NOT NULL,
	`name` text NOT NULL,
	`location` text NOT NULL,
	`sector` text NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_members_class_id` ON `members` (`class_id`);--> statement-breakpoint
CREATE INDEX `idx_members_sector` ON `members` (`class_id`,`sector`);--> statement-breakpoint
CREATE INDEX `idx_members_location` ON `members` (`class_id`,`location`);
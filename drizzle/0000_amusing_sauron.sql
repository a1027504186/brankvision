CREATE TABLE `agent_assets` (
	`session_id` text NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`size` text NOT NULL,
	`platform` text NOT NULL,
	`url` text NOT NULL,
	`prompt` text NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`session_id`, `kind`),
	FOREIGN KEY (`session_id`) REFERENCES `agent_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `agent_assets_session_idx` ON `agent_assets` (`session_id`);--> statement-breakpoint
CREATE TABLE `agent_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`brand_type` text NOT NULL,
	`category` text NOT NULL,
	`stage` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `agent_sessions_updated_at_idx` ON `agent_sessions` (`updated_at`);--> statement-breakpoint
CREATE TABLE `agent_traces` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`input` text NOT NULL,
	`route` text NOT NULL,
	`action` text,
	`asset_kind` text,
	`platform` text,
	`status` text NOT NULL,
	`checks` text NOT NULL,
	`error` text,
	`started_at` text NOT NULL,
	`completed_at` text,
	`duration_ms` integer,
	FOREIGN KEY (`session_id`) REFERENCES `agent_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `agent_traces_session_started_idx` ON `agent_traces` (`session_id`,`started_at`);--> statement-breakpoint
CREATE INDEX `agent_traces_route_status_idx` ON `agent_traces` (`route`,`status`);
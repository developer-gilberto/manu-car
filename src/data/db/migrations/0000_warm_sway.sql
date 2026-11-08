CREATE TABLE `maintenance_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`vehicle_id` integer NOT NULL,
	`name` text NOT NULL,
	`interval_km` integer,
	`interval_months` integer,
	`last_done_km` integer,
	`last_done_at` text,
	`notify_enabled` integer DEFAULT true NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `maintenance_items_vehicle_id_idx` ON `maintenance_items` (`vehicle_id`);--> statement-breakpoint
CREATE TABLE `maintenance_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item_id` integer NOT NULL,
	`done_at` text NOT NULL,
	`km` integer NOT NULL,
	`cost_cents` integer,
	`notes` text,
	FOREIGN KEY (`item_id`) REFERENCES `maintenance_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `maintenance_logs_item_id_idx` ON `maintenance_logs` (`item_id`);--> statement-breakpoint
CREATE TABLE `odometer_readings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`vehicle_id` integer NOT NULL,
	`km` integer NOT NULL,
	`read_at` text NOT NULL,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `odometer_readings_vehicle_id_idx` ON `odometer_readings` (`vehicle_id`);--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`plate` text,
	`odometer_km` integer DEFAULT 0 NOT NULL,
	`odometer_updated_at` text NOT NULL
);

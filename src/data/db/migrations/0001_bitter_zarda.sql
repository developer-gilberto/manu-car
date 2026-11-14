ALTER TABLE `maintenance_items` ADD `baseline_km` integer;--> statement-breakpoint
ALTER TABLE `maintenance_items` ADD `baseline_at` text;--> statement-breakpoint
UPDATE `maintenance_items`
SET `baseline_km` = COALESCE(
	`last_done_km`,
	(SELECT `r`.`km` FROM `odometer_readings` `r` WHERE `r`.`vehicle_id` = `maintenance_items`.`vehicle_id` ORDER BY `r`.`read_at` ASC, `r`.`id` ASC LIMIT 1),
	(SELECT `v`.`odometer_km` FROM `vehicles` `v` WHERE `v`.`id` = `maintenance_items`.`vehicle_id`)
)
WHERE `baseline_km` IS NULL;--> statement-breakpoint
UPDATE `maintenance_items`
SET `baseline_at` = COALESCE(
	`last_done_at`,
	(SELECT `r`.`read_at` FROM `odometer_readings` `r` WHERE `r`.`vehicle_id` = `maintenance_items`.`vehicle_id` ORDER BY `r`.`read_at` ASC, `r`.`id` ASC LIMIT 1),
	(SELECT `v`.`odometer_updated_at` FROM `vehicles` `v` WHERE `v`.`id` = `maintenance_items`.`vehicle_id`)
)
WHERE `baseline_at` IS NULL;
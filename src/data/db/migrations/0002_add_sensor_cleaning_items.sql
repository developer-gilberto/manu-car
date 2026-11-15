INSERT INTO `maintenance_items` (`vehicle_id`, `name`, `interval_km`, `interval_months`, `baseline_km`, `baseline_at`)
SELECT `v`.`id`, 'limpeza do sensor MAP', 30000, 24, `v`.`odometer_km`, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM `vehicles` `v`
WHERE NOT EXISTS (
	SELECT 1 FROM `maintenance_items` `mi`
	WHERE `mi`.`vehicle_id` = `v`.`id` AND `mi`.`name` = 'limpeza do sensor MAP'
);--> statement-breakpoint
INSERT INTO `maintenance_items` (`vehicle_id`, `name`, `interval_km`, `interval_months`, `baseline_km`, `baseline_at`)
SELECT `v`.`id`, 'limpeza do sensor MAF', 30000, 24, `v`.`odometer_km`, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM `vehicles` `v`
WHERE NOT EXISTS (
	SELECT 1 FROM `maintenance_items` `mi`
	WHERE `mi`.`vehicle_id` = `v`.`id` AND `mi`.`name` = 'limpeza do sensor MAF'
);--> statement-breakpoint
INSERT INTO `maintenance_items` (`vehicle_id`, `name`, `interval_km`, `interval_months`, `baseline_km`, `baseline_at`)
SELECT `v`.`id`, 'limpeza da sonda lambda', 40000, 24, `v`.`odometer_km`, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM `vehicles` `v`
WHERE NOT EXISTS (
	SELECT 1 FROM `maintenance_items` `mi`
	WHERE `mi`.`vehicle_id` = `v`.`id` AND `mi`.`name` = 'limpeza da sonda lambda'
);

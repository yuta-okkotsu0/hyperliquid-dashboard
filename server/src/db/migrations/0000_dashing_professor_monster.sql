CREATE TABLE `account_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`timestamp` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`total_equity` real NOT NULL,
	`available_balance` real NOT NULL,
	`unrealized_pnl` real DEFAULT 0 NOT NULL,
	`realized_pnl_24h` real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ai_reasoning` (
	`id` text PRIMARY KEY NOT NULL,
	`trade_id` text,
	`position_id` text,
	`timestamp` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`action` text NOT NULL,
	`confidence` real NOT NULL,
	`reasoning` text NOT NULL,
	`indicators` text DEFAULT '{}' NOT NULL,
	FOREIGN KEY (`trade_id`) REFERENCES `trades`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`position_id`) REFERENCES `positions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `bot_status` (
	`id` integer PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'STOPPED' NOT NULL,
	`last_heartbeat` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`started_at` integer
);
--> statement-breakpoint
CREATE TABLE `logs` (
	`id` text PRIMARY KEY NOT NULL,
	`timestamp` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`level` text NOT NULL,
	`source` text NOT NULL,
	`message` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `positions` (
	`id` text PRIMARY KEY NOT NULL,
	`coin` text NOT NULL,
	`side` text NOT NULL,
	`entry_price` real NOT NULL,
	`mark_price` real NOT NULL,
	`size` real NOT NULL,
	`leverage` real DEFAULT 1 NOT NULL,
	`unrealized_pnl` real DEFAULT 0 NOT NULL,
	`liquidation_price` real,
	`opened_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`closed_at` integer,
	`status` text DEFAULT 'OPEN' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `trades` (
	`id` text PRIMARY KEY NOT NULL,
	`position_id` text,
	`coin` text NOT NULL,
	`side` text NOT NULL,
	`size` real NOT NULL,
	`price` real NOT NULL,
	`fee` real DEFAULT 0 NOT NULL,
	`pnl` real,
	`timestamp` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`position_id`) REFERENCES `positions`(`id`) ON UPDATE no action ON DELETE no action
);

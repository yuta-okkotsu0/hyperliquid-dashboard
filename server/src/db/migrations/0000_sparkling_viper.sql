CREATE TABLE `account_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`timestamp` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`total_equity` real NOT NULL,
	`available_balance` real NOT NULL,
	`unrealized_pnl` real DEFAULT 0 NOT NULL,
	`realized_pnl_24h` real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `activities` (
	`id` text PRIMARY KEY NOT NULL,
	`strategy_id` text,
	`type` text NOT NULL,
	`message` text NOT NULL,
	`coin` text,
	`data` text,
	`timestamp` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`strategy_id`) REFERENCES `strategies`(`id`) ON UPDATE no action ON DELETE no action
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
CREATE TABLE `exchange_health` (
	`id` integer PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'ONLINE' NOT NULL,
	`latency_ms` integer DEFAULT 0,
	`rate_limit_used` integer DEFAULT 0,
	`rate_limit_total` integer DEFAULT 100,
	`last_check` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`error_message` text
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
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`strategy_id` text,
	`position_id` text,
	`coin` text NOT NULL,
	`side` text NOT NULL,
	`order_type` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`size` real NOT NULL,
	`price` real,
	`filled_price` real,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer,
	`closed_at` integer,
	FOREIGN KEY (`strategy_id`) REFERENCES `strategies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`position_id`) REFERENCES `positions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `positions` (
	`id` text PRIMARY KEY NOT NULL,
	`strategy_id` text,
	`coin` text NOT NULL,
	`side` text NOT NULL,
	`entry_price` real NOT NULL,
	`mark_price` real NOT NULL,
	`size` real NOT NULL,
	`leverage` real DEFAULT 1 NOT NULL,
	`unrealized_pnl` real DEFAULT 0 NOT NULL,
	`liquidation_price` real,
	`margin_used` real DEFAULT 0,
	`opened_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`closed_at` integer,
	`status` text DEFAULT 'OPEN' NOT NULL,
	FOREIGN KEY (`strategy_id`) REFERENCES `strategies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `strategies` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`total_trades` integer DEFAULT 0 NOT NULL,
	`winning_trades` integer DEFAULT 0 NOT NULL,
	`total_pnl` real DEFAULT 0 NOT NULL,
	`sharpe_ratio` real DEFAULT 0,
	`max_drawdown` real DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `trades` (
	`id` text PRIMARY KEY NOT NULL,
	`strategy_id` text,
	`position_id` text,
	`coin` text NOT NULL,
	`side` text NOT NULL,
	`size` real NOT NULL,
	`price` real NOT NULL,
	`fee` real DEFAULT 0 NOT NULL,
	`pnl` real,
	`timestamp` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`strategy_id`) REFERENCES `strategies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`position_id`) REFERENCES `positions`(`id`) ON UPDATE no action ON DELETE no action
);

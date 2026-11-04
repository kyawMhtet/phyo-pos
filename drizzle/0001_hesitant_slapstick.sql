CREATE TABLE `product_packs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`label` text NOT NULL,
	`units_per_pack` integer DEFAULT 1 NOT NULL,
	`price` integer NOT NULL,
	`cost_price` integer DEFAULT 0 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `categories` ADD `stock_unit` text DEFAULT 'pcs' NOT NULL;--> statement-breakpoint
ALTER TABLE `categories` ADD `options` text;--> statement-breakpoint
ALTER TABLE `categories` ADD `low_stock_at` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `categories` ADD `sort_order` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `order_items` ADD `pack_id` integer;--> statement-breakpoint
ALTER TABLE `order_items` ADD `pack_label` text;--> statement-breakpoint
ALTER TABLE `order_items` ADD `units_per_pack` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `order_items` ADD `option_label` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `fulfillment` text DEFAULT 'delivery' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `paid_amount` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `sort_order` integer DEFAULT 0 NOT NULL;
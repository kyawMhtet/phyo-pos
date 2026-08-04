import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
});

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  categoryId: integer("category_id").references(() => categories.id),
  name: text("name").notNull(),
  variant: text("variant"),
  price: integer("price").notNull(),
  costPrice: integer("cost_price").notNull().default(0),
  stock: integer("stock").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone"),
  address: text("address"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id").references(() => customers.id),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  address: text("address"),
  note: text("note"),
  status: text("status", {
    enum: ["pending", "paid", "delivered", "cancelled"],
  })
    .notNull()
    .default("pending"),
  paymentMethod: text("payment_method", {
    enum: ["cash", "transfer", "other"],
  })
    .notNull()
    .default("cash"),
  handledBy: text("handled_by"),
  itemsSubtotal: integer("items_subtotal").notNull(),
  deliveryFee: integer("delivery_fee").notNull().default(0),
  discount: integer("discount").notNull().default(0),
  total: integer("total").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  productName: text("product_name").notNull(),
  unitPrice: integer("unit_price").notNull(),
  unitCost: integer("unit_cost").notNull().default(0),
  quantity: integer("quantity").notNull(),
  subtotal: integer("subtotal").notNull(),
});

export const stockAdjustments = sqliteTable("stock_adjustments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  change: integer("change").notNull(),
  reason: text("reason").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const expenses = sqliteTable("expenses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  description: text("description").notNull(),
  amount: integer("amount").notNull(),
  category: text("category"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

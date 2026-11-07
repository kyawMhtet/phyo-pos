import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// A product line — one flyer's worth of goods, e.g. "China Made Deli Bag". The UI
// calls this a "product"; each size under it is a `products` row.
export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  // What `products.stock` is counted in: pcs, kg, yard...
  stockUnit: text("stock_unit").notNull().default("pcs"),
  // Comma-separated colours/designs the customer picks from. Not stock-tracked.
  options: text("options"),
  // Warn when a size's stock is at or below this. 0 turns the warning off.
  lowStockAt: integer("low_stock_at").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
});

// One size within a product line. `name` is the size ("15 x 25 cm"), `variant` an
// optional extra line under it ('5.9"x9.8"'). Stock is held here, in the line's
// stockUnit, and shared by all of the size's packs.
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  categoryId: integer("category_id").references(() => categories.id),
  name: text("name").notNull(),
  variant: text("variant"),
  // Superseded by product_packs; only kept in step with the first pack so the
  // migration stays additive. Read prices from product_packs.
  price: integer("price").notNull(),
  costPrice: integer("cost_price").notNull().default(0),
  stock: integer("stock").notNull().default(0),
  // How many stock units one pack from the supplier holds. Only for entering and
  // showing stock; selling always goes through product_packs.
  supplierPackSize: integer("supplier_pack_size"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// How a size is sold: "100 pcs", "1 kg", "1 roll". Selling one pack takes
// unitsPerPack off products.stock.
export const productPacks = sqliteTable("product_packs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  unitsPerPack: integer("units_per_pack").notNull().default(1),
  price: integer("price").notNull(),
  costPrice: integer("cost_price").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
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
    enum: ["pending", "packed", "delivered", "cancelled"],
  })
    .notNull()
    .default("pending"),
  fulfillment: text("fulfillment", { enum: ["delivery", "pickup"] })
    .notNull()
    .default("delivery"),
  paymentMethod: text("payment_method", {
    enum: ["cash", "kpay", "wave", "transfer", "other"],
  })
    .notNull()
    .default("cash"),
  // Money received so far. Balance is total - paidAmount.
  paidAmount: integer("paid_amount").notNull().default(0),
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
  // No FK: packs can be deleted, the snapshot fields below keep the history.
  packId: integer("pack_id"),
  packLabel: text("pack_label"),
  unitsPerPack: integer("units_per_pack").notNull().default(1),
  optionLabel: text("option_label"),
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

import Link from "next/link";
import { and, desc, eq, gte, lt, lte, ne } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { expenses, orderItems, orders, products } from "@/lib/db/schema";
import { formatMoney } from "@/lib/money";
import { getDictionary } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const LOW_STOCK_THRESHOLD = 5;

export default async function DashboardPage() {
  const { dict } = await getDictionary();
  const db = getDb();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const todayWhere = and(
    gte(orders.createdAt, startOfToday),
    lt(orders.createdAt, startOfTomorrow),
    ne(orders.status, "cancelled")
  );

  const [todaysOrders, todaysItems, todaysExpenses, recentOrders, lowStockProducts] =
    await Promise.all([
      db.select({ total: orders.total }).from(orders).where(todayWhere),
      db
        .select({ quantity: orderItems.quantity, unitCost: orderItems.unitCost })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(todayWhere),
      db
        .select()
        .from(expenses)
        .where(
          and(gte(expenses.createdAt, startOfToday), lt(expenses.createdAt, startOfTomorrow))
        ),
      db.select().from(orders).orderBy(desc(orders.createdAt)).limit(5),
      db.select().from(products).where(lte(products.stock, LOW_STOCK_THRESHOLD)),
    ]);

  const todaysSales = todaysOrders.reduce((sum, order) => sum + order.total, 0);
  const todaysCogs = todaysItems.reduce((sum, i) => sum + i.unitCost * i.quantity, 0);
  const todaysExpenseTotal = todaysExpenses.reduce((sum, e) => sum + e.amount, 0);
  const profit = todaysSales - todaysCogs - todaysExpenseTotal;
  const activeLowStock = lowStockProducts.filter((p) => p.isActive);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-lg text-accent">{dict.dashboard.title}</h1>
        <Link href="/orders/new">
          <Button>{dict.dashboard.newSale}</Button>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="rise-in">
          <p className="text-xs text-muted">{dict.dashboard.todaySales}</p>
          <p className="text-lg font-semibold">{formatMoney(todaysSales)}</p>
        </Card>
        <Card className="rise-in" style={{ animationDelay: "60ms" }}>
          <p className="text-xs text-muted">{dict.dashboard.todayExpenses}</p>
          <p className="text-lg font-semibold text-red-600">
            {formatMoney(todaysExpenseTotal)}
          </p>
        </Card>
        <Card className="rise-in" style={{ animationDelay: "120ms" }}>
          <p className="text-xs text-muted">{dict.dashboard.profit}</p>
          <p className="text-lg font-semibold text-accent">{formatMoney(profit)}</p>
        </Card>
      </div>

      {activeLowStock.length > 0 && (
        <Card className="space-y-2 border-stamp-pending">
          <p className="text-sm font-medium text-stamp-pending">{dict.dashboard.lowStock}</p>
          {activeLowStock.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="flex justify-between text-sm"
            >
              <span>
                {product.name}
                {product.variant ? ` — ${product.variant}` : ""}
              </span>
              <span className="text-stamp-pending">
                {product.stock} {dict.dashboard.left}
              </span>
            </Link>
          ))}
        </Card>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{dict.dashboard.recentOrders}</p>
          <Link href="/orders" className="text-sm text-muted hover:text-accent">
            {dict.dashboard.viewAll}
          </Link>
        </div>
        {recentOrders.length === 0 && (
          <p className="text-sm text-muted">{dict.dashboard.noOrders}</p>
        )}
        {recentOrders.map((order, i) => (
          <Link key={order.id} href={`/orders/${order.id}`}>
            <Card
              className="rise-in flex items-center justify-between hover:border-accent"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div>
                <p className="font-medium">{order.customerName}</p>
                <p className="text-xs text-muted">{order.createdAt.toLocaleString()}</p>
              </div>
              <p className="font-medium">{formatMoney(order.total)}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

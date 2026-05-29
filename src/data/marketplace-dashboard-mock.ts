export type OrderStatus = "paid" | "pending" | "shipped" | "cancelled";

export type MarketplaceProduct = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  sales: number;
  image: string;
};

export type MarketplaceOrder = {
  id: string;
  customer: string;
  product: string;
  amount: number;
  status: OrderStatus;
  date: string;
};

export type RevenuePoint = {
  label: string;
  value: number;
};

export const marketplaceStats = {
  revenue: 128_450_000,
  revenueChange: 12.4,
  revenueSpark: [42, 58, 51, 64, 72, 68, 85, 91, 88, 100],
  orders: 384,
  ordersChange: 8.2,
  ordersSpark: [28, 32, 30, 35, 38, 36, 42, 45, 44, 48],
  products: 56,
  productsChange: 3,
  productsSpark: [48, 50, 51, 52, 53, 54, 55, 56, 56, 56],
  visitors: 12_840,
  visitorsChange: -2.1,
  visitorsSpark: [92, 88, 90, 86, 84, 82, 80, 78, 79, 76],
};

/** Monthly gross revenue (IDR) — Jun matches MTD total in stats. */
export const revenueByMonth: RevenuePoint[] = [
  { label: "Jan", value: 79_500_000 },
  { label: "Feb", value: 92_100_000 },
  { label: "Mar", value: 87_400_000 },
  { label: "Apr", value: 105_200_000 },
  { label: "May", value: 118_800_000 },
  { label: "Jun", value: 128_450_000 },
];

export const products: MarketplaceProduct[] = [
  {
    id: "p1",
    name: "Wireless Earbuds Pro",
    category: "Electronics",
    price: 899_000,
    stock: 124,
    sales: 342,
    image: "🎧",
  },
  {
    id: "p2",
    name: "Minimal Desk Lamp",
    category: "Home",
    price: 349_000,
    stock: 58,
    sales: 189,
    image: "💡",
  },
  {
    id: "p3",
    name: "Organic Coffee Beans 1kg",
    category: "Food",
    price: 185_000,
    stock: 210,
    sales: 521,
    image: "☕",
  },
  {
    id: "p4",
    name: "Running Shoes Air",
    category: "Fashion",
    price: 1_299_000,
    stock: 42,
    sales: 97,
    image: "👟",
  },
  {
    id: "p5",
    name: "Smart Watch S2",
    category: "Electronics",
    price: 1_599_000,
    stock: 31,
    sales: 156,
    image: "⌚",
  },
  {
    id: "p6",
    name: "Yoga Mat Premium",
    category: "Sports",
    price: 279_000,
    stock: 88,
    sales: 203,
    image: "🧘",
  },
];

export const orders: MarketplaceOrder[] = [
  {
    id: "ORD-9281",
    customer: "Aisha Rahman",
    product: "Wireless Earbuds Pro",
    amount: 899_000,
    status: "paid",
    date: "2026-05-26",
  },
  {
    id: "ORD-9280",
    customer: "Budi Santoso",
    product: "Organic Coffee Beans 1kg",
    amount: 370_000,
    status: "shipped",
    date: "2026-05-26",
  },
  {
    id: "ORD-9279",
    customer: "Clara Wijaya",
    product: "Smart Watch S2",
    amount: 1_599_000,
    status: "pending",
    date: "2026-05-25",
  },
  {
    id: "ORD-9278",
    customer: "Dewi Lestari",
    product: "Minimal Desk Lamp",
    amount: 349_000,
    status: "paid",
    date: "2026-05-25",
  },
  {
    id: "ORD-9277",
    customer: "Eko Prasetyo",
    product: "Running Shoes Air",
    amount: 1_299_000,
    status: "cancelled",
    date: "2026-05-24",
  },
  {
    id: "ORD-9276",
    customer: "Farah Malik",
    product: "Yoga Mat Premium",
    amount: 279_000,
    status: "shipped",
    date: "2026-05-24",
  },
];

export const topCategories = [
  { name: "Electronics", share: 34, color: "bg-primary" },
  { name: "Food", share: 22, color: "bg-emerald-500" },
  { name: "Fashion", share: 18, color: "bg-blue-500" },
  { name: "Home", share: 14, color: "bg-amber-500" },
  { name: "Sports", share: 12, color: "bg-purple-500" },
];

import { products, orders } from './mockData';

export async function get_order(order_id: string) {
  // simulate latency
  await new Promise((r) => setTimeout(r, 100));
  const order = orders.find((o) => o.order_id === order_id);
  if (!order) throw new Error('OrderNotFound');
  return order;
}

export async function search_products(query: string) {
  await new Promise((r) => setTimeout(r, 120));
  // naive search: if 'under $' present, filter by price
  const m = query.match(/under \$(\d+)/i);
  if (m) {
    const max = Number(m[1]);
    return products.filter((p) => p.price <= max);
  }
  // otherwise, return top-rated matches by name includes
  const q = query.toLowerCase();
  return products.filter((p) => p.name.toLowerCase().includes(q));
}

export async function get_product(product_id: string) {
  await new Promise((r) => setTimeout(r, 80));
  const p = products.find((x) => x.id === product_id);
  if (!p) throw new Error('ProductNotFound');
  return {
    ...p,
    description: `Description for ${p.name}`,
    sizes: ['S', 'M', 'L'],
    stock: 'In stock'
  };
}

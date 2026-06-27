export const products = [
  { id: 'P-55', name: 'Trail Runner X', price: 89, rating: 4.5 },
  { id: 'P-61', name: 'CloudStep Lite', price: 59, rating: 4.4 },
  { id: 'P-74', name: 'SpeedFlex Go', price: 49, rating: 4.1 },
  { id: 'P-90', name: 'Budget Runner', price: 39, rating: 3.9 }
];

export const orders = [
  {
    order_id: 'ORD-1002',
    status: 'Shipped',
    eta: '2026-07-01',
    carrier: 'FastShip',
    tracking_url: 'https://track.example.com/ORD-1002',
    items: [{ product_id: 'P-55', name: 'Trail Runner X', price: 89 }]
  },
  {
    order_id: 'ORD-2041',
    status: 'Processing',
    eta: '2026-07-05',
    carrier: null,
    tracking_url: null,
    items: [
      { product_id: 'P-74', name: 'SpeedFlex Go', price: 49 },
      { product_id: 'P-90', name: 'Budget Runner', price: 39 }
    ]
  }
];

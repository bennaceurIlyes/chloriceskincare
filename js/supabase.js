/* =============================================
   CHLORICE — Supabase Client
   Connects the frontend to Supabase backend
   ============================================= */

const SUPABASE_URL = 'https://pnxwmyqiiycfawvrflco.supabase.co';
const SUPABASE_KEY = 'sb_publishable_tC3cD6utlF9sQ4Gt2ozEFg_2ARA8VKp';

// Initialize the Supabase client (requires supabase-js CDN loaded before this file)
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* ── Helper: Fetch all products ── */
async function fetchProducts() {
  const { data, error } = await supabaseClient
    .from('products')
    .select('*')
    .order('id', { ascending: true });
  if (error) { console.error('Supabase fetchProducts error:', error); return null; }
  return data;
}

/* ── Helper: Fetch single product with benefits, formulations, usage ── */
async function fetchProductById(productId) {
  const { data: product, error } = await supabaseClient
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();
  if (error) { console.error('Supabase fetchProduct error:', error); return null; }

  // Fetch related data in parallel
  const [benefits, formulations, usage] = await Promise.all([
    supabaseClient.from('product_benefits').select('*').eq('product_id', productId),
    supabaseClient.from('product_formulations').select('*').eq('product_id', productId),
    supabaseClient.from('product_usage').select('*').eq('product_id', productId).order('step_order', { ascending: true })
  ]);

  product.benefits = benefits.data || [];
  product.formulations = formulations.data || [];
  product.usage = usage.data || [];
  return product;
}

/* ── Helper: Create an order ── */
async function createOrder(customerName, customerPhone, customerAddress, cartItems) {
  // 1. Insert the order
  const { data: order, error: orderError } = await supabaseClient
    .from('orders')
    .insert({
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_address: customerAddress,
      status: 'pending'
    })
    .select()
    .single();

  if (orderError) {
    console.error('Supabase createOrder error:', orderError);
    return null;
  }

  // 2. Insert order items
  const orderItems = cartItems.map(item => ({
    order_id: order.id,
    product_id: item.product_id,
    quantity: item.qty,
    price: item.price
  }));

  const { error: itemsError } = await supabaseClient
    .from('order_items')
    .insert(orderItems);

  if (itemsError) {
    console.error('Supabase createOrderItems error:', itemsError);
    // Order was created but items failed — still return order
  }

  return order;
}

/* ── Helper: Fetch all orders (admin) ── */
async function fetchOrders() {
  const { data, error } = await supabaseClient
    .from('orders')
    .select('*, order_items(*, products(name, price))')
    .order('created_at', { ascending: false });
  if (error) { console.error('Supabase fetchOrders error:', error); return []; }
  return data || [];
}

/* ── Helper: Update order status (admin) ── */
async function updateOrderStatus(orderId, newStatus) {
  const { error } = await supabaseClient
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId);
  if (error) { console.error('Supabase updateOrderStatus error:', error); return false; }
  return true;
}

/* ── Helper: Update product details (admin) ── */
async function updateProduct(productId, updates) {
  const { error } = await supabaseClient
    .from('products')
    .update(updates)
    .eq('id', productId);
  if (error) { console.error('Supabase updateProduct error:', error); return false; }
  return true;
}

/* ── Helper: Create a new product (admin) ── */
async function createProduct(productData) {
  // Ensure productData contains name, price, description, ingredients, usage, image, promotion
  const { data, error } = await supabaseClient
    .from('products')
    .insert([productData])
    .select()
    .single();
  if (error) { console.error('Supabase createProduct error:', error); return null; }
  return data;
}

/* ── Helper: Upload Product Image to Storage ── */
async function uploadProductImage(file) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `product-images/${fileName}`;

  const { data, error } = await supabaseClient.storage
    .from('products')
    .upload(filePath, file);

  if (error) {
    console.error('Supabase storage upload error:', error);
    return null;
  }

  // Get public URL
  const { data: { publicUrl } } = supabaseClient.storage
    .from('products')
    .getPublicUrl(filePath);

  return publicUrl;
}

/* ── Helper: Fetch dashboard stats (admin) ── */
async function fetchDashboardStats() {
  const [productsRes, ordersRes, orderItemsRes] = await Promise.all([
    supabaseClient.from('products').select('id', { count: 'exact' }),
    supabaseClient.from('orders').select('id, created_at', { count: 'exact' }),
    supabaseClient.from('order_items').select('price, quantity')
  ]);

  const totalProducts = productsRes.count || 0;
  const totalOrders = ordersRes.count || 0;
  const revenue = (orderItemsRes.data || []).reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return { totalProducts, totalOrders, revenue };
}

/* ── Helper: Admin login ── */
async function adminLogin(email, password) {
  const { data, error } = await supabaseClient
    .from('admin')
    .select('*')
    .eq('email', email)
    .eq('password', password)
    .single();
  if (error || !data) return false;
  return true;
}

console.log('✅ Supabase client initialized');

import { useEffect, useState, type FormEvent } from 'react';
import {
  BarChart3, LayoutDashboard, Package, ShoppingBag, Users,
  Percent, FileText, Settings, LogOut, Plus, Trash2, Save, X, Search,
  RefreshCw, ChevronRight
} from 'lucide-react';
import { supabase } from './lib/supabase';
import type { DbOrder, DbProduct } from './lib/types';

const emptyProduct={name:'',slug:'',category:'Outerwear',price:0,description:'',image:'',stock:0,featured:false,active:true,colors:['Noir','Ivory','Stone'],color_images:{}};

type Tab='dashboard'|'products'|'orders'|'customers'|'discounts'|'content'|'settings'|'reports';
type Customer={id:string;full_name:string|null;role:string;created_at:string};
type Discount={id:string;code:string;kind:'percentage'|'fixed';value:number;active:boolean;starts_at:string|null;ends_at:string|null;usage_limit:number|null;usage_count:number;created_at:string;updated_at:string};
type ContentBlock={id:string;key:string;title:string|null;body:string|null;image:string|null;active:boolean};
type OrderItem={id:string;product_name:string;quantity:number;unit_price:number;size:string|null;color:string|null};
type OrderDetail=DbOrder & {payment_status?:string;payment_provider?:string|null;payment_reference?:string|null;shipping_address?:Record<string,unknown>};

const tabs:{key:Tab;label:string;Icon:any}[]=[
  {key:'dashboard',label:'Overview',Icon:LayoutDashboard},
  {key:'products',label:'Products',Icon:Package},
  {key:'orders',label:'Orders',Icon:ShoppingBag},
  {key:'customers',label:'Customers',Icon:Users},
  {key:'discounts',label:'Discounts',Icon:Percent},
  {key:'content',label:'Content',Icon:FileText},
  {key:'settings',label:'Settings',Icon:Settings},
  {key:'reports',label:'Reports',Icon:BarChart3},
];

export default function Admin(){
  const [session,setSession]=useState<any>(null);
  const [authorized,setAuthorized]=useState(false);
  const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
  const [error,setError]=useState(''); const [loading,setLoading]=useState(true); const [refreshing,setRefreshing]=useState(false);
  const [tab,setTab]=useState<Tab>('dashboard');
  const [products,setProducts]=useState<DbProduct[]>([]); const [orders,setOrders]=useState<DbOrder[]>([]);
  const [customers,setCustomers]=useState<Customer[]>([]);
  const [discounts,setDiscounts]=useState<Discount[]>([]); const [content,setContent]=useState<ContentBlock[]>([]);
  const [settings,setSettings]=useState<Record<string,any>>({});
  const [editing,setEditing]=useState<Partial<DbProduct>|null>(null); const [saving,setSaving]=useState(false);

  useEffect(()=>{supabase.auth.getSession().then(({data})=>{setSession(data.session);setLoading(false)});const {data}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s));return()=>data.subscription.unsubscribe()},[]);
  useEffect(()=>{if(session) verifyAdmin()},[session]);

  async function verifyAdmin(){
    const {data,error}=await supabase.from('profiles').select('role').eq('id',session.user.id).maybeSingle();
    if(error||data?.role!=='admin'){setAuthorized(false);setError('This account does not have admin access.');return}
    setAuthorized(true); refresh();
  }

  async function refresh(){
    setRefreshing(true); setError('');
    const [p,o,c,d,cb,ss]=await Promise.all([
      supabase.from('products').select('*').order('created_at',{ascending:false}),
      supabase.from('orders').select('*').order('created_at',{ascending:false}),
      supabase.from('profiles').select('id,full_name,role,created_at').eq('role','customer').order('created_at',{ascending:false}),
      supabase.from('discounts').select('*').order('created_at',{ascending:false}),
      supabase.from('content_blocks').select('id,key,title,body,image,active').order('key'),
      supabase.from('store_settings').select('key,value')
    ]);
    if(p.error)setError(p.error.message);else setProducts((p.data||[]) as DbProduct[]);
    if(o.error)setError(o.error.message);else setOrders((o.data||[]) as DbOrder[]);
    if(!c.error)setCustomers((c.data||[]) as Customer[]);
    if(!d.error)setDiscounts((d.data||[]) as Discount[]);
    if(!cb.error)setContent((cb.data||[]) as ContentBlock[]);
    if(!ss.error){const next:any={};(ss.data||[]).forEach((x:any)=>next[x.key]=x.value);setSettings(next)}
    setRefreshing(false);
  }

  async function signIn(e:FormEvent){e.preventDefault();setError('');const {error}=await supabase.auth.signInWithPassword({email,password});if(error)setError(error.message)}
  async function saveProduct(e:FormEvent){
    e.preventDefault();if(!editing)return;setSaving(true);setError('');
    const payload={name:editing.name||'',slug:editing.slug||editing.name?.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')||'',category:editing.category||'Other',price:Number(editing.price)||0,description:editing.description||'',image:editing.image||'',stock:Number(editing.stock)||0,featured:Boolean(editing.featured),active:editing.active!==false,details:editing.details||[],gallery:editing.gallery||[],colors:editing.colors||['Noir','Ivory','Stone'],color_images:editing.color_images||{},sizes:editing.sizes||['XS','S','M','L','XL']};
    const result=editing.id?await supabase.from('products').update(payload).eq('id',editing.id):await supabase.from('products').insert(payload);
    if(result.error)setError(result.error.message);else{setEditing(null);await refresh()}setSaving(false);
  }
  async function removeProduct(id:string){if(!confirm('Delete this product?'))return;const {error}=await supabase.from('products').delete().eq('id',id);if(error)setError(error.message);else refresh()}
  async function logout(){await supabase.auth.signOut();setSession(null)}
  function nav(next:Tab){setError('');setTab(next)}

  if(loading)return <div className="admin-screen"><div>Loading NOIRÉ Admin…</div></div>;
  if(!session)return <div className="admin-screen"><form className="admin-login" onSubmit={signIn}><p className="eyebrow">NOIRÉ / PRIVATE</p><h1>Admin<br/><em>Access.</em></h1><input type="email" required placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/><input type="password" required placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}/><button className="admin-primary">Sign in</button>{error&&<p className="admin-error">{error}</p>}</form></div>;
  if(!authorized)return <div className="admin-screen"><div className="admin-login"><p className="eyebrow">NOIRÉ / PRIVATE</p><h1>Access<br/><em>restricted.</em></h1><p className="admin-muted">This account is not authorized for the private control room.</p><button className="admin-primary" onClick={logout}>Sign out</button></div></div>;

  const title=tabs.find(x=>x.key===tab)?.label||'Overview';
  return <div className="admin-shell">
    <aside><div className="admin-brand">NOIRÉ <span>ADMIN</span></div><nav>{tabs.map(({key,label,Icon})=><button className={tab===key?'active':''} onClick={()=>nav(key)} key={key}><Icon size={15}/>{label}</button>)}</nav><button className="admin-logout" onClick={logout}><LogOut size={15}/> Sign out</button></aside>
    <main className="admin-main">
      <header><div><p className="eyebrow">CONTROL ROOM</p><h1>{title}</h1></div><div className="admin-header-actions"><span>{session.user.email}</span><button className="icon-btn" onClick={refreshing?undefined:refresh} title="Refresh"><RefreshCw size={16} className={refreshing?'spin':''}/></button></div></header>
      {error&&<div className="admin-error">{error}</div>}
      {tab==='dashboard'&&<Dashboard products={products} orders={orders} customers={customers} onOrders={()=>nav('orders')} />}
      {tab==='products'&&<Products products={products} edit={setEditing} remove={removeProduct}/>}
      {tab==='orders'&&<Orders orders={orders} onRefresh={refresh}/>}
      {tab==='customers'&&<Customers customers={customers} orders={orders}/>}
      {tab==='discounts'&&<Discounts discounts={discounts} refresh={refresh}/>}
      {tab==='content'&&<ContentManager blocks={content} refresh={refresh}/>}
      {tab==='settings'&&<SettingsManager settings={settings} refresh={refresh}/>}
      {tab==='reports'&&<Reports orders={orders} products={products}/>}
      {editing&&<ProductEditor product={editing} setProduct={setEditing} save={saveProduct} saving={saving}/>}
    </main>
  </div>;
}

function Dashboard({products,orders,customers,onOrders}:{products:DbProduct[];orders:DbOrder[];customers:Customer[];onOrders:()=>void}){
 const revenue=orders.filter(o=>o.status!=='cancelled').reduce((s,o)=>s+Number(o.subtotal),0);
 const paid=orders.filter((o:any)=>o.payment_status==='paid').length;
 const low=products.filter(p=>Number(p.stock)<5);
 const recent=orders.slice(0,6);
 return <section className="admin-grid">
  <Stat label="Products" value={products.length}/><Stat label="Orders" value={orders.length}/><Stat label="Revenue" value={'€'+revenue.toLocaleString()}/><Stat label="Customers" value={customers.length}/>
  <div className="admin-panel admin-wide-stats"><div><span>Low stock</span><strong>{low.length}</strong></div><div><span>Paid orders</span><strong>{paid}</strong></div><div><span>Active products</span><strong>{products.filter(p=>p.active).length}</strong></div><div><span>Cancelled</span><strong>{orders.filter(o=>o.status==='cancelled').length}</strong></div></div>
  <div className="admin-panel"><div className="admin-panel-head"><h2>Recent orders</h2><button className="admin-secondary" onClick={onOrders}>View all <ChevronRight size={14}/></button></div>{recent.map(o=><OrderRow key={o.id} order={o}/>)}{!recent.length&&<p className="admin-muted">No orders yet.</p>}</div>
  <div className="admin-panel"><h2>Inventory attention</h2>{low.length?low.slice(0,8).map(p=><div className="admin-simple-row" key={p.id}><span>{p.name}</span><strong className="admin-danger-text">{p.stock} left</strong></div>):<p className="admin-muted">All products have healthy stock levels.</p>}</div>
 </section>;
}
function Stat({label,value}:{label:string;value:string|number}){return <div className="admin-stat"><span>{label}</span><strong>{value}</strong></div>}
function OrderRow({order}:{order:DbOrder}){return <div className="admin-row"><span><b>{order.email}</b><small>{new Date(order.created_at).toLocaleString()}</small></span><strong>€{Number(order.subtotal).toLocaleString()}</strong><span className={'status-pill status-'+order.status}>{order.status}</span></div>}

function Products({products,edit,remove}:{products:DbProduct[];edit:(p:Partial<DbProduct>)=>void;remove:(id:string)=>void}){
 const [q,setQ]=useState(''); const [filter,setFilter]=useState('all');
 const visible=products.filter(p=>(p.name+' '+p.category).toLowerCase().includes(q.toLowerCase())).filter(p=>filter==='all'||(filter==='low'?Number(p.stock)<5:filter==='hidden'?!p.active:p.active));
 return <section className="admin-panel"><div className="admin-panel-head"><div><h2>Catalog</h2><p className="admin-muted">{visible.length} of {products.length} products</p></div><button className="admin-primary small" onClick={()=>edit(emptyProduct)}><Plus size={15}/> Add product</button></div><div className="admin-toolbar"><label className="admin-search"><Search size={15}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search products"/></label><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All</option><option value="active">Active</option><option value="hidden">Hidden</option><option value="low">Low stock</option></select></div>{visible.map(p=><div className="admin-row admin-product-row" key={p.id}><div className="admin-product"><img src={p.image||''} alt=""/><span><b>{p.name}</b><small>{p.category} · €{Number(p.price).toLocaleString()}</small></span></div><span>{p.stock} in stock</span><span className={'status-pill '+(p.active?'status-active':'status-hidden')}>{p.active?'Active':'Hidden'}</span><div><button className="icon-btn" onClick={()=>edit(p)} title="Edit"><Save size={15}/></button><button className="icon-btn danger" onClick={()=>remove(p.id)} title="Delete"><Trash2 size={15}/></button></div></div>)}{!visible.length&&<p className="admin-muted">No products match this filter.</p>}</section>;
}

function Orders({orders,onRefresh}:{orders:DbOrder[];onRefresh:()=>void}){
 const [q,setQ]=useState(''); const [status,setStatusFilter]=useState('all'); const [selected,setSelected]=useState<DbOrder|null>(null); const [busy,setBusy]=useState('');
 const visible=orders.filter(o=>(o.email+' '+JSON.stringify(o.shipping_address||{})).toLowerCase().includes(q.toLowerCase())).filter(o=>status==='all'||o.status===status);
 async function setOrderStatus(id:string,next:string){setBusy(id);const {error}=await supabase.from('orders').update({status:next}).eq('id',id);if(error)alert(error.message);else{onRefresh();setSelected(x=>x?.id===id?({...x,status:next} as DbOrder):x)}setBusy('')}
 return <section className="admin-panel"><div className="admin-panel-head"><div><h2>Order management</h2><p className="admin-muted">{visible.length} of {orders.length} orders</p></div></div><div className="admin-toolbar"><label className="admin-search"><Search size={15}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search email, city, address"/></label><select value={status} onChange={e=>setStatusFilter(e.target.value)}><option value="all">All statuses</option>{['pending','confirmed','processing','shipped','delivered','cancelled'].map(x=><option key={x}>{x}</option>)}</select></div>{visible.map(o=><div className="admin-row order-row" key={o.id} onClick={()=>setSelected(o)}><span><b>{o.email}</b><small>{new Date(o.created_at).toLocaleString()}</small></span><strong>€{Number(o.subtotal).toLocaleString()}</strong><span>{String(o.shipping_address?.city||'—')}</span><select disabled={busy===o.id} value={o.status} onClick={e=>e.stopPropagation()} onChange={e=>setOrderStatus(o.id,e.target.value)}>{['pending','confirmed','processing','shipped','delivered','cancelled'].map(x=><option key={x}>{x}</option>)}</select></div>)}{!visible.length&&<p className="admin-muted">No orders match this filter.</p>}{selected&&<OrderDetail order={selected} close={()=>setSelected(null)} />}</section>;
}

function OrderDetail({order,close}:{order:DbOrder;close:()=>void}){
 const [items,setItems]=useState<OrderItem[]>([]);
 const [customer,setCustomer]=useState<Customer|null>(null);
 const [freshOrder,setFreshOrder]=useState<DbOrder>(order);
 const [detailLoading,setDetailLoading]=useState(true);
 const [detailError,setDetailError]=useState('');
 const [rawCheckoutOpen,setRawCheckoutOpen]=useState(false);
 const [rawOrderOpen,setRawOrderOpen]=useState(false);
 useEffect(()=>{
   let alive=true;
   setDetailLoading(true); setDetailError('');
   (async()=>{
     const [orderResult,itemsResult,customerResult]=await Promise.all([
       supabase.from('orders').select('*').eq('id',order.id).maybeSingle(),
       supabase.from('order_items').select('id,product_name,quantity,unit_price,size,color').eq('order_id',order.id),
       order.customer_id
         ? supabase.from('profiles').select('id,full_name,role,created_at').eq('id',order.customer_id).maybeSingle()
         : Promise.resolve({data:null,error:null})
     ]);
     if(!alive)return;
     if(orderResult.data)setFreshOrder(orderResult.data as DbOrder);
     else if(orderResult.error)setDetailError(orderResult.error.message);
     if(itemsResult.error && !itemsResult.error.message.toLowerCase().includes('permission')){
       setDetailError(itemsResult.error.message);
     }
     setItems((itemsResult.data||[]) as OrderItem[]);
     setCustomer((customerResult.data||null) as Customer|null);
     setDetailLoading(false);
   })();
   return()=>{alive=false};
 },[order.id,order.customer_id]);

 const addressRaw=freshOrder.shipping_address ?? order.shipping_address;
 const address=typeof addressRaw==='string'
   ? (()=>{try{return JSON.parse(addressRaw)}catch{return {}}})()
   : (addressRaw||{}) as Record<string,unknown>;
 const field=(...keys:string[])=>{
   for(const key of keys){
     const value=(address as any)[key];
     if(value!==undefined&&value!==null&&String(value).trim()!=='')return String(value);
   }
   return '—';
 };
 const total=Number(freshOrder.subtotal)||0;
 const customerName=field('name')!=='—'?field('name'):(customer?.full_name||'—');
 return <div className="admin-modal-backdrop"><aside className="admin-detail">
   <button className="admin-close" onClick={close}><X size={18}/></button>
   <p className="eyebrow">ORDER / {freshOrder.id.slice(0,8)}</p><h2>Order detail</h2>
   {detailLoading&&<p className="admin-muted">Loading complete customer details…</p>}
   {detailError&&<p className="admin-error">Some live detail data could not be loaded. Showing the information saved with this order.</p>}

   <h3>Customer information</h3>
   <div className="detail-grid">
     <div><span>Full name</span><strong>{customerName}</strong></div>
     <div><span>Email</span><strong>{freshOrder.email||order.email||'—'}</strong></div>
     <div><span>Phone</span><strong>{field('phone','mobile','telephone')}</strong></div>
     <div><span>Country</span><strong>{field('country')}</strong></div>
     <div><span>City</span><strong>{field('city')}</strong></div>
     <div><span>Postal code</span><strong>{field('postalCode','postal_code','zip','zipCode')}</strong></div>
     <div className="detail-full"><span>Address</span><strong>{field('address','street','shipping_address')}</strong></div>
   </div>

   <h3>Order information</h3>
   <div className="detail-grid">
     <div><span>Status</span><strong>{freshOrder.status}</strong></div>
     <div><span>Total</span><strong>€{total.toLocaleString()}</strong></div>
     <div><span>Created</span><strong>{new Date(freshOrder.created_at).toLocaleString()}</strong></div>
     <div><span>Customer ID</span><strong>{freshOrder.customer_id||'—'}</strong></div>
     <div><span>Payment status</span><strong>{freshOrder.payment_status||'—'}</strong></div>
     <div><span>Payment provider</span><strong>{freshOrder.payment_provider||'—'}</strong></div>
     <div><span>Payment reference</span><strong>{freshOrder.payment_reference||'—'}</strong></div>
     <div><span>Discount code</span><strong>{freshOrder.discount_code||'—'}</strong></div>
     <div><span>Discount amount</span><strong>€{Number(freshOrder.discount_amount||0).toLocaleString()}</strong></div>
     <div><span>Account joined</span><strong>{customer?.created_at?new Date(customer.created_at).toLocaleString():'—'}</strong></div>
   </div>

   <h3>Items purchased</h3>
   {items.map(i=><div className="admin-detail-row" key={i.id}><span><b>{i.product_name}</b><small>{i.color||'—'} · {i.size||'—'} · ×{i.quantity}</small></span><strong>€{Number(i.unit_price).toLocaleString()}</strong></div>)}
   {!items.length&&!detailLoading&&<p className="admin-muted">No item details found.</p>}

   <h3>All checkout information</h3>
   <div className="admin-address admin-checkout-data">
     <div><span>Full name</span><strong>{customerName}</strong></div>
     <div><span>Email</span><strong>{freshOrder.email||order.email||'—'}</strong></div>
     <div><span>Phone</span><strong>{field('phone','mobile','telephone')}</strong></div>
     <div><span>Country</span><strong>{field('country')}</strong></div>
     <div><span>City</span><strong>{field('city')}</strong></div>
     <div><span>Postal code</span><strong>{field('postalCode','postal_code','zip','zipCode')}</strong></div>
     <div className="checkout-data-address"><span>Address</span><strong>{field('address','street','shipping_address')}</strong></div>
   </div>

   <button type="button" className="admin-raw-toggle" onClick={()=>setRawCheckoutOpen(v=>!v)} aria-expanded={rawCheckoutOpen}>Raw checkout JSON <span>{rawCheckoutOpen?'−':'+'}</span></button>
   {rawCheckoutOpen&&<div className="admin-address admin-raw-details"><pre>{JSON.stringify(address,null,2)}</pre></div>}
   <button type="button" className="admin-raw-toggle" onClick={()=>setRawOrderOpen(v=>!v)} aria-expanded={rawOrderOpen}>Raw order data <span>{rawOrderOpen?'−':'+'}</span></button>
   {rawOrderOpen&&<div className="admin-address admin-raw-details"><pre>{JSON.stringify({order:freshOrder,address,customer},null,2)}</pre></div>}
 </aside></div>;
}
function Customers({customers,orders}:{customers:Customer[];orders:DbOrder[]}){
 const [q,setQ]=useState(''); const visible=customers.filter(c=>(c.full_name||'').toLowerCase().includes(q.toLowerCase())||orders.some(o=>String(o.customer_id)===String(c.id)&&o.email.toLowerCase().includes(q.toLowerCase())));
 return <section className="admin-panel"><div className="admin-panel-head"><div><h2>Customers</h2><p className="admin-muted">{visible.length} registered customers</p></div></div><div className="admin-toolbar"><label className="admin-search"><Search size={15}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search name or email"/></label></div>{visible.map(c=>{const mine=orders.filter(o=>o.customer_id===c.id);const spend=mine.filter(o=>o.status!=='cancelled').reduce((s,o)=>s+Number(o.subtotal),0);return <div className="admin-row customer-row" key={c.id}><span><b>{c.full_name||'Unnamed customer'}</b><small>{mine[0]?.email||'No email on profile'} · Joined {new Date(c.created_at).toLocaleDateString()}</small></span><span>{mine.length} orders</span><strong>€{spend.toLocaleString()}</strong></div>})}{!visible.length&&<p className="admin-muted">No customers found.</p>}</section>;
}

function Discounts({discounts,refresh}:{discounts:Discount[];refresh:()=>void}){
 const [editing,setEditing]=useState<Partial<Discount>|null>(null); const [saving,setSaving]=useState(false);
 async function save(e:FormEvent){e.preventDefault();if(!editing)return;setSaving(true);const payload={code:(editing.code||'').trim().toUpperCase(),kind:editing.kind||'percentage',value:Number(editing.value)||0,active:editing.active!==false,starts_at:editing.starts_at||null,ends_at:editing.ends_at||null,usage_limit:(editing.usage_limit===null||editing.usage_limit===undefined||(editing.usage_limit as any)==='')?null:Number(editing.usage_limit)};const r=editing.id?await supabase.from('discounts').update(payload).eq('id',editing.id):await supabase.from('discounts').insert(payload);if(r.error)alert(r.error.message);else{setEditing(null);refresh()}setSaving(false)}
 async function remove(id:string){if(!confirm('Delete this discount?'))return;const r=await supabase.from('discounts').delete().eq('id',id);if(r.error)alert(r.error.message);else refresh()}
 return <section className="admin-panel"><div className="admin-panel-head"><div><h2>Discounts</h2><p className="admin-muted">Create and control promotion codes.</p></div><button className="admin-primary small" onClick={()=>setEditing({code:'',kind:'percentage',value:10,active:true,usage_limit:null})}><Plus size={15}/> Add discount</button></div>{discounts.map(d=><div className="admin-row discount-row" key={d.id}><span><b>{d.code}</b><small>{d.kind==='percentage'?d.value+'%':'€'+d.value} · used {d.usage_count}{d.usage_limit!==null?' / '+d.usage_limit:''}</small></span><span className={'status-pill '+(d.active?'status-active':'status-hidden')}>{d.active?'Active':'Disabled'}</span><div><button className="icon-btn" onClick={()=>setEditing(d)}><Save size={15}/></button><button className="icon-btn danger" onClick={()=>remove(d.id)}><Trash2 size={15}/></button></div></div>)}{!discounts.length&&<p className="admin-muted">No discount codes yet.</p>}{editing&&<DiscountEditor value={editing} setValue={setEditing} save={save} saving={saving}/>}</section>;
}

function DiscountEditor({value,setValue,save,saving}:{value:Partial<Discount>;setValue:(v:Partial<Discount>|null)=>void;save:(e:FormEvent)=>void;saving:boolean}){const f=(k:keyof Discount)=>(e:any)=>setValue({...value,[k]:e.target.type==='checkbox'?e.target.checked:e.target.value});return <div className="admin-modal-backdrop"><form className="admin-editor compact" onSubmit={save}><button type="button" className="admin-close" onClick={()=>setValue(null)}><X size={18}/></button><p className="eyebrow">MARKETING / DISCOUNT</p><h2>{value.id?'Edit code':'New code'}</h2><label>Code<input required value={value.code||''} onChange={f('code')}/></label><label>Type<select value={value.kind||'percentage'} onChange={f('kind')}><option value="percentage">Percentage</option><option value="fixed">Fixed EUR</option></select></label><label>Value<input required type="number" min="0" value={value.value??0} onChange={f('value')}/></label><label>Usage limit<input type="number" min="0" value={value.usage_limit??''} onChange={f('usage_limit')} placeholder="Unlimited"/></label><label className="admin-check"><input type="checkbox" checked={value.active!==false} onChange={f('active')}/> Active</label><button className="admin-primary" disabled={saving}><Save size={15}/> {saving?'Saving…':'Save discount'}</button></form></div>}

function ContentManager({blocks,refresh}:{blocks:ContentBlock[];refresh:()=>void}){
 const [editing,setEditing]=useState<Partial<ContentBlock>|null>(null);
 async function save(e:FormEvent){e.preventDefault();if(!editing)return;const payload={key:(editing.key||'').trim().toLowerCase().replace(/\s+/g,'-'),title:editing.title||'',body:editing.body||'',image:editing.image||'',active:editing.active!==false};const r=editing.id?await supabase.from('content_blocks').update(payload).eq('id',editing.id):await supabase.from('content_blocks').insert(payload);if(r.error)alert(r.error.message);else{setEditing(null);refresh()}}
 async function remove(id:string){if(!confirm('Delete this content block?'))return;const r=await supabase.from('content_blocks').delete().eq('id',id);if(r.error)alert(r.error.message);else refresh()}
 return <section className="admin-panel"><div className="admin-panel-head"><div><h2>Content blocks</h2><p className="admin-muted">Manage reusable homepage/editorial content for future publishing.</p></div><button className="admin-primary small" onClick={()=>setEditing({key:'new-block',title:'',body:'',image:'',active:true})}><Plus size={15}/> Add block</button></div>{blocks.map(b=><div className="admin-row content-row" key={b.id}><span><b>{b.title||b.key}</b><small>{b.key}</small></span><span className={'status-pill '+(b.active?'status-active':'status-hidden')}>{b.active?'Published':'Hidden'}</span><div><button className="icon-btn" onClick={()=>setEditing(b)}><Save size={15}/></button><button className="icon-btn danger" onClick={()=>remove(b.id)}><Trash2 size={15}/></button></div></div>)}{!blocks.length&&<p className="admin-muted">No content blocks yet.</p>}{editing&&<ContentEditor value={editing} setValue={setEditing} save={save}/>}</section>;
}
function ContentEditor({value,setValue,save}:{value:Partial<ContentBlock>;setValue:(v:Partial<ContentBlock>|null)=>void;save:(e:FormEvent)=>void}){const f=(k:keyof ContentBlock)=>(e:any)=>setValue({...value,[k]:e.target.type==='checkbox'?e.target.checked:e.target.value});return <div className="admin-modal-backdrop"><form className="admin-editor" onSubmit={save}><button type="button" className="admin-close" onClick={()=>setValue(null)}><X size={18}/></button><p className="eyebrow">CONTENT / BLOCK</p><h2>{value.id?'Edit block':'New block'}</h2><label>Key<input required value={value.key||''} onChange={f('key')}/></label><label>Title<input value={value.title||''} onChange={f('title')}/></label><label>Body<textarea value={value.body||''} onChange={f('body')}/></label><label>Image URL<input value={value.image||''} onChange={f('image')}/></label><label className="admin-check"><input type="checkbox" checked={value.active!==false} onChange={f('active')}/> Published</label><button className="admin-primary"><Save size={15}/> Save block</button></form></div>}

function SettingsManager({settings,refresh}:{settings:Record<string,any>;refresh:()=>void}){
 const [form,setForm]=useState({store_name:settings.store_name?.value||settings.store_name||'NOIRÉ',phone:settings.contact?.phone||'',email:settings.contact?.email||'',instagram:settings.contact?.instagram||'',whatsapp:settings.contact?.whatsapp||'',address:settings.contact?.address||'',shipping_note:settings.shipping_note||''});
 useEffect(()=>setForm({store_name:settings.store_name?.value||settings.store_name||'NOIRÉ',phone:settings.contact?.phone||'',email:settings.contact?.email||'',instagram:settings.contact?.instagram||'',whatsapp:settings.contact?.whatsapp||'',address:settings.contact?.address||'',shipping_note:settings.shipping_note||''}),[settings]);
 async function save(e:FormEvent){e.preventDefault();const values:{key:string;value:any}[]=[{key:'store_name',value:form.store_name},{key:'contact',value:{phone:form.phone,email:form.email,instagram:form.instagram,whatsapp:form.whatsapp,address:form.address}},{key:'shipping_note',value:form.shipping_note}];for(const x of values){const r=await supabase.from('store_settings').upsert(x,{onConflict:'key'});if(r.error){alert(r.error.message);return}}refresh()}
 const f=(k:keyof typeof form)=>(e:any)=>setForm({...form,[k]:e.target.value});
 return <section className="admin-panel"><div className="admin-panel-head"><div><h2>Store settings</h2><p className="admin-muted">Central store details used by the control room and future customer-facing features.</p></div></div><form className="settings-form" onSubmit={save}><div className="settings-grid"><label>Store name<input value={form.store_name} onChange={f('store_name')}/></label><label>Phone<input value={form.phone} onChange={f('phone')}/></label><label>Email<input type="email" value={form.email} onChange={f('email')}/></label><label>Instagram<input value={form.instagram} onChange={f('instagram')}/></label><label>WhatsApp<input value={form.whatsapp} onChange={f('whatsapp')}/></label><label>Address<input value={form.address} onChange={f('address')}/></label><label className="settings-full">Shipping note<textarea value={form.shipping_note} onChange={f('shipping_note')}/></label></div><button className="admin-primary"><Save size={15}/> Save settings</button></form></section>;
}

function Reports({orders,products}:{orders:DbOrder[];products:DbProduct[]}){
 const [range,setRange]=useState('30'); const days=Number(range); const since=Date.now()-days*86400000; const scoped=orders.filter(o=>new Date(o.created_at).getTime()>=since); const valid=scoped.filter(o=>o.status!=='cancelled'); const revenue=valid.reduce((s,o)=>s+Number(o.subtotal),0); const average=valid.length?revenue/valid.length:0;
 const byStatus=['pending','confirmed','processing','shipped','delivered','cancelled'].map(s=>({s,n:scoped.filter(o=>o.status===s).length}));
 return <section className="admin-grid"><div className="admin-panel report-toolbar"><h2>Sales report</h2><select value={range} onChange={e=>setRange(e.target.value)}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="365">Last 12 months</option></select></div><Stat label="Revenue" value={'€'+revenue.toLocaleString()}/><Stat label="Orders" value={valid.length}/><Stat label="Average order" value={'€'+Math.round(average).toLocaleString()}/><Stat label="Cancelled" value={scoped.filter(o=>o.status==='cancelled').length}/><div className="admin-panel"><h2>Order status</h2>{byStatus.map(x=><div className="report-bar" key={x.s}><span>{x.s}</span><div><i style={{width:(x.n/Math.max(1,scoped.length))*100+'%'}}/></div><strong>{x.n}</strong></div>)}</div><div className="admin-panel"><h2>Inventory value</h2><p className="report-big">€{products.reduce((s,p)=>s+Number(p.price)*Number(p.stock||0),0).toLocaleString()}</p><p className="admin-muted">Current retail value of units in stock.</p></div></section>;
}

function ProductEditor({product,setProduct,save,saving}:{product:Partial<DbProduct>;setProduct:(p:Partial<DbProduct>|null)=>void;save:(e:FormEvent)=>void;saving:boolean}){
 const [uploading,setUploading]=useState(false); const [uploadError,setUploadError]=useState(''); const [newColor,setNewColor]=useState('');
 const colors=Array.isArray(product.colors)?product.colors:[]; const colorImages=product.color_images||{};
 const f=(k:keyof DbProduct)=>(e:any)=>setProduct({...product,[k]:e.target.type==='checkbox'?e.target.checked:(k==='price'||k==='stock'?Number(e.target.value):e.target.value)});
 const slugify=(value:string)=>value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
 function addColor(){const name=newColor.trim();if(!name||colors.some(c=>c.toLowerCase()===name.toLowerCase()))return;setProduct({...product,colors:[...colors,name]});setNewColor('')}
 function removeColor(name:string){const nextImages={...colorImages};delete nextImages[name];setProduct({...product,colors:colors.filter(c=>c!==name),color_images:nextImages})}
 function setColorImage(name:string,url:string){setProduct({...product,color_images:{...colorImages,[name]:url}})}
 async function uploadImage(file:File|undefined,color?:string){if(!file)return;setUploading(true);setUploadError('');const ext=file.name.split('.').pop()?.toLowerCase()||'jpg';const slug=slugify(product.slug||product.name||'product');const suffix=color?'-'+slugify(color):'';const path=`products/${slug}${suffix}-${Date.now()}.${ext}`;const {error}=await supabase.storage.from('product-images').upload(path,file,{contentType:file.type||'image/jpeg',upsert:false,cacheControl:'31536000'});if(error)setUploadError(error.message);else{const {data}=supabase.storage.from('product-images').getPublicUrl(path);if(color)setColorImage(color,data.publicUrl);else setProduct({...product,image:data.publicUrl})}setUploading(false)}
 return <div className="admin-modal-backdrop"><form className="admin-editor" onSubmit={save}><button type="button" className="admin-close" onClick={()=>setProduct(null)}><X size={18}/></button><p className="eyebrow">CATALOG / EDITOR</p><h2>{product.id?'Edit piece':'New piece'}</h2><label>Name<input required value={product.name||''} onChange={f('name')}/></label><label>Slug<input required value={product.slug||''} onChange={f('slug')}/></label><label>Category<input required value={product.category||''} onChange={f('category')}/></label><label>Price (EUR)<input required type="number" min="0" value={product.price||0} onChange={f('price')}/></label><label>Stock<input required type="number" min="0" value={product.stock||0} onChange={f('stock')}/></label><label>Product image<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={uploading} onChange={e=>uploadImage(e.target.files?.[0])}/></label>{uploading&&<p className="admin-muted">Uploading image…</p>}{uploadError&&<p className="admin-error">{uploadError}</p>}{product.image&&<div className="admin-image-preview"><img src={product.image} alt="" /><small>Storage image ready</small></div>}<label>Image URL<input value={product.image||''} onChange={f('image')} placeholder="Or paste an image URL"/></label>
 <section className="admin-color-manager"><div className="admin-color-head"><div><span>COLOR OPTIONS</span><small>Only colors listed here appear on the product page.</small></div></div><div className="admin-add-color"><input value={newColor} onChange={e=>setNewColor(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addColor()}}} placeholder="e.g. Burgundy"/><button type="button" className="admin-secondary" onClick={addColor}><Plus size={14}/> Add color</button></div><div className="admin-color-list">{colors.map(name=><div className="admin-color-row" key={name}><div className="admin-color-name"><i/><strong>{name}</strong></div><div className="admin-color-image">{colorImages[name]?<img src={colorImages[name]} alt={name}/>:<span>No image yet</span>}<label className="admin-upload-color">Upload image<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={uploading} onChange={e=>uploadImage(e.target.files?.[0],name)}/></label><input value={colorImages[name]||''} onChange={e=>setColorImage(name,e.target.value)} placeholder="Or paste image URL"/></div><button type="button" className="icon-btn danger" onClick={()=>removeColor(name)} aria-label={`Remove ${name}`}><Trash2 size={15}/></button></div>)}{!colors.length&&<p className="admin-muted">No colors yet. Add the colors this piece is actually available in.</p>}</div></section>
 <label>Description<textarea value={product.description||''} onChange={f('description')}/></label><label className="admin-check"><input type="checkbox" checked={product.featured||false} onChange={f('featured')}/> Featured</label><label className="admin-check"><input type="checkbox" checked={product.active!==false} onChange={f('active')}/> Visible in store</label><button className="admin-primary" disabled={saving||uploading}><Save size={15}/> {saving?'Saving…':'Save product'}</button></form></div>
}}

import { useEffect, useState, type FormEvent } from 'react';
import { LayoutDashboard, Package, ShoppingBag, LogOut, Plus, Trash2, Save, X } from 'lucide-react';
import { supabase } from './lib/supabase';
import type { DbOrder, DbProduct } from './lib/types';

const emptyProduct={name:'',slug:'',category:'Outerwear',price:0,description:'',image:'',stock:0,featured:false,active:true,colors:['Noir','Ivory','Stone'],color_images:{}};

export default function Admin(){
 const [session,setSession]=useState<any>(null); const [authorized,setAuthorized]=useState(false);
 const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
 const [error,setError]=useState(''); const [loading,setLoading]=useState(true);
 const [tab,setTab]=useState<'dashboard'|'products'|'orders'>('dashboard');
 const [products,setProducts]=useState<DbProduct[]>([]); const [orders,setOrders]=useState<DbOrder[]>([]);
 const [editing,setEditing]=useState<Partial<DbProduct>|null>(null); const [saving,setSaving]=useState(false);

 useEffect(()=>{supabase.auth.getSession().then(({data})=>{setSession(data.session);setLoading(false)});const {data}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s));return()=>data.subscription.unsubscribe()},[]);
 useEffect(()=>{if(session) verifyAdmin()},[session]);
 async function verifyAdmin(){const {data,error}=await supabase.from('profiles').select('role').eq('id',session.user.id).maybeSingle();if(error||data?.role!=='admin'){setAuthorized(false);setError('This account does not have admin access.');return}setAuthorized(true);refresh()}

 async function refresh(){const [p,o]=await Promise.all([supabase.from('products').select('*').order('created_at',{ascending:false}),supabase.from('orders').select('*').order('created_at',{ascending:false})]);if(p.error)setError(p.error.message);else setProducts((p.data||[]) as DbProduct[]);if(!o.error)setOrders((o.data||[]) as DbOrder[])}
 async function signIn(e:FormEvent){e.preventDefault();setError('');const {error}=await supabase.auth.signInWithPassword({email,password});if(error)setError(error.message)}
 async function saveProduct(e:FormEvent){e.preventDefault();if(!editing)return;setSaving(true);setError('');const payload={name:editing.name||'',slug:editing.slug||editing.name?.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')||'',category:editing.category||'Other',price:Number(editing.price)||0,description:editing.description||'',image:editing.image||'',stock:Number(editing.stock)||0,featured:Boolean(editing.featured),active:editing.active!==false,details:editing.details||[],gallery:editing.gallery||[],colors:editing.colors||['Noir','Ivory','Stone'],color_images:editing.color_images||{},sizes:editing.sizes||['XS','S','M','L','XL']};const result=editing.id?await supabase.from('products').update(payload).eq('id',editing.id):await supabase.from('products').insert(payload);if(result.error)setError(result.error.message);else{setEditing(null);await refresh()}setSaving(false)}
 async function remove(id:string){if(!confirm('Delete this product?'))return;const {error}=await supabase.from('products').delete().eq('id',id);if(error)setError(error.message);else refresh()}
 async function logout(){await supabase.auth.signOut();setSession(null)}
 if(loading)return <div className="admin-screen"><div>Loading NOIRÉ Admin…</div></div>;
 if(!session)return <div className="admin-screen"><form className="admin-login" onSubmit={signIn}><p className="eyebrow">NOIRÉ / PRIVATE</p><h1>Admin<br/><em>Access.</em></h1><input type="email" required placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/><input type="password" required placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}/><button className="admin-primary">Sign in</button>{error&&<p className="admin-error">{error}</p>}</form></div>;
 if(!authorized)return <div className="admin-screen"><div className="admin-login"><p className="eyebrow">NOIRÉ / PRIVATE</p><h1>Access<br/><em>restricted.</em></h1><p className="admin-muted">This account is not authorized for the private control room.</p><button className="admin-primary" onClick={logout}>Sign out</button></div></div>;
 return <div className="admin-shell"><aside><div className="admin-brand">NOIRÉ <span>ADMIN</span></div><nav>{[['dashboard','Overview',LayoutDashboard],['products','Products',Package],['orders','Orders',ShoppingBag]].map(([key,label,Icon]:any)=><button className={tab===key?'active':''} onClick={()=>setTab(key)} key={key}><Icon size={16}/>{label}</button>)}</nav><button className="admin-logout" onClick={logout}><LogOut size={15}/> Sign out</button></aside><main className="admin-main"><header><div><p className="eyebrow">CONTROL ROOM</p><h1>{tab==='dashboard'?'Overview':tab==='products'?'Products':'Orders'}</h1></div><span>{session.user.email}</span></header>{error&&<div className="admin-error">{error}</div>}{tab==='dashboard'&&<Dashboard products={products} orders={orders}/>} {tab==='products'&&<Products products={products} edit={setEditing} remove={remove}/>} {tab==='orders'&&<Orders orders={orders}/>} {editing&&<ProductEditor product={editing} setProduct={setEditing} save={saveProduct} saving={saving}/>}</main></div>
}

function Dashboard({products,orders}:{products:DbProduct[];orders:DbOrder[]}){const revenue=orders.filter(o=>o.status!=='cancelled').reduce((s,o)=>s+Number(o.subtotal),0);return <section className="admin-grid"><Stat label="Products" value={products.length}/><Stat label="Orders" value={orders.length}/><Stat label="Revenue" value={'€'+revenue.toLocaleString()}/><Stat label="Low stock" value={products.filter(p=>p.stock<5).length}/><div className="admin-panel"><h2>Recent orders</h2>{orders.slice(0,5).map(o=><div className="admin-row" key={o.id}><span>{o.email}</span><strong>{o.status}</strong><b>€{Number(o.subtotal).toLocaleString()}</b></div>)}{!orders.length&&<p className="admin-muted">No orders yet.</p>}</div></section>}
function Stat({label,value}:{label:string;value:string|number}){return <div className="admin-stat"><span>{label}</span><strong>{value}</strong></div>}
function Products({products,edit,remove}:{products:DbProduct[];edit:(p:Partial<DbProduct>)=>void;remove:(id:string)=>void}){return <section className="admin-panel"><div className="admin-panel-head"><h2>Catalog</h2><button className="admin-primary small" onClick={()=>edit(emptyProduct)}> <Plus size={15}/> Add product</button></div>{products.map(p=><div className="admin-row" key={p.id}><div className="admin-product"><img src={p.image} alt=""/><span><b>{p.name}</b><small>{p.category} · €{Number(p.price).toLocaleString()}</small></span></div><span>{p.stock} in stock</span><span>{p.active?'Active':'Hidden'}</span><div><button className="icon-btn" onClick={()=>edit(p)}><Save size={15}/></button><button className="icon-btn danger" onClick={()=>remove(p.id)}><Trash2 size={15}/></button></div></div>)}</section>}
function Orders({orders}:{orders:DbOrder[]}){const [busy,setBusy]=useState('');async function setStatus(id:string,status:string){setBusy(id);const {error}=await supabase.from('orders').update({status}).eq('id',id);if(error) alert(error.message);else window.location.reload();setBusy('')}return <section className="admin-panel"><h2>Order management</h2>{orders.map(o=><div className="admin-row order-row" key={o.id}><span><b>{o.email}</b><small>{new Date(o.created_at).toLocaleString()}</small></span><strong>€{Number(o.subtotal).toLocaleString()}</strong><span className="admin-order-address">{String(o.shipping_address?.city||'—')}</span><select disabled={busy===o.id} value={o.status} onChange={e=>setStatus(o.id,e.target.value)}><option>pending</option><option>confirmed</option><option>processing</option><option>shipped</option><option>delivered</option><option>cancelled</option></select></div>)}{!orders.length&&<p className="admin-muted">No orders yet.</p>}</section>}
function ProductEditor({product,setProduct,save,saving}:{product:Partial<DbProduct>;setProduct:(p:Partial<DbProduct>|null)=>void;save:(e:FormEvent)=>void;saving:boolean}){
 const [uploading,setUploading]=useState(false);
 const [uploadError,setUploadError]=useState('');
 const [newColor,setNewColor]=useState('');
 const colors=Array.isArray(product.colors)?product.colors:[];
 const colorImages=product.color_images||{};
 const f=(k:keyof DbProduct)=>(e:any)=>setProduct({...product,[k]:e.target.type==='checkbox'?e.target.checked:(k==='price'||k==='stock'?Number(e.target.value):e.target.value)});
 const slugify=(value:string)=>value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
 function addColor(){
   const name=newColor.trim();
   if(!name||colors.some(c=>c.toLowerCase()===name.toLowerCase()))return;
   setProduct({...product,colors:[...colors,name]});
   setNewColor('');
 }
 function removeColor(name:string){
   const nextImages={...colorImages};
   delete nextImages[name];
   setProduct({...product,colors:colors.filter(c=>c!==name),color_images:nextImages});
 }
 function setColorImage(name:string,url:string){
   setProduct({...product,color_images:{...colorImages,[name]:url}});
 }
 async function uploadImage(file:File|undefined,color?:string){
   if(!file)return;
   setUploading(true);setUploadError('');
   const ext=file.name.split('.').pop()?.toLowerCase()||'jpg';
   const slug=slugify(product.slug||product.name||'product');
   const suffix=color?'-'+slugify(color):'';
   const path=`products/${slug}${suffix}-${Date.now()}.${ext}`;
   const {error}=await supabase.storage.from('product-images').upload(path,file,{contentType:file.type||'image/jpeg',upsert:false,cacheControl:'31536000'});
   if(error){setUploadError(error.message)}
   else{
     const {data}=supabase.storage.from('product-images').getPublicUrl(path);
     if(color)setColorImage(color,data.publicUrl);else setProduct({...product,image:data.publicUrl});
   }
   setUploading(false);
 }
 return <div className="admin-modal-backdrop"><form className="admin-editor" onSubmit={save}>
   <button type="button" className="admin-close" onClick={()=>setProduct(null)}><X size={18}/></button>
   <p className="eyebrow">CATALOG / EDITOR</p><h2>{product.id?'Edit piece':'New piece'}</h2>
   <label>Name<input required value={product.name||''} onChange={f('name')}/></label>
   <label>Slug<input required value={product.slug||''} onChange={f('slug')}/></label>
   <label>Category<input required value={product.category||''} onChange={f('category')}/></label>
   <label>Price (EUR)<input required type="number" min="0" value={product.price||0} onChange={f('price')}/></label>
   <label>Stock<input required type="number" min="0" value={product.stock||0} onChange={f('stock')}/></label>
   <label>Product image<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={uploading} onChange={e=>uploadImage(e.target.files?.[0])}/></label>
   {uploading&&<p className="admin-muted">Uploading image…</p>}{uploadError&&<p className="admin-error">{uploadError}</p>}
   {product.image&&<div className="admin-image-preview"><img src={product.image} alt="" /><small>Storage image ready</small></div>}
   <label>Image URL<input value={product.image||''} onChange={f('image')} placeholder="Or paste an image URL"/></label>
   <section className="admin-color-manager">
     <div className="admin-color-head"><div><span>COLOR OPTIONS</span><small>Only colors listed here appear on the product page.</small></div></div>
     <div className="admin-add-color"><input value={newColor} onChange={e=>setNewColor(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addColor()}}} placeholder="e.g. Burgundy"/><button type="button" className="admin-secondary" onClick={addColor}><Plus size={14}/> Add color</button></div>
     <div className="admin-color-list">
       {colors.map(name=><div className="admin-color-row" key={name}>
         <div className="admin-color-name"><i/><strong>{name}</strong></div>
         <div className="admin-color-image">
           {colorImages[name]?<img src={colorImages[name]} alt={name}/>:<span>No image yet</span>}
           <label className="admin-upload-color">Upload image<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={uploading} onChange={e=>uploadImage(e.target.files?.[0],name)}/></label>
           <input value={colorImages[name]||''} onChange={e=>setColorImage(name,e.target.value)} placeholder="Or paste image URL"/>
         </div>
         <button type="button" className="icon-btn danger" onClick={()=>removeColor(name)} aria-label={`Remove ${name}`}><Trash2 size={15}/></button>
       </div>)}
       {!colors.length&&<p className="admin-muted">No colors yet. Add the colors this piece is actually available in.</p>}
     </div>
   </section>
   <label>Description<textarea value={product.description||''} onChange={f('description')}/></label>
   <label className="admin-check"><input type="checkbox" checked={product.featured||false} onChange={f('featured')}/> Featured</label>
   <label className="admin-check"><input type="checkbox" checked={product.active!==false} onChange={f('active')}/> Visible in store</label>
   <button className="admin-primary" disabled={saving||uploading}><Save size={15}/> {saving?'Saving…':'Save product'}</button>
 </form></div>
}

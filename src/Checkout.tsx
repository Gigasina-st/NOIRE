import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Check, Loader2, LockKeyhole, X } from 'lucide-react';
import { supabase } from './lib/supabase';
import { useStore } from './store';

type CheckoutProps={close:()=>void;onAccount:()=>void};

export default function Checkout({close,onAccount}:CheckoutProps){
  const {cart,subtotal}=useStore();
  const [user,setUser]=useState<any>(null);
  const [loading,setLoading]=useState(false);
  const [done,setDone]=useState<string|null>(null);
  const [error,setError]=useState('');
  const [form,setForm]=useState({name:'',phone:'',address:'',city:'',postalCode:'',country:''});

  useEffect(()=>{
    supabase.auth.getUser().then(({data})=>setUser(data.user));
  },[]);

  async function placeOrder(e:FormEvent){
    e.preventDefault();
    if(!user){onAccount();return}
    if(!cart.length){setError('Your bag is empty.');return}
    setLoading(true);setError('');
    const {data,error}=await supabase.rpc('create_order',{
      p_items:cart.map(item=>({product_id:item.product.id,quantity:item.quantity,size:item.variant.size,color:item.variant.color})),
      p_shipping_address:form
    });
    setLoading(false);
    if(error){setError(error.message);return}
    setDone(String(data));
  }

  if(done)return <div className="checkout-layer"><div className="checkout-success"><div className="success-mark"><Check size={23}/></div><p className="eyebrow">ORDER RECEIVED</p><h1>Quietly<br/><em>confirmed.</em></h1><p>Your order <strong>#{done.slice(0,8).toUpperCase()}</strong> has been placed. We will use your account email for order updates.</p><button className="button checkout-button" onClick={close}>Return to NOIRÉ <ArrowUpRight size={15}/></button></div></div>;

  return <div className="checkout-layer"><div className="checkout-shell">
    <header className="checkout-header"><button onClick={close}><ArrowLeft size={16}/> Back</button><span className="wordmark">NOIRÉ</span><span className="checkout-secure"><LockKeyhole size={13}/> Secure checkout</span></header>
    <div className="checkout-grid">
      <main><p className="eyebrow">CHECKOUT / SHIPPING</p><h1>Complete<br/><em>your order.</em></h1>
        {!user&&<div className="checkout-login"><span>Already have an account?</span><button onClick={onAccount}>Sign in <ArrowUpRight size={14}/></button></div>}
        <form className="checkout-form" onSubmit={placeOrder}>
          <label>Full name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
          <label>Phone<input required value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
          <label>Address<textarea required value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></label>
          <div className="checkout-two"><label>City<input required value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/></label><label>Postal code<input required value={form.postalCode} onChange={e=>setForm({...form,postalCode:e.target.value})}/></label></div>
          <label>Country<input required value={form.country} onChange={e=>setForm({...form,country:e.target.value})}/></label>
          {error&&<p className="checkout-error">{error}</p>}
          <button className="button checkout-button" disabled={loading||!cart.length}>{loading?<><Loader2 size={15} className="spin"/> Processing...</>:<>{user?'Place order':'Sign in to continue'} <ArrowUpRight size={15}/></>}</button>
        </form>
      </main>
      <aside className="checkout-summary"><p className="eyebrow">YOUR ORDER</p>{cart.map(x=><div className="summary-item" key={x.product.id+x.variant.size+x.variant.color}><img src={x.product.image} alt=""/><div><strong>{x.product.name}</strong><small>{x.variant.color} · {x.variant.size} · ×{x.quantity}</small></div><b>€{(Number(x.product.price.replace(/\D/g,''))*x.quantity).toLocaleString('en-US')}</b></div>)}<div className="summary-total"><span>Subtotal</span><strong>€{subtotal.toLocaleString('en-US')}</strong></div><small className="summary-note">Shipping and taxes will be confirmed with your order.</small></aside>
    </div>
  </div></div>
}
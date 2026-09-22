import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowUpRight, Check, Loader2, LogOut, X } from 'lucide-react';
import { supabase } from './lib/supabase';

type AccountProps={close:()=>void;onCheckout:()=>void};
type Order={id:string;status:string;subtotal:number;currency:string;created_at:string;shipping_address:any};
const trackingSteps=[['pending','Order placed'],['confirmed','Confirmed'],['processing','Preparing'],['shipped','Shipped'],['delivered','Delivered']] as const;
function OrderTracking({status}:{status:string}){
  if(status==='cancelled') return <div className="order-tracking cancelled"><span className="tracking-label">ORDER TRACKING</span><strong>Cancelled</strong><p>This order is no longer moving through fulfilment.</p></div>;
  const current=Math.max(0,trackingSteps.findIndex(([key])=>key===status));
  return <div className="order-tracking"><div className="tracking-head"><span>ORDER TRACKING</span><span>{trackingSteps[current]?.[1]}</span></div><div className="tracking-steps">{trackingSteps.map(([key,label],index)=><div className={'tracking-step '+(index<=current?'complete ':'')+(index===current?'current':'')} key={key}><i>{index<current?'✓':index+1}</i><span>{label}</span></div>)}</div></div>;
}



export default function Account({close,onCheckout}:AccountProps){
  const [session,setSession]=useState<any>(null);
  const [mode,setMode]=useState<'signin'|'signup'>('signin');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [name,setName]=useState('');
  const [loading,setLoading]=useState(false);
  const [message,setMessage]=useState('');
  const [orders,setOrders]=useState<Order[]>([]);
  const [selected,setSelected]=useState<Order|null>(null);

  useEffect(()=>{
    let mounted=true;
    supabase.auth.getSession().then(({data})=>{if(mounted)setSession(data.session)});
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>{if(mounted)setSession(next)});
    return()=>{mounted=false;subscription.unsubscribe()};
  },[]);

  useEffect(()=>{
    if(!session?.user?.id){setOrders([]);return}
    supabase.from('orders').select('id,status,subtotal,currency,created_at,shipping_address').eq('customer_id',session.user.id).order('created_at',{ascending:false}).then(({data})=>setOrders((data||[]) as Order[]));
  },[session]);

  async function submit(e:FormEvent){
    e.preventDefault();setLoading(true);setMessage('');
    const result=mode==='signin'
      ?await supabase.auth.signInWithPassword({email,password})
      :await supabase.auth.signUp({email,password,options:{data:{full_name:name}}});
    setLoading(false);
    if(result.error){setMessage(result.error.message);return}
    if(mode==='signup'&&!result.data.session){setMessage('Account created. Check your email to confirm your account.')}
    else setMessage('Welcome back.');
    setPassword('');
  }

  async function signOut(){await supabase.auth.signOut();setMessage('Signed out.');}

  return <div className="account-layer"><button className="account-backdrop" onClick={close}/><aside className="account-panel">
    <div className="account-head"><div><p className="eyebrow">NOIRÉ / ACCOUNT</p><h2>{session?'Your account':'Welcome.'}</h2></div><button onClick={close}><X size={22}/></button></div>
    {session?<div className="account-content">
      <div className="account-intro"><span>{session.user.email}</span><button onClick={signOut}><LogOut size={14}/> Sign out</button></div>
      <section className="account-section"><div className="account-section-head"><span>ORDER HISTORY</span><span>{orders.length} orders</span></div>
        {orders.length?orders.map(o=><button className="account-order" key={o.id} onClick={()=>setSelected(o)}><div><strong>Order #{o.id.slice(0,8).toUpperCase()}</strong><small>{new Date(o.created_at).toLocaleDateString()} · {o.status}</small></div><b>{o.currency||'EUR'} {Number(o.subtotal).toLocaleString('en-US')}</b></button>):<p className="account-empty">Your first order will appear here.</p>}
      </section>
      {selected&&<div className="account-detail"><div className="account-detail-head"><div><span>ORDER #{selected.id.slice(0,8).toUpperCase()}</span><strong>{selected.status}</strong></div><button onClick={()=>setSelected(null)}><X size={16}/></button></div><p>{selected.shipping_address?.address}</p><small>{selected.shipping_address?.city} · {selected.shipping_address?.postalCode} · {selected.shipping_address?.country}</small><OrderTracking status={selected.status}/></div>}
      <button className="button account-cta" onClick={()=>{close();onCheckout()}}>Continue shopping <ArrowUpRight size={15}/></button>
    </div>:<div className="account-content">
      <div className="auth-tabs"><button className={mode==='signin'?'active':''} onClick={()=>{setMode('signin');setMessage('')}}>Sign in</button><button className={mode==='signup'?'active':''} onClick={()=>{setMode('signup');setMessage('')}}>Create account</button></div>
      <form className="account-form" onSubmit={submit}>
        {mode==='signup'&&<label>Full name<input value={name} onChange={e=>setName(e.target.value)} required autoComplete="name"/></label>}
        <label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"/></label>
        <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={8} autoComplete={mode==='signin'?'current-password':'new-password'}/></label>
        {message&&<p className="account-message">{message}</p>}
        <button className="button account-cta" disabled={loading}>{loading?<><Loader2 size={15} className="spin"/> Working...</>:<>{mode==='signin'?'Sign in':'Create account'} <ArrowUpRight size={15}/></>}</button>
      </form>
      <p className="account-note">Your account keeps your orders and saved details together across visits.</p>
    </div>}
  </aside></div>
}
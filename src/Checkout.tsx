import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowUpRight, Check, Loader2, LockKeyhole } from 'lucide-react';
import { supabase } from './lib/supabase';
import { useStore } from './store';

type CheckoutProps={close:()=>void;onAccount:()=>void};
type AppliedDiscount={code:string;amount:number};

export default function Checkout({close,onAccount}:CheckoutProps){
  const {cart,subtotal,clearCart}=useStore();
  const [user,setUser]=useState<any>(null);
  const [loading,setLoading]=useState(false);
  const [done,setDone]=useState<string|null>(null);
  const [error,setError]=useState('');
  const [form,setForm]=useState({name:'',phone:'',address:'',city:'',postalCode:'',country:''});
  const [discountCode,setDiscountCode]=useState('');
  const [appliedDiscount,setAppliedDiscount]=useState<AppliedDiscount|null>(null);
  const [discountLoading,setDiscountLoading]=useState(false);

  useEffect(()=>{
    supabase.auth.getUser().then(({data})=>setUser(data.user));
  },[]);

  async function applyDiscount(){
    const code=discountCode.trim();
    if(!code){setAppliedDiscount(null);setError('کد تخفیف را وارد کنید.');return}
    if(!user){onAccount();return}
    setDiscountLoading(true);setError('');
    const {data,error}=await supabase.rpc('validate_discount',{p_code:code,p_subtotal:subtotal});
    setDiscountLoading(false);
    if(error){setAppliedDiscount(null);setError(error.message);return}
    const row=Array.isArray(data)?data[0]:data;
    if(!row){setAppliedDiscount(null);setError('کد تخفیف نامعتبر یا منقضی شده است.');return}
    setAppliedDiscount({code:String(row.code),amount:Number(row.discount_amount)||0});
  }

  async function placeOrder(e:FormEvent){
    e.preventDefault();
    if(!user){onAccount();return}
    if(!cart.length){setError('سبد شما خالی است.');return}
    setLoading(true);setError('');
    const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const fallbackItems=cart.filter(item=>!uuidPattern.test(item.product.id));
    let productIds=new Map<string,string>();
    if(fallbackItems.length){
      const names=[...new Set(fallbackItems.map(item=>item.product.name))];
      const {data:rows,error:lookupError}=await supabase.from('products').select('id,name').in('name',names).eq('active',true);
      if(lookupError){setLoading(false);setError(lookupError.message);return}
      productIds=new Map((rows||[]).map(row=>[row.name,row.id]));
      const missing=fallbackItems.find(item=>!productIds.has(item.product.name));
      if(missing){setLoading(false);setError(`Product "${missing.product.name}" is not available for checkout.`);return}
    }
    const {data,error}=await supabase.rpc('create_order',{
      p_items:cart.map(item=>({product_id:uuidPattern.test(item.product.id)?item.product.id:productIds.get(item.product.name),quantity:item.quantity,size:item.variant.size,color:item.variant.color})),
      p_shipping_address:form,
      p_payment_required:false,
      p_discount_code:appliedDiscount?.code||null
    });
    setLoading(false);
    if(error){setError(error.message);return}
    clearCart();
    setDone(String(data));
  }

  if(done)return <div className="checkout-layer"><div className="checkout-success"><div className="success-mark"><Check size={23}/></div><p className="eyebrow">سفارش دریافت شد</p><h1>با آرامش<br/><em>تأیید شد.</em></h1><p>Your order <strong>#{done.slice(0,8).toUpperCase()}</strong> ثبت شد. برای به‌روزرسانی سفارش از ایمیل حساب شما استفاده می‌کنیم.</p><button className="button checkout-button" onClick={close}>Return to NOIRÉ <ArrowUpRight size={15}/></button></div></div>;

  return <div className="checkout-layer"><div className="checkout-shell">
    <header className="checkout-header"><button onClick={close}><ArrowLeft size={16}/> Back</button><span className="wordmark">NOIRÉ</span><span className="checkout-secure"><LockKeyhole size={13}/> Secure checkout</span></header>
    <div className="checkout-grid">
      <main><p className="eyebrow">تکمیل سفارش / ارسال</p><h1>سفارش خود را<br/><em>تکمیل کنید.</em></h1>
        {!user&&<div className="checkout-login"><span>حساب کاربری دارید؟</span><button onClick={onAccount}>Sign in <ArrowUpRight size={14}/></button></div>}
        <form className="checkout-form" onSubmit={placeOrder}>
          <label>نام و نام خانوادگی<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
          <label>شماره تلفن<input required value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
          <label>آدرس<textarea required value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></label>
          <div className="checkout-two"><label>شهر<input required value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/></label><label>کد پستی<input required value={form.postalCode} onChange={e=>setForm({...form,postalCode:e.target.value})}/></label></div>
          <label>کشور<input required value={form.country} onChange={e=>setForm({...form,country:e.target.value})}/></label>
          <div className="checkout-discount">
            <span>کد تخفیف</span>
            <div>
              <input value={discountCode} onChange={e=>{setDiscountCode(e.target.value);setAppliedDiscount(null)}} placeholder="کد را وارد کنید"/>
              <button type="button" onClick={applyDiscount} disabled={discountLoading}>{discountLoading?'در حال بررسی...':'Apply'}</button>
            </div>
            {appliedDiscount&&<small>Code {appliedDiscount.code} applied — −{appliedDiscount.amount.toLocaleString('en-US')} تومان</small>}
          </div>
          {error&&<p className="checkout-error">{error}</p>}
          <button className="button checkout-button" disabled={loading||!cart.length}>{loading?<><Loader2 size={15} className="spin"/> Processing...</>:<>{user?'ثبت سفارش':'برای ادامه وارد شوید'} <ArrowUpRight size={15}/></>}</button>
        </form>
      </main>
      <aside className="checkout-summary"><p className="eyebrow">سفارش شما</p>{cart.map(x=><div className="summary-item" key={x.product.id+x.variant.size+x.variant.color}><img src={x.product.image} alt=""/><div><strong>{x.product.name}</strong><small>{x.variant.color} · {x.variant.size} · ×{x.quantity}</small></div><b>{(Number(x.product.price.replace(/\D/g,''))*x.quantity).toLocaleString('en-US')} تومان</b></div>)}<div className="summary-total"><span>جمع جزء</span><strong>{subtotal.toLocaleString('en-US')} تومان</strong></div>{appliedDiscount&&<div className="summary-total"><span>تخفیف</span><strong>−{appliedDiscount.amount.toLocaleString('en-US')} تومان</strong></div>}{appliedDiscount&&<div className="summary-total"><span>مجموع</span><strong>{Math.max(0,subtotal-appliedDiscount.amount).toLocaleString('en-US')} تومان</strong></div>}<small className="summary-note">هزینه ارسال و مالیات همراه با سفارش تأیید می‌شود.</small></aside>
    </div>
  </div></div>
}
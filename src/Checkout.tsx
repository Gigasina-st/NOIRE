import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowUpRight, Check, Loader2, LockKeyhole } from 'lucide-react';
import { supabase } from './lib/supabase';
import { useStore } from './store';

type CheckoutProps={close:()=>void;onAccount:()=>void};

export default function Checkout({close,onAccount}:CheckoutProps){
  const {cart,subtotal,clearCart}=useStore();
  const [user,setUser]=useState<any>(null);
  const [loading,setLoading]=useState(false);
  const [done,setDone]=useState<string|null>(null);
  const [error,setError]=useState('');
  const [form,setForm]=useState({name:'',phone:'',address:'',city:'',postalCode:'',country:''});

  useEffect(()=>{
    supabase.auth.getUser().then(({data})=>setUser(data.user));
  },[]);

  async function applyDiscount(){
    const code=discountCode.trim();
    if(!code){setAppliedDiscount(null);setError('Enter a discount code.');return}
    if(!user){onAccount();return}
    setDiscountLoading(true);setError('');
    const {data,error}=await supabase.rpc('validate_discount',{p_code:code,p_subtotal:subtotal});
    setDiscountLoading(false);
    if(error){setError(error.message);setAppliedDiscount(null);return}
    const row=Array.isArray(data)?data[0]:data;
    if(!row){setError('Invalid or expired discount code.');setAppliedDiscount(null);return}
    setAppliedDiscount({code:row.code,amount:Number(row.discount_amount)||0});
  }}
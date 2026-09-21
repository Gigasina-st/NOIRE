import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Product } from './data';

type Variant={size:string;color:string};
type CartItem={product:Product;quantity:number;variant:Variant};
type Store={cart:CartItem[];wishlist:number[];addToCart:(product:Product,variant?:Variant)=>void;removeFromCart:(id:number,size?:string,color?:string)=>void;changeQuantity:(id:number,delta:number,size?:string,color?:string)=>void;toggleWishlist:(id:number)=>void;cartCount:number;subtotal:number;isWishlist:(id:number)=>boolean};
const StoreContext=createContext<Store|null>(null);

export function StoreProvider({children}:{children:ReactNode}){
 const [cart,setCart]=useState<CartItem[]>(()=>{try{return JSON.parse(localStorage.getItem('noire-cart')||'[]')}catch{return []}});
 const [wishlist,setWishlist]=useState<number[]>(()=>{try{return JSON.parse(localStorage.getItem('noire-wishlist')||'[]')}catch{return []}});
 useEffect(()=>localStorage.setItem('noire-cart',JSON.stringify(cart)),[cart]);
 useEffect(()=>localStorage.setItem('noire-wishlist',JSON.stringify(wishlist)),[wishlist]);
 const addToCart=(product:Product,variant:Variant={size:'M',color:'Noir'})=>setCart(c=>{const found=c.find(x=>x.product.id===product.id&&x.variant.size===variant.size&&x.variant.color===variant.color);return found?c.map(x=>x.product.id===product.id&&x.variant.size===variant.size&&x.variant.color===variant.color?{...x,quantity:x.quantity+1}:x):[...c,{product,quantity:1,variant}]});
 const removeFromCart=(id:number,size?:string,color?:string)=>setCart(c=>c.filter(x=>!(x.product.id===id&&(size===undefined||x.variant.size===size)&&(color===undefined||x.variant.color===color))));
 const changeQuantity=(id:number,delta:number,size?:string,color?:string)=>setCart(c=>c.flatMap(x=>x.product.id===id&&(size===undefined||x.variant.size===size)&&(color===undefined||x.variant.color===color)?[{...x,quantity:x.quantity+delta}].filter(y=>y.quantity>0):[x]));
 const toggleWishlist=(id:number)=>setWishlist(w=>w.includes(id)?w.filter(x=>x!==id):[...w,id]);
 const cartCount=cart.reduce((s,x)=>s+x.quantity,0);
 const subtotal=cart.reduce((s,x)=>s+Number(x.product.price.replace(/[^0-9]/g,'').replace(',','.'))*x.quantity,0);
 const value=useMemo(()=>({cart,wishlist,addToCart,removeFromCart,changeQuantity,toggleWishlist,cartCount,subtotal,isWishlist:(id:number)=>wishlist.includes(id)}),[cart,wishlist,cartCount,subtotal]);
 return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
export function useStore(){const value=useContext(StoreContext);if(!value)throw new Error('useStore must be used inside StoreProvider');return value;}

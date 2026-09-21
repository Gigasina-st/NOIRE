import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Product } from './data';

type CartItem={product:Product;quantity:number};
type Store={cart:CartItem[];wishlist:number[];addToCart:(product:Product)=>void;removeFromCart:(id:number)=>void;changeQuantity:(id:number,delta:number)=>void;toggleWishlist:(id:number)=>void;cartCount:number;subtotal:number;isWishlist:(id:number)=>boolean};
const StoreContext=createContext<Store|null>(null);

export function StoreProvider({children}:{children:ReactNode}){
 const [cart,setCart]=useState<CartItem[]>(()=>{try{return JSON.parse(localStorage.getItem('noire-cart')||'[]')}catch{return []}});
 const [wishlist,setWishlist]=useState<number[]>(()=>{try{return JSON.parse(localStorage.getItem('noire-wishlist')||'[]')}catch{return []}});
 useEffect(()=>localStorage.setItem('noire-cart',JSON.stringify(cart)),[cart]);
 useEffect(()=>localStorage.setItem('noire-wishlist',JSON.stringify(wishlist)),[wishlist]);
 const addToCart=(product:Product)=>setCart(c=>{const found=c.find(x=>x.product.id===product.id);return found?c.map(x=>x.product.id===product.id?{...x,quantity:x.quantity+1}:x):[...c,{product,quantity:1}]});
 const removeFromCart=(id:number)=>setCart(c=>c.filter(x=>x.product.id!==id));
 const changeQuantity=(id:number,delta:number)=>setCart(c=>c.flatMap(x=>x.product.id===id?[{...x,quantity:x.quantity+delta}].filter(y=>y.quantity>0):[x]));
 const toggleWishlist=(id:number)=>setWishlist(w=>w.includes(id)?w.filter(x=>x!==id):[...w,id]);
 const cartCount=cart.reduce((s,x)=>s+x.quantity,0);
 const subtotal=cart.reduce((s,x)=>s+Number(x.product.price.replace(/[^0-9]/g,'').replace(',','.'))*x.quantity,0);
 const value=useMemo(()=>({cart,wishlist,addToCart,removeFromCart,changeQuantity,toggleWishlist,cartCount,subtotal,isWishlist:(id:number)=>wishlist.includes(id)}),[cart,wishlist,cartCount,subtotal]);
 return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
export function useStore(){const value=useContext(StoreContext);if(!value)throw new Error('useStore must be used inside StoreProvider');return value;}

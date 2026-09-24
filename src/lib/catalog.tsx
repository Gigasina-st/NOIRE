import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from './supabase';
import { products as fallbackProducts, type Product } from '../data';

type DbProduct={id:string;name:string;slug:string;category:string;price:number;currency:string;description:string|null;details:string[]|null;image:string|null;gallery:string[]|null;stock:number|null;sizes:string[]|null;colors:string[]|null;color_images:Record<string,string>|null};
type CatalogState={products:Product[];loading:boolean;error:string|null};

const CatalogContext=createContext<CatalogState>({products:fallbackProducts,loading:true,error:null});

function toProduct(row:DbProduct):Product{
  const fallback=fallbackProducts.find(product=>product.name===row.name);
  return {
    id:row.id,
    name:row.name,
    category:row.category,
    price:new Intl.NumberFormat('en-US',{style:'currency',currency:row.currency||'EUR',maximumFractionDigits:0}).format(Number(row.price)),
    image:row.image||fallback?.image||'',
    alt:fallback?.alt||row.name,
    gallery:row.gallery?.length?row.gallery:fallback?.gallery||[],
    description:row.description||fallback?.description||'',
    details:row.details?.length?row.details:fallback?.details||[],
    stock:row.stock??fallback?.stock,
    sizes:row.sizes?.length?row.sizes:fallback?.sizes,
    colors:row.colors?.length?row.colors:fallback?.colors,
    colorImages:row.color_images||fallback?.colorImages
  };
}

export function CatalogProvider({children}:{children:ReactNode}){
  const [state,setState]=useState<CatalogState>({products:fallbackProducts,loading:true,error:null});

  useEffect(()=>{
    let active=true;
    async function loadProducts(){
      const {data,error}=await supabase.from('products')
        .select('id,name,slug,category,price,currency,description,details,image,gallery,stock,sizes,colors')
        .eq('active',true)
        .order('created_at',{ascending:true});

      if(!active)return;
      if(error){
        console.warn('NOIRÉ: Could not load products from Supabase. Using local fallback.',error.message);
        setState({products:fallbackProducts,loading:false,error:'Live catalog unavailable. Showing the latest local collection.'});
        return;
      }
      if(data?.length){
        setState({products:(data as DbProduct[]).map(toProduct),loading:false,error:null});
      }else{
        setState({products:fallbackProducts,loading:false,error:'No live products found. Showing the latest local collection.'});
      }
    }
    loadProducts();
    return()=>{active=false};
  },[]);

  return <CatalogContext.Provider value={state}>{children}</CatalogContext.Provider>;
}

export function useProducts(){return useContext(CatalogContext).products}
export function useCatalog(){return useContext(CatalogContext)}

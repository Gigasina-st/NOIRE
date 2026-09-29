import { supabase } from './lib/supabase';
import { Component, useEffect, useMemo, useState, type ErrorInfo, type ImgHTMLAttributes, type ReactNode } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, Heart, Menu, Minus, Plus, Search, ShoppingBag, Trash2, UserRound, X, ZoomIn } from 'lucide-react';
import { type Product } from './data';
import { CatalogProvider, useCatalog, useProducts } from './lib/catalog';
import { StoreProvider, useStore } from './store';
import Account from './Account';
import Checkout from './Checkout';

const nav=['Shop','Collections','Journal','About'];
const sizes=['XS','S','M','L','XL'];
const colors=[['Noir','#171613'],['Ivory','#e8e2d7'],['Stone','#9b958b'],['Burgundy','#6f2b35'],['Olive','#65705a'],['Navy','#26364d'],['Chocolate','#5b4030'],['Grey','#9b9b98'],['White','#f7f5ef'],['Black','#171613'],['Red','#8f3030'],['Blue','#3e5f86'],['Green','#52644d'],['Beige','#c8b99f'],['Brown','#795548'],['Pink','#d8a9b5']];

class AppErrorBoundary extends Component<{children:ReactNode},{hasError:boolean}>{
  state={hasError:false};
  static getDerivedStateFromError(){return {hasError:true};}
  componentDidCatch(error:Error,info:ErrorInfo){console.error('NOIRÉ application error',error,info);}
  render(){
    if(this.state.hasError)return <main className="app-error"><p className="eyebrow">NOIRÉ / SYSTEM</p><h1>مشکلی<br/><em>پیش آمد.</em></h1><p>لحظه‌ای غیرمنتظره پیش آمد. سبد ذخیره‌شده شما روی این دستگاه باقی می‌ماند.</p><button className="button" onClick={()=>window.location.reload()}>بارگذاری مجدد NOIRÉ <ArrowUpRight size={15}/></button></main>;
    return this.props.children;
  }
}
function SafeImage({alt,...props}:ImgHTMLAttributes<HTMLImageElement>){
  const [failed,setFailed]=useState(false);
  if(failed)return <div className="image-fallback" role="img" aria-label={alt||'NOIRÉ image'}><span>NOIRÉ</span></div>;
  return <img {...props} alt={alt} onError={()=>setFailed(true)}/>;
}

function useLock(locked:boolean){useEffect(()=>{document.body.style.overflow=locked?'hidden':'';return()=>{document.body.style.overflow=''}},[locked])}
function useEscape(close:()=>void,active=true){useEffect(()=>{if(!active)return;const f=(e:KeyboardEvent)=>e.key==='Escape'&&close();addEventListener('keydown',f);return()=>removeEventListener('keydown',f)},[close,active])}
function useDocumentMeta(product:Product|null){
  useEffect(()=>{
    const title=product?`${product.name} — NOIRÉ`:'NOIRÉ — Quietly Unforgettable';
    const description=product?product.description:'NOIRÉ is a modern fashion house built around silhouette, texture and considered restraint.';
    document.title=title;
    let meta=document.querySelector('meta[name="description"]') as HTMLMetaElement|null;
    if(!meta){meta=document.createElement('meta');meta.name='description';document.head.appendChild(meta)}
    meta.content=description;
    let theme=document.querySelector('meta[name="theme-color"]') as HTMLMetaElement|null;
    if(!theme){theme=document.createElement('meta');theme.name='theme-color';document.head.appendChild(theme)}
    theme.content='#f4f1ea';
    return()=>{if(product){document.title='NOIRÉ — Quietly Unforgettable';if(meta)meta.content='NOIRÉ is a modern fashion house built around silhouette, texture and considered restraint.'}};
  },[product]);
}
function useCanonicalMeta(product:Product|null){
  useEffect(()=>{
    const url=window.location.origin+window.location.pathname;
    let canonical=document.querySelector('link[rel="canonical"]') as HTMLLinkElement|null;
    if(!canonical){canonical=document.createElement('link');canonical.rel='canonical';document.head.appendChild(canonical)}
    canonical.href=url;
    const setMeta=(selector:string,attr:'name'|'property',key:string,content:string)=>{
      let node=document.querySelector(selector) as HTMLMetaElement|null;
      if(!node){node=document.createElement('meta');node.setAttribute(attr,key);document.head.appendChild(node)}
      node.content=content;
    };
    const title=product?product.name+' — NOIRÉ':'NOIRÉ — Quietly Unforgettable';
    const description=product?.description||'NOIRÉ is a modern fashion house built around silhouette, texture and considered restraint.';
    setMeta('meta[property="og:title"]','property','og:title',title);
    setMeta('meta[property="og:description"]','property','og:description',description);
    setMeta('meta[property="og:type"]','property','og:type',product?'product':'website');
    setMeta('meta[property="og:url"]','property','og:url',url);
  },[product]);
}
function NotFound(){
  useEffect(()=>{document.title='Page not found — NOIRÉ'},[]);
  return <main className="not-found"><p className="eyebrow">NOIRÉ / 404</p><h1>صفحه<br/><em>پیدا نشد.</em></h1><p>صفحه‌ای که درخواست کرده‌اید وجود ندارد یا جابه‌جا شده است.</p><a className="button" href="/">بازگشت به خانه <ArrowUpRight size={15}/></a></main>
}
function productSlug(product:Product){return product.id}
function goToCheckout(){
  window.history.pushState({checkout:true},'',`/checkout`);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
function goToProduct(product:Product){
  const slug=productSlug(product);
  window.location.assign(`/product/${slug}`);
}
function useRoutePath(){
  const [pathname,setPathname]=useState(()=>window.location.pathname);
  useEffect(()=>{
    const sync=()=>setPathname(window.location.pathname);
    addEventListener('popstate',sync);
    return()=>removeEventListener('popstate',sync);
  },[]);
  return pathname;
}
function Header({onMenu,onSearch,onCart,onWishlist,onCollections,onAccount,onHomeSection,storeName}:{onMenu:()=>void;onSearch:()=>void;onCart:()=>void;onWishlist:()=>void;onCollections:()=>void;onAccount:()=>void;onHomeSection?:(section:string)=>void;storeName:string}){const [scrolled,setScrolled]=useState(false);const pathname=useRoutePath();const productHeader=pathname.startsWith('/product/');const {cartCount,wishlist}=useStore();useEffect(()=>{const f=()=>setScrolled(scrollY>30);addEventListener('scroll',f,{passive:true});f();return()=>removeEventListener('scroll',f)},[]);const homeLink=(section:string)=>{if(onHomeSection){onHomeSection(section);return;}window.location.hash=section};return <header className={'site-header '+(scrolled?'is-scrolled ':'')+(productHeader?'product-header':'')}><a className="wordmark" href={productHeader?'/#top':'#top'}>{storeName}</a><nav className="desktop-nav">{nav.map(x=>x==='Collections'?<button key={x} onClick={onCollections}>{x}</button>:x==='Journal'?<button key={x} onClick={()=>homeLink('journal')}>مجله</button>:productHeader?<a key={x} href={'/#'+x.toLowerCase()}>{x}</a>:<button key={x} onClick={()=>homeLink(x.toLowerCase())}>{x}</button>)}</nav><div className="header-actions"><button onClick={onSearch} aria-label="جستجو"><Search size={16}/></button><button onClick={onWishlist} aria-label="علاقه‌مندی‌ها"><Heart size={16}/>{wishlist.length>0&&<span>{wishlist.length}</span>}</button><button onClick={onAccount} aria-label="حساب کاربری"><UserRound size={16}/></button><button onClick={onCart} className="cart-button" aria-label="سبد"><ShoppingBag size={16}/><span>{cartCount}</span></button></div><button className="mobile-menu" type="button" onClick={onMenu} aria-label="باز کردن منو"><Menu size={21}/></button></header>}

function MobileNav({close,onSearch,onCart,onWishlist,onCollections,onAccount,onHomeSection}:{close:()=>void;onSearch:()=>void;onCart:()=>void;onWishlist:()=>void;onCollections:()=>void;onAccount:()=>void;onHomeSection?:((section:string)=>void)}){useLock(true);useEscape(close);return <div className="mobile-overlay"><div className="mobile-top"><span className="wordmark">NOIRÉ</span><button onClick={close}><X size={23}/></button></div><nav>{nav.map((x,i)=>{if(x==='Collections')return <button className="mobile-nav-link" key={x} onClick={()=>{close();onCollections()}}><span>0{i+1}</span>{x}<ArrowUpRight size={18}/></button>;if(onHomeSection)return <a className="mobile-nav-link" key={x} href={'/#'+x.toLowerCase()} onClick={close}><span>0{i+1}</span>{x}<ArrowUpRight size={18}/></a>;return <a className="mobile-nav-link" key={x} href={'#'+x.toLowerCase()} onClick={close}><span>0{i+1}</span>{x}<ArrowUpRight size={18}/></a>})}</nav><div className="mobile-tools"><button onClick={()=>{close();onSearch()}}><Search size={15}/> Search</button><button onClick={()=>{close();onWishlist()}}><Heart size={15}/> Wishlist</button><button onClick={()=>{close();onCart()}}><ShoppingBag size={15}/> Bag</button><button onClick={()=>{close();onAccount()}}><UserRound size={15}/> Account</button></div><p>پاریس · لندن · همه‌جا</p></div>}

function Hero(){return <section className="hero" id="top"><div className="hero-media"><img src="/images/noire-hero.jpg" alt="NOIRÉ editorial fashion campaign" loading="eager" fetchPriority="high" decoding="async"/></div><div className="hero-shade"/><div className="hero-content"><p className="eyebrow light reveal">پاییز / زمستان ۱۴۰۵</p><h1 className="reveal delay-1">Quietly<br/><em>Unforgettable.</em></h1><p className="hero-copy reveal delay-2">مطالعه‌ای در فرم، بافت و فاصله‌های میان آن‌ها؛ طراحی‌شده در پاریس، برای همه‌جا.</p><div className="hero-actions reveal delay-3"><a className="button button-light" href="#shop">مشاهده مجموعه <ArrowUpRight size={15}/></a><a className="text-link light" href="#story">کاوش <ArrowDown size={14}/></a></div></div><div className="hero-meta"><span>01</span><i/><span>04</span></div><a className="scroll-cue" href="#collections"><i/> برای کشف بیشتر اسکرول کنید</a></section>}

function SectionHeading({index,eyebrow,title,italic,action,onAction}:{index:string;eyebrow:string;title:string;italic:string;action?:string;onAction?:()=>void}){return <div className="section-head"><div><p className="eyebrow">{index} / {eyebrow}</p><h2>{title}<br/><em>{italic}</em></h2></div>{action&&(onAction?<button className="text-link" onClick={onAction}>{action} <ArrowUpRight size={14}/></button>:<a className="text-link" href="#shop">{action} <ArrowUpRight size={14}/></a>)}</div>}

function Campaign01({onDiscover}:{onDiscover:()=>void}){
  const products=useProducts();
  const heroProduct=products[0];
  const campaignProduct=products[1]||products[0];
  return <section className="campaign-01" aria-label="NOIRÉ Campaign 01">
    <div className="campaign-intro">
      <div className="campaign-index"><span>NOIRÉ</span><i/><span>CAMPAIGN 01</span></div>
      <div className="campaign-intro-copy">
        <p className="eyebrow light">مطالعه بصری / ۱۴۰۵</p>
        <h2>Form<br/><em>After Dark.</em></h2>
        <p>فرم، سایه و اعتمادبه‌نفس آرام قطعاتی که برای زندگی ساخته شده‌اند.</p>
      </div>
      <span className="campaign-scroll">برای ورود اسکرول کنید</span>
    </div>
    <div className="campaign-frame campaign-frame-main">
      <img src="/images/noire-editorial.jpg" alt="NOIRÉ Campaign 01 editorial" loading="lazy" decoding="async"/>
      <div className="campaign-frame-overlay"/>
      <div className="campaign-frame-copy">
        <span>استایل ۰۱ / ۰۴</span>
        <strong>یونیفرم جدید</strong>
      </div>
    </div>
    <div className="campaign-split">
      <div className="campaign-frame campaign-frame-tall">
        <img src="/images/noire-story.jpg" alt="NOIRÉ Campaign 01 portrait" loading="lazy" decoding="async"/>
        <div className="campaign-frame-copy"><span>استایل ۰۲ / ۰۴</span><strong>ساختار آرام</strong></div>
      </div>
      <div className="campaign-manifesto">
        <p className="eyebrow">NOIRÉ / CAMPAIGN 01</p>
        <h3>Less noise.<br/><em>More presence.</em></h3>
        <p>طراحی‌شده با خویشتن‌داری و برش‌خورده با دقت؛ مجموعه‌ای که نیازی به معرفی خود ندارد.</p>
        <button className="text-link" onClick={onDiscover}>کشف مجموعه <ArrowUpRight size={14}/></button>
      </div>
    </div>
    <div className="campaign-frame campaign-frame-wide">
      <img src={heroProduct?.image||"/images/noire-hero.jpg"} alt={heroProduct?.alt||"NOIRÉ signature piece"} loading="lazy" decoding="async"/>
      <div className="campaign-frame-overlay"/>
      <div className="campaign-product-lockup">
        <span>کمپین ۰۱ / قطعه شاخص</span>
        <strong>{campaignProduct?.name||"NOIRÉ"}</strong>
        <b>{campaignProduct?.price||""}</b>
      </div>
    </div>
    <div className="campaign-end">
      <p className="eyebrow">پایان کمپین ۰۱</p>
      <h3>Quietly<br/><em>unforgettable.</em></h3>
      <button className="button" onClick={onDiscover}>ورود به مجموعه <ArrowUpRight size={15}/></button>
    </div>
  </section>
}

function Featured({openProduct,onCollections}:{openProduct:(p:Product)=>void;onCollections:()=>void}){const products=useProducts();return <section className="section featured" id="collections"><SectionHeading index="01" eyebrow="COLLECTION" title="The art of" italic="restraint." action="View collection" onAction={onCollections}/><div className="feature-grid"><article className="image-card feature-main" onClick={()=>openProduct(products[0])}><img src="/images/noire-story.jpg" alt="NOIRÉ campaign portrait" loading="lazy" decoding="async"/><div className="image-caption"><span>استایل ۰۱</span><strong>یونیفرم جدید</strong><ArrowUpRight size={17}/></div></article><article className="image-card feature-side" onClick={()=>openProduct(products[0])}><img src="/images/noire-editorial.jpg" alt="Sculpted wool coat editorial" loading="lazy" decoding="async"/><div className="image-caption"><span>استایل ۰۴</span><strong>پشم معماری</strong><ArrowUpRight size={17}/></div></article></div></section>}

function ProductCard({product,onOpen}:{product:Product;onOpen:(p:Product)=>void}){const {addToCart,toggleWishlist,isWishlist}=useStore();const liked=isWishlist(product.id);return <article className="product-card"><div className="product-image" onClick={()=>onOpen(product)}><img src={product.image} alt={product.alt} loading="lazy" decoding="async"/><button className={'wish '+(liked?'active':'')} onClick={e=>{e.stopPropagation();toggleWishlist(product.id)}} aria-label="علاقه‌مندی‌ها"><Heart size={17} fill={liked?'currentColor':'none'}/></button><button className="quick-add" onClick={e=>{e.stopPropagation();addToCart(product)}}>Quick add <ArrowUpRight size={14}/></button></div><div className="product-info" onClick={()=>onOpen(product)}><div><h3>{product.name}</h3><p>{product.category}</p></div><strong>{product.price}</strong></div></article>}

function NewArrivals({openProduct}:{openProduct:(p:Product)=>void}){const products=useProducts();const {loading,error}=useCatalog();const [filter,setFilter]=useState('All');const cats=['All',...new Set(products.map(p=>p.category))];const visible=filter==='All'?products:products.filter(p=>p.category===filter);return <section className="section arrivals" id="shop"><SectionHeading index="02" eyebrow="NEW ARRIVALS" title="Now," italic="in focus."/><p className="section-note">شش قطعه منتخب از جدیدترین مجموعه NOIRÉ.</p>{(loading||error)&&<p className="catalog-status" aria-live="polite">{loading?'Synchronising the collection…':error}</p>}<div className="filter-bar">{cats.map(c=><button className={filter===c?'active':''} key={c} onClick={()=>setFilter(c)}>{c}</button>)}</div><div className="product-grid">{visible.map(p=><ProductCard key={p.id} product={p} onOpen={openProduct}/>)}</div></section>}

function Story(){return <section className="story" id="about"><div className="story-image"><img src="/images/noire-story.jpg" alt="NOIRÉ atelier detail" loading="lazy" decoding="async"/></div><div className="story-copy" id="story"><p className="eyebrow">۰۳ / خانه</p><h2>Made with<br/><em>intention.</em></h2><p>NOIRÉ خانه‌ای مدرن است که بر این باور بنا شده که لوکس بودن از چیزهایی آغاز می‌شود که حذف می‌کنیم. هر فرم به خط اصلی خود می‌رسد و هر متریال برای ماندگاری‌اش انتخاب می‌شود.</p><a className="text-link" href="#journal">داستان ما را کشف کنید <ArrowUpRight size={14}/></a></div></section>}

function Editorial(){return <section className="editorial" id="journal"><img src="/images/noire-editorial.jpg" alt="NOIRÉ autumn editorial campaign" loading="lazy" decoding="async"/><div className="editorial-content"><p className="eyebrow light">منتخب پاییز / ۱۴۰۵</p><h2>After<br/><em>Dark.</em></h2><a className="button button-light" href="#journal-story">ورود به مجله <ArrowUpRight size={15}/></a></div></section>}

function Journal(){
  const products=useProducts();
  const [entries,setEntries]=useState<Array<{id:string;section:string;title:string;summary:string;body:string;image:string;product_ids:string[]}>>([]);
  const [selected,setSelected]=useState('uniform');
  const [loading,setLoading]=useState(true);
  useEffect(()=>{let alive=true;(async()=>{const {data}=await supabase.from('journal_entries').select('id,section,title,summary,body,image,product_ids').eq('active',true).order('sort_order').order('created_at');if(alive){setEntries((data||[]) as any);setLoading(false)}})();return()=>{alive=false}},[]);
  const sections=[['uniform','یونیفرم جدید','On proportion and everyday ritual'],['atelier','درون آتلیه','متریال، دست و خویشتن‌داری'],['after-dark','After Dark','مطالعه‌ای بصری در سایه']] as const;
  const visible=entries.filter(e=>e.section===selected);
  return <section className="journal-story" id="journal-story"><div><p className="eyebrow">۰۴ / مجله</p><h2>Objects with<br/><em>quiet power.</em></h2></div><div className="journal-copy"><p>سه نگاه به مجموعه جدید: انضباط خیاطی، صمیمیت چرم و پالت شبانه‌ای که پاییز / زمستان ۱۴۰۵ را تعریف می‌کند.</p><div className="journal-list">{sections.map(([key,title,summary],i)=><button type="button" className={'journal-entry-button '+(selected===key?'active':'')} key={key} onClick={()=>setSelected(key)}><span>0{i+1}</span><strong>{title}</strong><small>{summary}</small></button>)}</div><div className="journal-entry-content">{loading?<p>در حال بارگذاری…</p>:visible.length?visible.map(entry=><article key={entry.id}>{entry.image&&<img src={entry.image} alt={entry.title}/>}<h3>{entry.title}</h3>{entry.summary&&<small>{entry.summary}</small>}<p>{entry.body}</p>{entry.product_ids?.length>0&&<div className="journal-products">{entry.product_ids.map(id=>{const product=products.find(p=>p.id===id);return product?<ProductCard key={id} product={product} onOpen={goToProduct}/>:null})}</div>}</article>):<p>این بخش هنوز محتوایی ندارد.</p>}</div></div></section>;
}
function Newsletter(){const [sent,setSent]=useState(false);return <section className="newsletter"><div><p className="eyebrow">پیش‌نمایش خصوصی</p><h2>Be the first to<br/><em>know.</em></h2></div><form onSubmit={e=>{e.preventDefault();setSent(true)}}><p>یادداشت‌های منتخب NOIRÉ را دریافت کنید — مجموعه‌های جدید، داستان‌های مجله و پیش‌نمایش‌های خصوصی.</p><div className="email-row"><input required type="email" placeholder="آدرس ایمیل شما"/><button type="submit">{sent?<Check size={17}/>:<ArrowUpRight size={18}/>}</button></div><small>{sent?'Thank you. You are on the list.':'By subscribing, you agree to receive NOIRÉ correspondence.'}</small></form></section>}

type StoreSettings={store_name:string;phone:string;email:string;instagram:string;whatsapp:string;address:string;shipping_note:string};
const DEFAULT_SETTINGS:StoreSettings={store_name:'NOIRÉ',phone:'+989120000000',email:'hello@noire.example',instagram:'https://instagram.com/noire_official',whatsapp:'https://wa.me/989120000000',address:'Tehran, Iran',shipping_note:''};
function useStoreSettings(){
 const [settings,setSettings]=useState<StoreSettings>(DEFAULT_SETTINGS);
 useEffect(()=>{let alive=true;(async()=>{const {data}=await supabase.from('store_settings').select('key,value');if(!alive||!data)return;const next={...DEFAULT_SETTINGS};for(const row of data as any[]){if(row.key==='store_name')next.store_name=typeof row.value==='string'?row.value:(row.value?.value||DEFAULT_SETTINGS.store_name);if(row.key==='contact'){const v=typeof row.value==='object'&&row.value?row.value:{};next.phone=v.phone||'';next.email=v.email||'';next.instagram=v.instagram||'';next.whatsapp=v.whatsapp||'';next.address=v.address||''}if(row.key==='shipping_note')next.shipping_note=typeof row.value==='string'?row.value:(row.value?.value||'')}setSettings(next)})();return()=>{alive=false}},[]);
 return settings;
}
function FaqPanel({close,settings}:{close:()=>void;settings:StoreSettings}){useEscape(close);return <div className="service-layer"><button className="service-backdrop" onClick={close}/><aside className="service-panel"><div className="service-head"><div><p className="eyebrow">NOIRÉ / FAQ</p><h2>Questions,<br/><em>answered.</em></h2></div><button onClick={close}><X size={22}/></button></div><div className="service-list"><details open><summary>ارسال سفارش چقدر زمان می‌برد؟</summary><p>{settings.shipping_note||'Orders are prepared with care and dispatched as soon as they are ready.'}</p></details><details><summary>آیا می‌توانم سفارش را تغییر دهم یا لغو کنم؟</summary><p>Contact NOIRÉ as soon as possible with your order number.</p></details><details><summary>چطور سایز خود را انتخاب کنم؟</summary><p>Use the size selector on each product page. A detailed size guide can be added here later.</p></details><details><summary>چطور سفارش خود را پیگیری کنم؟</summary><p>Sign in to your account to view your order history and latest status.</p></details><details><summary>Do you ship internationally?</summary><p>International shipping information can be added here later.</p></details></div></aside></div>}
function ContactPanel({close,settings}:{close:()=>void;settings:StoreSettings}){useEscape(close);return <div className="service-layer"><button className="service-backdrop" onClick={close}/><aside className="service-panel contact-panel"><div className="service-head"><div><p className="eyebrow">NOIRÉ / CONTACT</p><h2>Talk to<br/><em>the house.</em></h2></div><button onClick={close}><X size={22}/></button></div><div className="contact-grid"><a href={`tel:${settings.phone}`}><span>PHONE</span><strong>{settings.phone}</strong><small>Tap to call</small></a><a href={`mailto:${settings.email}`}><span>EMAIL</span><strong>{settings.email}</strong><small>Tap to email</small></a><a href={settings.whatsapp} target="_blank" rel="noreferrer"><span>WHATSAPP</span><strong>Message us</strong><small>Open WhatsApp</small></a><a href={settings.instagram} target="_blank" rel="noreferrer"><span>INSTAGRAM</span><strong>@noire_official</strong><small>Open Instagram</small></a><a className="contact-address" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`} target="_blank" rel="noreferrer"><span>ADDRESS</span><strong>{settings.address}</strong><small>Open in Maps</small></a><div><span>OPENING HOURS</span><strong>Mon — Sat · 10:00 — 19:00</strong><small>Local time</small></div></div><p className="contact-note">These contact details are temporary placeholders; replace them with the seller's real details later.</p></aside></div>}
function Footer({onHomeSection,onAccount,onFaq,onContact,settings}:{onHomeSection?:(section:string)=>void;onAccount?:()=>void;onFaq?:()=>void;onContact?:()=>void;settings:StoreSettings}){const link=(section:string)=>(e:React.MouseEvent<HTMLAnchorElement>)=>{if(onHomeSection){e.preventDefault();onHomeSection(section)}};return <footer><div className="footer-top"><a className="wordmark" href={onHomeSection?"/#top":"#top"} onClick={onHomeSection?link('top'):undefined}>{settings.store_name}</a><p>A modern house for<br/>quietly remarkable things.</p><div className="footer-links"><div><span>SHOP</span><a href={onHomeSection?"/#shop":"#shop"} onClick={onHomeSection?link('shop'):undefined}>New arrivals</a><a href={onHomeSection?"/#collections":"#collections"} onClick={onHomeSection?link('collections'):undefined}>Collections</a><a href={onHomeSection?"/#shop":"#shop"} onClick={onHomeSection?link('shop'):undefined}>Accessories</a></div><div><span>HOUSE</span><a href={onHomeSection?"/#about":"#about"} onClick={onHomeSection?link('about'):undefined}>Our story</a><a href={onHomeSection?"/#journal":"#journal"} onClick={onHomeSection?link('journal'):undefined}>مجله</a><a href={onHomeSection?"/#about":"#about"} onClick={onHomeSection?link('about'):undefined}>Stockists</a></div><div><span>CARE</span><button type="button" onClick={onAccount}>Shipping & returns</button><button type="button" onClick={onContact}>Contact</button><button type="button" onClick={onFaq}>FAQ</button></div></div></div><div className="footer-bottom"><span>© 2026 {settings.store_name}</span><div>{settings.instagram&&<a href={settings.instagram} target="_blank" rel="noreferrer">Instagram</a>}<a href={onHomeSection?"/#top":"#top"} onClick={onHomeSection?link('top'):undefined}>Legal</a></div><span>Made with intention.</span></div></footer>}

function CollectionPage({close,openProduct}:{close:()=>void;openProduct:(p:Product)=>void}){const products=useProducts();const [filter,setFilter]=useState('All');const [sort,setSort]=useState('featured');const cats=['All',...new Set(products.map(p=>p.category))];const visible=useMemo(()=>[...products.filter(p=>filter==='All'||p.category===filter)].sort((a,b)=>sort==='featured'?products.indexOf(a)-products.indexOf(b):sort==='price-low'?parseInt(a.price.replace(/\D/g,''))-parseInt(b.price.replace(/\D/g,'')):sort==='price-high'?parseInt(b.price.replace(/\D/g,''))-parseInt(a.price.replace(/\D/g,'')):a.name.localeCompare(b.name)),[filter,sort]);useLock(true);useEscape(close);return <div className="collection-page"><header className="collection-header"><button className="collection-close" onClick={close}><X size={19}/> Close</button><p className="eyebrow">NOIRÉ / AUTUMN WINTER 2026</p><h1>The<br/><em>Collection.</em></h1><p className="collection-intro">A complete study in proportion, texture and modern tailoring. Six pieces, considered without excess.</p></header><div className="collection-toolbar"><div className="collection-filters">{cats.map(c=><button className={filter===c?'active':''} key={c} onClick={()=>setFilter(c)}>{c}</button>)}</div><select value={sort} onChange={e=>setSort(e.target.value)} aria-label="Sort collection"><option value="featured">منتخب</option><option value="price-low">قیمت: کم به زیاد</option><option value="price-high">قیمت: زیاد به کم</option></select></div><div className="collection-grid">{visible.map((p,i)=><div className={'collection-product c-product-'+(i%4)} key={p.id}><ProductCard product={p} onOpen={openProduct}/></div>)}</div><div className="collection-foot"><span>{visible.length} pieces</span><span>طراحی‌شده در پاریس · برای همه‌جا</span></div></div>}

function ProductGallery({product,activeColor}:{product:Product;activeColor?:string}){const [index,setIndex]=useState(0);const [zoom,setZoom]=useState(false);const colorImage=activeColor?product.colorImages?.[activeColor]:undefined;const gallery=[...(colorImage?[colorImage]:[]),...product.gallery.filter(src=>src!==colorImage)];const image=gallery[index]||product.image;useEffect(()=>{setIndex(0);setZoom(false)},[activeColor,product.id]);return <div className="gallery"><div className="gallery-main" onClick={()=>setZoom(true)}><SafeImage src={image} alt={product.alt} loading="eager" decoding="async"/><span><ZoomIn size={14}/> View full</span><button className="gallery-prev" onClick={e=>{e.stopPropagation();setIndex((index-1+gallery.length)%gallery.length)}}><ArrowLeft size={16}/></button><button className="gallery-next" onClick={e=>{e.stopPropagation();setIndex((index+1)%gallery.length)}}><ArrowRight size={16}/></button></div><div className="gallery-thumbs">{gallery.map((src,i)=><button className={index===i?'active':''} key={src} onClick={()=>setIndex(i)}><img src={src} alt="" loading="lazy" decoding="async"/></button>)}</div>{zoom&&<div className="zoom-view" onClick={()=>setZoom(false)}><img src={image} alt={product.alt}/><button onClick={()=>setZoom(false)}><X size={21}/></button></div>}</div>}

function ProductPage({product,back}:{product:Product;back:()=>void}){
  const {addToCart,toggleWishlist,isWishlist}=useStore();
  const availableSizes=product.sizes?.length?product.sizes:sizes;
  const availableColors=product.colors??colors.map(c=>c[0]);
  const [size,setSize]=useState(availableSizes.includes('M')?'M':availableSizes[0]);
  const [color,setColor]=useState(availableColors.includes('Noir')?'Noir':availableColors[0]);
  const [added,setAdded]=useState(false);
  const [details,setDetails]=useState(true);
  const liked=isWishlist(product.id);
  const soldOut=product.stock!==undefined&&product.stock<=0;
  useDocumentMeta(product);
  useEffect(()=>window.scrollTo(0,0),[product.id]);
  return <main className="product-page">
    <div className="product-page-top">
      <button type="button" className="product-back-button" onClick={back}><ArrowLeft size={17}/> Back to home</button>
      <span className="eyebrow">NOIRÉ / PRODUCT</span>
      <button className={'product-page-wish '+(liked?'active':'')} onClick={()=>toggleWishlist(product.id)} aria-label="Save product"><Heart size={19} fill={liked?'currentColor':'none'}/></button>
    </div>
    <div className="product-page-grid">
      <ProductGallery product={product} activeColor={color}/>
      <section className="product-page-info">
        <p className="eyebrow">{product.category}</p>
        <h1>{product.name}</h1>
        <strong className="product-page-price">{product.price}</strong>
        <p className="product-page-description">{product.description}</p>
        {product.stock!==undefined&&<p className="stock-note">{soldOut?'Currently unavailable':product.stock<5?`Only ${product.stock} left in the atelier`:'In stock'}</p>}
        <div className="selector"><div><span>رنگ</span><b>{color}</b></div><div className="swatches">{availableColors.map(name=>{const hex=colors.find(([n])=>n===name)?.[1]||'#b8b3aa';return <button key={name} className={color===name?'selected':''} onClick={()=>setColor(name)} aria-label={name}><i style={{background:hex}}/></button>})}</div></div>
        <div className="selector"><div><span>سایز</span><b>{size}</b></div><div className="sizes">{availableSizes.map(s=><button key={s} className={size===s?'selected':''} onClick={()=>setSize(s)}>{s}</button>)}</div></div>
        <button disabled={soldOut} className={'button modal-add '+(added?'added':'')} onClick={()=>{addToCart(product,{size,color});setAdded(true)}}>{soldOut?'Unavailable':added?<><Check size={15}/> Added to bag</>:<>افزودن به سبد <ArrowUpRight size={15}/></>}</button>
        <button className="details-toggle" onClick={()=>setDetails(!details)}>جزئیات محصول <ChevronDown size={15} className={details?'open':''}/></button>
        {details&&<div className="product-details">{product.details.map(d=><p key={d}><span>—</span>{d}</p>)}</div>}
        <div className="product-page-note"><span>خدمات NOIRÉ</span><p>ارسال رایگان برای سفارش‌های بالای ۵۰۰ یورو. هر قطعه پیش از خروج از آتلیه با دقت آماده می‌شود.</p></div>
      </section>
    </div>
  </main>
}
function ProductModal({product,close}:{product:Product;close:()=>void}){const {addToCart,toggleWishlist,isWishlist}=useStore();const availableSizes=product.sizes?.length?product.sizes:sizes;const availableColors=product.colors?.length?product.colors:colors.map(c=>c[0]);const [size,setSize]=useState(availableSizes.includes('M')?'M':availableSizes[0]);const [color,setColor]=useState(availableColors.includes('Noir')?'Noir':availableColors[0]);const [added,setAdded]=useState(false);const [details,setDetails]=useState(true);const liked=isWishlist(product.id);const soldOut=product.stock!==undefined&&product.stock<=0;useLock(true);useEscape(close);return <div className="product-modal-layer"><button className="product-modal-backdrop" onClick={close} aria-label="Close product"/><article className="product-modal" role="dialog" aria-modal="true" aria-labelledby="product-modal-title"><button className="modal-close" onClick={close} aria-label="Close product"><X size={22}/></button><ProductGallery product={product} activeColor={color}/><div className="modal-info"><p className="eyebrow">{product.category}</p><div className="modal-title-row"><h2 id="product-modal-title">{product.name}</h2><button className={'modal-wish '+(liked?'active':'')} onClick={()=>toggleWishlist(product.id)} aria-label="Save product"><Heart size={19} fill={liked?'currentColor':'none'}/></button></div><strong className="modal-price">{product.price}</strong><p className="modal-description">{product.description}</p>{product.stock!==undefined&&<p className="stock-note">{soldOut?'Currently unavailable':product.stock<5?`Only ${product.stock} left in the atelier`:'In stock'}</p>}<div className="selector"><div><span>رنگ</span><b>{color}</b></div><div className="swatches">{availableColors.map(name=>{const hex=colors.find(([n])=>n===name)?.[1]||'#b8b3aa';return <button key={name} className={color===name?'selected':''} onClick={()=>setColor(name)} aria-label={name}><i style={{background:hex}}/></button>})}</div></div><div className="selector"><div><span>سایز</span><b>{size}</b></div><div className="sizes">{availableSizes.map(s=><button key={s} className={size===s?'selected':''} onClick={()=>setSize(s)}>{s}</button>)}</div></div><button disabled={soldOut} className={'button modal-add '+(added?'added':'')} onClick={()=>{addToCart(product,{size,color});setAdded(true)}}>{soldOut?'Unavailable':added?<><Check size={15}/> Added to bag</>:<>افزودن به سبد <ArrowUpRight size={15}/></>}</button><button className="details-toggle" onClick={()=>setDetails(!details)}>جزئیات محصول <ChevronDown size={15} className={details?'open':''}/></button>{details&&<div className="product-details">{product.details.map(d=><p key={d}><span>—</span>{d}</p>)}</div>}</div></article></div>}

function SearchOverlay({close,onOpen}:{close:()=>void;onOpen:(p:Product)=>void}){const products=useProducts();const [q,setQ]=useState('');const results=products.filter(p=>(p.name+' '+p.category+' '+p.description+' '+p.details.join(' ')).toLowerCase().includes(q.toLowerCase())).slice(0,6);useLock(true);useEffect(()=>{const f=(e:KeyboardEvent)=>e.key==='Escape'&&close();addEventListener('keydown',f);return()=>removeEventListener('keydown',f)},[close]);return <div className="search-overlay"><div className="search-inner"><div className="search-top"><span className="eyebrow">جستجوی NOIRÉ</span><button onClick={close}><X size={22}/></button></div><div className="search-input"><Search size={19}/><input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="جستجوی محصولات، دسته‌بندی‌ها..."/></div><div className="search-results">{q&&results.map(p=><button className="search-result" onClick={()=>{close();onOpen(p)}} key={p.id}><img src={p.image} alt="" loading="lazy" decoding="async"/><span><strong>{p.name}</strong><small>{p.category} · {p.price}</small></span><ArrowUpRight size={16}/></button>)}{q&&!results.length&&<p>محصولی پیدا نشد. جستجوی دیگری را امتحان کنید.</p>}</div></div></div>}

function CartDrawer({close,onCheckout}:{close:()=>void;onCheckout:()=>void}){const {cart,removeFromCart,changeQuantity,subtotal}=useStore();useEscape(close);const pieces=cart.reduce((s,x)=>s+x.quantity,0);useLock(true);return <div className="cart-layer"><button className="cart-backdrop" onClick={close}/><aside className="cart-drawer"><div className="cart-head"><div><p className="eyebrow">سبد شما</p><h2>{cart.length?pieces+' pieces':'Your bag is empty'}</h2></div><button onClick={close}><X size={22}/></button></div>{cart.length?<><div className="cart-items">{cart.map(x=><div className="cart-item" key={x.product.id+'-'+x.variant.size+'-'+x.variant.color}><img src={x.product.image} alt={x.product.alt} loading="lazy" decoding="async"/><div className="cart-item-info"><div><strong>{x.product.name}</strong><small>{x.product.category} · {x.variant.color} · {x.variant.size}</small></div><span>{x.product.price}</span><div className="quantity"><button onClick={()=>changeQuantity(x.product.id,-1,x.variant.size,x.variant.color)}><Minus size={12}/></button><b>{x.quantity}</b><button onClick={()=>changeQuantity(x.product.id,1,x.variant.size,x.variant.color)}><Plus size={12}/></button><button className="remove" onClick={()=>removeFromCart(x.product.id,x.variant.size,x.variant.color)}><Trash2 size={13}/></button></div></div></div>)}</div><div className="cart-foot"><div><span>جمع جزء</span><strong>{subtotal.toLocaleString('en-US')} تومان</strong></div><button type="button" className="button cart-checkout" onClick={onCheckout}>تکمیل سفارش <ArrowUpRight size={15}/></button><small>مالیات و هزینه ارسال هنگام تکمیل سفارش محاسبه می‌شود.</small></div></>:<div className="empty-cart"><ShoppingBag size={28}/><p>هنوز چیزی اینجا نیست.</p><a href="#shop" onClick={close} className="text-link">کشف مجموعه <ArrowUpRight size={14}/></a></div>}</aside></div>}

function WishlistDrawer({close,onOpen}:{close:()=>void;onOpen:(p:Product)=>void}){const products=useProducts();const {wishlist,toggleWishlist}=useStore();useEscape(close);const items=products.filter(p=>wishlist.includes(p.id));useLock(true);return <div className="cart-layer"><button className="cart-backdrop" onClick={close}/><aside className="cart-drawer wishlist-drawer"><div className="cart-head"><div><p className="eyebrow">قطعات ذخیره‌شده</p><h2>{items.length} {items.length===1?'piece':'pieces'}</h2></div><button onClick={close}><X size={22}/></button></div>{items.length?<div className="wishlist-items">{items.map(p=><div className="wishlist-item" key={p.id} onClick={()=>{close();onOpen(p)}}><img src={p.image} alt={p.alt} loading="lazy" decoding="async"/><div><strong>{p.name}</strong><small>{p.category} · {p.price}</small><button onClick={e=>{e.stopPropagation();toggleWishlist(p.id)}}>حذف</button></div><ArrowUpRight size={15}/></div>)}</div>:<div className="empty-cart"><Heart size={28}/><p>هنوز قطعه‌ای ذخیره نشده است.</p><a href="#shop" onClick={close} className="text-link">Explore the collection <ArrowUpRight size={14}/></a></div>}</aside></div>}

function AppInner(){const [menu,setMenu]=useState(false),[search,setSearch]=useState(false),[cart,setCart]=useState(false),[wishlist,setWishlist]=useState(false),[collection,setCollection]=useState(false),[account,setAccount]=useState(false),[faq,setFaq]=useState(false),[contact,setContact]=useState(false);const pathname=useRoutePath();const settings=useStoreSettings();const productSlugRoute=pathname.match(/^\/product\/([^/]+)\/?$/)?.[1]||null;const products=useProducts();const routeProduct:Product|null=productSlugRoute?(products.find(p=>productSlug(p)===productSlugRoute)??null):null;const isCheckout=pathname==='/checkout';useCanonicalMeta(routeProduct);useEffect(()=>{if(pathname!=='/'||!window.location.hash)return;const section=decodeURIComponent(window.location.hash.slice(1));let frame=0;const scrollToSection=()=>{const target=document.getElementById(section);if(target){target.scrollIntoView({block:'start',behavior:'auto'});return}frame=window.requestAnimationFrame(scrollToSection)};frame=window.requestAnimationFrame(scrollToSection);return()=>window.cancelAnimationFrame(frame)},[pathname]);const openProduct=(p:Product)=>goToProduct(p);const backFromProduct=()=>{window.location.assign('/#top')};const backFromCheckout=()=>{window.history.pushState({},'', '/');window.dispatchEvent(new PopStateEvent('popstate'))};const openAccount=()=>{setFaq(false);setContact(false);setAccount(true)};const openFaq=()=>{setAccount(false);setContact(false);setFaq(true)};const openContact=()=>{setAccount(false);setFaq(false);setContact(true)};if(isCheckout)return <><Checkout close={backFromCheckout} onAccount={()=>setAccount(true)}/>{account&&<Account close={()=>setAccount(false)} onCheckout={goToCheckout}/>}</>;if(productSlugRoute&&!routeProduct){return products.length?<NotFound/>:<main/>}if(pathname!=='/'&&pathname!==''&&!productSlugRoute){return <NotFound/>}if(productSlugRoute&&routeProduct){const goHomeSection=(section:string)=>{setMenu(false);setSearch(false);setCart(false);setWishlist(false);setCollection(false);setAccount(false);window.location.assign(`/#${section}`)};const goHomeCollection=()=>{setMenu(false);setSearch(false);setCart(false);setWishlist(false);setAccount(false);window.history.pushState({fromProduct:productSlugRoute,collection:true},'',`/#collections`);setCollection(true)};const closeProductCollection=()=>{setCollection(false);if(window.history.state?.fromProduct){window.history.back()}};return <><Header storeName={settings.store_name} onMenu={()=>setMenu(true)} onSearch={()=>setSearch(true)} onCart={()=>setCart(true)} onWishlist={()=>setWishlist(true)} onAccount={()=>setAccount(true)} onCollections={goHomeCollection} onHomeSection={goHomeSection}/>{menu&&<MobileNav close={()=>setMenu(false)} onSearch={()=>setSearch(true)} onCart={()=>setCart(true)} onWishlist={()=>setWishlist(true)} onAccount={()=>setAccount(true)} onCollections={goHomeCollection} onHomeSection={goHomeSection}/>} {search&&<SearchOverlay close={()=>setSearch(false)} onOpen={openProduct}/>} {cart&&<CartDrawer close={()=>setCart(false)} onCheckout={goToCheckout}/>} {wishlist&&<WishlistDrawer close={()=>setWishlist(false)} onOpen={openProduct}/>} {account&&<Account close={()=>setAccount(false)} onCheckout={goToCheckout}/>} {faq&&<FaqPanel close={()=>setFaq(false)} settings={settings}/>} {contact&&<ContactPanel close={()=>setContact(false)} settings={settings}/>} {collection&&<CollectionPage close={closeProductCollection} openProduct={openProduct}/>}<ProductPage product={routeProduct} back={backFromProduct}/><Footer onHomeSection={goHomeSection} onAccount={openAccount} onFaq={openFaq} onContact={openContact} settings={settings}/></>}return <><Header storeName={settings.store_name} onMenu={()=>setMenu(true)} onSearch={()=>setSearch(true)} onCart={()=>setCart(true)} onWishlist={()=>setWishlist(true)} onAccount={()=>setAccount(true)} onCollections={()=>setCollection(true)}/>{menu&&<MobileNav close={()=>setMenu(false)} onSearch={()=>setSearch(true)} onCart={()=>setCart(true)} onWishlist={()=>setWishlist(true)} onAccount={()=>setAccount(true)} onCollections={()=>setCollection(true)}/>} {search&&<SearchOverlay close={()=>setSearch(false)} onOpen={openProduct}/>} {cart&&<CartDrawer close={()=>setCart(false)} onCheckout={goToCheckout}/>} {wishlist&&<WishlistDrawer close={()=>setWishlist(false)} onOpen={openProduct}/>} {account&&<Account close={()=>setAccount(false)} onCheckout={goToCheckout}/>} {faq&&<FaqPanel close={()=>setFaq(false)} settings={settings}/>} {contact&&<ContactPanel close={()=>setContact(false)} settings={settings}/>} {collection&&<CollectionPage close={()=>setCollection(false)} openProduct={openProduct}/>}<main><Hero/><Featured openProduct={openProduct} onCollections={()=>setCollection(true)}/><NewArrivals openProduct={openProduct}/><Campaign01 onDiscover={()=>setCollection(true)}/><Story/><Editorial/><Journal/><Newsletter/></main><Footer onAccount={openAccount} onFaq={openFaq} onContact={openContact} settings={settings}/></>}
void ProductModal;

export default function App(){return <AppErrorBoundary><StoreProvider><CatalogProvider><AppInner/></CatalogProvider></StoreProvider></AppErrorBoundary>}

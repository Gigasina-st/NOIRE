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
    if(this.state.hasError)return <main className="app-error"><p className="eyebrow">NOIRÉ / SYSTEM</p><h1>Something<br/><em>shifted.</em></h1><p>We hit an unexpected moment. Your saved bag remains on this device.</p><button className="button" onClick={()=>window.location.reload()}>Reload NOIRÉ <ArrowUpRight size={15}/></button></main>;
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
  return <main className="not-found"><p className="eyebrow">NOIRÉ / 404</p><h1>Not<br/><em>found.</em></h1><p>The page you requested does not exist or has moved.</p><a className="button" href="/">Return home <ArrowUpRight size={15}/></a></main>
}
function productSlug(product:Product){return product.name.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function goToCheckout(){
  window.history.pushState({checkout:true},'',`/checkout`);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
function goToProduct(product:Product){
  const slug=productSlug(product);
  window.history.pushState({productSlug:slug},'',`/product/${slug}`);
  window.dispatchEvent(new PopStateEvent('popstate'));
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
function Header({onMenu,onSearch,onCart,onWishlist,onCollections,onAccount}:{onMenu:()=>void;onSearch:()=>void;onCart:()=>void;onWishlist:()=>void;onCollections:()=>void;onAccount:()=>void}){const [scrolled,setScrolled]=useState(false);const pathname=useRoutePath();const productHeader=pathname.startsWith('/product/');const {cartCount,wishlist}=useStore();useEffect(()=>{const f=()=>setScrolled(scrollY>30);addEventListener('scroll',f,{passive:true});f();return()=>removeEventListener('scroll',f)},[]);return <header className={'site-header '+(scrolled?'is-scrolled ':'')+(productHeader?'product-header':'')}><a className="wordmark" href="#top">NOIRÉ</a><nav className="desktop-nav">{nav.map(x=>x==='Collections'?<button key={x} onClick={onCollections}>{x}</button>:<a key={x} href={'#'+x.toLowerCase()}>{x}</a>)}</nav><div className="header-actions"><button onClick={onSearch} aria-label="Search"><Search size={16}/></button><button onClick={onWishlist} aria-label="Wishlist"><Heart size={16}/>{wishlist.length>0&&<span>{wishlist.length}</span>}</button><button onClick={onAccount} aria-label="Account"><UserRound size={16}/></button><button onClick={onCart} className="cart-button" aria-label="Cart"><ShoppingBag size={16}/><span>{cartCount}</span></button></div><button className="mobile-menu" type="button" onClick={onMenu} aria-label="Open menu"><Menu size={21}/></button></header>}

function MobileNav({close,onSearch,onCart,onWishlist,onCollections,onAccount,onHomeSection}:{close:()=>void;onSearch:()=>void;onCart:()=>void;onWishlist:()=>void;onCollections:()=>void;onAccount:()=>void;onHomeSection?:((section:string)=>void)}){useLock(true);useEscape(close);return <div className="mobile-overlay"><div className="mobile-top"><span className="wordmark">NOIRÉ</span><button onClick={close}><X size={23}/></button></div><nav>{nav.map((x,i)=>{if(x==='Collections')return <button className="mobile-nav-link" key={x} onClick={()=>{close();onCollections()}}><span>0{i+1}</span>{x}<ArrowUpRight size={18}/></button>;if(onHomeSection)return <button className="mobile-nav-link" key={x} onClick={()=>{close();onHomeSection(x.toLowerCase())}}><span>0{i+1}</span>{x}<ArrowUpRight size={18}/></button>;return <a className="mobile-nav-link" key={x} href={'#'+x.toLowerCase()} onClick={close}><span>0{i+1}</span>{x}<ArrowUpRight size={18}/></a>})}</nav><div className="mobile-tools"><button onClick={()=>{close();onSearch()}}><Search size={15}/> Search</button><button onClick={()=>{close();onWishlist()}}><Heart size={15}/> Wishlist</button><button onClick={()=>{close();onCart()}}><ShoppingBag size={15}/> Bag</button><button onClick={()=>{close();onAccount()}}><UserRound size={15}/> Account</button></div><p>Paris · London · Everywhere</p></div>}

function Hero(){return <section className="hero" id="top"><div className="hero-media"><img src="/images/noire-hero.jpg" alt="NOIRÉ editorial fashion campaign" loading="eager" fetchPriority="high" decoding="async"/></div><div className="hero-shade"/><div className="hero-content"><p className="eyebrow light reveal">AUTUMN / WINTER 2026</p><h1 className="reveal delay-1">Quietly<br/><em>Unforgettable.</em></h1><p className="hero-copy reveal delay-2">A study in silhouette, texture and the spaces between. Designed in Paris, made for everywhere.</p><div className="hero-actions reveal delay-3"><a className="button button-light" href="#shop">Shop Collection <ArrowUpRight size={15}/></a><a className="text-link light" href="#story">Explore <ArrowDown size={14}/></a></div></div><div className="hero-meta"><span>01</span><i/><span>04</span></div><a className="scroll-cue" href="#collections"><i/> Scroll to discover</a></section>}

function SectionHeading({index,eyebrow,title,italic,action,onAction}:{index:string;eyebrow:string;title:string;italic:string;action?:string;onAction?:()=>void}){return <div className="section-head"><div><p className="eyebrow">{index} / {eyebrow}</p><h2>{title}<br/><em>{italic}</em></h2></div>{action&&(onAction?<button className="text-link" onClick={onAction}>{action} <ArrowUpRight size={14}/></button>:<a className="text-link" href="#shop">{action} <ArrowUpRight size={14}/></a>)}</div>}

function Campaign01({onDiscover}:{onDiscover:()=>void}){
  const products=useProducts();
  const heroProduct=products[0];
  const campaignProduct=products[1]||products[0];
  return <section className="campaign-01" aria-label="NOIRÉ Campaign 01">
    <div className="campaign-intro">
      <div className="campaign-index"><span>NOIRÉ</span><i/><span>CAMPAIGN 01</span></div>
      <div className="campaign-intro-copy">
        <p className="eyebrow light">A VISUAL STUDY / 2026</p>
        <h2>Form<br/><em>after dark.</em></h2>
        <p>Silhouette, shadow and the quiet confidence of pieces made to be lived in.</p>
      </div>
      <span className="campaign-scroll">Scroll to enter</span>
    </div>
    <div className="campaign-frame campaign-frame-main">
      <img src="/images/noire-editorial.jpg" alt="NOIRÉ Campaign 01 editorial" loading="lazy" decoding="async"/>
      <div className="campaign-frame-overlay"/>
      <div className="campaign-frame-copy">
        <span>LOOK 01 / 04</span>
        <strong>The New Uniform</strong>
      </div>
    </div>
    <div className="campaign-split">
      <div className="campaign-frame campaign-frame-tall">
        <img src="/images/noire-story.jpg" alt="NOIRÉ Campaign 01 portrait" loading="lazy" decoding="async"/>
        <div className="campaign-frame-copy"><span>LOOK 02 / 04</span><strong>Quiet Structure</strong></div>
      </div>
      <div className="campaign-manifesto">
        <p className="eyebrow">NOIRÉ / CAMPAIGN 01</p>
        <h3>Less noise.<br/><em>More presence.</em></h3>
        <p>Designed with restraint. Cut with intention. A collection that does not need to announce itself.</p>
        <button className="text-link" onClick={onDiscover}>Discover the collection <ArrowUpRight size={14}/></button>
      </div>
    </div>
    <div className="campaign-frame campaign-frame-wide">
      <img src={heroProduct?.image||"/images/noire-hero.jpg"} alt={heroProduct?.alt||"NOIRÉ signature piece"} loading="lazy" decoding="async"/>
      <div className="campaign-frame-overlay"/>
      <div className="campaign-product-lockup">
        <span>CAMPAIGN 01 / SIGNATURE PIECE</span>
        <strong>{campaignProduct?.name||"NOIRÉ"}</strong>
        <b>{campaignProduct?.price||""}</b>
      </div>
    </div>
    <div className="campaign-end">
      <p className="eyebrow">END OF CAMPAIGN 01</p>
      <h3>Quietly<br/><em>unforgettable.</em></h3>
      <button className="button" onClick={onDiscover}>Enter the collection <ArrowUpRight size={15}/></button>
    </div>
  </section>
}

function Featured({openProduct,onCollections}:{openProduct:(p:Product)=>void;onCollections:()=>void}){const products=useProducts();return <section className="section featured" id="collections"><SectionHeading index="01" eyebrow="COLLECTION" title="The art of" italic="restraint." action="View collection" onAction={onCollections}/><div className="feature-grid"><article className="image-card feature-main" onClick={()=>openProduct(products[0])}><img src="/images/noire-story.jpg" alt="NOIRÉ campaign portrait" loading="lazy" decoding="async"/><div className="image-caption"><span>Look 01</span><strong>The New Uniform</strong><ArrowUpRight size={17}/></div></article><article className="image-card feature-side" onClick={()=>openProduct(products[0])}><img src="/images/noire-editorial.jpg" alt="Sculpted wool coat editorial" loading="lazy" decoding="async"/><div className="image-caption"><span>Look 04</span><strong>Architectural Wool</strong><ArrowUpRight size={17}/></div></article></div></section>}

function ProductCard({product,onOpen}:{product:Product;onOpen:(p:Product)=>void}){const {addToCart,toggleWishlist,isWishlist}=useStore();const liked=isWishlist(product.id);return <article className="product-card"><div className="product-image" onClick={()=>onOpen(product)}><img src={product.image} alt={product.alt} loading="lazy" decoding="async"/><button className={'wish '+(liked?'active':'')} onClick={e=>{e.stopPropagation();toggleWishlist(product.id)}} aria-label="Wishlist"><Heart size={17} fill={liked?'currentColor':'none'}/></button><button className="quick-add" onClick={e=>{e.stopPropagation();addToCart(product)}}>Quick add <ArrowUpRight size={14}/></button></div><div className="product-info" onClick={()=>onOpen(product)}><div><h3>{product.name}</h3><p>{product.category}</p></div><strong>{product.price}</strong></div></article>}

function NewArrivals({openProduct}:{openProduct:(p:Product)=>void}){const products=useProducts();const {loading,error}=useCatalog();const [filter,setFilter]=useState('All');const cats=['All',...new Set(products.map(p=>p.category))];const visible=filter==='All'?products:products.filter(p=>p.category===filter);return <section className="section arrivals" id="shop"><SectionHeading index="02" eyebrow="NEW ARRIVALS" title="Now," italic="in focus."/><p className="section-note">Six considered pieces from the latest NOIRÉ collection.</p>{(loading||error)&&<p className="catalog-status" aria-live="polite">{loading?'Synchronising the collection…':error}</p>}<div className="filter-bar">{cats.map(c=><button className={filter===c?'active':''} key={c} onClick={()=>setFilter(c)}>{c}</button>)}</div><div className="product-grid">{visible.map(p=><ProductCard key={p.id} product={p} onOpen={openProduct}/>)}</div></section>}

function Story(){return <section className="story" id="about"><div className="story-image"><img src="/images/noire-story.jpg" alt="NOIRÉ atelier detail" loading="lazy" decoding="async"/></div><div className="story-copy" id="story"><p className="eyebrow">03 / THE HOUSE</p><h2>Made with<br/><em>intention.</em></h2><p>NOIRÉ is a modern house built around the belief that luxury begins with what we leave out. Every silhouette is reduced to its essential line, every material chosen for how it lives over time.</p><a className="text-link" href="#journal">Discover our story <ArrowUpRight size={14}/></a></div></section>}

function Editorial(){return <section className="editorial" id="journal"><img src="/images/noire-editorial.jpg" alt="NOIRÉ autumn editorial campaign" loading="lazy" decoding="async"/><div className="editorial-content"><p className="eyebrow light">THE AUTUMN EDIT / 2026</p><h2>After<br/><em>dark.</em></h2><a className="button button-light" href="#journal-story">Enter the journal <ArrowUpRight size={15}/></a></div></section>}

function Journal(){return <section className="journal-story" id="journal-story"><div><p className="eyebrow">04 / JOURNAL</p><h2>Objects of<br/><em>quiet power.</em></h2></div><div className="journal-copy"><p>Three ways of looking at the new collection: the discipline of tailoring, the intimacy of leather and the nocturnal palette that defines Autumn / Winter 2026.</p><div className="journal-list"><article><span>01</span><strong>The New Uniform</strong><small>On proportion and everyday ritual</small></article><article><span>02</span><strong>Inside the Atelier</strong><small>Material, hand and restraint</small></article><article><span>03</span><strong>After Dark</strong><small>A visual study in shadow</small></article></div></div></section>}

function Newsletter(){const [sent,setSent]=useState(false);return <section className="newsletter"><div><p className="eyebrow">PRIVATE VIEW</p><h2>Be the first<br/><em>to know.</em></h2></div><form onSubmit={e=>{e.preventDefault();setSent(true)}}><p>Receive considered notes from NOIRÉ — new collections, journal stories and private previews.</p><div className="email-row"><input required type="email" placeholder="Your email address"/><button type="submit">{sent?<Check size={17}/>:<ArrowUpRight size={18}/>}</button></div><small>{sent?'Thank you. You are on the list.':'By subscribing, you agree to receive NOIRÉ correspondence.'}</small></form></section>}

function Footer(){return <footer><div className="footer-top"><a className="wordmark" href="#top">NOIRÉ</a><p>A modern house for<br/>quietly remarkable things.</p><div className="footer-links"><div><span>SHOP</span><a href="#shop">New arrivals</a><a href="#collections">Collections</a><a href="#shop">Accessories</a></div><div><span>HOUSE</span><a href="#about">Our story</a><a href="#journal">Journal</a><a href="#about">Stockists</a></div><div><span>CARE</span><a href="#top">Shipping & returns</a><a href="#top">Contact</a><a href="#top">FAQ</a></div></div></div><div className="footer-bottom"><span>© 2026 NOIRÉ PARIS</span><div><a href="#top">Instagram</a><a href="#top">Pinterest</a><a href="#top">Legal</a></div><span>Made with intention.</span></div></footer>}

function CollectionPage({close,openProduct}:{close:()=>void;openProduct:(p:Product)=>void}){const products=useProducts();const [filter,setFilter]=useState('All');const [sort,setSort]=useState('featured');const cats=['All',...new Set(products.map(p=>p.category))];const visible=useMemo(()=>[...products.filter(p=>filter==='All'||p.category===filter)].sort((a,b)=>sort==='featured'?products.indexOf(a)-products.indexOf(b):sort==='price-low'?parseInt(a.price.replace(/\D/g,''))-parseInt(b.price.replace(/\D/g,'')):sort==='price-high'?parseInt(b.price.replace(/\D/g,''))-parseInt(a.price.replace(/\D/g,'')):a.name.localeCompare(b.name)),[filter,sort]);useLock(true);useEscape(close);return <div className="collection-page"><header className="collection-header"><button className="collection-close" onClick={close}><X size={19}/> Close</button><p className="eyebrow">NOIRÉ / AUTUMN WINTER 2026</p><h1>The<br/><em>Collection.</em></h1><p className="collection-intro">A complete study in proportion, texture and modern tailoring. Six pieces, considered without excess.</p></header><div className="collection-toolbar"><div className="collection-filters">{cats.map(c=><button className={filter===c?'active':''} key={c} onClick={()=>setFilter(c)}>{c}</button>)}</div><select value={sort} onChange={e=>setSort(e.target.value)} aria-label="Sort collection"><option value="featured">Featured</option><option value="price-low">Price: Low to high</option><option value="price-high">Price: High to low</option></select></div><div className="collection-grid">{visible.map((p,i)=><div className={'collection-product c-product-'+(i%4)} key={p.id}><ProductCard product={p} onOpen={openProduct}/></div>)}</div><div className="collection-foot"><span>{visible.length} pieces</span><span>Designed in Paris · Made for everywhere</span></div></div>}

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
      <button className="collection-close" onClick={back}><ArrowLeft size={17}/> Back to collection</button>
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
        <div className="selector"><div><span>Colour</span><b>{color}</b></div><div className="swatches">{availableColors.map(name=>{const hex=colors.find(([n])=>n===name)?.[1]||'#b8b3aa';return <button key={name} className={color===name?'selected':''} onClick={()=>setColor(name)} aria-label={name}><i style={{background:hex}}/></button>})}</div></div>
        <div className="selector"><div><span>Size</span><b>{size}</b></div><div className="sizes">{availableSizes.map(s=><button key={s} className={size===s?'selected':''} onClick={()=>setSize(s)}>{s}</button>)}</div></div>
        <button disabled={soldOut} className={'button modal-add '+(added?'added':'')} onClick={()=>{addToCart(product,{size,color});setAdded(true)}}>{soldOut?'Unavailable':added?<><Check size={15}/> Added to bag</>:<>Add to bag <ArrowUpRight size={15}/></>}</button>
        <button className="details-toggle" onClick={()=>setDetails(!details)}>Product details <ChevronDown size={15} className={details?'open':''}/></button>
        {details&&<div className="product-details">{product.details.map(d=><p key={d}><span>—</span>{d}</p>)}</div>}
        <div className="product-page-note"><span>NOIRÉ SERVICE</span><p>Complimentary delivery on orders over €500. Each piece is prepared with care before leaving the atelier.</p></div>
      </section>
    </div>
  </main>
}
function ProductModal({product,close}:{product:Product;close:()=>void}){const {addToCart,toggleWishlist,isWishlist}=useStore();const availableSizes=product.sizes?.length?product.sizes:sizes;const availableColors=product.colors?.length?product.colors:colors.map(c=>c[0]);const [size,setSize]=useState(availableSizes.includes('M')?'M':availableSizes[0]);const [color,setColor]=useState(availableColors.includes('Noir')?'Noir':availableColors[0]);const [added,setAdded]=useState(false);const [details,setDetails]=useState(true);const liked=isWishlist(product.id);const soldOut=product.stock!==undefined&&product.stock<=0;useLock(true);useEscape(close);return <div className="product-modal-layer"><button className="product-modal-backdrop" onClick={close} aria-label="Close product"/><article className="product-modal" role="dialog" aria-modal="true" aria-labelledby="product-modal-title"><button className="modal-close" onClick={close} aria-label="Close product"><X size={22}/></button><ProductGallery product={product} activeColor={color}/><div className="modal-info"><p className="eyebrow">{product.category}</p><div className="modal-title-row"><h2 id="product-modal-title">{product.name}</h2><button className={'modal-wish '+(liked?'active':'')} onClick={()=>toggleWishlist(product.id)} aria-label="Save product"><Heart size={19} fill={liked?'currentColor':'none'}/></button></div><strong className="modal-price">{product.price}</strong><p className="modal-description">{product.description}</p>{product.stock!==undefined&&<p className="stock-note">{soldOut?'Currently unavailable':product.stock<5?`Only ${product.stock} left in the atelier`:'In stock'}</p>}<div className="selector"><div><span>Colour</span><b>{color}</b></div><div className="swatches">{availableColors.map(name=>{const hex=colors.find(([n])=>n===name)?.[1]||'#b8b3aa';return <button key={name} className={color===name?'selected':''} onClick={()=>setColor(name)} aria-label={name}><i style={{background:hex}}/></button>})}</div></div><div className="selector"><div><span>Size</span><b>{size}</b></div><div className="sizes">{availableSizes.map(s=><button key={s} className={size===s?'selected':''} onClick={()=>setSize(s)}>{s}</button>)}</div></div><button disabled={soldOut} className={'button modal-add '+(added?'added':'')} onClick={()=>{addToCart(product,{size,color});setAdded(true)}}>{soldOut?'Unavailable':added?<><Check size={15}/> Added to bag</>:<>Add to bag <ArrowUpRight size={15}/></>}</button><button className="details-toggle" onClick={()=>setDetails(!details)}>Product details <ChevronDown size={15} className={details?'open':''}/></button>{details&&<div className="product-details">{product.details.map(d=><p key={d}><span>—</span>{d}</p>)}</div>}</div></article></div>}

function SearchOverlay({close,onOpen}:{close:()=>void;onOpen:(p:Product)=>void}){const products=useProducts();const [q,setQ]=useState('');const results=products.filter(p=>(p.name+' '+p.category+' '+p.description+' '+p.details.join(' ')).toLowerCase().includes(q.toLowerCase())).slice(0,6);useLock(true);useEffect(()=>{const f=(e:KeyboardEvent)=>e.key==='Escape'&&close();addEventListener('keydown',f);return()=>removeEventListener('keydown',f)},[close]);return <div className="search-overlay"><div className="search-inner"><div className="search-top"><span className="eyebrow">SEARCH NOIRÉ</span><button onClick={close}><X size={22}/></button></div><div className="search-input"><Search size={19}/><input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Search pieces, categories..."/></div><div className="search-results">{q&&results.map(p=><button className="search-result" onClick={()=>{close();onOpen(p)}} key={p.id}><img src={p.image} alt="" loading="lazy" decoding="async"/><span><strong>{p.name}</strong><small>{p.category} · {p.price}</small></span><ArrowUpRight size={16}/></button>)}{q&&!results.length&&<p>No pieces found. Try another search.</p>}</div></div></div>}

function CartDrawer({close,onCheckout}:{close:()=>void;onCheckout:()=>void}){const {cart,removeFromCart,changeQuantity,subtotal}=useStore();useEscape(close);const pieces=cart.reduce((s,x)=>s+x.quantity,0);useLock(true);return <div className="cart-layer"><button className="cart-backdrop" onClick={close}/><aside className="cart-drawer"><div className="cart-head"><div><p className="eyebrow">YOUR BAG</p><h2>{cart.length?pieces+' pieces':'Your bag is empty'}</h2></div><button onClick={close}><X size={22}/></button></div>{cart.length?<><div className="cart-items">{cart.map(x=><div className="cart-item" key={x.product.id+'-'+x.variant.size+'-'+x.variant.color}><img src={x.product.image} alt={x.product.alt} loading="lazy" decoding="async"/><div className="cart-item-info"><div><strong>{x.product.name}</strong><small>{x.product.category} · {x.variant.color} · {x.variant.size}</small></div><span>{x.product.price}</span><div className="quantity"><button onClick={()=>changeQuantity(x.product.id,-1,x.variant.size,x.variant.color)}><Minus size={12}/></button><b>{x.quantity}</b><button onClick={()=>changeQuantity(x.product.id,1,x.variant.size,x.variant.color)}><Plus size={12}/></button><button className="remove" onClick={()=>removeFromCart(x.product.id,x.variant.size,x.variant.color)}><Trash2 size={13}/></button></div></div></div>)}</div><div className="cart-foot"><div><span>Subtotal</span><strong>€{subtotal.toLocaleString('en-US')}</strong></div><button type="button" className="button cart-checkout" onClick={onCheckout}>Checkout <ArrowUpRight size={15}/></button><small>Taxes and shipping calculated at checkout.</small></div></>:<div className="empty-cart"><ShoppingBag size={28}/><p>Nothing here yet.</p><a href="#shop" onClick={close} className="text-link">Discover the collection <ArrowUpRight size={14}/></a></div>}</aside></div>}

function WishlistDrawer({close,onOpen}:{close:()=>void;onOpen:(p:Product)=>void}){const products=useProducts();const {wishlist,toggleWishlist}=useStore();useEscape(close);const items=products.filter(p=>wishlist.includes(p.id));useLock(true);return <div className="cart-layer"><button className="cart-backdrop" onClick={close}/><aside className="cart-drawer wishlist-drawer"><div className="cart-head"><div><p className="eyebrow">SAVED PIECES</p><h2>{items.length} {items.length===1?'piece':'pieces'}</h2></div><button onClick={close}><X size={22}/></button></div>{items.length?<div className="wishlist-items">{items.map(p=><div className="wishlist-item" key={p.id} onClick={()=>{close();onOpen(p)}}><img src={p.image} alt={p.alt} loading="lazy" decoding="async"/><div><strong>{p.name}</strong><small>{p.category} · {p.price}</small><button onClick={e=>{e.stopPropagation();toggleWishlist(p.id)}}>Remove</button></div><ArrowUpRight size={15}/></div>)}</div>:<div className="empty-cart"><Heart size={28}/><p>No saved pieces yet.</p><a href="#shop" onClick={close} className="text-link">Explore the collection <ArrowUpRight size={14}/></a></div>}</aside></div>}

function AppInner(){const [menu,setMenu]=useState(false),[search,setSearch]=useState(false),[cart,setCart]=useState(false),[wishlist,setWishlist]=useState(false),[collection,setCollection]=useState(false),[account,setAccount]=useState(false);const pathname=useRoutePath();const productSlugRoute=pathname.match(/^\/product\/([^/]+)\/?$/)?.[1]||null;const products=useProducts();const routeProduct:Product|null=productSlugRoute?(products.find(p=>productSlug(p)===productSlugRoute)??null):null;const isCheckout=pathname==='/checkout';useCanonicalMeta(routeProduct);const openProduct=(p:Product)=>goToProduct(p);const backFromProduct=()=>{window.history.pushState({},'', '/');window.dispatchEvent(new PopStateEvent('popstate'))};const backFromCheckout=()=>{window.history.pushState({},'', '/');window.dispatchEvent(new PopStateEvent('popstate'))};if(isCheckout)return <><Checkout close={backFromCheckout} onAccount={()=>setAccount(true)}/>{account&&<Account close={()=>setAccount(false)} onCheckout={goToCheckout}/>}</>;if(productSlugRoute&&!routeProduct){return products.length?<NotFound/>:<main/>}if(pathname!=='/'&&pathname!==''&&!productSlugRoute){return <NotFound/>}if(productSlugRoute&&routeProduct){const goHomeSection=(section:string)=>{window.history.pushState({},'',`/#${section}`);window.dispatchEvent(new PopStateEvent('popstate'));window.location.hash=section};return <><Header onMenu={()=>setMenu(true)} onSearch={()=>setSearch(true)} onCart={()=>setCart(true)} onWishlist={()=>setWishlist(true)} onAccount={()=>setAccount(true)} onCollections={()=>setCollection(true)}/>{menu&&<MobileNav close={()=>setMenu(false)} onSearch={()=>setSearch(true)} onCart={()=>setCart(true)} onWishlist={()=>setWishlist(true)} onAccount={()=>setAccount(true)} onCollections={()=>setCollection(true)} onHomeSection={goHomeSection}/>} {search&&<SearchOverlay close={()=>setSearch(false)} onOpen={openProduct}/>} {cart&&<CartDrawer close={()=>setCart(false)} onCheckout={goToCheckout}/>} {wishlist&&<WishlistDrawer close={()=>setWishlist(false)} onOpen={openProduct}/>} {account&&<Account close={()=>setAccount(false)} onCheckout={goToCheckout}/>} {collection&&<CollectionPage close={()=>setCollection(false)} openProduct={openProduct}/>}<ProductPage product={routeProduct} back={backFromProduct}/><Footer/></>}return <><Header onMenu={()=>setMenu(true)} onSearch={()=>setSearch(true)} onCart={()=>setCart(true)} onWishlist={()=>setWishlist(true)} onAccount={()=>setAccount(true)} onCollections={()=>setCollection(true)}/>{menu&&<MobileNav close={()=>setMenu(false)} onSearch={()=>setSearch(true)} onCart={()=>setCart(true)} onWishlist={()=>setWishlist(true)} onAccount={()=>setAccount(true)} onCollections={()=>setCollection(true)}/>} {search&&<SearchOverlay close={()=>setSearch(false)} onOpen={openProduct}/>} {cart&&<CartDrawer close={()=>setCart(false)} onCheckout={goToCheckout}/>} {wishlist&&<WishlistDrawer close={()=>setWishlist(false)} onOpen={openProduct}/>} {account&&<Account close={()=>setAccount(false)} onCheckout={goToCheckout}/>} {collection&&<CollectionPage close={()=>setCollection(false)} openProduct={openProduct}/>}<main><Hero/><Featured openProduct={openProduct} onCollections={()=>setCollection(true)}/><NewArrivals openProduct={openProduct}/><Campaign01 onDiscover={()=>setCollection(true)}/><Story/><Editorial/><Journal/><Newsletter/></main><Footer/></>}
void ProductModal;

export default function App(){return <AppErrorBoundary><StoreProvider><CatalogProvider><AppInner/></CatalogProvider></StoreProvider></AppErrorBoundary>}
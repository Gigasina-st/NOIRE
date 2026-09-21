import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUpRight, Heart, Menu, Search, ShoppingBag, X } from 'lucide-react';
import { products } from './data';

const nav = ['Shop','Collections','Journal','About'];

function Header({ onMenu }: { onMenu: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => { const fn=()=>setScrolled(window.scrollY>40); window.addEventListener('scroll',fn,{passive:true}); fn(); return()=>window.removeEventListener('scroll',fn); },[]);
  return <header className={'site-header '+(scrolled?'is-scrolled':'')}>
    <a className="wordmark" href="#top" aria-label="NOIRÉ home">NOIRÉ</a>
    <nav className="desktop-nav">{nav.map(x=><a href={'#'+x.toLowerCase()} key={x}>{x}</a>)}</nav>
    <div className="header-actions">
      <button aria-label="Search"><Search size={16}/></button><button aria-label="Wishlist"><Heart size={16}/></button>
      <button aria-label="Cart" className="cart-button"><ShoppingBag size={16}/><span>0</span></button>
    </div>
    <button className="mobile-menu" onClick={onMenu} aria-label="Open menu"><Menu size={21}/></button>
  </header>
}

function MobileNav({ close }: { close: () => void }) {
  return <div className="mobile-overlay"><div className="mobile-top"><span className="wordmark">NOIRÉ</span><button onClick={close} aria-label="Close menu"><X size={23}/></button></div>
    <nav>{nav.map((x,i)=><a key={x} href={'#'+x.toLowerCase()} onClick={close}><span>0{i+1}</span>{x}<ArrowUpRight size={18}/></a>)}</nav>
    <p>Paris · London · Everywhere</p>
  </div>
}

function Hero() {
  return <section className="hero" id="top">
    <div className="hero-media"><img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=2400&q=90" alt="NOIRÉ editorial fashion campaign"/></div><div className="hero-shade"/>
    <div className="hero-content"><p className="eyebrow light reveal">AUTUMN / WINTER 2026</p><h1 className="reveal delay-1">Quietly<br/><em>Unforgettable.</em></h1><p className="hero-copy reveal delay-2">A study in silhouette, texture and the spaces between. Designed in Paris, made for everywhere.</p>
      <div className="hero-actions reveal delay-3"><a className="button button-light" href="#shop">Shop Collection <ArrowUpRight size={15}/></a><a className="text-link light" href="#story">Explore <ArrowDown size={14}/></a></div>
    </div>
    <div className="hero-meta"><span>01</span><i/><span>04</span></div><a className="scroll-cue" href="#collections"><i/> Scroll to discover</a>
  </section>
}

function SectionHeading({ index, eyebrow, title, italic, action }: {index:string;eyebrow:string;title:string;italic:string;action?:string}) {
  return <div className="section-head"><div><p className="eyebrow">{index} / {eyebrow}</p><h2>{title}<br/><em>{italic}</em></h2></div>{action&&<a className="text-link" href="#shop">{action} <ArrowUpRight size={14}/></a>}</div>
}

function Featured() {
  return <section className="section featured" id="collections"><SectionHeading index="01" eyebrow="COLLECTION" title="The art of" italic="restraint." action="View collection"/>
    <div className="feature-grid"><article className="image-card feature-main"><img src="https://images.unsplash.com/photo-1506629905607-d9a1d6a9b6f3?auto=format&fit=crop&w=1600&q=90" alt="NOIRÉ campaign portrait"/><div className="image-caption"><span>Look 01</span><strong>The New Uniform</strong><ArrowUpRight size={17}/></div></article>
      <article className="image-card feature-side"><img src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1100&q=90" alt="Sculpted wool coat editorial"/><div className="image-caption"><span>Look 04</span><strong>Architectural Wool</strong><ArrowUpRight size={17}/></div></article></div>
  </section>
}

function ProductCard({ product }: { product: typeof products[number] }) {
  const [liked,setLiked]=useState(false); const [added,setAdded]=useState(false);
  return <article className="product-card"><div className="product-image"><img src={product.image} alt={product.alt}/>
    <button className={'wish '+(liked?'active':'')} onClick={()=>setLiked(v=>!v)} aria-label={liked?'Remove from wishlist':'Add to wishlist'}><Heart size={17} fill={liked?'currentColor':'none'}/></button>
    <button className={'quick-add '+(added?'added':'')} onClick={()=>setAdded(v=>!v)}>{added?'Added to bag':'Quick add'} <ArrowUpRight size={14}/></button>
  </div><div className="product-info"><div><h3>{product.name}</h3><p>{product.category}</p></div><strong>{product.price}</strong></div></article>
}

function NewArrivals(){return <section className="section arrivals" id="shop"><SectionHeading index="02" eyebrow="NEW ARRIVALS" title="Now," italic="in focus."/><p className="section-note">Six considered pieces from the latest NOIRÉ collection.</p><div className="product-grid">{products.map(p=><ProductCard key={p.id} product={p}/>)}</div></section>}

function Story(){return <section className="story" id="about"><div className="story-image"><img src="https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=1600&q=90" alt="NOIRÉ atelier detail"/></div><div className="story-copy" id="story"><p className="eyebrow">03 / THE HOUSE</p><h2>Made with<br/><em>intention.</em></h2><p>NOIRÉ is a modern house built around the belief that luxury begins with what we leave out. Every silhouette is reduced to its essential line, every material chosen for how it lives over time.</p><a className="text-link" href="#journal">Discover our story <ArrowUpRight size={14}/></a></div></section>}

function Editorial(){return <section className="editorial" id="journal"><img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=2400&q=90" alt="NOIRÉ autumn editorial campaign"/><div className="editorial-content"><p className="eyebrow light">THE AUTUMN EDIT / 2026</p><h2>After<br/><em>dark.</em></h2><a className="button button-light" href="#shop">Enter the journal <ArrowUpRight size={15}/></a></div></section>}

function Newsletter(){const [sent,setSent]=useState(false);return <section className="newsletter"><div><p className="eyebrow">PRIVATE VIEW</p><h2>Be the first<br/><em>to know.</em></h2></div><form onSubmit={e=>{e.preventDefault();setSent(true)}}><p>Receive considered notes from NOIRÉ — new collections, journal stories and private previews.</p><div className="email-row"><input required type="email" placeholder="Your email address" aria-label="Email address"/><button type="submit" aria-label="Subscribe">{sent?<span>✓</span>:<ArrowUpRight size={18}/>}</button></div><small>{sent?'Thank you. You are on the list.':'By subscribing, you agree to receive NOIRÉ correspondence.'}</small></form></section>}

function Footer(){return <footer><div className="footer-top"><a className="wordmark" href="#top">NOIRÉ</a><p>A modern house for<br/>quietly remarkable things.</p><div className="footer-links"><div><span>SHOP</span><a href="#shop">New arrivals</a><a href="#collections">Collections</a><a href="#shop">Accessories</a></div><div><span>HOUSE</span><a href="#about">Our story</a><a href="#journal">Journal</a><a href="#about">Stockists</a></div><div><span>CARE</span><a href="#top">Shipping & returns</a><a href="#top">Contact</a><a href="#top">FAQ</a></div></div></div><div className="footer-bottom"><span>© 2026 NOIRÉ PARIS</span><div><a href="#top">Instagram</a><a href="#top">Pinterest</a><a href="#top">Legal</a></div><span>Made with intention.</span></div></footer>}

export default function App(){const [menu,setMenu]=useState(false);useEffect(()=>{document.body.style.overflow=menu?'hidden':'';return()=>{document.body.style.overflow=''}},[menu]);return <><Header onMenu={()=>setMenu(true)}/>{menu&&<MobileNav close={()=>setMenu(false)}/>}<main><Hero/><Featured/><NewArrivals/><Story/><Editorial/><Newsletter/></main><Footer/></>}

export type DbProduct = {
  id:string; name:string; slug:string; category:string; price:number; currency:string;
  description:string; details:string[]; image:string; gallery:string[]; colors:string[];
  sizes:string[]; stock:number; featured:boolean; active:boolean; created_at:string; updated_at:string;
};
export type DbOrder = {
  id:string; email:string; status:'pending'|'confirmed'|'processing'|'shipped'|'delivered'|'cancelled';
  subtotal:number; currency:string; created_at:string; updated_at:string;
};

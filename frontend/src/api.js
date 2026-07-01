const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
export function can(perms, code){ return perms?.includes(code); }
export function getSession(){ try{return JSON.parse(localStorage.getItem('droguerie_session')||'null')}catch{return null} }
export function setSession(s){ localStorage.setItem('droguerie_session', JSON.stringify(s)); }
export function clearSession(){ localStorage.removeItem('droguerie_session'); }
export async function api(path, options={}){
  const session = getSession();
  const res = await fetch(API_URL + path, { ...options, headers:{ 'Content-Type':'application/json', ...(session?.token?{Authorization:`Bearer ${session.token}`}:{ }), ...(options.headers||{}) }});
  const data = await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.error || 'Erreur API');
  return data;
}
export const fmt = n => (Number(n)||0).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2});
export const dh = n => fmt(n)+' DH';

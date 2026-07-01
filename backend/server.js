require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const DB_FILE = process.env.DB_FILE || './data/droguerie.db';
fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
const db = new sqlite3.Database(DB_FILE);
db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'), (err) => {
  if (err) console.error(err);
  db.run("UPDATE users SET password_hash=? WHERE username='admin' AND password_hash='__ADMIN_HASH__'", [bcrypt.hashSync('admin123', 10)]);
});

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
const run = (sql, params=[]) => new Promise((res, rej)=>db.run(sql, params, function(e){e?rej(e):res(this)}));
const get = (sql, params=[]) => new Promise((res, rej)=>db.get(sql, params, (e,row)=>e?rej(e):res(row)));
const all = (sql, params=[]) => new Promise((res, rej)=>db.all(sql, params, (e,rows)=>e?rej(e):res(rows)));
const json = (v, fallback=[]) => { try { return JSON.parse(v || JSON.stringify(fallback)); } catch { return fallback; } };

async function userPerms(userId){
  return (await all(`SELECT p.code FROM users u JOIN role_permissions rp ON rp.role_id=u.role_id JOIN permissions p ON p.id=rp.permission_id WHERE u.id=?`, [userId])).map(x=>x.code);
}
async function auth(req,res,next){
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if(!token) return res.status(401).json({error:'Non authentifié'});
  try { const payload = jwt.verify(token, JWT_SECRET); const u = await get(`SELECT u.id,u.username,u.full_name,u.role_id,r.name role FROM users u JOIN roles r ON r.id=u.role_id WHERE u.id=? AND active=1`, [payload.id]); if(!u) throw new Error('bad user'); req.user=u; req.perms=await userPerms(u.id); next(); }
  catch { res.status(401).json({error:'Session expirée'}); }
}
const need = (perm) => (req,res,next)=> req.perms?.includes(perm) ? next() : res.status(403).json({error:`Permission manquante: ${perm}`});

app.get('/api/health', (req,res)=>res.json({ok:true}));
app.post('/api/auth/login', async (req,res)=>{
  const { username, password } = req.body;
  const u = await get(`SELECT u.*, r.name role FROM users u JOIN roles r ON r.id=u.role_id WHERE username=? AND active=1`, [username]);
  if(!u || !(await bcrypt.compare(password || '', u.password_hash))) return res.status(401).json({error:'Identifiant ou mot de passe incorrect'});
  const token = jwt.sign({id:u.id}, JWT_SECRET, {expiresIn:'12h'});
  const perms = await userPerms(u.id);
  res.json({token, user:{id:u.id, username:u.username, full_name:u.full_name, role:u.role}, perms});
});
app.get('/api/me', auth, (req,res)=>res.json({user:req.user, perms:req.perms}));

app.get('/api/roles', auth, need('users.read'), async (req,res)=>res.json(await all('SELECT * FROM roles ORDER BY id')));
app.get('/api/users', auth, need('users.read'), async (req,res)=>res.json(await all(`SELECT u.id,u.username,u.full_name,u.active,u.created_at,r.name role FROM users u JOIN roles r ON r.id=u.role_id ORDER BY u.id`)));
app.post('/api/users', auth, need('users.write'), async (req,res)=>{ const {username,password,full_name,role_id}=req.body; const hash=await bcrypt.hash(password||'changeme',10); const r=await run(`INSERT INTO users(username,password_hash,full_name,role_id) VALUES(?,?,?,?)`,[username,hash,full_name,role_id]); res.json({id:r.lastID}); });

function mapProduct(p){return {id:p.id,ref:p.ref,nom:p.name,categorie:p.category,unite:p.unit,prixAchat:p.purchase_price,prixVente:p.sale_price,quantite:p.quantity,stockMin:p.min_stock,fournisseurId:p.supplier_id};}
app.get('/api/products', auth, need('products.read'), async (req,res)=>res.json((await all('SELECT * FROM products ORDER BY name')).map(mapProduct)));
app.post('/api/products', auth, need('products.write'), async (req,res)=>{const p=req.body; const r=await run(`INSERT INTO products(ref,name,category,unit,purchase_price,sale_price,quantity,min_stock,supplier_id) VALUES(?,?,?,?,?,?,?,?,?)`,[p.ref,p.nom,p.categorie,p.unite,p.prixAchat||0,p.prixVente||0,p.quantite||0,p.stockMin||0,p.fournisseurId||null]); res.json({id:r.lastID});});
app.put('/api/products/:id', auth, need('products.write'), async (req,res)=>{const p=req.body; await run(`UPDATE products SET ref=?,name=?,category=?,unit=?,purchase_price=?,sale_price=?,quantity=?,min_stock=?,supplier_id=? WHERE id=?`,[p.ref,p.nom,p.categorie,p.unite,p.prixAchat||0,p.prixVente||0,p.quantite||0,p.stockMin||0,p.fournisseurId||null,req.params.id]); res.json({ok:true});});
app.delete('/api/products/:id', auth, need('products.delete'), async (req,res)=>{await run('DELETE FROM products WHERE id=?',[req.params.id]);res.json({ok:true});});

const crud = (name, table, readPerm, writePerm) => {
  app.get(`/api/${name}`, auth, need(readPerm), async (req,res)=>res.json(await all(`SELECT * FROM ${table} ORDER BY name`)));
  app.post(`/api/${name}`, auth, need(writePerm), async (req,res)=>{ const x=req.body; const cols=table==='clients'?['name','type','ice','phone','city','address']:['name','ice','phone','city','contact','address']; const vals=cols.map(c=>x[c]??x[{name:'nom',phone:'tel',city:'ville',address:'adresse'}[c]]??''); const r=await run(`INSERT INTO ${table}(${cols.join(',')}) VALUES(${cols.map(()=>'?').join(',')})`,vals); res.json({id:r.lastID}); });
};
crud('clients','clients','clients.read','clients.write'); crud('suppliers','suppliers','suppliers.read','suppliers.write');

async function nextNumber(prefix){ const row=await get('SELECT value FROM counters WHERE name=?',[prefix]); const n=row?.value||1; await run('INSERT INTO counters(name,value) VALUES(?,?) ON CONFLICT(name) DO UPDATE SET value=value+1',[prefix,n+1]); return `${prefix}-${new Date().getFullYear()}-${String(n).padStart(4,'0')}`; }
function totals(lines, vat=20, ttcPrices=true){ const base=lines.reduce((s,l)=>s+(+l.prixUnit||0)*(+l.qte||0),0); if(ttcPrices){const totalTTC=base,totalHT=base/(1+vat/100); return {totalHT,totalTTC,vat:totalTTC-totalHT};} const totalHT=base; return {totalHT,vat:base*vat/100,totalTTC:base*(1+vat/100)}; }
async function updateStock(lines, sign){ for(const l of lines) await run('UPDATE products SET quantity=quantity+? WHERE id=?',[(+l.qte||0)*sign,l.produitId]); }
app.get('/api/dashboard', auth, need('dashboard.read'), async (req,res)=>{ const products=await all('SELECT * FROM products'); const sales=await all(`SELECT * FROM sales WHERE stage='facture'`); const stockValue=products.reduce((a,p)=>a+p.quantity*p.purchase_price,0); const ca=sales.reduce((a,s)=>a+s.total_ttc,0); res.json({products:products.length, lowStock:products.filter(p=>p.quantity<=p.min_stock).length, stockValue, ca}); });
app.get('/api/sales', auth, need('sales.read'), async (req,res)=>res.json((await all('SELECT * FROM sales ORDER BY id DESC')).map(s=>({...s,numeros:json(s.numbers_json,{}),lignes:json(s.lines_json,[]),paiements:json(s.payments_json,[])}))));
app.post('/api/sales', auth, need('sales.write'), async (req,res)=>{ const b=req.body, start=b.start||'devis', prefix=start==='facture'?'FAC':'DEV', numbers={[start==='facture'?'facture':'devis']:await nextNumber(prefix)}, t=totals(b.lignes||[],b.tauxTva||20,true); if(start==='facture') await updateStock(b.lignes||[],-1); const r=await run(`INSERT INTO sales(date,client_id,client_name,stage,numbers_json,lines_json,vat_rate,total_ht,vat,total_ttc,delivered,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`,[b.date,b.clientId,b.clientNom,start,JSON.stringify(numbers),JSON.stringify(b.lignes||[]),b.tauxTva||20,t.totalHT,t.vat,t.totalTTC,start==='facture'?1:0,req.user.id]); res.json({id:r.lastID,numbers}); });
app.post('/api/sales/:id/advance', auth, need('sales.write'), async (req,res)=>{ const doc=await get('SELECT * FROM sales WHERE id=?',[req.params.id]); const stages=['devis','commande','livraison','facture']; const next=stages[stages.indexOf(doc.stage)+1]; if(!next) return res.json({ok:true}); const prefixes={commande:'BC',livraison:'BL',facture:'FAC'}, keys={commande:'commande',livraison:'bl',facture:'facture'}; const nums={...json(doc.numbers_json,{}),[keys[next]]:await nextNumber(prefixes[next])}; if(next==='livraison'&&!doc.delivered) await updateStock(json(doc.lines_json,[]),-1); await run('UPDATE sales SET stage=?, numbers_json=?, delivered=? WHERE id=?',[next,JSON.stringify(nums),next==='livraison'?1:doc.delivered,req.params.id]); res.json({ok:true,numbers:nums,stage:next}); });
app.post('/api/sales/:id/pay', auth, need('sales.write'), async (req,res)=>{ const doc=await get('SELECT payments_json FROM sales WHERE id=?',[req.params.id]); const p=json(doc.payments_json,[]); p.push(req.body); await run('UPDATE sales SET payments_json=? WHERE id=?',[JSON.stringify(p),req.params.id]); res.json({ok:true}); });

app.get('/api/purchases', auth, need('purchases.read'), async (req,res)=>res.json((await all('SELECT * FROM purchases ORDER BY id DESC')).map(s=>({...s,numeros:json(s.numbers_json,{}),lignes:json(s.lines_json,[]),paiements:json(s.payments_json,[])}))));
app.post('/api/purchases', auth, need('purchases.write'), async (req,res)=>{ const b=req.body, start=b.start||'commande', prefix=start==='reception'?'BR':'CF', numbers={[start==='reception'?'reception':'commande']:await nextNumber(prefix)}, t=totals(b.lignes||[],b.tauxTva||20,false); if(start==='reception') await updateStock(b.lignes||[],1); const r=await run(`INSERT INTO purchases(date,supplier_id,supplier_name,stage,numbers_json,lines_json,vat_rate,total_ht,vat,total_ttc,received,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`,[b.date,b.fournisseurId,b.fournisseurNom,start,JSON.stringify(numbers),JSON.stringify(b.lignes||[]),b.tauxTva||20,t.totalHT,t.vat,t.totalTTC,start==='reception'?1:0,req.user.id]); res.json({id:r.lastID,numbers}); });
app.post('/api/purchases/:id/advance', auth, need('purchases.write'), async (req,res)=>{ const doc=await get('SELECT * FROM purchases WHERE id=?',[req.params.id]); const stages=['commande','reception','facture']; const next=stages[stages.indexOf(doc.stage)+1]; if(!next) return res.json({ok:true}); const prefixes={reception:'BR',facture:'FF'}, keys={reception:'reception',facture:'facture'}; const nums={...json(doc.numbers_json,{}),[keys[next]]:await nextNumber(prefixes[next])}; if(next==='reception'&&!doc.received) await updateStock(json(doc.lines_json,[]),1); await run('UPDATE purchases SET stage=?, numbers_json=?, received=? WHERE id=?',[next,JSON.stringify(nums),next==='reception'?1:doc.received,req.params.id]); res.json({ok:true,numbers:nums,stage:next}); });
app.post('/api/purchases/:id/pay', auth, need('purchases.write'), async (req,res)=>{ const doc=await get('SELECT payments_json FROM purchases WHERE id=?',[req.params.id]); const p=json(doc.payments_json,[]); p.push(req.body); await run('UPDATE purchases SET payments_json=? WHERE id=?',[JSON.stringify(p),req.params.id]); res.json({ok:true}); });

app.use((err,req,res,next)=>{ console.error(err); res.status(500).json({error:err.message}); });
app.listen(PORT,()=>console.log(`DrogueriePro API http://localhost:${PORT}`));

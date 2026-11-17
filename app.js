const KEY='skoneBillingV1';
const defaults={customers:[{id:crypto.randomUUID(),name:'Walk-in Customer',phone:'',gstin:'',address:''}],items:[{id:crypto.randomUUID(),name:'Computer / Laptop Repair',rate:750,tax:18},{id:crypto.randomUUID(),name:'Remote Technical Support',rate:500,tax:18},{id:crypto.randomUUID(),name:'Windows Installation',rate:800,tax:18}],invoices:[]};
let state=structuredClone(defaults);
let storageKey=KEY;
let draft={lines:[]};
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const money=n=>'₹'+Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
const save=()=>{localStorage.setItem(storageKey,JSON.stringify(state));window.billingBackend?.saveState(state).catch(error=>toast(`Cloud sync failed: ${error.message}`))};
const toast=t=>{const el=$('#toast');el.textContent=t;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2200)};
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
function showView(id){$$('.view').forEach(v=>v.classList.toggle('active',v.id===id));$$('.nav-item').forEach(v=>v.classList.toggle('active',v.dataset.view===id));const company=window.billingBackend?.company?.name||'Your company';const titles={dashboard:['OVERVIEW',company],invoice:['CREATE','New invoice'],invoices:['RECORDS','Invoices'],customers:['DIRECTORY','Customers'],items:['CATALOGUE','Items & services']};$('#eyebrow').textContent=titles[id][0];$('#pageTitle').textContent=titles[id][1];$('.sidebar').classList.remove('open');if(id==='invoice')initInvoice();if(id==='invoices')renderInvoices();if(id==='customers')renderCustomers();if(id==='items')renderItems();}
$$('.nav-item').forEach(b=>b.onclick=()=>showView(b.dataset.view));$$('[data-open-invoice]').forEach(b=>b.onclick=()=>showView('invoice'));$$('[data-view-link]').forEach(b=>b.onclick=()=>showView(b.dataset.viewLink));$('#menuBtn').onclick=()=>$('.sidebar').classList.toggle('open');
$('#today').textContent=new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
function invoiceNumber(){return `SK-${new Date().getFullYear()}-${String(state.invoices.length+1).padStart(4,'0')}`}
function initInvoice(){if(draft.lines.length)return;$('#invoiceNo').value=invoiceNumber();$('#invoiceDate').value=new Date().toISOString().slice(0,10);$('#invoiceCustomer').innerHTML=state.customers.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('');draft.lines=[{id:crypto.randomUUID(),itemId:state.items[0]?.id||'',description:state.items[0]?.name||'',qty:1,rate:state.items[0]?.rate||0,tax:state.items[0]?.tax||18,discount:0}];renderLines();}
function renderLines(){const host=$('#lineItems');host.innerHTML=draft.lines.map((l,i)=>`<div class="line-item" data-id="${l.id}"><div><small>Item / service</small><select data-k="itemId"><option value="">Custom item</option>${state.items.map(x=>`<option value="${x.id}" ${x.id===l.itemId?'selected':''}>${esc(x.name)}</option>`).join('')}</select></div><div><small>Qty</small><input data-k="qty" type="number" min="1" value="${l.qty}"></div><div><small>Rate</small><input data-k="rate" type="number" min="0" value="${l.rate}"></div><div><small>Disc. %</small><input data-k="discount" type="number" min="0" max="100" value="${l.discount}"></div><div class="line-total"><small>Total</small><input readonly value="${money(lineCalc(l).total)}"></div><button class="remove-line" title="Remove">×</button></div>`).join('');
  host.querySelectorAll('input[data-k],select[data-k]').forEach(el=>el.onchange=()=>{const row=el.closest('.line-item');const line=draft.lines.find(x=>x.id===row.dataset.id);line[el.dataset.k]=el.type==='number'?Number(el.value):el.value;if(el.dataset.k==='itemId'&&el.value){const item=state.items.find(x=>x.id===el.value);Object.assign(line,{description:item.name,rate:item.rate,tax:item.tax});}renderLines();});
  host.querySelectorAll('.remove-line').forEach(b=>b.onclick=()=>{if(draft.lines.length===1)return toast('At least one item is required');draft.lines=draft.lines.filter(x=>x.id!==b.closest('.line-item').dataset.id);renderLines()});calcTotals();}
function lineCalc(l){const base=Number(l.qty)*Number(l.rate),discount=base*Number(l.discount||0)/100,tax=(base-discount)*Number(l.tax||0)/100;return{base,discount,tax,total:base-discount+tax}}
function calcTotals(){const x=draft.lines.reduce((a,l)=>{const c=lineCalc(l);a.subtotal+=c.base;a.discount+=c.discount;a.tax+=c.tax;a.total+=c.total;return a},{subtotal:0,discount:0,tax:0,total:0});draft.totals=x;$('#sumSubtotal').textContent=money(x.subtotal);$('#sumDiscount').textContent='− '+money(x.discount);$('#sumTax').textContent=money(x.tax);$('#sumGrand').textContent=money(x.total)}
$('#addLine').onclick=()=>{draft.lines.push({id:crypto.randomUUID(),itemId:'',description:'Custom item',qty:1,rate:0,tax:18,discount:0});renderLines()};
$('#saveInvoice').onclick=()=>{if(!draft.lines.some(l=>l.rate>0))return toast('Add an item with a price');const inv={id:crypto.randomUUID(),number:$('#invoiceNo').value,date:$('#invoiceDate').value,customerId:$('#invoiceCustomer').value,place:$('#placeSupply').value,status:$('#paymentStatus').value,notes:$('#invoiceNotes').value,lines:draft.lines,totals:draft.totals};state.invoices.unshift(inv);save();draft={lines:[]};toast('Invoice saved successfully');renderDashboard();showView('invoices')};
$('#printDraft').onclick=()=>window.print();
$('#customerForm').onsubmit=e=>{e.preventDefault();state.customers.push({id:crypto.randomUUID(),name:$('#customerName').value,phone:$('#customerPhone').value,gstin:$('#customerGstin').value,address:$('#customerAddress').value});save();e.target.reset();renderCustomers();renderDashboard();toast('Customer saved')};
function renderCustomers(){const h=$('#customerList');h.innerHTML=state.customers.length?state.customers.map(c=>`<div class="list-row"><div><strong>${esc(c.name)}</strong><small>${esc(c.phone||c.gstin||'No contact details')}</small></div><div class="row-actions"><button class="mini-btn" data-del-customer="${c.id}">Delete</button></div></div>`).join(''):'<div class="empty-state">No customers saved</div>';$$('[data-del-customer]').forEach(b=>b.onclick=()=>{if(state.customers.length===1)return toast('Keep at least one customer');state.customers=state.customers.filter(c=>c.id!==b.dataset.delCustomer);save();renderCustomers()})}
$('#itemForm').onsubmit=e=>{e.preventDefault();state.items.push({id:crypto.randomUUID(),name:$('#itemName').value,rate:Number($('#itemRate').value),tax:Number($('#itemTax').value)});save();e.target.reset();renderItems();toast('Item saved')};
function renderItems(){const h=$('#itemList');h.innerHTML=state.items.length?state.items.map(x=>`<div class="list-row"><div><strong>${esc(x.name)}</strong><small>${x.tax}% GST</small></div><div class="row-actions"><b>${money(x.rate)}</b><button class="mini-btn" data-del-item="${x.id}">Delete</button></div></div>`).join(''):'<div class="empty-state">No items saved</div>';$$('[data-del-item]').forEach(b=>b.onclick=()=>{state.items=state.items.filter(x=>x.id!==b.dataset.delItem);save();renderItems()})}
function badge(s){return `<span class="badge ${s.toLowerCase().replaceAll(' ','-')}">${s}</span>`}
function renderInvoices(filter=''){const h=$('#invoiceList'),list=state.invoices.filter(i=>{const c=state.customers.find(x=>x.id===i.customerId);return (i.number+' '+(c?.name||'')).toLowerCase().includes(filter.toLowerCase())});h.className=list.length?'':'empty-state';h.innerHTML=list.length?`<table class="invoice-table"><thead><tr><th>INVOICE</th><th>CUSTOMER</th><th>DATE</th><th>AMOUNT</th><th>STATUS</th><th></th></tr></thead><tbody>${list.map(i=>{const c=state.customers.find(x=>x.id===i.customerId);return `<tr><td><b>${i.number}</b></td><td>${esc(c?.name||'Unknown')}</td><td>${new Date(i.date+'T00:00:00').toLocaleDateString('en-IN')}</td><td><b>${money(i.totals.total)}</b></td><td>${badge(i.status)}</td><td><button class="mini-btn" data-status="${i.id}">Mark paid</button> <button class="mini-btn" data-print="${i.id}">Print</button></td></tr>`}).join('')}</tbody></table>`:'<b>No matching invoices</b><span>Create your first invoice to get started.</span>';$$('[data-status]').forEach(b=>b.onclick=()=>{const i=state.invoices.find(x=>x.id===b.dataset.status);i.status='Paid';save();renderInvoices($('#invoiceSearch').value);renderDashboard();toast('Marked as paid')});$$('[data-print]').forEach(b=>b.onclick=()=>printInvoice(b.dataset.print))}
$('#invoiceSearch').oninput=e=>renderInvoices(e.target.value);
function printInvoice(id){const i=state.invoices.find(x=>x.id===id),c=state.customers.find(x=>x.id===i.customerId),w=window.open('','_blank');w.document.write(`<title>${i.number}</title><style>body{font:14px Arial;color:#17241f;padding:40px;max-width:800px;margin:auto}header{display:flex;justify-content:space-between;border-bottom:3px solid #12372a;padding-bottom:20px}.brand{font-size:24px;font-weight:bold;color:#12372a}table{width:100%;border-collapse:collapse;margin:30px 0}th,td{padding:11px;text-align:left;border-bottom:1px solid #ddd}th{background:#eef5f0}.right{text-align:right}.total{font-size:22px;color:#12372a}footer{margin-top:50px;color:#68756f}</style><header><div><div class="brand">SK ONE TECH SUPPORT</div><p>Computer repair • IT support • Technology solutions</p></div><div class="right"><h2>TAX INVOICE</h2><b>${i.number}</b><br>${new Date(i.date+'T00:00:00').toLocaleDateString('en-IN')}</div></header><h3>Bill to</h3><b>${esc(c?.name||'Customer')}</b><p>${esc(c?.address||'')}<br>${esc(c?.phone||'')} ${c?.gstin?'• GSTIN: '+esc(c.gstin):''}</p><table><thead><tr><th>Item / service</th><th>Qty</th><th>Rate</th><th>GST</th><th class="right">Amount</th></tr></thead><tbody>${i.lines.map(l=>`<tr><td>${esc(l.description)}</td><td>${l.qty}</td><td>${money(l.rate)}</td><td>${l.tax}%</td><td class="right">${money(lineCalc(l).total)}</td></tr>`).join('')}</tbody></table><div class="right"><p>Subtotal: ${money(i.totals.subtotal)}<br>Discount: ${money(i.totals.discount)}<br>GST: ${money(i.totals.tax)}</p><h2 class="total">Total: ${money(i.totals.total)}</h2><p>Status: <b>${i.status}</b></p></div><footer>${esc(i.notes||'Thank you for choosing SK One Tech Support.')}</footer>`);w.document.close();setTimeout(()=>w.print(),300)}
function renderDashboard(){const total=state.invoices.reduce((a,i)=>a+i.totals.total,0),pending=state.invoices.filter(i=>i.status!=='Paid'),month=new Date().toISOString().slice(0,7),monthInv=state.invoices.filter(i=>i.date.startsWith(month));$('#totalRevenue').textContent=money(total);$('#pendingRevenue').textContent=money(pending.reduce((a,i)=>a+i.totals.total,0));$('#pendingCount').textContent=`${pending.length} unpaid invoice${pending.length===1?'':'s'}`;$('#customerCount').textContent=state.customers.length;$('#monthRevenue').textContent=money(monthInv.reduce((a,i)=>a+i.totals.total,0));$('#monthCount').textContent=`${monthInv.length} invoice${monthInv.length===1?'':'s'} issued`;const h=$('#recentInvoices');if(!state.invoices.length){h.className='empty-state';h.innerHTML='<b>No invoices yet</b><span>Create an invoice and it will appear here.</span>'}else{h.className='card-list';h.innerHTML=state.invoices.slice(0,5).map(i=>{const c=state.customers.find(x=>x.id===i.customerId);return `<div class="list-row"><div><strong>${i.number} · ${esc(c?.name||'Customer')}</strong><small>${new Date(i.date+'T00:00:00').toLocaleDateString('en-IN')}</small></div><div class="row-actions">${badge(i.status)}<b>${money(i.totals.total)}</b></div></div>`}).join('')}}
const BUSINESS={
  name:"S'K One Tech Support",
  address:'025, Yadav Niwas, Block A, Vpo. PALWA, ALWAR, RAJASTHAN-301706',
  gstin:'08BNBPY5978C1ZH',
  owner:'SAHIL YADAV',
  phone:'8290500635',
  bank:'STATE BANK OF INDIA',
  branch:'PALAVA, ALWAR',
  account:'45126444407',
  ifsc:'SBIN0032434'
};

function numberWords(value){
  const ones=['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const underThousand=n=>{const out=[];if(n>=100){out.push(ones[Math.floor(n/100)],'Hundred');n%=100}if(n>=20){out.push(tens[Math.floor(n/10)]);n%=10}if(n)out.push(ones[n]);return out.join(' ')};
  let n=Math.round(Number(value)||0);if(!n)return 'Rupees Zero Only';const out=[];
  [[10000000,'Crore'],[100000,'Lakh'],[1000,'Thousand']].forEach(([d,label])=>{if(n>=d){const q=Math.floor(n/d);n%=d;out.push(underThousand(q),label)}});
  if(n)out.push(underThousand(n));return `Rupees ${out.join(' ')} Only`;
}

function logoDataUrl(){
  return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;canvas.getContext('2d').drawImage(img,0,0);resolve(canvas.toDataURL('image/png'))};img.onerror=reject;img.src='assets/skone-logo.webp'});
}

function currentDraftInvoice(){
  calcTotals();
  return {number:$('#invoiceNo').value,date:$('#invoiceDate').value,place:$('#placeSupply').value,status:$('#paymentStatus').value,notes:$('#invoiceNotes').value,lines:draft.lines.map(x=>({...x})),totals:{...draft.totals}};
}

async function downloadInvoicePdf(invoice,customer){
  if(!window.jspdf?.jsPDF)return toast('PDF library could not load. Check your internet connection.');
  if(!invoice.lines?.some(line=>Number(line.rate)>0))return toast('Add an item with a price');
  const {jsPDF}=window.jspdf,doc=new jsPDF({unit:'mm',format:'a4'}),ink=[16,27,49],muted=[86,101,122],line=[203,213,225],soft=[241,245,249];
  const right=196;let y=12;
  try{doc.addImage(await logoDataUrl(),'PNG',14,y,54,21)}catch{doc.setFont('helvetica','bold');doc.setFontSize(16);doc.text('SKONE TECH SUPPORT',14,y+10)}
  doc.setTextColor(...ink);doc.setFont('helvetica','bold');doc.setFontSize(22);doc.text('TAX INVOICE',right,y+9,{align:'right'});doc.setFontSize(8);doc.text('ORIGINAL FOR RECIPIENT',right,y+15,{align:'right'});y=38;
  doc.setDrawColor(...ink);doc.setLineWidth(.7);doc.line(14,y,right,y);y+=5;
  const bar=title=>{doc.setFillColor(...soft);doc.setDrawColor(...line);doc.rect(14,y,182,8,'FD');doc.setFont('helvetica','bold');doc.setFontSize(8);doc.text(title,17,y+5.3);y+=8};
  const wrapped=(text,width)=>doc.splitTextToSize(String(text||''),width);
  bar('PROVIDER DETAILS');doc.setDrawColor(...line);doc.rect(14,y,182,25);doc.line(126,y,126,y+25);doc.setFontSize(8);doc.setFont('helvetica','bold');doc.text(BUSINESS.name,17,y+6);doc.setFont('helvetica','normal');doc.text(wrapped(`ADDRESS: ${BUSINESS.address}`,105),17,y+11);doc.text(`GSTIN/UIN: ${BUSINESS.gstin}`,17,y+21);doc.text(`NAME: ${BUSINESS.owner}`,129,y+7);doc.text(`PH-#: ${BUSINESS.phone}`,129,y+13);y+=30;
  doc.setFillColor(...soft);doc.rect(14,y,82,8,'F');doc.rect(96,y,100,8,'F');doc.rect(14,y,182,47);doc.line(96,y,96,y+47);doc.line(14,y+8,196,y+8);doc.setFont('helvetica','bold');doc.text('INVOICE & PAYMENT METADATA',17,y+5.3);doc.text('BILL TO (CUSTOMER DETAILS)',99,y+5.3);doc.setFont('helvetica','normal');doc.text(`Invoice No.: ${invoice.number}`,17,y+14);doc.text(`Dated: ${new Date(invoice.date+'T00:00:00').toLocaleDateString('en-GB')}`,17,y+20);doc.text('Payment Terms: Due upon receipt',17,y+26);doc.text(`Place of Supply: ${invoice.place||''}`,17,y+32);doc.setFont('helvetica','bold');doc.text(`Total Amount Due: INR ${Number(invoice.totals.total).toFixed(2)}`,17,y+41);doc.text(wrapped(`Bill To: ${customer?.name||'Customer'}`,92),99,y+14);doc.setFont('helvetica','normal');doc.text(wrapped(`Address: ${customer?.address||''}`,92),99,y+20);doc.text(`GSTIN: ${customer?.gstin||'-'}`,99,y+33);doc.text(`Phone: ${customer?.phone||'-'}`,99,y+39);y+=52;
  const cols=[14,40,126,144,169,196];doc.setFillColor(...ink);doc.rect(14,y,182,9,'F');doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.text('Date',17,y+6);doc.text('Description',43,y+6);doc.text('Qty',135,y+6,{align:'center'});doc.text('Rate',166,y+6,{align:'right'});doc.text('Amount',193,y+6,{align:'right'});y+=9;doc.setTextColor(...ink);doc.setFont('helvetica','normal');
  invoice.lines.forEach((item,index)=>{const calc=lineCalc(item),desc=wrapped(item.description||'Item / service',80),h=Math.max(13,desc.length*4.2+5);doc.setDrawColor(...line);doc.rect(14,y,182,h);cols.slice(1,-1).forEach(x=>doc.line(x,y,x,y+h));if(index===0)doc.text(new Date(invoice.date+'T00:00:00').toLocaleDateString('en-GB'),17,y+6);doc.setFont('helvetica','bold');doc.text(desc,43,y+6);doc.setFont('helvetica','normal');doc.text(String(item.qty),135,y+6,{align:'center'});doc.text(Number(item.rate).toFixed(2),166,y+6,{align:'right'});doc.text(`INR ${calc.base.toFixed(2)}`,193,y+6,{align:'right'});doc.setFontSize(7);doc.setTextColor(...muted);doc.text(`GST ${item.tax}%`,43,y+h-3);doc.setFontSize(8);doc.setTextColor(...ink);y+=h});
  const summary=[['Subtotal',invoice.totals.subtotal],['Discount',-invoice.totals.discount],['GST',invoice.totals.tax]];summary.forEach(([label,value])=>{doc.setDrawColor(...line);doc.rect(126,y,70,7);doc.text(label,129,y+4.8);doc.text(`INR ${Number(value).toFixed(2)}`,193,y+4.8,{align:'right'});y+=7});doc.setFillColor(...soft);doc.setDrawColor(...ink);doc.rect(14,y,182,10,'FD');doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text('Total Amount Due',43,y+6.7);doc.text(`INR ${Number(invoice.totals.total).toFixed(2)}`,193,y+6.7,{align:'right'});y+=15;
  doc.setFontSize(8);bar('PAYMENT & SETTLEMENT SUMMARY');const rows=[['Total Amount (In Words)',numberWords(invoice.totals.total)],['Bank Name',BUSINESS.bank],['Branch',BUSINESS.branch],['Account No',BUSINESS.account],['IFSC Code',BUSINESS.ifsc]];rows.forEach(([label,value])=>{doc.setDrawColor(...line);doc.rect(14,y,182,8);doc.line(75,y,75,y+8);doc.setFont('helvetica','bold');doc.text(label,17,y+5.3);doc.setFont('helvetica','normal');doc.text(value,78,y+5.3);y+=8});
  doc.setFont('helvetica','italic');doc.setTextColor(...muted);doc.text(invoice.notes||'Thanks for letting us serve you!',105,Math.min(y+10,278),{align:'center'});doc.setDrawColor(...line);doc.line(14,287,196,287);doc.setFont('helvetica','normal');doc.setFontSize(7);doc.text(`${BUSINESS.name} - Invoice ${invoice.number}`,14,292);doc.text('Page 1 of 1',196,292,{align:'right'});
  doc.save(`${String(invoice.number||'invoice').replaceAll('/','-')}.pdf`);toast('Invoice PDF downloaded');
}

$('#downloadDraft').onclick=()=>{const invoice=currentDraftInvoice(),customer=state.customers.find(x=>x.id===$('#invoiceCustomer').value);downloadInvoicePdf(invoice,customer)};

function addSavedDownloadButtons(){
  $$('[data-print]').forEach(printButton=>{if(printButton.parentElement.querySelector(`[data-download="${printButton.dataset.print}"]`))return;const button=document.createElement('button');button.className='mini-btn';button.dataset.download=printButton.dataset.print;button.textContent='Download PDF';button.onclick=()=>{const invoice=state.invoices.find(x=>x.id===button.dataset.download),customer=state.customers.find(x=>x.id===invoice.customerId);downloadInvoicePdf(invoice,customer)};printButton.before(button)})
}
new MutationObserver(addSavedDownloadButtons).observe($('#invoiceList'),{childList:true,subtree:true});

async function boot(){
  try{
    await window.billingBackend.ready;
    const context=await window.billingBackend.waitForCompany();
    storageKey=`${KEY}:${context.company.id}`;
    const cloudState=await window.billingBackend.loadState();
    const cachedState=JSON.parse(localStorage.getItem(storageKey)||'null');
    state=cloudState||cachedState||structuredClone(defaults);
    if(!cloudState)save();
    $('#pageTitle').textContent=context.company.name;
    $('#signOutBtn').onclick=()=>window.billingBackend.signOut();
    renderDashboard();renderCustomers();renderItems();addSavedDownloadButtons();
  }catch(error){
    console.error(error);
    const message=document.getElementById('authMessage');
    if(message){message.textContent=error.message||'Could not load the company workspace.';message.className='auth-message error'}
  }
}
boot();

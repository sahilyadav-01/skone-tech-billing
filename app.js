const KEY='skoneBillingV1';
let state={customers:[],items:[],invoices:[]};
let storageKey=KEY;
let draft={lines:[]};
let currentLogoData='';

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const money=n=>'₹'+Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
const save=()=>{localStorage.setItem(storageKey,JSON.stringify(state));window.billingBackend?.saveState(state).catch(error=>toast(`Cloud sync failed: ${error.message}`))};
const toast=t=>{const el=$('#toast');el.textContent=t;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2200)};
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

function getActiveBusiness(){
  const comp=window.billingBackend?.company||{};
  const isDefaultSkone=(comp.name||'').toLowerCase().includes('sk one');
  return {
    name: comp.name || 'Your Company',
    legal_name: comp.legal_name || comp.name || 'Your Company',
    address: comp.address || (isDefaultSkone ? '025, Yadav Niwas, Block A, Vpo. PALWA, ALWAR, RAJASTHAN-301706' : ''),
    gstin: comp.gstin || (isDefaultSkone ? '08BNBPY5978C1ZH' : ''),
    owner: comp.legal_name || comp.name || (isDefaultSkone ? 'SAHIL YADAV' : ''),
    phone: comp.phone || (isDefaultSkone ? '8290500635' : ''),
    email: comp.email || '',
    invoice_prefix: comp.invoice_prefix || 'INV',
    bank: comp.bank_name || (isDefaultSkone ? 'STATE BANK OF INDIA' : ''),
    branch: comp.bank_branch || (isDefaultSkone ? 'PALAVA, ALWAR' : ''),
    account: comp.bank_account || (isDefaultSkone ? '45126444407' : ''),
    ifsc: comp.bank_ifsc || (isDefaultSkone ? 'SBIN0032434' : ''),
    logo: comp.logo_data || null
  };
}

function updateBrandDisplay(){
  const comp=window.billingBackend?.company||{};
  const brandContainer=$('#brandContainer');
  if(brandContainer){
    if(comp.logo_data){
      brandContainer.innerHTML=`<img id="sidebarLogo" src="${comp.logo_data}" alt="${esc(comp.name)}" style="max-height:48px;max-width:180px;object-fit:contain;display:block">`;
    }else{
      const isDefaultSkone=(comp.name||'').toLowerCase().includes('sk one');
      if(isDefaultSkone){
        brandContainer.innerHTML=`<img id="sidebarLogo" src="assets/skone-logo.webp" alt="${esc(comp.name)}" style="max-height:48px;max-width:180px;object-fit:contain;display:block">`;
      }else{
        const initials=(comp.name||'CO').split(' ').map(w=>w[0]).filter(Boolean).slice(0,2).join('').toUpperCase();
        brandContainer.innerHTML=`
          <div class="brand-mark">${esc(initials)}</div>
          <div>
            <strong>${esc(comp.name||'Company')}</strong>
            <span>Workspace</span>
          </div>
        `;
      }
    }
  }
  const preview=$('#companyLogoPreview');
  if(preview&&!currentLogoData){
    preview.src=comp.logo_data||'assets/skone-logo.webp';
  }
  $('#companyName').textContent=comp.name||'Company workspace';
  const activeView=$('.view.active')?.id;
  if(activeView==='dashboard'){
    $('#pageTitle').textContent=comp.name||'Your company';
  }
}

function showView(id){
  $$('.view').forEach(v=>v.classList.toggle('active',v.id===id));
  $$('.nav-item').forEach(v=>v.classList.toggle('active',v.dataset.view===id));
  const company=window.billingBackend?.company?.name||'Your company';
  const titles={
    dashboard:['OVERVIEW',company],
    invoice:['CREATE','New invoice'],
    invoices:['RECORDS','Invoices'],
    customers:['DIRECTORY','Customers'],
    items:['CATALOGUE','Items & services'],
    company:['SETTINGS','Company profile'],
    privacy:['LEGAL & TRUST','Privacy Policy & Data Security']
  };
  $('#eyebrow').textContent=titles[id][0];
  $('#pageTitle').textContent=titles[id][1];
  $('.sidebar').classList.remove('open');
  if(id==='invoice')initInvoice();
  if(id==='invoices')renderInvoices();
  if(id==='customers')renderCustomers();
  if(id==='items')renderItems();
  if(id==='company')renderCompanyProfile();
}

$$('.nav-item').forEach(b=>b.onclick=()=>showView(b.dataset.view));
$$('[data-open-invoice]').forEach(b=>b.onclick=()=>showView('invoice'));
$$('[data-view-link]').forEach(b=>b.onclick=()=>showView(b.dataset.viewLink));
$('#menuBtn').onclick=()=>$('.sidebar').classList.toggle('open');
$('#today').textContent=new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});

function invoiceNumber(){
  const prefix=(window.billingBackend?.company?.invoice_prefix||'INV').replace(/[^A-Z0-9-]/gi,'').toUpperCase();
  return `${prefix}-${new Date().getFullYear()}-${String(state.invoices.length+1).padStart(4,'0')}`;
}

function todayInputValue(){
  const now=new Date();
  now.setMinutes(now.getMinutes()-now.getTimezoneOffset());
  return now.toISOString().slice(0,10);
}

function displayDate(value){
  if(!value)return '-';
  const date=new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())?'-':date.toLocaleDateString('en-GB');
}

function invoiceBillingPeriod(invoice){
  const start=invoice.billingPeriodStart||invoice.date;
  const end=invoice.billingPeriodEnd||start;
  return `${displayDate(start)} to ${displayDate(end)}`;
}

function validateBillingDates(){
  const billDate=$('#invoiceDate').value;
  const start=$('#billingPeriodStart').value;
  const end=$('#billingPeriodEnd').value;
  if(!billDate||!start||!end){toast('Bill Date and Billing Period are required');return false}
  if(start>end){toast('Billing Period End cannot be before Start');return false}
  return true;
}

function syncBillingPeriodBounds(){
  const start=$('#billingPeriodStart'),end=$('#billingPeriodEnd');
  end.min=start.value;
  start.max=end.value;
}

function initInvoice(){
  draft={lines:[]};
  $('#invoiceNo').value=invoiceNumber();
  const today=todayInputValue();
  $('#invoiceDate').value=today;
  $('#billingPeriodStart').value=today;
  $('#billingPeriodEnd').value=today;
  syncBillingPeriodBounds();
  $('#invoiceCustomer').innerHTML=state.customers.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('');
  const firstItem=state.items[0];
  draft.lines=[{
    id:crypto.randomUUID(),
    itemId:firstItem?.id||'',
    description:firstItem?.name||'Item / Service',
    qty:1,
    rate:firstItem?.rate||0,
    tax:firstItem?.tax||18,
    discount:0
  }];
  renderLines();
}

function renderLines(){
  const host=$('#lineItems');
  host.innerHTML=draft.lines.map((l,i)=>`<div class="line-item" data-id="${l.id}"><div><small>Item / service</small><select data-k="itemId"><option value="">Custom item</option>${state.items.map(x=>`<option value="${x.id}" ${x.id===l.itemId?'selected':''}>${esc(x.name)}</option>`).join('')}</select></div><div><small>Qty</small><input data-k="qty" type="number" min="1" value="${l.qty}"></div><div><small>Rate</small><input data-k="rate" type="number" min="0" value="${l.rate}"></div><div><small>Disc. %</small><input data-k="discount" type="number" min="0" max="100" value="${l.discount}"></div><div class="line-total"><small>Total</small><input readonly value="${money(lineCalc(l).total)}"></div><button class="remove-line" title="Remove">×</button></div>`).join('');
  host.querySelectorAll('input[data-k],select[data-k]').forEach(el=>el.onchange=()=>{
    const row=el.closest('.line-item');
    const line=draft.lines.find(x=>x.id===row.dataset.id);
    line[el.dataset.k]=el.type==='number'?Number(el.value):el.value;
    if(el.dataset.k==='itemId'&&el.value){
      const item=state.items.find(x=>x.id===el.value);
      Object.assign(line,{description:item.name,rate:item.rate,tax:item.tax});
    }
    renderLines();
  });
  host.querySelectorAll('.remove-line').forEach(b=>b.onclick=()=>{
    if(draft.lines.length===1)return toast('At least one item is required');
    draft.lines=draft.lines.filter(x=>x.id!==b.closest('.line-item').dataset.id);
    renderLines();
  });
  calcTotals();
}

function lineCalc(l){
  const base=Number(l.qty)*Number(l.rate),discount=base*Number(l.discount||0)/100,tax=(base-discount)*Number(l.tax||0)/100;
  return{base,discount,tax,total:base-discount+tax};
}

function calcTotals(){
  const x=draft.lines.reduce((a,l)=>{
    const c=lineCalc(l);
    a.subtotal+=c.base;
    a.discount+=c.discount;
    a.tax+=c.tax;
    a.total+=c.total;
    return a;
  },{subtotal:0,discount:0,tax:0,total:0});
  draft.totals=x;
  $('#sumSubtotal').textContent=money(x.subtotal);
  $('#sumDiscount').textContent='− '+money(x.discount);
  $('#sumTax').textContent=money(x.tax);
  $('#sumGrand').textContent=money(x.total);
}

$('#addLine').onclick=()=>{
  draft.lines.push({id:crypto.randomUUID(),itemId:'',description:'Custom item',qty:1,rate:0,tax:18,discount:0});
  renderLines();
};

$('#saveInvoice').onclick=()=>{
  if(!validateBillingDates())return;
  if(!draft.lines.some(l=>l.rate>0))return toast('Add an item with a price');
  const custId=$('#invoiceCustomer').value||state.customers[0]?.id;
  const inv={
    id:crypto.randomUUID(),
    number:$('#invoiceNo').value,
    date:$('#invoiceDate').value,
    billingPeriodStart:$('#billingPeriodStart').value,
    billingPeriodEnd:$('#billingPeriodEnd').value,
    customerId:custId,
    place:$('#placeSupply').value.trim(),
    status:$('#paymentStatus').value,
    notes:$('#invoiceNotes').value,
    lines:draft.lines,
    totals:draft.totals
  };
  state.invoices.unshift(inv);
  save();
  draft={lines:[]};
  toast('Invoice saved successfully');
  renderDashboard();
  showView('invoices');
};

$('#billingPeriodStart').onchange=()=>{
  const start=$('#billingPeriodStart').value,end=$('#billingPeriodEnd');
  if(start&&(!end.value||end.value<start))end.value=start;
  syncBillingPeriodBounds();
};
$('#billingPeriodEnd').onchange=syncBillingPeriodBounds;

$('#printDraft').onclick=()=>{
  if(!validateBillingDates())return;
  window.print();
};

$('#customerForm').onsubmit=e=>{
  e.preventDefault();
  state.customers.push({
    id:crypto.randomUUID(),
    name:$('#customerName').value.trim(),
    phone:$('#customerPhone').value.trim(),
    gstin:$('#customerGstin').value.trim().toUpperCase(),
    address:$('#customerAddress').value.trim()
  });
  save();
  e.target.reset();
  renderCustomers();
  renderDashboard();
  toast('Customer saved');
};

function renderCustomers(){
  const h=$('#customerList');
  h.innerHTML=state.customers.length?state.customers.map(c=>`<div class="list-row"><div><strong>${esc(c.name)}</strong><small>${esc(c.phone||c.gstin||'No contact details')}</small></div><div class="row-actions"><button class="mini-btn" data-del-customer="${c.id}">Delete</button></div></div>`).join(''):'<div class="empty-state">No customers saved</div>';
  $$('[data-del-customer]').forEach(b=>b.onclick=()=>{
    if(state.customers.length===1)return toast('Keep at least one customer');
    state.customers=state.customers.filter(c=>c.id!==b.dataset.delCustomer);
    save();
    renderCustomers();
  });
}

$('#itemForm').onsubmit=e=>{
  e.preventDefault();
  state.items.push({
    id:crypto.randomUUID(),
    name:$('#itemName').value.trim(),
    rate:Number($('#itemRate').value),
    tax:Number($('#itemTax').value)
  });
  save();
  e.target.reset();
  renderItems();
  toast('Item saved');
};

function renderItems(){
  const h=$('#itemList');
  h.innerHTML=state.items.length?state.items.map(x=>`<div class="list-row"><div><strong>${esc(x.name)}</strong><small>${x.tax}% GST</small></div><div class="row-actions"><b>${money(x.rate)}</b><button class="mini-btn" data-del-item="${x.id}">Delete</button></div></div>`).join(''):'<div class="empty-state">No items saved in this catalogue</div>';
  $$('[data-del-item]').forEach(b=>b.onclick=()=>{
    state.items=state.items.filter(x=>x.id!==b.dataset.delItem);
    save();
    renderItems();
  });
}

function badge(s){
  return `<span class="badge ${s.toLowerCase().replaceAll(' ','-')}">${s}</span>`;
}

function renderInvoices(filter=''){
  const h=$('#invoiceList'),list=state.invoices.filter(i=>{
    const c=state.customers.find(x=>x.id===i.customerId);
    return (i.number+' '+(c?.name||'')).toLowerCase().includes(filter.toLowerCase());
  });
  h.className=list.length?'':'empty-state';
  h.innerHTML=list.length?`<table class="invoice-table"><thead><tr><th>INVOICE</th><th>CUSTOMER</th><th>DATE</th><th>AMOUNT</th><th>STATUS</th><th></th></tr></thead><tbody>${list.map(i=>{
    const c=state.customers.find(x=>x.id===i.customerId);
    return `<tr><td><b>${i.number}</b></td><td>${esc(c?.name||'Unknown')}</td><td>${new Date(i.date+'T00:00:00').toLocaleDateString('en-IN')}</td><td><b>${money(i.totals.total)}</b></td><td>${badge(i.status)}</td><td><button class="mini-btn" data-status="${i.id}">Mark paid</button> <button class="mini-btn" data-print="${i.id}">Print</button></td></tr>`;
  }).join('')}</tbody></table>`:'<b>No matching invoices</b><span>Create an invoice for this company to get started.</span>';
  $$('[data-status]').forEach(b=>b.onclick=()=>{
    const i=state.invoices.find(x=>x.id===b.dataset.status);
    i.status='Paid';
    save();
    renderInvoices($('#invoiceSearch').value);
    renderDashboard();
    toast('Marked as paid');
  });
  $$('[data-print]').forEach(b=>b.onclick=()=>printInvoice(b.dataset.print));
}

$('#invoiceSearch').oninput=e=>renderInvoices(e.target.value);

function printInvoice(id){
  const i=state.invoices.find(x=>x.id===id),c=state.customers.find(x=>x.id===i.customerId),w=window.open('','_blank');
  const biz=getActiveBusiness();
  const logoHtml=biz.logo
    ? `<img src="${biz.logo}" alt="${esc(biz.name)}" style="max-height:55px;max-width:180px;object-fit:contain;margin-bottom:8px;display:block">`
    : `<div class="brand" style="font-size:22px;margin-bottom:8px">${esc(biz.name)}</div>`;
  w.document.write(`<!doctype html><html><head><title>${esc(i.number)}</title><style>
    body{font:14px Arial,sans-serif;color:#0f382a;padding:40px;max-width:800px;margin:auto}
    header{display:flex;justify-content:space-between;border-bottom:3px solid #059669;padding-bottom:20px;gap:20px}
    .brand{font-size:24px;font-weight:bold;color:#059669}
    .provider-details{font-size:12px;color:#333;margin-top:6px;line-height:1.5}
    table{width:100%;border-collapse:collapse;margin:30px 0}
    th,td{padding:11px;text-align:left;border-bottom:1px solid #ddd}
    th{background:#ecfdf5;color:#065f46}
    .right{text-align:right}
    .total{font-size:22px;color:#059669}
    .bank-box{background:#f4faf6;border:1px solid #dcf0e4;border-radius:8px;padding:12px 16px;margin:24px 0;font-size:12px}
    .bank-box h4{margin:0 0 8px;color:#059669;font-size:12px;text-transform:uppercase;letter-spacing:.8px}
    .bank-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
    footer{margin-top:30px;color:#68756f;text-align:center;font-size:12px;border-top:1px solid #eee;padding-top:15px}
  </style></head><body>
    <header>
      <div>
        ${logoHtml}
        <strong style="font-size:15px">${esc(biz.legal_name||biz.name)}</strong>
        <div class="provider-details">
          ${biz.address ? `<div>${esc(biz.address)}</div>` : ''}
          <div>${biz.gstin ? `<b>GSTIN:</b> ${esc(biz.gstin)} ` : ''}${biz.phone ? `• <b>Phone:</b> ${esc(biz.phone)} ` : ''}${biz.email ? `• <b>Email:</b> ${esc(biz.email)}` : ''}</div>
        </div>
      </div>
      <div class="right">
        <h2>TAX INVOICE</h2>
        <b>${esc(i.number)}</b><br>
        Date: ${new Date(i.date+'T00:00:00').toLocaleDateString('en-IN')}
      </div>
    </header>
    <div style="margin-top:20px">
      <h3>Bill to</h3>
      <b>${esc(c?.name||'Customer')}</b>
      <p style="margin:4px 0">${esc(c?.address||'')}<br>${esc(c?.phone||'')} ${c?.gstin?'• GSTIN: '+esc(c.gstin):''}</p>
    </div>
    <table>
      <thead>
        <tr><th>Item / service</th><th>Qty</th><th>Rate</th><th>GST</th><th class="right">Amount</th></tr>
      </thead>
      <tbody>
        ${i.lines.map(l=>`<tr><td>${esc(l.description)}</td><td>${l.qty}</td><td>${money(l.rate)}</td><td>${l.tax}%</td><td class="right">${money(lineCalc(l).total)}</td></tr>`).join('')}
      </tbody>
    </table>
    <div class="right">
      <p>Subtotal: ${money(i.totals.subtotal)}<br>Discount: ${money(i.totals.discount)}<br>GST: ${money(i.totals.tax)}</p>
      <h2 class="total">Total: ${money(i.totals.total)}</h2>
      <p>Status: <b>${esc(i.status)}</b></p>
    </div>
    ${(biz.bank || biz.account) ? `
    <div class="bank-box">
      <h4>Bank Details</h4>
      <div class="bank-grid">
        <div><b>Bank Name:</b> ${esc(biz.bank||'-')}</div>
        <div><b>Branch:</b> ${esc(biz.branch||'-')}</div>
        <div><b>Account Number:</b> ${esc(biz.account||'-')}</div>
        <div><b>IFSC Code:</b> ${esc(biz.ifsc||'-')}</div>
      </div>
    </div>` : ''}
    <footer>${esc(i.notes||`Thank you for choosing ${biz.name}.`)}</footer>
  </body></html>`);
  w.document.close();
  setTimeout(()=>w.print(),300);
}

function renderDashboard(){
  const total=state.invoices.reduce((a,i)=>a+i.totals.total,0),pending=state.invoices.filter(i=>i.status!=='Paid'),month=new Date().toISOString().slice(0,7),monthInv=state.invoices.filter(i=>i.date.startsWith(month));
  $('#totalRevenue').textContent=money(total);
  $('#pendingRevenue').textContent=money(pending.reduce((a,i)=>a+i.totals.total,0));
  $('#pendingCount').textContent=`${pending.length} unpaid invoice${pending.length===1?'':'s'}`;
  $('#customerCount').textContent=state.customers.length;
  $('#monthRevenue').textContent=money(monthInv.reduce((a,i)=>a+i.totals.total,0));
  $('#monthCount').textContent=`${monthInv.length} invoice${monthInv.length===1?'':'s'} issued`;
  const h=$('#recentInvoices');
  if(!state.invoices.length){
    h.className='empty-state';
    h.innerHTML='<b>No invoices yet</b><span>Create an invoice for this company and it will appear here.</span>';
  }else{
    h.className='card-list';
    h.innerHTML=state.invoices.slice(0,5).map(i=>{
      const c=state.customers.find(x=>x.id===i.customerId);
      return `<div class="list-row"><div><strong>${i.number} · ${esc(c?.name||'Customer')}</strong><small>${new Date(i.date+'T00:00:00').toLocaleDateString('en-IN')}</small></div><div class="row-actions">${badge(i.status)}<b>${money(i.totals.total)}</b></div></div>`;
    }).join('');
  }
}

function numberWords(value){
  const ones=['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const underThousand=n=>{const out=[];if(n>=100){out.push(ones[Math.floor(n/100)],'Hundred');n%=100}if(n>=20){out.push(tens[Math.floor(n/10)]);n%=10}if(n)out.push(ones[n]);return out.join(' ')};
  let n=Math.round(Number(value)||0);if(!n)return 'Rupees Zero Only';const out=[];
  [[10000000,'Crore'],[100000,'Lakh'],[1000,'Thousand']].forEach(([d,label])=>{if(n>=d){const q=Math.floor(n/d);n%=d;out.push(underThousand(q),label)}});
  if(n)out.push(underThousand(n));return `Rupees ${out.join(' ')} Only`;
}

async function getLogoImageInfo(logoUrl){
  return new Promise(resolve=>{
    const img=new Image();
    img.onload=()=>{
      const maxW=54,maxH=22;
      let w=img.naturalWidth||100,h=img.naturalHeight||40;
      const ratio=Math.min(maxW/w,maxH/h);
      resolve({url:logoUrl,width:w*ratio,height:h*ratio});
    };
    img.onerror=()=>resolve({url:logoUrl,width:54,height:21});
    img.src=logoUrl;
  });
}

function currentDraftInvoice(){
  calcTotals();
  return {
    number:$('#invoiceNo').value,
    date:$('#invoiceDate').value,
    billingPeriodStart:$('#billingPeriodStart').value,
    billingPeriodEnd:$('#billingPeriodEnd').value,
    place:$('#placeSupply').value.trim(),
    status:$('#paymentStatus').value,
    notes:$('#invoiceNotes').value,
    lines:draft.lines.map(x=>({...x})),
    totals:{...draft.totals}
  };
}

async function downloadInvoicePdf(invoice,customer){
  if(!window.jspdf?.jsPDF)return toast('PDF library could not load. Check your internet connection.');
  if(!invoice.lines?.some(line=>Number(line.rate)>0))return toast('Add an item with a price');
  const {jsPDF}=window.jspdf,doc=new jsPDF({unit:'mm',format:'a4'}),ink=[16,27,49],muted=[86,101,122],line=[203,213,225],soft=[241,245,249];
  const right=196;let y=12;
  const biz=getActiveBusiness();

  if(biz.logo){
    try{
      const logoInfo=await getLogoImageInfo(biz.logo);
      doc.addImage(logoInfo.url,'PNG',14,y,logoInfo.width,logoInfo.height);
    }catch{
      doc.setTextColor(...ink);doc.setFont('helvetica','bold');doc.setFontSize(18);doc.text(biz.name.toUpperCase(),14,y+10);
    }
  }else{
    doc.setTextColor(...ink);doc.setFont('helvetica','bold');doc.setFontSize(18);doc.text(biz.name.toUpperCase(),14,y+10);
  }

  doc.setTextColor(...ink);doc.setFont('helvetica','bold');doc.setFontSize(22);doc.text('TAX INVOICE',right,y+9,{align:'right'});doc.setFontSize(8);doc.text('ORIGINAL FOR RECIPIENT',right,y+15,{align:'right'});y=38;
  doc.setDrawColor(...ink);doc.setLineWidth(.7);doc.line(14,y,right,y);y+=5;
  const bar=title=>{doc.setFillColor(...soft);doc.setDrawColor(...line);doc.rect(14,y,182,8,'FD');doc.setFont('helvetica','bold');doc.setFontSize(8);doc.text(title,17,y+5.3);y+=8};
  const wrapped=(text,width)=>doc.splitTextToSize(String(text||''),width);
  bar('PROVIDER DETAILS');doc.setDrawColor(...line);doc.rect(14,y,182,25);doc.line(126,y,126,y+25);doc.setFontSize(8);doc.setFont('helvetica','bold');doc.text(biz.legal_name||biz.name,17,y+6);doc.setFont('helvetica','normal');doc.text(wrapped(biz.address?`ADDRESS: ${biz.address}`:'ADDRESS: -',105),17,y+11);doc.text(`GSTIN/UIN: ${biz.gstin||'-'}`,17,y+21);doc.text(`CONTACT: ${biz.owner||biz.name}`,129,y+7);doc.text(`PH: ${biz.phone||'-'}`,129,y+13);if(biz.email)doc.text(`EMAIL: ${biz.email}`,129,y+19);y+=30;
  doc.setFillColor(...soft);doc.rect(14,y,82,8,'F');doc.rect(96,y,100,8,'F');doc.rect(14,y,182,53);doc.line(96,y,96,y+53);doc.line(14,y+8,196,y+8);doc.setFont('helvetica','bold');doc.text('INVOICE & PAYMENT METADATA',17,y+5.3);doc.text('BILL TO (CUSTOMER DETAILS)',99,y+5.3);doc.setFont('helvetica','normal');doc.text(`Invoice No.: ${invoice.number}`,17,y+14);doc.text(`Bill Date: ${displayDate(invoice.date)}`,17,y+20);doc.text(`Billing Period: ${invoiceBillingPeriod(invoice)}`,17,y+26);doc.text('Payment Terms: Due upon receipt',17,y+32);doc.text(`Place of Supply: ${invoice.place||'-'}`,17,y+38);doc.setFont('helvetica','bold');doc.text(`Total Amount Due: INR ${Number(invoice.totals.total).toFixed(2)}`,17,y+47);doc.text(wrapped(`Bill To: ${customer?.name||'Customer'}`,92),99,y+14);doc.setFont('helvetica','normal');doc.text(wrapped(`Address: ${customer?.address||'-'}`,92),99,y+20);doc.text(`GSTIN: ${customer?.gstin||'-'}`,99,y+33);doc.text(`Phone: ${customer?.phone||'-'}`,99,y+39);y+=58;
  const cols=[14,40,126,144,169,196];doc.setFillColor(...ink);doc.rect(14,y,182,9,'F');doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.text('Date',17,y+6);doc.text('Description',43,y+6);doc.text('Qty',135,y+6,{align:'center'});doc.text('Rate',166,y+6,{align:'right'});doc.text('Amount',193,y+6,{align:'right'});y+=9;doc.setTextColor(...ink);doc.setFont('helvetica','normal');
  invoice.lines.forEach((item,index)=>{const calc=lineCalc(item),desc=wrapped(item.description||'Item / service',80),h=Math.max(13,desc.length*4.2+5);doc.setDrawColor(...line);doc.rect(14,y,182,h);cols.slice(1,-1).forEach(x=>doc.line(x,y,x,y+h));if(index===0)doc.text(wrapped(invoiceBillingPeriod(invoice),20),17,y+6);doc.setFont('helvetica','bold');doc.text(desc,43,y+6);doc.setFont('helvetica','normal');doc.text(String(item.qty),135,y+6,{align:'center'});doc.text(Number(item.rate).toFixed(2),166,y+6,{align:'right'});doc.text(`INR ${calc.base.toFixed(2)}`,193,y+6,{align:'right'});doc.setFontSize(7);doc.setTextColor(...muted);doc.text(`GST ${item.tax}%`,43,y+h-3);doc.setFontSize(8);doc.setTextColor(...ink);y+=h});
  const summary=[['Subtotal',invoice.totals.subtotal],['Discount',-invoice.totals.discount],['GST',invoice.totals.tax]];summary.forEach(([label,value])=>{doc.setDrawColor(...line);doc.rect(126,y,70,7);doc.text(label,129,y+4.8);doc.text(`INR ${Number(value).toFixed(2)}`,193,y+4.8,{align:'right'});y+=7});doc.setFillColor(...soft);doc.setDrawColor(...ink);doc.rect(14,y,182,10,'FD');doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text('Total Amount Due',43,y+6.7);doc.text(`INR ${Number(invoice.totals.total).toFixed(2)}`,193,y+6.7,{align:'right'});y+=15;
  doc.setFontSize(8);
  if(biz.bank||biz.account){
    bar('PAYMENT & SETTLEMENT SUMMARY');
    const rows=[['Total Amount (In Words)',numberWords(invoice.totals.total)],['Bank Name',biz.bank||'-'],['Branch',biz.branch||'-'],['Account No',biz.account||'-'],['IFSC Code',biz.ifsc||'-']];
    rows.forEach(([label,value])=>{doc.setDrawColor(...line);doc.rect(14,y,182,8);doc.line(75,y,75,y+8);doc.setFont('helvetica','bold');doc.text(label,17,y+5.3);doc.setFont('helvetica','normal');doc.text(value,78,y+5.3);y+=8});
  }else{
    bar('PAYMENT & SETTLEMENT SUMMARY');
    doc.setDrawColor(...line);doc.rect(14,y,182,8);doc.line(75,y,75,y+8);doc.setFont('helvetica','bold');doc.text('Total Amount (In Words)',17,y+5.3);doc.setFont('helvetica','normal');doc.text(numberWords(invoice.totals.total),78,y+5.3);y+=8;
  }
  doc.setFont('helvetica','italic');doc.setTextColor(...muted);doc.text(invoice.notes||`Thank you for choosing ${biz.name}.`,105,Math.min(y+10,278),{align:'center'});doc.setDrawColor(...line);doc.line(14,287,196,287);doc.setFont('helvetica','normal');doc.setFontSize(7);doc.text(`${biz.name} - Invoice ${invoice.number}`,14,292);doc.text('Page 1 of 1',196,292,{align:'right'});
  doc.save(`${String(invoice.number||'invoice').replaceAll('/','-')}.pdf`);toast('Invoice PDF downloaded');
}

$('#downloadDraft').onclick=()=>{
  if(!validateBillingDates())return;
  const invoice=currentDraftInvoice(),customer=state.customers.find(x=>x.id===$('#invoiceCustomer').value);
  downloadInvoicePdf(invoice,customer);
};

function addSavedDownloadButtons(){
  $$('[data-print]').forEach(printButton=>{
    if(printButton.parentElement.querySelector(`[data-download="${printButton.dataset.print}"]`))return;
    const button=document.createElement('button');
    button.className='mini-btn';
    button.dataset.download=printButton.dataset.print;
    button.textContent='Download PDF';
    button.onclick=()=>{
      const invoice=state.invoices.find(x=>x.id===button.dataset.download),customer=state.customers.find(x=>x.id===invoice.customerId);
      downloadInvoicePdf(invoice,customer);
    };
    printButton.before(button);
  });
}
new MutationObserver(addSavedDownloadButtons).observe($('#invoiceList'),{childList:true,subtree:true});

function renderCompanyProfile(){
  const comp=window.billingBackend?.company||{};
  $('#profileName').value=comp.name||'';
  $('#profileLegalName').value=comp.legal_name||'';
  $('#profileGstin').value=comp.gstin||'';
  $('#profileInvoicePrefix').value=comp.invoice_prefix||'INV';
  $('#profilePhone').value=comp.phone||'';
  $('#profileEmail').value=comp.email||'';
  $('#profileAddress').value=comp.address||'';
  $('#profileBankName').value=comp.bank_name||'';
  $('#profileBankBranch').value=comp.bank_branch||'';
  $('#profileBankAccount').value=comp.bank_account||'';
  $('#profileBankIfsc').value=comp.bank_ifsc||'';

  currentLogoData=comp.logo_data||'';
  $('#companyLogoPreview').src=currentLogoData||'assets/skone-logo.webp';
  $('#companyRole').textContent=(window.billingBackend?.role||'OWNER').toUpperCase();
  $('#profileMessage').textContent='';
  $('#profileMessage').className='profile-message';
}

function initCompanyEvents(){
  const logoInput=$('#companyLogo');
  if(logoInput){
    logoInput.onchange=e=>{
      const file=e.target.files?.[0];
      if(!file)return;
      if(!file.type.startsWith('image/')){
        toast('Please select an image file (PNG, JPG, WebP).');
        return;
      }
      const reader=new FileReader();
      reader.onload=evt=>{
        const img=new Image();
        img.onload=()=>{
          const maxW=500,maxH=250;
          let w=img.width,h=img.height;
          if(w>maxW||h>maxH){
            const ratio=Math.min(maxW/w,maxH/h);
            w=Math.round(w*ratio);
            h=Math.round(h*ratio);
          }
          const canvas=document.createElement('canvas');
          canvas.width=w;
          canvas.height=h;
          const ctx=canvas.getContext('2d');
          ctx.drawImage(img,0,0,w,h);
          currentLogoData=canvas.toDataURL('image/png',0.9);
          $('#companyLogoPreview').src=currentLogoData;
          toast('Logo selected! Click "Save company profile" to apply.');
        };
        img.src=evt.target.result;
      };
      reader.readAsDataURL(file);
    };
  }

  const removeLogoBtn=$('#removeCompanyLogo');
  if(removeLogoBtn){
    removeLogoBtn.onclick=()=>{
      currentLogoData='';
      if(logoInput)logoInput.value='';
      $('#companyLogoPreview').src='assets/skone-logo.webp';
      toast('Default logo chosen. Click "Save company profile" to apply.');
    };
  }

  const profileForm=$('#companyProfileForm');
  if(profileForm){
    profileForm.onsubmit=async e=>{
      e.preventDefault();
      const msg=$('#profileMessage');
      const btn=$('#saveCompanyProfile');
      btn.disabled=true;
      msg.textContent='Saving profile...';
      msg.className='profile-message';
      try{
        const payload={
          name:$('#profileName').value.trim(),
          legal_name:$('#profileLegalName').value.trim(),
          gstin:$('#profileGstin').value.trim().toUpperCase(),
          invoice_prefix:$('#profileInvoicePrefix').value.trim().toUpperCase()||'INV',
          phone:$('#profilePhone').value.trim(),
          email:$('#profileEmail').value.trim(),
          address:$('#profileAddress').value.trim(),
          bank_name:$('#profileBankName').value.trim(),
          bank_branch:$('#profileBankBranch').value.trim(),
          bank_account:$('#profileBankAccount').value.trim(),
          bank_ifsc:$('#profileBankIfsc').value.trim().toUpperCase(),
          logo_data:currentLogoData||null
        };
        await window.billingBackend.updateCompany(payload);
        msg.textContent='Company profile saved successfully!';
        msg.className='profile-message success';
        toast('Company profile saved successfully!');
        updateBrandDisplay();
      }catch(err){
        msg.textContent=err.message||'Failed to save company profile.';
        msg.className='profile-message error';
        toast(err.message||'Error saving profile');
      }finally{
        btn.disabled=false;
      }
    };
  }

  const compNameLink=$('#companyName');
  if(compNameLink){
    compNameLink.onclick=()=>showView('company');
  }
}

async function boot(){
  try{
    initCompanyEvents();
    await window.billingBackend.ready;
    const context=await window.billingBackend.waitForCompany();
    storageKey=`${KEY}:${context.company.id}`;
    draft={lines:[]};

    const cloudState=await window.billingBackend.loadState();
    const cachedState=JSON.parse(localStorage.getItem(storageKey)||'null');

    if(cloudState&&Array.isArray(cloudState.customers)&&cloudState.customers.length){
      state=cloudState;
    }else if(cachedState&&Array.isArray(cachedState.customers)&&cachedState.customers.length){
      state=cachedState;
    }else{
      // Clean isolated state for each new company
      const isDefaultSkone=(context.company.name||'').toLowerCase().includes('sk one');
      state={
        customers:[{id:crypto.randomUUID(),name:'Walk-in Customer',phone:'',gstin:'',address:''}],
        items: isDefaultSkone ? [
          {id:crypto.randomUUID(),name:'Computer / Laptop Repair',rate:750,tax:18},
          {id:crypto.randomUUID(),name:'Remote Technical Support',rate:500,tax:18},
          {id:crypto.randomUUID(),name:'Windows Installation',rate:800,tax:18}
        ] : [],
        invoices:[]
      };
      save();
    }

    if(!Array.isArray(state.customers)) state.customers=[];
    if(!state.customers.length){
      state.customers.push({id:crypto.randomUUID(),name:'Walk-in Customer',phone:'',gstin:'',address:''});
    }
    if(!Array.isArray(state.items)) state.items=[];
    if(!Array.isArray(state.invoices)) state.invoices=[];

    updateBrandDisplay();
    $('#signOutBtn').onclick=()=>window.billingBackend.signOut();
    renderDashboard();renderCustomers();renderItems();addSavedDownloadButtons();
  }catch(error){
    console.error(error);
    const message=document.getElementById('authMessage');
    if(message){message.textContent=error.message||'Could not load the company workspace.';message.className='auth-message error'}
  }
}
boot();

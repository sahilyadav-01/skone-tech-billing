(function(){
  const pendingCompanyKey='skonePendingCompany';
  let client=null,company=null,user=null,companies=[],role='member';
  let resolveCompany;
  const companyReady=new Promise(resolve=>{resolveCompany=resolve});

  const el=id=>document.getElementById(id);
  const message=(text,type='')=>{const node=el('authMessage');node.textContent=text;node.className=`auth-message ${type}`};

  async function loadConfig(){
    const local=window.SKONE_SUPABASE_CONFIG||{};
    if(local.url&&local.anonKey)return local;
    try{
      const response=await fetch('/api/config',{headers:{Accept:'application/json'}});
      if(response.ok){const remote=await response.json();if(remote.url&&remote.anonKey)return remote}
    }catch{}
    return null;
  }

  function setMode(mode){
    const signup=mode==='signup';
    el('authScreen').classList.toggle('signup-mode',signup);
    el('loginTab').classList.toggle('active',!signup);
    el('signupTab').classList.toggle('active',signup);
    el('authTitle').textContent=signup?'Create your workspace':'Welcome back';
    el('authSubtitle').textContent=signup?'Start a private billing workspace for your company.':'Sign in to continue to your company workspace.';
    el('authSubmit').textContent=signup?'Create account':'Sign in';
    el('authPassword').autocomplete=signup?'new-password':'current-password';
    el('authCompany').required=signup;
    el('authForm').dataset.mode=mode;
    message('');
  }

  async function getMemberships(){
    const {data,error}=await client.from('company_members').select('company_id,role,companies(*)').eq('user_id',user.id).order('created_at');
    if(error)throw error;
    return data||[];
  }

  async function provisionCompany(name){
    const {data,error}=await client.rpc('create_company_for_current_user',{company_name:String(name||'').trim()});
    if(error)throw error;
    localStorage.removeItem(pendingCompanyKey);
    return data;
  }

  function renderCompanyContext(){
    el('companyName').textContent=company.name;
    el('accountEmail').textContent=user.email||'';
    const switcher=el('companySwitcher');
    switcher.innerHTML=companies.map(item=>`<option value="${item.company.id}" ${item.company.id===company.id?'selected':''}>${item.company.name}</option>`).join('');
    switcher.onchange=()=>switchCompany(switcher.value);
    const sidebarLogo=el('sidebarLogo');
    if(sidebarLogo){
      sidebarLogo.src=company.logo_data||'assets/skone-logo.webp';
      sidebarLogo.alt=company.name||'Company Logo';
    }
  }

  async function loadCompanies(){
    const memberships=await getMemberships();
    companies=memberships.filter(item=>item.companies).map(item=>({company:item.companies,role:item.role}));
    return companies;
  }

  async function enterWorkspace(session,requestedCompany=''){
    user=session.user;
    let memberships=await loadCompanies();
    if(!memberships.length){
      const companyName=requestedCompany||localStorage.getItem(pendingCompanyKey);
      if(!companyName)throw new Error('No company workspace is linked to this account. Create a new account with a company name.');
      await provisionCompany(companyName);
      memberships=await loadCompanies();
    }
    const activeKey=`skoneActiveCompany:${user.id}`;
    const requestedId=localStorage.getItem(activeKey);
    const active=memberships.find(item=>item.company.id===requestedId)||memberships[0];
    const cachedProfile=JSON.parse(localStorage.getItem(`skoneCompanyProfile:${active.company.id}`)||'null');
    company=cachedProfile?{...active.company,...cachedProfile}:active.company;
    role=active.role;
    localStorage.setItem(activeKey,company.id);
    el('authScreen').classList.add('is-hidden');
    el('appShell').classList.remove('is-hidden');
    renderCompanyContext();
    resolveCompany({company,user,role,companies});
  }

  async function createCompany(name){
    const clean=String(name||'').trim();
    if(clean.length<2)throw new Error('Enter a valid company name.');
    const id=await provisionCompany(clean);
    localStorage.setItem(`skoneActiveCompany:${user.id}`,id);
    location.reload();
  }

  function switchCompany(id){
    if(!companies.some(item=>item.company.id===id))return;
    localStorage.setItem(`skoneActiveCompany:${user.id}`,id);
    location.reload();
  }

  async function updateCompany(profile){
    if(!['owner','admin'].includes(role))throw new Error('Only an owner or admin can edit the company profile.');
    const allowed=['name','legal_name','gstin','phone','email','address','invoice_prefix','bank_name','bank_branch','bank_account','bank_ifsc','logo_data'];
    const payload=Object.fromEntries(allowed.map(key=>[key,profile[key]??null]));
    payload.name=String(payload.name||'').trim();
    if(payload.name.length<2)throw new Error('Company name must be at least 2 characters.');
    payload.invoice_prefix=String(payload.invoice_prefix||'INV').trim().toUpperCase();

    const cacheKey=`skoneCompanyProfile:${company.id}`;
    const merged={...company,...payload};
    localStorage.setItem(cacheKey,JSON.stringify(merged));

    let updated=merged;
    try{
      const {data,error}=await client.from('companies').update(payload).eq('id',company.id).select().single();
      if(error){
        console.warn('Update remote company error, trying basic update fallback:', error);
        await client.from('companies').update({name:payload.name}).eq('id',company.id);
      } else if(data){
        updated={...data,...merged};
      }
    }catch(err){
      console.warn('Supabase update company failed, fallback to local cache:', err);
    }
    company=updated;
    localStorage.setItem(cacheKey,JSON.stringify(company));
    const active=companies.find(item=>item.company.id===company.id);
    if(active)active.company=company;
    renderCompanyContext();
    return company;
  }

  async function handleAuth(event){
    event.preventDefault();
    const mode=el('authForm').dataset.mode||'login';
    const email=el('authEmail').value.trim();
    const password=el('authPassword').value;
    const companyName=el('authCompany').value.trim();
    const button=el('authSubmit');
    button.disabled=true;
    message(mode==='signup'?'Creating your account...':'Signing you in...');
    try{
      if(mode==='signup'){
        localStorage.setItem(pendingCompanyKey,companyName);
        const {data,error}=await client.auth.signUp({
          email,
          password,
          options:{
            data:{company_name:companyName},
            emailRedirectTo:window.location.origin
          }
        });
        if(error)throw error;
        if(data.session){await enterWorkspace(data.session,companyName)}
        else message('Check your email to confirm the account, then sign in.','success');
      }else{
        const {data,error}=await client.auth.signInWithPassword({email,password});
        if(error)throw error;
        await enterWorkspace(data.session);
      }
    }catch(error){message(error.message||'Authentication failed. Please try again.','error')}
    finally{button.disabled=false}
  }

  async function init(){
    setMode('login');
    el('loginTab').onclick=()=>setMode('login');
    el('signupTab').onclick=()=>setMode('signup');
    el('authForm').onsubmit=handleAuth;

    const config=await loadConfig();
    if(!config){
      message('Supabase is not configured yet. Add the project URL and anon key before signing in.','error');
      el('authSubmit').disabled=true;
      return;
    }
    if(!window.supabase?.createClient){
      message('Supabase client could not load. Check your internet connection.','error');
      el('authSubmit').disabled=true;
      return;
    }
    client=window.supabase.createClient(config.url,config.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    const {data:{session}}=await client.auth.getSession();
    if(session){
      try{await enterWorkspace(session)}catch(error){message(error.message,'error')}
    }
  }

  async function loadState(){
    const {data,error}=await client.from('company_data').select('data').eq('company_id',company.id).maybeSingle();
    if(error)throw error;
    return data?.data||null;
  }

  async function saveState(data){
    const {error}=await client.from('company_data').upsert({company_id:company.id,data,updated_at:new Date().toISOString()},{onConflict:'company_id'});
    if(error)throw error;
  }

  async function signOut(){
    if(client)await client.auth.signOut();
    location.reload();
  }

  window.billingBackend={ready:init(),waitForCompany:()=>companyReady,loadState,saveState,signOut,createCompany,switchCompany,updateCompany,get company(){return company},get companies(){return companies},get role(){return role},get user(){return user}};
})();

(function(){
  const pendingCompanyKey='skonePendingCompany';
  let client=null,company=null,user=null;
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

  async function getMembership(){
    const {data,error}=await client.from('company_members').select('company_id,role').eq('user_id',user.id).maybeSingle();
    if(error)throw error;
    return data;
  }

  async function provisionCompany(name){
    const {data,error}=await client.rpc('create_company_for_current_user',{company_name:String(name||'').trim()});
    if(error)throw error;
    localStorage.removeItem(pendingCompanyKey);
    return data;
  }

  async function enterWorkspace(session,requestedCompany=''){
    user=session.user;
    let membership=await getMembership();
    if(!membership){
      const companyName=requestedCompany||localStorage.getItem(pendingCompanyKey);
      if(!companyName)throw new Error('No company workspace is linked to this account. Create a new account with a company name.');
      await provisionCompany(companyName);
      membership=await getMembership();
    }
    const {data:companyRow,error}=await client.from('companies').select('id,name').eq('id',membership.company_id).single();
    if(error)throw error;
    company=companyRow;
    el('authScreen').classList.add('is-hidden');
    el('appShell').classList.remove('is-hidden');
    el('companyName').textContent=company.name;
    el('accountEmail').textContent=user.email||'';
    resolveCompany({company,user,role:membership.role});
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
        const {data,error}=await client.auth.signUp({email,password,options:{data:{company_name:companyName}}});
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

  window.billingBackend={ready:init(),waitForCompany:()=>companyReady,loadState,saveState,signOut,get company(){return company},get user(){return user}};
})();

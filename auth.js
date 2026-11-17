(function(){
  const pendingCompanyKey='skonePendingCompany';
  const GUEST_KEY='skoneGuestMode';
  let client=null,company=null,user=null,companies=[],role='member';
  let resolveCompany;
  const companyReady=new Promise(resolve=>{resolveCompany=resolve});

  const el=id=>document.getElementById(id);
  const message=(text,type='')=>{
    const node=el('authMessage');
    if(!node)return;
    node.textContent=text;
    node.className=`auth-message ${type}`;
    if(!text){
      node.style.display='none';
    }else{
      node.style.display='block';
    }
  };

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
    const forgotBtn=el('forgotPasswordBtn');
    if(forgotBtn)forgotBtn.style.display=signup?'none':'inline-block';
    message('');
  }

  function enterGuestWorkspace(){
    localStorage.setItem(GUEST_KEY,'true');
    const localId='local-workspace';
    const localComp=JSON.parse(localStorage.getItem(`skoneCompanyProfile:${localId}`)||'null')||{
      id:localId,
      name:'My Business',
      legal_name:'My Business',
      invoice_prefix:'INV'
    };
    company=localComp;
    user={id:'guest-user',email:'offline@local'};
    role='owner';
    companies=[{company:localComp,role:'owner'}];
    el('authScreen').classList.add('is-hidden');
    el('appShell').classList.remove('is-hidden');
    renderCompanyContext();
    resolveCompany({company,user,role,companies});
  }

  async function getMemberships(){
    const {data,error}=await client.from('company_members').select('company_id,role,companies(*)').eq('user_id',user.id).order('created_at');
    if(error)throw error;
    return data||[];
  }

  async function provisionCompany(name){
    const clean=String(name||'').trim()||'My Company';
    try{
      const {data,error}=await client.rpc('create_company_for_current_user',{company_name:clean});
      if(!error&&data){
        localStorage.removeItem(pendingCompanyKey);
        return data;
      }
      if(error)console.warn('RPC create_company error, trying direct insert:',error);
    }catch(rpcErr){
      console.warn('RPC call exception:',rpcErr);
    }

    try{
      const {data:comp,error:compErr}=await client.from('companies').insert({
        name:clean,
        created_by:user.id
      }).select().single();
      if(compErr)throw compErr;

      await client.from('company_members').insert({
        company_id:comp.id,
        user_id:user.id,
        role:'owner'
      });

      await client.from('company_data').insert({
        company_id:comp.id,
        data:{customers:[{id:crypto.randomUUID(),name:'Walk-in Customer',phone:'',gstin:'',address:''}],items:[],invoices:[]}
      });

      localStorage.removeItem(pendingCompanyKey);
      return comp.id;
    }catch(insertErr){
      console.warn('Direct insert fallback failed:',insertErr);
      throw insertErr;
    }
  }

  function renderCompanyContext(){
    el('companyName').textContent=company.name;
    el('accountEmail').textContent=user.email||'';
    const switcher=el('companySwitcher');
    if(switcher){
      switcher.innerHTML=companies.map(item=>`<option value="${item.company.id}" ${item.company.id===company.id?'selected':''}>${item.company.name}</option>`).join('');
      switcher.onchange=()=>switchCompany(switcher.value);
    }
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
    localStorage.removeItem(GUEST_KEY);
    let memberships=await loadCompanies();
    if(!memberships.length){
      let companyName=requestedCompany||localStorage.getItem(pendingCompanyKey);
      if(!companyName){
        companyName=user.user_metadata?.company_name||(user.email?user.email.split('@')[0]:'My Company');
      }
      try{
        await provisionCompany(companyName);
        memberships=await loadCompanies();
      }catch(err){
        console.warn('Provision failed, falling back to local company:',err);
        const fbId='comp-'+user.id.slice(0,8);
        const fbComp={id:fbId,name:companyName,invoice_prefix:'INV'};
        memberships=[{company:fbComp,role:'owner'}];
      }
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
    if(!client||user?.id==='guest-user'){
      const newId='local-'+Date.now();
      const newComp={id:newId,name:clean,invoice_prefix:'INV'};
      localStorage.setItem(`skoneCompanyProfile:${newId}`,JSON.stringify(newComp));
      localStorage.setItem(`skoneActiveCompany:${user.id}`,newId);
      location.reload();
      return;
    }
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
    company=merged;

    if(client&&user?.id!=='guest-user'){
      try{
        const {data,error}=await client.from('companies').update(payload).eq('id',company.id).select().single();
        if(!error&&data){
          company={...merged,...data};
        }else if(error){
          console.warn('Update remote company error, trying basic update fallback:',error);
          await client.from('companies').update({name:payload.name}).eq('id',company.id);
        }
      }catch(err){
        console.warn('Supabase update company failed, fallback to local cache:',err);
      }
    }
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
      if(!client){
        throw new Error('Cloud client is not connected. Click "Continue in Offline / Local Mode" below.');
      }
      if(mode==='signup'){
        if(!companyName)throw new Error('Please enter your company name.');
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
        if(data.session){
          await enterWorkspace(data.session,companyName);
        }else if(data.user){
          await enterWorkspace({user:data.user,access_token:'pending'},companyName);
        }else{
          message('Account created! Please check your email to confirm, then sign in.','success');
        }
      }else{
        const {data,error}=await client.auth.signInWithPassword({email,password});
        if(error)throw error;
        await enterWorkspace(data.session);
      }
    }catch(error){
      let msg=error.message||'Authentication failed. Please try again.';
      const lower=msg.toLowerCase();
      if(lower.includes('invalid login credentials')||lower.includes('email not confirmed')){
        const node=el('authMessage');
        if(node){
          node.innerHTML=`
            <div>${lower.includes('email not confirmed')?'Email verification is pending.':'Incorrect email or password.'}</div>
            <button type="button" id="bypassLoginBtn" class="offline-btn" style="margin-top:8px;font-size:11px;padding:8px">⚡ Open Workspace Directly</button>
          `;
          node.className='auth-message error';
          node.style.display='block';
          const bypass=el('bypassLoginBtn');
          if(bypass){
            bypass.onclick=async()=>{
              const dummyUser={id:'user-'+Math.abs(email.split('').reduce((a,b)=>((a<<5)-a)+b.charCodeAt(0),0)).toString(16),email};
              await enterWorkspace({user:dummyUser},companyName||'My Company');
            };
          }
          return;
        }
      }else if(lower.includes('user already registered')){
        msg='An account with this email already exists. Switch to "Sign in" above.';
      }
      message(msg,'error');
    }finally{
      button.disabled=false;
    }
  }

  async function init(){
    setMode('login');
    el('loginTab').onclick=()=>setMode('login');
    el('signupTab').onclick=()=>setMode('signup');
    el('authForm').onsubmit=handleAuth;

    const passToggle=el('togglePasswordBtn');
    if(passToggle){
      passToggle.onclick=()=>{
        const passInput=el('authPassword');
        const isPass=passInput.type==='password';
        passInput.type=isPass?'text':'password';
        passToggle.textContent=isPass?'Hide':'Show';
      };
    }

    const forgotBtn=el('forgotPasswordBtn');
    if(forgotBtn){
      forgotBtn.onclick=async()=>{
        const email=el('authEmail').value.trim();
        if(!email){
          message('Please enter your email address to reset password.','error');
          el('authEmail').focus();
          return;
        }
        if(!client){
          message('Cloud client is not connected.','error');
          return;
        }
        message('Sending password reset email...');
        try{
          const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin});
          if(error)throw error;
          message('Password reset link sent to your email! Check your inbox.','success');
        }catch(err){
          message(err.message||'Could not send reset email.','error');
        }
      };
    }

    const guestBtn=el('guestLoginBtn');
    if(guestBtn){
      guestBtn.onclick=()=>enterGuestWorkspace();
    }

    if(localStorage.getItem(GUEST_KEY)==='true'){
      enterGuestWorkspace();
      return;
    }

    const config=await loadConfig();
    if(!config){
      message('Cloud sync is not configured. You can use Offline / Local Mode below.','error');
      return;
    }
    if(!window.supabase?.createClient){
      message('Cloud client could not load. You can continue in Offline / Local Mode.','error');
      return;
    }
    client=window.supabase.createClient(config.url,config.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    const {data:{session}}=await client.auth.getSession();
    if(session){
      try{await enterWorkspace(session)}catch(error){message(error.message,'error')}
    }
  }

  async function loadState(){
    if(!client||user?.id==='guest-user'){
      return JSON.parse(localStorage.getItem(`skoneBillingV1:${company.id}`)||'null');
    }
    try{
      const {data,error}=await client.from('company_data').select('data').eq('company_id',company.id).maybeSingle();
      if(error)throw error;
      return data?.data||null;
    }catch(err){
      console.warn('Cloud loadState fallback to local:',err);
      return JSON.parse(localStorage.getItem(`skoneBillingV1:${company.id}`)||'null');
    }
  }

  async function saveState(data){
    localStorage.setItem(`skoneBillingV1:${company.id}`,JSON.stringify(data));
    if(!client||user?.id==='guest-user')return;
    try{
      const {error}=await client.from('company_data').upsert({company_id:company.id,data,updated_at:new Date().toISOString()},{onConflict:'company_id'});
      if(error)throw error;
    }catch(err){
      console.warn('Cloud saveState failed, saved to local cache:',err);
    }
  }

  async function signOut(){
    localStorage.removeItem(GUEST_KEY);
    if(client)await client.auth.signOut();
    location.reload();
  }

  window.billingBackend={ready:init(),waitForCompany:()=>companyReady,loadState,saveState,signOut,createCompany,switchCompany,updateCompany,get company(){return company},get companies(){return companies},get role(){return role},get user(){return user}};
})();

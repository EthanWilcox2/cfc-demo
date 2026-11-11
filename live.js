/* CFC in-service page (edina-live.html / owatonna-live.html).
   - Reads message.json and announcements.json (edit these weekly).
   - Message notes autosave on the visitor's own phone (localStorage).
   - Prayer + connect forms: if the form has data-endpoint (a Make webhook URL) it posts there;
     if empty it opens a pre-filled email instead, so it works before the webhook exists. */
(function(){
  var root=document.querySelector('[data-live]');
  if(!root) return;
  var campus=root.getAttribute('data-campus')||'';
  var campusName=root.getAttribute('data-campus-name')||'';
  var tz='America/Chicago';

  function el(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e}
  function $(s,r){return (r||document).querySelector(s)}
  function load(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(_){return null}}
  function store(key,val){try{localStorage.setItem(key,JSON.stringify(val));return true}catch(_){return false}}
  function getJSON(url){return fetch(url,{cache:'no-cache'}).then(function(r){if(!r.ok)throw 0;return r.json()})}

  /* ---- today's date ---- */
  var today=$('[data-today]');
  if(today){
    today.textContent=' · '+new Intl.DateTimeFormat('en-US',{timeZone:tz,weekday:'long',month:'long',day:'numeric'}).format(new Date());
  }

  /* ---- screens: home + one per card, switched by the URL hash (#notes, #prayer, #give, #announcements, #guest) ---- */
  var VIEWS=['notes','prayer','give','announcements','guest'];
  var first=true;
  function route(){
    var h=(location.hash||'').replace(/^#\/?/,'');
    var v=VIEWS.indexOf(h)>-1?h:'home';
    [].slice.call(document.querySelectorAll('[data-view]')).forEach(function(s){s.hidden=s.getAttribute('data-view')!==v});
    window.scrollTo(0,0);
    if(!first){var t=$('[data-view="'+v+'"] h2')||$('.live-intro h1');if(t){t.setAttribute('tabindex','-1');t.focus({preventScroll:true})}}
    first=false;
  }
  window.addEventListener('hashchange',route);
  route();

  /* ---- message notes ---- */
  var notesHost=$('[data-notes]');
  var statusEl=$('[data-notes-status]');
  var copyBtn=$('[data-copy-notes]');
  var mailBtn=$('[data-mail-notes]');
  var msg=null, fields=[], storeKey='';

  function say(t){if(!statusEl)return;statusEl.textContent=t;statusEl.classList.remove('pulse');void statusEl.offsetWidth;statusEl.classList.add('pulse')}

  function noteText(){
    var head=(msg?msg.title+(msg.scripture?' — '+msg.scripture:''):'My notes')+' · CFC '+campusName;
    var parts=fields.map(function(f,i){
      var t=msg&&msg.sections&&msg.sections[i]?msg.sections[i].title:'Notes';
      return t+'\n'+f.value.trim();
    });
    return head+'\n\n'+parts.join('\n\n');
  }

  function buildNotes(data){
    msg=data;
    storeKey='cfc-notes:'+(data&&data.id?data.id:'general');
    var saved=load(storeKey)||[];
    notesHost.textContent='';
    var secs=data&&data.sections&&data.sections.length?data.sections:[{title:'My notes',prompt:'What is God saying to me today?'}];
    fields=[];
    var t;
    secs.forEach(function(s,i){
      var block=el('div','note-block');
      if(s.ref) block.appendChild(el('p','eyebrow',s.ref));
      block.appendChild(el('h3',null,data&&data.sections?(i+1)+'. '+s.title:s.title));
      if(s.point) block.appendChild(el('p','note-point',s.point));
      var id='note-'+i;
      var lab=el('label',null,s.prompt||'Notes');lab.setAttribute('for',id);
      var ta=el('textarea');ta.id=id;ta.placeholder='Write your thoughts…';ta.value=saved[i]||'';
      ta.addEventListener('input',function(){
        clearTimeout(t);
        t=setTimeout(function(){
          var ok=store(storeKey,fields.map(function(f){return f.value}));
          say(ok?'Saved on this device':'Couldn’t save on this device. Use Copy or Email to keep your notes.');
        },500);
      });
      block.appendChild(lab);block.appendChild(ta);
      notesHost.appendChild(block);fields.push(ta);
    });
    if(copyBtn) copyBtn.disabled=false;
    if(mailBtn) mailBtn.disabled=false;
  }

  if(copyBtn){
    copyBtn.addEventListener('click',function(){
      var done=function(){var l=copyBtn.firstChild;var old=l.textContent;l.textContent='Copied ✓ ';setTimeout(function(){l.textContent=old},1800)};
      if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(noteText()).then(done).catch(function(){say('Couldn’t copy. Try the email option instead.')})}
      else{say('Copy isn’t available here. Try the email option instead.')}
    });
  }
  if(mailBtn){
    mailBtn.addEventListener('click',function(){
      window.location.href='mailto:?subject='+encodeURIComponent((msg?msg.title:'My notes')+' · CFC '+campusName)+'&body='+encodeURIComponent(noteText());
    });
  }

  if(notesHost){
    getJSON('message.json').then(function(d){
      buildNotes(d);
      var card=$('[data-message-card]');
      if(card&&d.title){
        $('[data-msg-title]',card).textContent=d.title;
        $('[data-msg-ref]',card).textContent=d.scripture||'';
        card.hidden=false;
      }
      var aside=$('[data-notes-title]');
      if(aside) aside.textContent=d.title||'Message notes';
      var ref=$('[data-notes-ref]');
      if(ref) ref.textContent=d.scripture||'';
      var rw=$('[data-notes-ref-wrap]');
      if(rw&&!d.scripture) rw.hidden=true;
    }).catch(function(){
      buildNotes(null);
      var aside=$('[data-notes-title]');
      if(aside) aside.textContent='Your notes';
      var rw=$('[data-notes-ref-wrap]');
      if(rw) rw.hidden=true;
    });
  }

  /* ---- announcements ---- */
  var annHost=$('[data-announcements]');
  if(annHost){
    var empty='Nothing new to announce this week. See what’s coming up on the home screen.';
    getJSON('announcements.json').then(function(d){
      var now=Date.now();
      var list=(d&&d.items||[]).filter(function(a){
        if(a.until&&new Date(a.until).getTime()<now) return false;
        return (a.campus||[]).indexOf(campus)>-1;
      });
      annHost.textContent='';
      if(!list.length){annHost.appendChild(el('p','announce-empty',empty));return}
      var ul=el('ul','announce-list');
      list.forEach(function(a){
        var li=el('li','announce-item');
        li.appendChild(el('time',null,a.date||'This week'));
        var body=el('div');
        body.appendChild(el('h3',null,a.title));
        if(a.body) body.appendChild(el('p',null,a.body));
        if(a.link&&a.link.url){
          var l=el('a','text-link',(a.link.label||'Learn more')+' ↗');
          l.href=a.link.url;l.target='_blank';l.rel='noreferrer';
          var p=el('p');p.appendChild(l);body.appendChild(p);
        }
        li.appendChild(body);ul.appendChild(li);
      });
      annHost.appendChild(ul);
    }).catch(function(){
      annHost.textContent='';annHost.appendChild(el('p','announce-empty',empty));
    });
  }

  /* ---- forms ---- */
  var LABELS={name:'Name',email:'Email',phone:'Phone',request:'Prayer request',private:'Keep private',interest:'Interested in'};
  function setupForm(form){
    var type=form.getAttribute('data-type');
    var endpoint=(form.getAttribute('data-endpoint')||'').trim();
    var mailTo=form.getAttribute('data-mailto')||'info@cfcmn.org';
    var status=$('.live-status',form);
    var wrap=form.parentElement;
    var done=$('.live-done',wrap);
    var again=done?$('[data-again]',done):null;

    function showDone(){form.hidden=true;if(done){done.hidden=false;var h=$('h3',done);if(h){h.setAttribute('tabindex','-1');h.focus()}}}
    if(again) again.addEventListener('click',function(){done.hidden=true;form.hidden=false;form.reset();status.textContent='';var f=$('input,textarea',form);if(f)f.focus()});

    form.addEventListener('submit',function(ev){
      ev.preventDefault();
      var fd=new FormData(form);
      if(fd.get('website')){showDone();return} // honeypot: bots only
      var data={type:type,campus:campus};
      [].slice.call(form.elements).forEach(function(f){
        if(!f.name||f.name==='website')return;
        data[f.name]=f.type==='checkbox'?(f.checked?'yes':'no'):(f.value||'').trim();
      });

      if(!endpoint){
        var subject=(type==='prayer'?'Prayer request':'Connect card')+' · CFC '+campusName;
        var lines=Object.keys(data).filter(function(k){return LABELS[k]&&data[k]}).map(function(k){return LABELS[k]+': '+data[k]});
        window.location.href='mailto:'+mailTo+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent('Campus: '+campusName+'\n'+lines.join('\n'));
        status.textContent='Opening your email app. Just hit send and we’ll receive it.';
        return;
      }
      var btn=$('button[type=submit]',form);
      btn.disabled=true;status.textContent='Sending…';
      fetch(endpoint,{method:'POST',mode:'no-cors',body:new URLSearchParams(data)})
        .then(function(){status.textContent='';form.reset();showDone()})
        .catch(function(){status.textContent='Something went wrong. Please email '+mailTo+' or call 507 455 3205.'})
        .then(function(){btn.disabled=false});
    });
  }
  [].slice.call(document.querySelectorAll('.live-form')).forEach(setupForm);
})();

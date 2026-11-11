/* "Let us know you're coming" form.
   - If the form has data-endpoint (a Make webhook URL), it posts there.
   - If data-endpoint is empty, it opens a pre-filled email instead, so it works before the webhook exists. */
(function(){
  var form=document.querySelector('.coming-form');
  if(!form) return;
  var status=form.querySelector('.coming-status');
  var endpoint=(form.getAttribute('data-endpoint')||'').trim();
  var mailTo=form.getAttribute('data-mailto')||'info@cfcmn.org';
  var campus=form.getAttribute('data-campus')||'';

  function say(msg){status.textContent=msg}

  form.addEventListener('submit',function(ev){
    ev.preventDefault();
    var fd=new FormData(form);
    if(fd.get('website')){say('Thanks! We’ll see you Sunday.');form.reset();return} // honeypot: bots only
    var data={campus:campus};
    ['name','email','phone','date','adults','kids','notes'].forEach(function(k){data[k]=(fd.get(k)||'').toString().trim()});

    if(!endpoint){
      var body='Hi! I’m planning to visit CFC '+campus+'.%0A%0AName: '+encodeURIComponent(data.name)+
        '%0AEmail: '+encodeURIComponent(data.email)+'%0APhone: '+encodeURIComponent(data.phone)+
        '%0ASunday: '+encodeURIComponent(data.date)+'%0AAdults: '+encodeURIComponent(data.adults)+
        '%0AKids (ages): '+encodeURIComponent(data.kids)+'%0AQuestions: '+encodeURIComponent(data.notes);
      window.location.href='mailto:'+mailTo+'?subject='+encodeURIComponent('Planning to visit CFC '+campus)+'&body='+body;
      say('Opening your email app. Just hit send and we’ll be in touch.');
      return;
    }

    var btn=form.querySelector('button[type=submit]');
    btn.disabled=true;say('Sending…');
    fetch(endpoint,{method:'POST',mode:'no-cors',body:new URLSearchParams(data)})
      .then(function(){say('Thanks! We’ll be in touch before Sunday.');form.reset()})
      .catch(function(){say('Something went wrong. Please email '+mailTo+' or call 507 455 3205.')})
      .then(function(){btn.disabled=false});
  });
})();

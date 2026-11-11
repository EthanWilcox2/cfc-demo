/* CFC events feed. Reads events.json (published from Planning Center Calendar),
   filters by campus, and renders the next few upcoming events.
   If the feed can't load, the static "View calendar" link in the HTML stays. */
(function(){
  var feed=document.querySelector('.event-feed');
  if(!feed) return;
  var campus=feed.getAttribute('data-campus'),
      limit=parseInt(feed.getAttribute('data-limit'),10)||4,
      calendar=feed.getAttribute('data-calendar'),
      src=feed.getAttribute('data-src'),
      tz='America/Chicago';

  function el(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e}
  function fmt(d,o){o.timeZone=tz;return new Intl.DateTimeFormat('en-US',o).format(d)}

  function render(data){
    var now=Date.now();
    var list=(data&&data.events||[]).filter(function(e){
      var end=new Date(e.end||e.start).getTime();
      return end>=now && (e.campus||[]).indexOf(campus)>-1;
    }).sort(function(a,b){return new Date(a.start)-new Date(b.start)}).slice(0,limit);

    feed.textContent='';
    if(!list.length){
      feed.appendChild(el('p','event-empty','No events posted yet for this campus. Check back soon, or see the full calendar.'));
    }else{
      var ul=el('ul','event-list');
      list.forEach(function(e){
        var s=new Date(e.start), en=e.end?new Date(e.end):null;
        var li=el('li','event-item');
        var row=el(e.url?'a':'div','event-row');
        if(e.url){row.href=e.url;row.target='_blank';row.rel='noreferrer'}
        var date=el('div','event-date');
        date.appendChild(el('small',null,fmt(s,{month:'short'})));
        date.appendChild(el('strong',null,fmt(s,{day:'numeric'})));
        var info=el('div','event-info');
        info.appendChild(el('strong',null,e.title));
        var t=fmt(s,{weekday:'long'})+' · '+fmt(s,{hour:'numeric',minute:'2-digit'});
        if(en) t+=' – '+fmt(en,{hour:'numeric',minute:'2-digit'});
        info.appendChild(el('span',null,t));
        row.appendChild(date);row.appendChild(info);
        if(e.url) row.appendChild(el('span','event-go','Details ↗'));
        li.appendChild(row);ul.appendChild(li);
      });
      feed.appendChild(ul);
    }
    if(calendar){
      var p=el('p','event-all');
      var a=el('a','text-link','See the full calendar ↗');
      a.href=calendar;a.target='_blank';a.rel='noreferrer';
      p.appendChild(a);feed.appendChild(p);
    }
  }

  if(window.CFC_EVENTS){render(window.CFC_EVENTS);return}
  fetch(src,{cache:'no-cache'}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(render).catch(function(){});
})();

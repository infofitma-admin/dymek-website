(function(){
"use strict";
var d=document, root=d.documentElement;
root.classList.add("js");
function $(s,c){return (c||d).querySelector(s)}
function $$(s,c){return Array.prototype.slice.call((c||d).querySelectorAll(s))}
function store(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}
var HOST=location.hostname||"";
var LIVE=/(^|\.)dymek\.com$|netlify\.app$/.test(HOST);          // real deployment: forms + embeds on
var CAN_EMBED=/^https?:$/.test(location.protocol)&&!/claude|anthropic|claudeusercontent/.test(HOST);

function toast(msg){var t=d.createElement("div");t.className="toast";t.setAttribute("role","status");t.textContent=msg;d.body.appendChild(t);setTimeout(function(){t.remove()},2400)}
function copy(text,btn){
  function done(){toast("Copied: "+text);if(btn){var o=btn.textContent;btn.textContent="Copied";setTimeout(function(){btn.textContent=o},1600)}}
  try{navigator.clipboard.writeText(text).then(done,function(){fallback()})}catch(e){fallback()}
  function fallback(){var r=d.createRange(),el=btn&&btn.previousElementSibling;if(el){r.selectNodeContents(el);var s=getSelection();s.removeAllRanges();s.addRange(r);toast("Selected. Press Ctrl+C to copy")}}
}
$$("[data-copy]").forEach(function(b){b.addEventListener("click",function(e){e.preventDefault();copy(b.getAttribute("data-copy"),b)})});

/* header: scrolled state + ruler gauge */
var head=$(".site-head"), ruler=$(".ruler");
function onScroll(){
  var y=scrollY, h=d.documentElement.scrollHeight-innerHeight;
  if(head) head.classList.toggle("scrolled",y>8);
  var tt=$(".to-top"); if(tt) tt.hidden=y<600;
}
addEventListener("scroll",onScroll,{passive:true}); onScroll();

/* dropdowns / mega menu */
var openBtn=null;
function closeMenus(except){$$(".nav-a[aria-expanded]").forEach(function(b){if(b!==except){b.setAttribute("aria-expanded","false");var p=d.getElementById(b.getAttribute("aria-controls"));if(p)p.hidden=true}});if(!except)openBtn=null}
$$(".nav-a[aria-controls]").forEach(function(b){
  var panel=d.getElementById(b.getAttribute("aria-controls")), li=b.parentElement, t;
  function open(){closeMenus(b);b.setAttribute("aria-expanded","true");panel.hidden=false;openBtn=b}
  function close(){b.setAttribute("aria-expanded","false");panel.hidden=true}
  b.addEventListener("click",function(e){e.preventDefault();b.getAttribute("aria-expanded")==="true"?close():open()});
  li.addEventListener("mouseenter",function(){if(matchMedia("(hover:hover)").matches){clearTimeout(t);open()}});
  li.addEventListener("mouseleave",function(){if(matchMedia("(hover:hover)").matches){t=setTimeout(close,180)}});
  li.addEventListener("focusout",function(e){if(!li.contains(e.relatedTarget))close()});
});
d.addEventListener("click",function(e){if(!e.target.closest(".nav"))closeMenus()});
d.addEventListener("keydown",function(e){if(e.key==="Escape"){if(openBtn){var b=openBtn;closeMenus();b.focus()}closeSearch();closeDrawer();if(window.DYMO)window.DYMO.close()}});

/* mobile drawer */
var drawer=$("#drawer");
function closeDrawer(){if(drawer&&!drawer.hidden){drawer.hidden=true;d.body.style.overflow="";var mb=$(".menu-btn");if(mb){mb.setAttribute("aria-expanded","false");mb.focus()}}}
$$(".menu-btn").forEach(function(b){b.addEventListener("click",function(){drawer.hidden=false;b.setAttribute("aria-expanded","true");d.body.style.overflow="hidden";var f=$("button,a",drawer);if(f)f.focus()})});
$$("[data-close-drawer]").forEach(function(b){b.addEventListener("click",closeDrawer)});

/* site search */
var ov=$("#search"), sin=$("#search-input"), list=$("#search-results"), sel=-1;
function esc(s){return s.replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function hl(text,q){if(!q)return esc(text);var re=new RegExp("("+q.split(/\s+/).filter(Boolean).map(function(w){return w.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}).join("|")+")","ig");return esc(text).replace(re,"<mark>$1</mark>")}
function search(q){
  var idx=window.DYMEK_INDEX||[]; q=(q||"").trim().toLowerCase();
  var words=q.split(/\s+/).filter(Boolean), out=[];
  if(!words.length){out=idx.filter(function(p){return p.f}).slice(0,8)}
  else idx.forEach(function(p){var s=0,t=p.t.toLowerCase(),b=(p.d+" "+p.k).toLowerCase(),ok=true;
    words.forEach(function(w){var a=t.indexOf(w)>-1?6:0,c=b.indexOf(w)>-1?2:0;if(!a&&!c)ok=false;s+=a+c});
    if(ok)out.push({p:p,s:s})}),out=out.sort(function(a,b){return b.s-a.s}).slice(0,12).map(function(x){return x.p});
  sel=-1;
  list.innerHTML=out.length?out.map(function(p){return '<li><a href="'+p.u+'"><span>'+esc(p.c)+'</span><b>'+hl(p.t,q)+'</b><small>'+hl(p.d,q)+'</small></a></li>'}).join(""):'<li class="sr-empty">No pages match “'+esc(q)+'”. Try “bonding”, “X-ray”, “interferometer” or “careers”.</li>';
}
function openSearch(){if(!ov)return;ov.hidden=false;d.body.style.overflow="hidden";sin.value="";search("");setTimeout(function(){sin.focus()},10)}
function closeSearch(){if(ov&&!ov.hidden){ov.hidden=true;d.body.style.overflow=""}}
$$("[data-search]").forEach(function(b){b.addEventListener("click",openSearch)});
if(ov){ov.addEventListener("click",function(e){if(e.target===ov)closeSearch()});
  sin.addEventListener("input",function(){search(sin.value)});
  sin.addEventListener("keydown",function(e){var a=$$("a",list);if(!a.length)return;
    if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();sel=(sel+(e.key==="ArrowDown"?1:-1)+a.length)%a.length;a.forEach(function(x,i){x.classList.toggle("on",i===sel)});a[sel].scrollIntoView({block:"nearest"})}
    if(e.key==="Enter"){e.preventDefault();location.href=(a[sel<0?0:sel]).getAttribute("href")}})}
d.addEventListener("keydown",function(e){var tag=(e.target.tagName||"").toLowerCase();if(((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k")||(e.key==="/"&&!/input|textarea|select/.test(tag))){e.preventDefault();openSearch()}});

$$(".to-top").forEach(function(b){b.addEventListener("click",function(){scrollTo({top:0,behavior:"smooth"})})});

/* TOC scrollspy */
var toc=$$(".toc a[href^='#']");
if(toc.length&&"IntersectionObserver" in window){
  var map={};toc.forEach(function(a){map[a.getAttribute("href").slice(1)]=a});
  var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){toc.forEach(function(a){a.classList.remove("on")});var a=map[en.target.id];if(a)a.classList.add("on")}})},{rootMargin:"-30% 0px -60% 0px"});
  Object.keys(map).forEach(function(id){var s=d.getElementById(id);if(s)io.observe(s)});
}

/* buttons: rolling label instead of trailing arrows */
function setLabel(b,text){b.textContent="";var o=d.createElement("span");o.className="bl";o.setAttribute("data-t",text);var i=d.createElement("span");i.textContent=text;o.appendChild(i);b.appendChild(o)}
$$(".btn").forEach(function(b){if(b.querySelector(".bl,span,img,svg"))return;var t=b.textContent.trim();if(t)setLabel(b,t)});

/* finder (fit check) */
var fdata=window.DYMEK_FINDER;
if(fdata&&$("#finder")){
  var chips=$$("#finder .chips[role=tablist] .chip"), panel=$("#finder-panel");
  function show(i){var it=fdata[i];chips.forEach(function(c,j){c.setAttribute("aria-selected",String(i===j));c.tabIndex=i===j?0:-1});
    $("#fp-title",panel).textContent=it.t; $("#fp-desc",panel).textContent=it.d;
    $("#fp-list",panel).innerHTML=it.l.map(function(x){return "<li>"+esc(x)+"</li>"}).join("");
    var a=$("#fp-link",panel); a.href=it.u; setLabel(a,"Explore "+it.s);
    var im=$("#fp-img",panel); if(im&&it.img) im.src="assets/ill/"+it.img+".webp?v=5";
    var subs=$("#fp-subs",panel); subs.innerHTML=(it.sub||[]).map(function(s){return '<a class="chip" href="'+s[1]+'">'+esc(s[0])+'</a>'}).join(""); subs.hidden=!(it.sub&&it.sub.length);
  }
  chips.forEach(function(c,i){c.addEventListener("click",function(){show(i)});
    c.addEventListener("keydown",function(e){if(/Arrow(Right|Left|Down|Up)/.test(e.key)){e.preventDefault();var n=(i+(/Right|Down/.test(e.key)?1:-1)+chips.length)%chips.length;chips[n].focus();show(n)}})});
  fdata.forEach(function(it){if(it.img){var p=new Image();p.src="assets/ill/"+it.img+".webp?v=5"}});
  show(0);
}

/* industry tabs */
$$("[data-tabs]").forEach(function(w){
  var tabs=$$("[role=tab]",w), pans=$$("[role=tabpanel]",w);
  function act(i,focus){tabs.forEach(function(t,j){t.setAttribute("aria-selected",String(i===j));t.tabIndex=i===j?0:-1});pans.forEach(function(p,j){p.classList.toggle("on",i===j)});if(focus)tabs[i].focus()}
  tabs.forEach(function(t,i){t.addEventListener("click",function(){act(i);if(innerWidth<900)pans[i].scrollIntoView({block:"start",behavior:"smooth"})});
    t.addEventListener("keydown",function(e){if(/Arrow(Down|Up|Right|Left)/.test(e.key)){e.preventDefault();act((i+(/Down|Right/.test(e.key)?1:-1)+tabs.length)%tabs.length,true)}})});
  w._act=function(id){pans.forEach(function(p,j){if(p.id===id)act(j)})};
});
/* horizontal rail */
$$(".rail").forEach(function(r){
  var sec=r.closest(".wrap"), bar=$(".rail-prog i",sec);
  function upd(){var m=r.scrollWidth-r.clientWidth;if(bar)bar.style.width=(m>0?Math.max(12,(r.scrollLeft+r.clientWidth)/r.scrollWidth*100):100)+"%"}
  r.addEventListener("scroll",upd,{passive:true});upd();
  $$("[data-rail]",sec).forEach(function(b){b.addEventListener("click",function(){r.scrollBy({left:(+b.dataset.rail)*(r.firstElementChild.offsetWidth+24),behavior:"smooth"})})});
});
/* deep links into accordions / tabs / rail */
function reveal(id){var el=id&&d.getElementById(id);if(!el)return;
  if(el.tagName==="DETAILS")el.open=true;
  var tw=el.closest("[data-tabs]");if(tw&&tw._act)tw._act(id);
  if(el.closest(".rail"))el.scrollIntoView({inline:"start",block:"nearest"});
}
addEventListener("hashchange",function(){reveal(location.hash.slice(1))});
reveal(location.hash.slice(1));
d.addEventListener("click",function(e){var a=e.target.closest('a[href^="#"]');if(a)reveal(a.getAttribute("href").slice(1))});

/* section spy for checklists, notebooks, platter */
if("IntersectionObserver" in window){
  var spyNav=$$(".L-check .panel nav a, .L-note .margin nav a"), tracks=$$(".track"), platter=$(".platter");
  var spyTargets=spyNav.map(function(a){return d.getElementById(a.getAttribute("href").slice(1))}).filter(Boolean).concat(tracks);
  if(spyTargets.length){var so=new IntersectionObserver(function(es){es.forEach(function(en){if(!en.isIntersecting)return;var id=en.target.id;
      spyNav.forEach(function(a){a.classList.toggle("on",a.getAttribute("href")==="#"+id)});
      if(en.target.classList.contains("track")){tracks.forEach(function(t){t.classList.toggle("on",t===en.target)});if(platter)platter.style.setProperty("--t",en.target.dataset.t)}
    })},{rootMargin:"-35% 0px -55% 0px"});spyTargets.forEach(function(t){so.observe(t)})}
  var rv=$$(".rv");
  var ro=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){en.target.classList.add("in");ro.unobserve(en.target)}})},{rootMargin:"0px 0px -8% 0px"});
  rv.forEach(function(el){ro.observe(el)});
}else{$$(".rv").forEach(function(el){el.classList.add("in")})}

/* map: markers <-> office cards */
$$(".dmap-block").forEach(function(block){
  var ms=$$(".d-marker",block), cards=$$(".office",block);
  function act(id,scroll){ms.forEach(function(m){m.classList.toggle("on",m.dataset.id===id)});cards.forEach(function(c){var on=c.dataset.id===id;c.classList.toggle("on",on);if(on&&scroll)c.scrollIntoView({block:"nearest",behavior:"smooth"})})}
  ms.forEach(function(m){m.addEventListener("click",function(){act(m.dataset.id,true)});m.addEventListener("mouseenter",function(){act(m.dataset.id,false)})});
  cards.forEach(function(c){c.addEventListener("mouseenter",function(){act(c.dataset.id,false)});c.addEventListener("focus",function(){act(c.dataset.id,false)});c.addEventListener("click",function(){act(c.dataset.id,false)})});
});

/* blog filter */
var bl=$("#blog-list");
if(bl){var cs=$$(".blog-cats .chip"), q=$("#blog-q"), cat="All";
  function filt(){var s=(q.value||"").toLowerCase(),n=0;$$("[data-cat]",bl).forEach(function(c){var ok=(cat==="All"||c.dataset.cat===cat)&&(!s||c.textContent.toLowerCase().indexOf(s)>-1);c.hidden=!ok;if(ok)n++});$("#blog-empty").hidden=n>0}
  cs.forEach(function(c){c.addEventListener("click",function(){cat=c.dataset.c;cs.forEach(function(x){x.setAttribute("aria-pressed",String(x===c))});filt()})});
  q.addEventListener("input",filt);
}

/* forms */
$$("form[data-form]").forEach(function(f){
  var status=$(".form-status",f.parentElement)||$(".form-status",f);
  f.addEventListener("submit",function(e){
    e.preventDefault(); var bad=null;
    $$("[required]",f).forEach(function(inp){var fl=inp.closest(".field"),ok=inp.checkValidity();if(fl)fl.classList.toggle("invalid",!ok);if(!ok&&!bad)bad=inp});
    if(bad){bad.focus();return}
    var btn=$("button[type=submit]",f); btn.disabled=true; var label=btn.innerHTML; btn.textContent="Sending…";
    function msg(cls,html){status.className="form-status notice "+cls;status.innerHTML=html;status.hidden=false;status.scrollIntoView({block:"nearest",behavior:"smooth"})}
    if(!LIVE){
      btn.disabled=false; btn.innerHTML=label;
      if(f.hasAttribute("data-gate")){f.dispatchEvent(new CustomEvent("dymek:sent",{detail:new FormData(f)}));return}
      msg("info","<b>This preview isn’t connected to an inbox.</b><span>On the live site this form goes straight to our team. For now, please email <strong>"+f.dataset.to+"</strong> with your message.</span>");
      return;
    }
    var fd=new FormData(f);
    var done=function(){f.dispatchEvent(new CustomEvent("dymek:sent",{detail:fd}));if(f.hasAttribute("data-gate"))return;f.reset();msg("ok","<b>Thank you. Your message has reached our team.</b><span>"+(f.dataset.ok||"We will review your inquiry and respond as soon as possible.")+"</span>")};
    if(fd.get("company_url")){done();btn.disabled=false;btn.innerHTML=label;return}   /* honeypot: silently accept bots */
    /* 1) email delivery to web@dymek.com via FormSubmit */
    var mail=new FormData();
    fd.forEach(function(v,k){if(k==="form-name"||k==="company_url")return;if(v instanceof File&&!v.name)return;mail.append(k,v)});
    mail.append("_subject",(f.dataset.subject||(f.getAttribute("name")==="careers"?"New job application":"New website enquiry"))+" from "+(fd.get("name")||"website visitor"));
    mail.append("_template","table");mail.append("_captcha","false");
    if(fd.get("email"))mail.append("_replyto",fd.get("email"));
    var W3F_KEY="b6a82774-3c24-4790-bfef-8705a4bdb606";  /* Web3Forms access key for web@dymek.com */
    if(W3F_KEY){
      var w=new FormData(); mail.forEach(function(v,k){if(k.charAt(0)!=="_"&&!(v instanceof File))w.append(k,v)});
      w.append("access_key",W3F_KEY); w.append("subject",mail.get("_subject")); w.append("from_name","Dymek website");
      if(fd.get("email"))w.append("replyto",fd.get("email"));
      var cv=fd.get("cv"); if(cv&&cv.name)w.append("cv_file","Attached CV ("+cv.name+") is saved in Netlify > dymek-site > Forms > careers");
    }
    function sendW3F(n){return fetch("https://api.web3forms.com/submit",{method:"POST",headers:{Accept:"application/json"},body:w})
      .then(function(r){return r.json()}).then(function(j){if(!j.success)throw j;return true})
      .catch(function(){if(n>0)return new Promise(function(res){setTimeout(res,1500)}).then(function(){return sendW3F(n-1)});return false})}
    function sendMail(n){var ac=window.AbortController?new AbortController():null;var t=ac&&setTimeout(function(){ac.abort()},9000);
      return fetch("https://formsubmit.co/ajax/"+f.dataset.to,{method:"POST",headers:{Accept:"application/json"},body:mail,signal:ac?ac.signal:undefined})
      .then(function(r){clearTimeout(t);return r})
      .then(function(r){return r.json()}).then(function(j){if(String(j.success)!=="true")throw j;return true})
      .catch(function(e){if(n>0)return new Promise(function(res){setTimeout(res,n===2?1200:2500)}).then(function(){return sendMail(n-1)});return false})}
    var toMail=W3F_KEY?sendW3F(2):sendMail(2);
    /* 2) backup copy in the Netlify Forms dashboard (best effort) */
    var nbody=f.enctype==="multipart/form-data"?fd:new URLSearchParams(fd).toString();
    var toNetlify=fetch("/",{method:"POST",headers:f.enctype==="multipart/form-data"?{}:{"Content-Type":"application/x-www-form-urlencoded"},body:nbody}).then(function(r){return r.ok}).catch(function(){return false});
    /* success when either channel has the submission: email (web@dymek.com) or the Netlify Forms inbox */
    Promise.all([toMail,toNetlify]).then(function(r){if(!r[0]&&!r[1])throw 0;done()})
      .catch(function(){msg("bad","<b>We couldn’t send your message.</b><span>Please check your connection and try again, or email <strong>"+f.dataset.to+"</strong>.</span>")})
      .then(function(){btn.disabled=false;btn.innerHTML=label});
  });
  $$("input,textarea,select",f).forEach(function(i){i.addEventListener("input",function(){var fl=i.closest(".field");if(fl&&fl.classList.contains("invalid")&&i.checkValidity())fl.classList.remove("invalid")})});
});

/* share */
$$("[data-share]").forEach(function(a){var u=encodeURIComponent(a.dataset.url||location.href),t=encodeURIComponent(d.title);
  a.href=a.dataset.share==="linkedin"?"https://www.linkedin.com/sharing/share-offsite/?url="+u:a.dataset.share==="x"?"https://twitter.com/intent/tweet?url="+u+"&text="+t:a.href});


/* ---------- home motion: scroll-linked hero, statement, pinned process, index preview ---------- */
var still=matchMedia("(prefers-reduced-motion:reduce)").matches;
function clamp(v){return v<0?0:v>1?1:v}
var grow=$("[data-grow]"), say=$("[data-words]"), pin=$("[data-pin]"), words=[];
if(say){
  (function split(el){Array.prototype.slice.call(el.childNodes).forEach(function(n){
    if(n.nodeType===3){var f=d.createDocumentFragment();n.textContent.split(/(\s+)/).forEach(function(w){if(!w)return;if(/^\s+$/.test(w)){f.appendChild(d.createTextNode(w));return}var sp=d.createElement("span");sp.className="w";sp.textContent=w;f.appendChild(sp);words.push(sp)});el.replaceChild(f,n)}
    else if(n.nodeType===1){n.classList.add("w");words.push(n)}
  })})(say);
  say.classList.add("is-split");
}
var counted=false;
  function count(){if(counted)return;counted=true;$$("[data-count]",say).forEach(function(c){var to=+c.dataset.count,from=to>1000?new Date().getFullYear():0,t0=0;
    if(still){c.textContent=to;return}
    function step(t){if(!t0)t0=t;var k=clamp((t-t0)/1400);k=1-Math.pow(1-k,3);c.textContent=Math.round(from+(to-from)*k);if(k<1)requestAnimationFrame(step)}requestAnimationFrame(step)})}
var pinOn=false;
function pinSize(){if(!pin)return;var track=$(".pin-track",pin);pinOn=!still&&innerWidth>=960;pin.classList.toggle("on",pinOn);
  if(pinOn){var extra=Math.max(0,track.scrollWidth-innerWidth+innerWidth*.12);pin.style.height=(innerHeight+extra)+"px";pin._extra=extra}else{pin.style.height="";track.style.transform=""}}
function motion(){
  var vh=innerHeight;
  if(grow){var r=grow.getBoundingClientRect();grow.style.setProperty("--p",still?1:clamp((vh-r.top)/(vh*.95)).toFixed(3))}
  if(say&&words.length){var r2=say.getBoundingClientRect(),k=still?1:clamp((vh*.85-r2.top)/(r2.height+vh*.35)),n=Math.round(k*words.length);
    words.forEach(function(w,i){w.classList.toggle("on",i<n)});if(r2.top<vh*.8)count()}
  if(pin&&pinOn){var r3=pin.getBoundingClientRect(),k3=clamp(-r3.top/(pin._extra||1));
    $(".pin-track",pin).style.transform="translate3d("+(-k3*pin._extra).toFixed(1)+"px,0,0)";pin.style.setProperty("--k",k3.toFixed(3));
    $$(".pin-step",pin).forEach(function(st){var b=st.getBoundingClientRect();st.classList.toggle("on",b.left<innerWidth*.75&&b.right>innerWidth*.3)})}
}
var ticking=false;
function onMotion(){if(!ticking){ticking=true;requestAnimationFrame(function(){ticking=false;motion()})}}
if(grow||say||pin){pinSize();motion();addEventListener("scroll",onMotion,{passive:true});addEventListener("resize",function(){pinSize();motion()})}

var fl=$(".ix-float");
if(fl&&matchMedia("(hover:hover) and (pointer:fine)").matches){var fi=$("img",fl);
  $$(".ix-index a").forEach(function(a){
    a.addEventListener("mouseenter",function(){fi.src=a.dataset.img;fl.classList.add("on")});
    a.addEventListener("mouseleave",function(){fl.classList.remove("on")});
    a.addEventListener("mousemove",function(e){fl.style.transform="translate3d("+(e.clientX+24)+"px,"+(e.clientY-110)+"px,0)"});
  })}

$$("[data-year]").forEach(function(s){s.textContent=new Date().getFullYear()});
})();

/* Careers: "Apply" on a role pre-fills the role field */
(function(){var d=document;d.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a[data-role]");if(!a)return;var f=d.getElementById("j-role");if(f){f.value=a.getAttribute("data-role");setTimeout(function(){try{f.focus({preventScroll:true})}catch(_){}},400)}})})();

/* Partners directory: search + filter */
(function(){var g=document.getElementById("pd-grid");if(!g)return;var q=document.getElementById("pd-q"),n=document.getElementById("pd-n"),em=document.getElementById("pd-empty"),fs=[].slice.call(document.querySelectorAll(".pd-f")),tiles=[].slice.call(g.querySelectorAll(".pd-tile")),cur="all";
function run(){var t=(q.value||"").trim().toLowerCase(),c=0;tiles.forEach(function(el){var ok=(cur==="all"||el.dataset.cat.indexOf("|"+cur+"|")>-1)&&(!t||el.dataset.name.indexOf(t)>-1||el.textContent.toLowerCase().indexOf(t)>-1);el.hidden=!ok;if(ok)c++});n.textContent=c;em.hidden=c>0}
fs.forEach(function(b){b.addEventListener("click",function(){fs.forEach(function(x){x.classList.toggle("on",x===b);x.setAttribute("aria-pressed",x===b)});cur=b.dataset.f;run()})});q.addEventListener("input",run);var sl=document.getElementById("pd-ind");if(sl)sl.addEventListener("change",function(){cur=sl.value;run()})})();
/* About: memories lightbox */
(function(){var box=document.querySelector('.mm-box');if(!box)return;var btns=[].slice.call(document.querySelectorAll('.mm-open')),img=box.querySelector('img'),cur=0,last=null;
function show(i){cur=(i+btns.length)%btns.length;var b=btns[cur],im=b.querySelector('img');img.src=im.src;img.alt=im.alt}
function open(i){last=document.activeElement;show(i);box.hidden=false;document.body.style.overflow='hidden';box.querySelector('.mm-x').focus()}
function close(){box.hidden=true;document.body.style.overflow='';if(last)last.focus()}
btns.forEach(function(b,i){b.addEventListener('click',function(){open(i)})});
box.querySelector('.mm-x').addEventListener('click',close);box.querySelector('.mm-prev').addEventListener('click',function(){show(cur-1)});box.querySelector('.mm-next').addEventListener('click',function(){show(cur+1)});
box.addEventListener('click',function(e){if(e.target===box)close()});
document.addEventListener('keydown',function(e){if(box.hidden)return;if(e.key==='Escape')close();if(e.key==='ArrowLeft')show(cur-1);if(e.key==='ArrowRight')show(cur+1)});})();
/* Home: project ruler fills as the section scrolls */
(function(){var s=document.querySelector('[data-proj]');if(!s)return;var marks=[].slice.call(s.querySelectorAll('.pr-mark')),steps=[].slice.call(s.querySelectorAll('.proj-step'));
function upd(){var r=s.getBoundingClientRect(),vh=innerHeight,k=Math.min(1,Math.max(0,(vh*.85-r.top)/(r.height*.75)));s.style.setProperty('--k',k.toFixed(3));
marks.forEach(function(m,i){var on=k>=(i*2+1)/12;m.classList.toggle('on',on);if(steps[i])steps[i].classList.toggle('on',on&&k<(i*2+3)/12)})}
upd();addEventListener('scroll',upd,{passive:true});addEventListener('resize',upd)})();

/* ===== Resources features: quote basket, brochure reader, nearest office, language ===== */
(function(){
var d=document,$=function(s,c){return(c||d).querySelector(s)},$$=function(s,c){return[].slice.call((c||d).querySelectorAll(s))};
function get(k){try{return localStorage.getItem(k)}catch(e){return null}}
function put(k,v){try{localStorage.setItem(k,v)}catch(e){}}
var esc=function(s){return String(s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};

/* --- Request-a-quote basket (stored per browser) --- */
var PR={"3d-micromac":["3D-Micromac","assets/partners/3d-micromac.png"],"4d":["4D Technology","assets/partners/4d.png"],"amerimade-technology":["Amerimade","assets/partners/amerimade-technology.png"],"ap-s-international":["AP&S","assets/partners/ap-s-international.png"],"beneq":["Beneq","assets/partners/beneq.png"],"boffotto-semiconductor":["Boffotto Semiconductor","assets/partners/boffotto-semiconductor.png"],"cortex-robotics":["Cortex Robotics","assets/partners/cortex-robotics.png"],"daeil-systems":["Daeil Systems","assets/partners/daeil-systems.png"],"delcom-instruments":["Delcom Instruments","assets/partners/delcom-instruments.png"],"dexforce":["DexForce","assets/partners/dexforce.svg"],"elveflow":["Elveflow","assets/partners/elveflow.png"],"evg":["EV Group","assets/partners/evg.svg"],"thermofisher":["Thermo Fisher Scientific (FEI)","assets/partners/thermofisher.png"],"film-sense":["Film Sense","assets/partners/film-sense.png"],"first-nano":["First Nano",""],"gigascan-technologies":["GigaScan Technologies","assets/partners/gigascan-technologies.png"],"herz":["Herz","assets/partners/herz.png"],"herzan":["Herzan","assets/partners/herzan.png"],"hisol":["HiSOL","assets/partners/hisol.png"],"ilis":["ilis","assets/partners/ilis.png"],"i-photonics":["i-Photonics","assets/partners/i-photonics.svg"],"jandel-engineering":["Jandel Engineering","assets/partners/jandel-engineering.svg"],"jfp-microtechnic":["JFP Microtechnic","assets/partners/jfp-microtechnic.png"],"kla":["KLA MicroSense","assets/partners/filmetrics.png"],"langer-emv-technik":["Langer EMV-Technik","assets/partners/langer-emv-technik.png"],"lesco":["LESCO",""],"lynxx":["Lynxx",""],"marposs-solarius":["Marposs","assets/partners/marposs-solarius.svg"],"mecademic":["Mecademic","assets/partners/mecademic.png"],"microview":["Microview","assets/partners/microview.png"],"mks-instruments":["MKS Instruments","assets/partners/mks-instruments.svg"],"moorfield-nanotechnology":["Moorfield Nanotechnology","assets/partners/moorfield-nanotechnology.png"],"nanotronics":["Nanotronics Inspection Systems","assets/partners/nanotronics-inspection-systems.svg"],"n-k-technology":["n&k Technology","assets/partners/n-k-technology.png"],"nyli-metrology":["NYLI Metrology","assets/partners/nyli-metrology.svg"],"opto-alignment":["Opto-Alignment","assets/partners/opto-alignment.png"],"otsuka-electronics":["Otsuka Electronics","assets/partners/otsuka-electronics.png"],"picoquant":["PicoQuant","assets/partners/picoquant.svg"],"plsintec":["PLSINTEC","assets/partners/plsintec.png"],"polyteknik-as":["Polyteknik","assets/partners/polyteknik-as.svg"],"p-tech-2000":["P&TECH 2000","assets/partners/p-tech-2000.png"],"raditech":["Raditech","assets/partners/raditech.png"],"redlux":["RedLux","assets/partners/redlux.svg"],"rtec-instruments":["Rtec Instruments","assets/partners/rtec-instruments.svg"],"sec-co-ltd":["SEC","assets/partners/sec-co-ltd.png"],"sonix":["Sonix","assets/partners/sonix.png"],"stefan-mayer-instruments":["Stefan Mayer Instruments","assets/partners/stefan-mayer-instruments.png"],"swiss-cluster":["Swiss Cluster","assets/partners/swiss-cluster.svg"],"tau-science":["Tau Science",""],"the-scatter-works":["The Scatter Works","assets/partners/the-scatter-works.png"],"thetametrisis":["ThetaMetrisis","assets/partners/thetametrisis.png"],"tystar":["Tystar","assets/partners/tystar.png"]};
var QK="dymek-rfq";
function q(){try{return(JSON.parse(get(QK)||"[]")||[]).filter(function(id){return PR[id]})}catch(e){return[]}}
function setQ(a){put(QK,JSON.stringify(a));render(true)}
function toggle(id){var a=q(),i=a.indexOf(id);if(i<0)a.push(id);else a.splice(i,1);setQ(a)}
var pill=null;
function render(bump){
  var a=q();
  if(!/quote\.html$/.test(location.pathname)){
    if(!pill){pill=d.createElement("a");pill.className="q-pill";pill.href="quote.html";d.body.appendChild(pill)}
    pill.innerHTML='<i>'+a.length+'</i>Quote list';pill.hidden=!a.length;pill.setAttribute("aria-label","Quote list, "+a.length+" principal"+(a.length===1?"":"s")+" selected");
    if(bump){pill.classList.remove("pop");void pill.offsetWidth;pill.classList.add("pop")}
  }
  $$("[data-q]").forEach(function(b){var on=a.indexOf(b.dataset.q)>-1;b.setAttribute("aria-pressed",String(on));b.innerHTML=on?"✓ In quote list":"+ Add to quote"});
  var list=$("#q-items");if(list){
    list.innerHTML=a.length?a.map(function(id){return'<li>'+(PR[id][1]?'<img src="'+PR[id][1]+'" alt="">':'<span class="q-wm">'+esc(PR[id][0].charAt(0))+'</span>')+'<b>'+esc(PR[id][0])+'</b><button type="button" data-rm="'+id+'">Remove</button></li>'}).join(""):'<li class="q-empty" style="background:none;padding:0">No principals selected yet. Pick from the list below, or simply describe what you need in the form.</li>';
    var h=$("#q-field");if(h)h.value=a.map(function(id){return PR[id][0]}).join(", ")||"Not specified";
    $$(".q-pick button").forEach(function(b){b.setAttribute("aria-pressed",String(a.indexOf(b.dataset.pick)>-1))});
  }
}
$$(".pd-tile").forEach(function(t){if(!PR[t.id])return;var b=d.createElement("button");b.type="button";b.className="pd-add";b.dataset.q=t.id;var v=$(".pd-visit",t);t.insertBefore(b,v||null)});
var pk=$(".q-pick");if(pk)pk.innerHTML=Object.keys(PR).map(function(id){return'<button type="button" data-pick="'+id+'">'+esc(PR[id][0])+'</button>'}).join("");
d.addEventListener("click",function(e){var t=e.target.closest("[data-q],[data-pick],[data-rm]");if(!t)return;toggle(t.dataset.q||t.dataset.pick||t.dataset.rm)});
var qf=$("form[name=quote]");if(qf)qf.addEventListener("dymek:sent",function(){setTimeout(function(){setQ([])},50)});
render(false);

/* --- Brochure reader with a details gate (like FlipLink) --- */
var gate=$("#gate"),fb=$("#fb");
if(gate&&fb){
  var BK="dymek-brochure-ok",cur=null,pages=[],spread=0,busy=false,single=false;
  var book=$(".fb-book",fb),L=$(".fb-side.l",fb),R=$(".fb-side.r",fb),leaf=$(".fb-leaf",fb),F=$(".f",leaf),B=$(".b",leaf),rng=$("#fb-r",fb),cnt=$("#fb-c",fb),prev=$(".fb-nav.p",fb),next=$(".fb-nav.n",fb);
  var opener=null;
  function url(i){return i>=0&&i<pages.length?'url("'+pages[i]+'")':"none"}
  function setSide(el,i){el.style.backgroundImage=url(i);el.classList.toggle("blank",!(i>=0&&i<pages.length))}
  function maxS(){return single?pages.length-1:Math.floor(pages.length/2)}
  function lr(s){return single?[-1,s]:[2*s-1,2*s]}
  function paint(){var p=lr(spread);setSide(L,p[0]);setSide(R,p[1]);leaf.hidden=true;
    rng.max=maxS();rng.value=spread;var a=p[0]+1,b=p[1]+1;cnt.textContent=(single?(spread+1):(a>0&&b<=pages.length?a+"–"+b:(a>0?a:b)))+" / "+pages.length;
    prev.disabled=spread<=0;next.disabled=spread>=maxS()}
  function go(to,anim){to=Math.max(0,Math.min(maxS(),to));if(to===spread||busy)return;
    if(single||!anim||Math.abs(to-spread)>1||matchMedia("(prefers-reduced-motion:reduce)").matches){spread=to;paint();return}
    busy=true;var fwd=to>spread,c=lr(spread),n=lr(to);
    leaf.className="fb-leaf"+(fwd?"":" back");leaf.hidden=false;
    if(fwd){setSide(R,n[1]);F.style.backgroundImage=url(c[1]);B.style.backgroundImage=url(n[0])}
    else{setSide(L,n[0]);B.style.backgroundImage=url(c[0]);F.style.backgroundImage=url(n[1])}
    void leaf.offsetWidth;leaf.classList.add("turn");
    var fin=function(){if(!busy)return;busy=false;spread=to;paint()};leaf.addEventListener("transitionend",fin,{once:true});setTimeout(fin,900)}
  function mode(){var s=innerWidth<820||innerHeight>innerWidth;if(s!==single){var p=lr(spread),first=Math.max(0,p[0]>=0?p[0]:p[1]);single=s;book.classList.toggle("single",s);spread=s?first:Math.floor((first+1)/2)}paint()}
  function openBook(card){cur=card;var n=+card.dataset.pages,base=card.dataset.base;pages=[];for(var i=1;i<=n;i++)pages.push(base+"p"+(i<10?"0":"")+i+".webp");
    pages.forEach(function(u,i){if(i<6){var im=new Image();im.src=u}});
    $(".fb-top b",fb).textContent=card.dataset.title;spread=0;single=null;fb.hidden=false;d.documentElement.style.overflow="hidden";mode();setTimeout(function(){pages.forEach(function(u){var im=new Image();im.src=u})},800);$(".fb-x",fb).focus()}
  function closeBook(){fb.hidden=true;d.documentElement.style.overflow="";if(opener&&opener.focus)opener.focus()}
  function openGate(card){cur=card;$("#g-title").value=card.dataset.title;$(".gate-side img",gate).src=card.dataset.cover;$(".gate-side b",gate).textContent=card.dataset.title;gate.hidden=false;d.documentElement.style.overflow="hidden";setTimeout(function(){$("input:not([type=hidden]):not([tabindex])",gate).focus()},30)}
  function closeGate(){gate.hidden=true;d.documentElement.style.overflow=""}
  $$("[data-brochure]").forEach(function(b){b.addEventListener("click",function(e){e.preventDefault();opener=b;var card=$(b.dataset.brochure);if(get(BK))openBook(card);else openGate(card)})});
  $("form",gate).addEventListener("dymek:sent",function(){put(BK,"1");closeGate();setTimeout(function(){openBook(cur)},120)});
  $$("[data-gate-close]",gate).forEach(function(b){b.addEventListener("click",closeGate)});
  gate.addEventListener("click",function(e){if(e.target===gate)closeGate()});
  $(".fb-x",fb).addEventListener("click",closeBook);
  prev.addEventListener("click",function(){go(spread-1,true)});next.addEventListener("click",function(){go(spread+1,true)});
  rng.addEventListener("input",function(){go(+rng.value,false)});
  L.addEventListener("click",function(){go(spread-1,true)});R.addEventListener("click",function(){go(spread+1,true)});
  d.addEventListener("keydown",function(e){if(!fb.hidden){if(e.key==="ArrowRight")go(spread+1,true);else if(e.key==="ArrowLeft")go(spread-1,true);else if(e.key==="Escape")closeBook()}else if(!gate.hidden&&e.key==="Escape")closeGate()});
  var sx=null;$(".fb-stage",fb).addEventListener("touchstart",function(e){sx=e.touches[0].clientX},{passive:true});
  $(".fb-stage",fb).addEventListener("touchend",function(e){if(sx===null)return;var dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>40)go(spread+(dx<0?1:-1),true);sx=null});
  addEventListener("resize",function(){if(!fb.hidden)mode()});
}

/* --- Nearest office from the visitor's location --- */
var nb=$("[data-near]");
if(nb){
  var OF={"hong-kong":[22.371,114.113,"Hong Kong"],"beijing":[39.735,116.143,"Beijing"],"shanghai":[31.255,121.625,"Shanghai"],"dongguan":[23.003,113.752,"Dongguan"],"hsinchu":[24.808,121.012,"Hsinchu"],"penang":[5.33,100.28,"Penang"],"singapore":[1.375,103.85,"Singapore"],"pathum-thani":[14.07,100.6,"Pathum Thani"],"hanoi":[20.99,105.84,"Hanoi"],"manila-muntinlupa":[14.42,121.04,"Muntinlupa (Manila)"]};
  var nm=$(".near-msg");
  function km(a,b,c,e){var r=Math.PI/180,x=Math.sin((c-a)*r/2),y=Math.sin((e-b)*r/2),h=x*x+Math.cos(a*r)*Math.cos(c*r)*y*y;return 12742*Math.asin(Math.sqrt(h))}
  nb.addEventListener("click",function(){
    if(!navigator.geolocation){nm.hidden=false;nm.textContent="Your browser can’t share a location. Please pick an office from the map.";return}
    nb.disabled=true;nm.hidden=false;nm.textContent="Finding your nearest office…";
    navigator.geolocation.getCurrentPosition(function(p){
      var best=null,bd=1e9;Object.keys(OF).forEach(function(id){var o=OF[id],k=km(p.coords.latitude,p.coords.longitude,o[0],o[1]);if(k<bd){bd=k;best=id}});
      $$(".office.near").forEach(function(o){o.classList.remove("near")});
      var mk=$('.d-marker[data-id="'+best+'"]'),card=$('.office[data-id="'+best+'"]');if(mk)mk.click();if(card){card.classList.add("near");card.scrollIntoView({block:"center",behavior:"smooth"})}
      nm.textContent="Your nearest office is "+OF[best][2]+", about "+(bd<10?"under 10":Math.round(bd/10)*10)+" km away.";nb.disabled=false;
    },function(){nm.textContent="We couldn’t get your location. Please allow location access, or pick an office from the map.";nb.disabled=false},{timeout:10000,maximumAge:600000});
  });
}

/* --- Language menu: AI localisation (pre-translated dictionaries + cached API fallback) --- */
var LANGS=[["en","English","EN"],["zh-CN","简体中文","简"],["zh-TW","繁體中文","繁"],["th","ไทย","TH"],["ms","Bahasa Melayu","MS"],["vi","Tiếng Việt","VI"],["id","Bahasa Indonesia","ID"],["ja","日本語","JA"],["ko","한국어","KO"]];
var I18NV="2";
var cur=get("dymek-lang")||"en";if(!LANGS.some(function(l){return l[0]===cur}))cur="en";
if(/googtrans=/.test(d.cookie)){var ex=";expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";d.cookie="googtrans="+ex;d.cookie="googtrans="+ex+";domain="+location.hostname;d.cookie="googtrans="+ex+";domain=."+location.hostname.split(".").slice(-2).join(".")}
var SKIP="script,style,noscript,code,pre,svg,.notranslate,.dymo,.lang,.cal-pop,[translate=no]";
var dict={},pend={},queue=[],active=0,total=0,doneN=0,saveT=0,timer=0,tracked=[],origTitle=d.title,obs=null;
var toast=d.createElement("div");toast.className="i18n-toast notranslate";toast.setAttribute("role","status");toast.hidden=true;d.body.appendChild(toast);
function langName(l){return LANGS.filter(function(x){return x[0]===l})[0]}
function paintMenus(){$$(".lang").forEach(function(box){var L=langName(cur),b=$(".lang-btn",box);if(b){$("span",b).textContent=L[2];b.setAttribute("aria-label","Language: "+L[1])}$$("[data-lang]",box).forEach(function(o){o.setAttribute("aria-selected",String(o.dataset.lang===cur))})})}
$$(".lang").forEach(function(box){
  var L=langName(cur);
  box.innerHTML='<button type="button" class="lang-btn" aria-haspopup="listbox" aria-expanded="false" aria-label="Language: '+L[1]+'"><svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/></svg><span>'+L[2]+'</span><svg aria-hidden="true" viewBox="0 0 10 10" width="9" height="9"><path d="M1.5 3.5 5 7l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></button>'+
  '<ul class="lang-menu" role="listbox" hidden>'+LANGS.map(function(l){return'<li><button type="button" role="option" lang="'+l[0]+'" data-lang="'+l[0]+'" aria-selected="'+(l[0]===cur)+'">'+l[1]+'</button></li>'}).join("")+'</ul>';
  var btn=$(".lang-btn",box),menu=$(".lang-menu",box);
  btn.addEventListener("click",function(e){e.stopPropagation();var o=menu.hidden;menu.hidden=!o;btn.setAttribute("aria-expanded",String(o))});
  d.addEventListener("click",function(){menu.hidden=true;btn.setAttribute("aria-expanded","false")});
  $$("[data-lang]",menu).forEach(function(o){o.addEventListener("click",function(){setLang(o.dataset.lang)})});
});
function nodes(root){var out=[],w=d.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:function(n){if(n.__o!==undefined)return 2;var t=n.data.trim();if(!t||!/\p{L}/u.test(t))return 2;var p=n.parentElement;if(!p||p.closest(SKIP))return 2;return 1}});while(w.nextNode())out.push(w.currentNode);return out}
function setText(n,t){var m=n.data.match(/^(\s*)[\s\S]*?(\s*)$/);n.data=m[1]+t+m[2]}
function want(k,apply){k=k.trim();if(dict[k]){apply(dict[k]);return}(pend[k]=pend[k]||[]).push(apply);if(pend[k].length===1){queue.push(k);total++}}
function scan(root){if(cur==="en")return;
  nodes(root).forEach(function(n){n.__o=n.data;tracked.push(n);var lc=cur;want(n.data,function(t){if(cur===lc)setText(n,t)})});
  $$("[placeholder],[aria-label],[title],img[alt]",root.nodeType===1?root:d.body).forEach(function(e){if(e.closest(SKIP))return;["placeholder","aria-label","title","alt"].forEach(function(a){var v=e.getAttribute(a);if(!v||!/\p{L}/u.test(v))return;var key="__o_"+a;if(e[key]===undefined){e[key]=v;tracked.push(e)}var lc=cur;want(e[key],function(t){if(cur===lc)e.setAttribute(a,t)})})});
  if(!timer)timer=setTimeout(flush,20)}
function save(){clearTimeout(saveT);saveT=setTimeout(function(){put("dymek-i18n-"+cur,JSON.stringify(dict))},500)}
function progress(){if(total&&doneN<total&&queue.length+active>0){toast.hidden=false;toast.textContent=langName(cur)[1]+" · "+Math.round(doneN/total*100)+"%"}else toast.hidden=true}
function flush(){timer=0;var lc=cur;while(queue.length&&active<4){var batch=queue.splice(0,25);active++;(function(batch){
    fetch("/api/translate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lang:lc,texts:batch})})
    .then(function(r){return r.json()}).then(function(j){if(lc!==cur)return;batch.forEach(function(k,i){var t=j.t&&j.t[i];if(t&&!j.partial)dict[k]=t;(pend[k]||[]).forEach(function(f){f(t||k)});delete pend[k]});save()})
    .catch(function(){batch.forEach(function(k){delete pend[k]})})
    .then(function(){active--;doneN+=batch.length;progress();if(queue.length)flush()})})(batch)}progress()}
function restore(){tracked.forEach(function(n){if(n.nodeType===3){if(n.__o!==undefined){n.data=n.__o;delete n.__o}}else["placeholder","aria-label","title","alt"].forEach(function(a){var k="__o_"+a;if(n[k]!==undefined){n.setAttribute(a,n[k]);delete n[k]}})});tracked=[];d.title=origTitle}
function apply(){pend={};queue=[];total=0;doneN=0;
  scan(d.body);want(origTitle,function(t){d.title=t});
  d.documentElement.classList.remove("i18n-wait");
  if(!obs){obs=new MutationObserver(function(ms){if(cur==="en")return;ms.forEach(function(m){m.addedNodes.forEach(function(n){if(n.nodeType===1&&!n.closest(SKIP))scan(n);else if(n.nodeType===3&&n.parentElement&&!n.parentElement.closest(SKIP))scan(n.parentElement)})})});obs.observe(d.body,{childList:true,subtree:true})}}
function load(l,cb){var c={};try{c=JSON.parse(get("dymek-i18n-"+l)||"{}")||{}}catch(e){}
  var fresh=get("dymek-i18n-v-"+l)===I18NV&&Object.keys(c).length>500;
  if(fresh){cb(c);return}
  fetch("/api/i18n?lang="+l+"&v="+I18NV).then(function(r){return r.ok?r.json():{}}).catch(function(){return{}}).then(function(j){for(var k in j)if(!c[k])c[k]=j[k];if(Object.keys(j).length){put("dymek-i18n-"+l,JSON.stringify(c));put("dymek-i18n-v-"+l,I18NV)}cb(c)})}
/* warm a language's dictionary as soon as the pointer or finger reaches it */
$$(".lang-menu [data-lang]").forEach(function(o){var w=function(){var l=o.dataset.lang;if(l==="en"||o.__w||get("dymek-i18n-v-"+l)===I18NV)return;o.__w=1;fetch("/api/i18n?lang="+l+"&v="+I18NV).catch(function(){})};o.addEventListener("pointerenter",w);o.addEventListener("touchstart",w,{passive:true});o.addEventListener("focus",w)});
function setLang(l){if(l===cur)return;restore();cur=l;put("dymek-lang",l);d.documentElement.lang=l==="en"?"en":l;paintMenus();
  if(l==="en"){toast.hidden=true;return}
  d.documentElement.classList.add("i18n-busy");load(l,function(c){if(cur!==l)return;dict=c;apply();d.documentElement.classList.remove("i18n-busy")})}
if(cur!=="en"){d.documentElement.lang=cur;load(cur,function(c){dict=c;apply()})}else d.documentElement.classList.remove("i18n-wait");
})();

/* events: countdown + "meet us there" prefill */
(function(){var d=document,c=d.querySelector("[data-count]");
if(c){var t=new Date(c.dataset.count+"T09:00:00+09:00"),f=function(){var s=Math.max(0,(t-Date.now())/1000),D=Math.floor(s/86400),H=Math.floor(s%86400/3600),M=Math.floor(s%3600/60);c.innerHTML=s?"<span><b>"+D+"</b>days</span><span><b>"+H+"</b>hours</span><span><b>"+M+"</b>minutes</span>":"<span><b>Now</b>on</span>"};f();setInterval(f,30000)}
d.addEventListener("click",function(e){var a=e.target.closest("[data-meet]");if(!a)return;var s=d.getElementById("e-show");if(s){s.value=a.dataset.meet;var fl=s.closest(".field");if(fl)fl.classList.remove("invalid")}});})();

/* add-to-calendar popup: Google, Outlook, Office 365, Yahoo, Apple/other (.ics) */
(function(){var d=document,pop=null,last=null;
function iso(s){return s.slice(0,4)+"-"+s.slice(4,6)+"-"+s.slice(6,8)}
function ics(c){var esc=function(x){return String(x).replace(/\\/g,"\\\\").replace(/,/g,"\\,").replace(/;/g,"\;").replace(/\n/g,"\\n")};
  return ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Dymek//Events//EN","CALSCALE:GREGORIAN","BEGIN:VEVENT","UID:"+c.s+"-"+c.t.replace(/\W+/g,"")+"@dymek.com","DTSTAMP:"+new Date().toISOString().replace(/[-:]/g,"").replace(/\.\d+/,""),"DTSTART;VALUE=DATE:"+c.s,"DTEND;VALUE=DATE:"+c.e,"SUMMARY:"+esc(c.t),"LOCATION:"+esc(c.l),"DESCRIPTION:"+esc(c.d),"URL:"+c.u,"END:VEVENT","END:VCALENDAR"].join("\r\n")}
function close(){if(pop){pop.remove();pop=null;if(last)last.focus()}}
function open(btn){close();last=btn;var c=JSON.parse(btn.dataset.cal),q=encodeURIComponent;
  var L=[["Google Calendar","https://calendar.google.com/calendar/render?action=TEMPLATE&text="+q(c.t)+"&dates="+c.s+"/"+c.e+"&details="+q(c.d)+"&location="+q(c.l)],
   ["Outlook.com","https://outlook.live.com/calendar/0/action/compose?subject="+q(c.t)+"&startdt="+iso(c.s)+"&enddt="+iso(c.e)+"&allday=true&location="+q(c.l)+"&body="+q(c.d)],
   ["Microsoft 365 / Outlook","https://outlook.office.com/calendar/0/action/compose?subject="+q(c.t)+"&startdt="+iso(c.s)+"&enddt="+iso(c.e)+"&allday=true&location="+q(c.l)+"&body="+q(c.d)],
   ["Yahoo Calendar","https://calendar.yahoo.com/?v=60&title="+q(c.t)+"&st="+c.s+"&et="+c.e+"&dur=allday&in_loc="+q(c.l)+"&desc="+q(c.d)]];
  pop=d.createElement("div");pop.className="cal-pop";pop.setAttribute("role","dialog");pop.setAttribute("aria-label","Add to calendar");
  pop.innerHTML='<div class="cal-h"><b>Add to calendar</b><button type="button" class="cal-x" aria-label="Close">×</button></div><p class="cal-t">'+c.t.replace(/</g,"&lt;")+'</p>'+
    L.map(function(x){return'<a href="'+x[1]+'" target="_blank" rel="noopener">'+x[0]+'</a>'}).join("")+'<button type="button" class="cal-ics">Apple Calendar / other (.ics)</button>';
  d.body.appendChild(pop);
  var r=btn.getBoundingClientRect(),w=pop.offsetWidth,h=pop.offsetHeight,top=r.bottom+8,left=Math.min(Math.max(12,r.left),innerWidth-w-12);
  if(top+h>innerHeight-12&&r.top-h-8>12)top=r.top-h-8;pop.style.top=(top+scrollY)+"px";pop.style.left=(left+scrollX)+"px";
  pop.querySelector(".cal-x").addEventListener("click",close);
  pop.querySelectorAll("a").forEach(function(a){a.addEventListener("click",function(){setTimeout(close,100)})});
  pop.querySelector(".cal-ics").addEventListener("click",function(){var u=URL.createObjectURL(new Blob([ics(c)],{type:"text/calendar"})),a=d.createElement("a");a.href=u;a.download=(btn.dataset.f||"event")+".ics";d.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},1000);close()});
  pop.querySelector("a").focus();
}
d.addEventListener("click",function(e){var b=e.target.closest("[data-cal]");if(b){e.preventDefault();e.stopPropagation();if(pop&&last===b)close();else open(b);return}if(pop&&!e.target.closest(".cal-pop"))close()});
d.addEventListener("keydown",function(e){if(e.key==="Escape")close()});
addEventListener("resize",close);})();

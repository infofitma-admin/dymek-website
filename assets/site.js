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
      msg("info","<b>This preview isn’t connected to an inbox.</b><span>On the live site this form goes straight to our team. For now, please email <strong>"+f.dataset.to+"</strong> with your message.</span>");
      return;
    }
    var fd=new FormData(f), body = f.enctype==="multipart/form-data"?fd:new URLSearchParams(fd).toString();
    fetch("/",{method:"POST",headers:f.enctype==="multipart/form-data"?{}:{"Content-Type":"application/x-www-form-urlencoded"},body:body})
      .then(function(r){if(!r.ok)throw 0;f.reset();msg("ok","<b>Thank you. Your message has reached our team.</b><span>"+(f.dataset.ok||"We will review your inquiry and respond as soon as possible.")+"</span>")})
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
  function count(){if(counted)return;counted=true;$$("[data-count]",say).forEach(function(c){var to=+c.dataset.count,from=to>1000?to-40:0,t0=0;
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
function run(){var t=(q.value||"").trim().toLowerCase(),c=0;tiles.forEach(function(el){var ok=(cur==="all"||el.dataset.cat===cur)&&(!t||el.dataset.name.indexOf(t)>-1||el.textContent.toLowerCase().indexOf(t)>-1);el.hidden=!ok;if(ok)c++});n.textContent=c;em.hidden=c>0}
fs.forEach(function(b){b.addEventListener("click",function(){fs.forEach(function(x){x.classList.toggle("on",x===b);x.setAttribute("aria-pressed",x===b)});cur=b.dataset.f;run()})});q.addEventListener("input",run)})();

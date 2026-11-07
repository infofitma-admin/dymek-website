/* Dymo — Dymek's AI assistant. Streams answers from /api/dymo (Netlify AI Gateway). */
(function(){
"use strict";
var d=document, KEY="dymo-chat-v1", MAX_TURNS=24;
var panel=null, log, form, ta, sendBtn, busy=false, history=[], opener=null;
try{history=JSON.parse(sessionStorage.getItem(KEY)||"[]")}catch(e){history=[]}
function save(){try{sessionStorage.setItem(KEY,JSON.stringify(history.slice(-MAX_TURNS)))}catch(e){}}

var SUGG=[
  "Is Dymek the right partner for my application?",
  "Which industries and processes do you support?",
  "What is hybrid bonding, in simple terms?",
  "Where is your nearest office to Penang?",
  "How does a feasibility test with Dymek work?",
  "Help me request a quote"
];

function esc(s){return String(s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function safeUrl(u){u=u.trim();if(/^(https?:\/\/|mailto:|tel:)/i.test(u))return u;if(/^\/?[a-z0-9][a-z0-9\-\/]*(\.html)?(#[a-z0-9\-]+)?$/i.test(u))return u.replace(/^\//,"");if(/^#[a-z0-9\-]+$/i.test(u))return u;return null}
function inline(s){
  s=esc(s);
  s=s.replace(/`([^`]+)`/g,"<code>$1</code>");
  s=s.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>");
  s=s.replace(/(^|[^*])\*([^*\n]+)\*/g,"$1<em>$2</em>");
  s=s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g,function(m,t,u){var x=safeUrl(u.replace(/&amp;/g,"&"));if(!x)return t;var ext=/^https?:/i.test(x);return '<a href="'+esc(x)+'"'+(ext?' target="_blank" rel="noopener"':'')+'>'+t+'</a>'});
  return s;
}
function md(src){
  var lines=src.replace(/\r/g,"").split("\n"), out=[], list=null, para=[], i=0;
  function flushP(){if(para.length){out.push("<p>"+inline(para.join(" "))+"</p>");para=[]}}
  function flushL(){if(list){out.push("<"+list.t+">"+list.items.map(function(x){return"<li>"+inline(x)+"</li>"}).join("")+"</"+list.t+">");list=null}}
  for(;i<lines.length;i++){var l=lines[i], m;
    if(/^\s*\|.*\|\s*$/.test(l)&&i+1<lines.length&&/^\s*\|[\s:\-|]+\|\s*$/.test(lines[i+1])){flushP();flushL();
      var row=function(r){return r.trim().replace(/^\||\|$/g,"").split("|").map(function(c){return c.trim()})};
      var h=row(l), body=[];i+=2;while(i<lines.length&&/^\s*\|.*\|\s*$/.test(lines[i])){body.push(row(lines[i]));i++}i--;
      out.push("<table><thead><tr>"+h.map(function(c){return"<th>"+inline(c)+"</th>"}).join("")+"</tr></thead><tbody>"+body.map(function(r){return"<tr>"+r.map(function(c){return"<td>"+inline(c)+"</td>"}).join("")+"</tr>"}).join("")+"</tbody></table>");continue}
    if(!l.trim()){flushP();flushL();continue}
    if((m=l.match(/^\s*#{1,4}\s+(.*)$/))){flushP();flushL();out.push("<h4>"+inline(m[1])+"</h4>");continue}
    if((m=l.match(/^\s*[-*•]\s+(.*)$/))){flushP();if(!list||list.t!=="ul"){flushL();list={t:"ul",items:[]}}list.items.push(m[1]);continue}
    if((m=l.match(/^\s*\d+[.)]\s+(.*)$/))){flushP();if(!list||list.t!=="ol"){flushL();list={t:"ol",items:[]}}list.items.push(m[1]);continue}
    if(list&&/^\s{2,}\S/.test(l)){list.items[list.items.length-1]+=" "+l.trim();continue}
    flushL();para.push(l.trim());
  }
  flushP();flushL();return out.join("");
}


var QF=[["name","Name"],["company","Company"],["email","Email"],["country","Country"],["phone","Phone"],["need","Needs"],["quantity","Quantity"],["application","Application"],["timeline","Timeline"]];
function botHTML(el,text,final){
  var i=text.indexOf("```quote"),main=i<0?text:text.slice(0,i);el.innerHTML=md(main);
  if(i<0)return;
  if(!final){var t=d.createElement("p");t.className="dq-wait";t.textContent="Preparing your quote request…";el.appendChild(t);return}
  var raw=text.slice(i+8).split("```")[0],o;try{o=JSON.parse(raw.trim())}catch(e){return}
  var box=d.createElement("div");box.className="dq";
  box.innerHTML="<b>Quote request for Dymek</b><dl>"+QF.filter(function(f){return o[f[0]]}).map(function(f){return"<dt>"+f[1]+"</dt><dd>"+esc(o[f[0]])+"</dd>"}).join("")+"</dl>";
  var b=d.createElement("button");b.type="button";b.className="btn btn-sm";b.textContent="Send to Dymek";box.appendChild(b);el.appendChild(box);
  b.addEventListener("click",function(){
    if(!/@/.test(o.email||"")){b.textContent="Please give Dymo a valid email first";return}
    b.disabled=true;b.textContent="Sending…";
    var w=new FormData();w.append("access_key","b6a82774-3c24-4790-bfef-8705a4bdb606");w.append("subject","New quote request (via Dymo) from "+(o.name||"website visitor"));w.append("from_name","Dymek website · Dymo");if(o.email)w.append("replyto",o.email);
    QF.forEach(function(f){if(o[f[0]])w.append(f[1],o[f[0]])});w.append("Page",location.pathname);
    var nf=new URLSearchParams();nf.append("form-name","dymo-quote");QF.forEach(function(f){nf.append(f[0],o[f[0]]||"")});
    var n=fetch("/",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:nf.toString()}).then(function(r){return r.ok}).catch(function(){return false});
    var m=fetch("https://api.web3forms.com/submit",{method:"POST",headers:{Accept:"application/json"},body:w}).then(function(r){return r.json()}).then(function(j){return!!j.success}).catch(function(){return false});
    Promise.all([m,n]).then(function(r){if(r[0]||r[1]){b.remove();var ok=d.createElement("p");ok.className="ok";ok.textContent="Sent. Our team will reply to "+o.email+" soon.";box.appendChild(ok)}else{b.disabled=false;b.textContent="Couldn’t send. Try again"}});
  });
}
function bubble(role,html,cls){var b=d.createElement("div");b.className="msg "+(role==="user"?"me":"bot")+(cls?" "+cls:"");if(role==="user")b.textContent=html;else b.innerHTML=html;log.appendChild(b);log.scrollTop=log.scrollHeight;return b}
function welcome(){
  var w=bubble("assistant","<p><strong>Hi, I’m Dymo!</strong> I know Dymek’s industries, technologies, partners and offices, and I’m happy to explain the engineering behind them. Ask me anything, in any language.</p>");
  var s=d.createElement("div");s.className="dymo-sugg";
  SUGG.forEach(function(q){var b=d.createElement("button");b.type="button";b.textContent=q;b.addEventListener("click",function(){send(q)});s.appendChild(b)});
  w.appendChild(s);
}
function build(){
  panel=d.createElement("div");panel.className="dymo";panel.setAttribute("role","dialog");panel.setAttribute("aria-label","Chat with Dymo, Dymek's AI assistant");panel.hidden=true;
  panel.innerHTML='<div class="dymo-head"><img src="assets/mascot-wave-right.webp" alt="" width="40" height="44"><div><b>Dymo</b><small>Dymek AI assistant</small></div>'+
    '<button class="icon-btn" type="button" data-dymo-reset aria-label="Start a new chat" title="New chat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg></button>'+
    '<button class="icon-btn" type="button" data-dymo-close aria-label="Close chat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>'+
    '<div class="dymo-log" aria-live="polite"></div>'+
    '<form class="dymo-form"><label class="sr" for="dymo-in">Message Dymo</label><textarea id="dymo-in" rows="1" maxlength="2000" placeholder="Ask about a process, a tool or an office…"></textarea>'+
    '<button class="btn" type="submit" aria-label="Send"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button></form>'+
    '<div class="dymo-note">Dymo can make mistakes. For quotes and specifications, our engineers confirm every detail.</div>';
  d.body.appendChild(panel);
  log=panel.querySelector(".dymo-log");form=panel.querySelector("form");ta=panel.querySelector("textarea");sendBtn=form.querySelector("button");
  form.addEventListener("submit",function(e){e.preventDefault();send(ta.value)});
  ta.addEventListener("keydown",function(e){if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send(ta.value)}});
  ta.addEventListener("input",function(){ta.style.height="auto";ta.style.height=Math.min(140,ta.scrollHeight)+"px"});
  panel.querySelector("[data-dymo-close]").addEventListener("click",close);
  panel.querySelector("[data-dymo-reset]").addEventListener("click",function(){if(busy)return;history=[];save();log.innerHTML="";welcome();ta.focus()});
  welcome();
  history.forEach(function(m){if(m.role==="user")bubble("user",m.content);else botHTML(bubble("assistant",""),m.content,true)});
}
function open(src){if(!panel)build();opener=src||d.activeElement;panel.hidden=false;var f=d.querySelector(".dymo-fab");if(f)f.hidden=true;log.scrollTop=log.scrollHeight;setTimeout(function(){ta.focus()},30)}
function close(){if(!panel||panel.hidden)return;panel.hidden=true;var f=d.querySelector(".dymo-fab");if(f)f.hidden=false;if(opener&&opener.focus)opener.focus()}

function send(text){
  text=(text||"").trim(); if(!text||busy)return;
  busy=true;sendBtn.disabled=true;ta.value="";ta.style.height="auto";
  bubble("user",text);history.push({role:"user",content:text});save();
  var b=bubble("assistant",'<span class="typing" aria-label="Dymo is typing"><i></i><i></i><i></i></span>'), acc="", raf=0;
  function paint(fin){raf=0;botHTML(b,acc,fin===true);log.scrollTop=log.scrollHeight}
  fetch("/api/dymo",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:history.slice(-MAX_TURNS),page:location.pathname.replace(/^\//,"")||"index.html",title:d.title})})
    .then(function(r){
      if(!r.ok||!r.body)return r.text().then(function(t){throw new Error(t||("HTTP "+r.status))});
      var rd=r.body.getReader(), dec=new TextDecoder();
      function pump(){return rd.read().then(function(x){if(x.done)return;acc+=dec.decode(x.value,{stream:true});if(!raf)raf=requestAnimationFrame(paint);return pump()})}
      return pump();
    })
    .then(function(){
      if(!acc.trim())throw new Error("empty");
      if(raf)cancelAnimationFrame(raf);paint(true);history.push({role:"assistant",content:acc});save();
    })
    .catch(function(){
      b.classList.add("err");
      b.innerHTML="<p><strong>Sorry, I couldn’t reach my knowledge base just now.</strong> Please try again in a moment, or contact our engineers at <a href=\"mailto:web@dymek.com\">web@dymek.com</a> / +852 2415 3601.</p>";
      history.pop();save();
    })
    .then(function(){busy=false;sendBtn.disabled=false;ta.focus()});
}

d.addEventListener("click",function(e){var t=e.target.closest("[data-dymo]");if(t){e.preventDefault();open(t)}});
d.addEventListener("keydown",function(e){if(e.key==="Escape"&&panel&&!panel.hidden)close()});
window.DYMO={open:open,close:close,send:function(q){open();send(q)}};
})();

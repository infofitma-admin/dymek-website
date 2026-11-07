/* Dymek free engineering tools. Plain JS, runs fully in the browser. */
(function(){
"use strict";
var d=document,$=function(s,c){return(c||d).querySelector(s)},$$=function(s,c){return[].slice.call((c||d).querySelectorAll(s))};
function num(el){var v=parseFloat(String(el.value).replace(",","."));return isFinite(v)?v:NaN}
function fmt(v,p){if(!isFinite(v))return"–";p=p||5;var a=Math.abs(v);if(a===0)return"0";if(a>=1e9||a<1e-4)return v.toExponential(3).replace("e+","e").replace(/\.?0+e/,"e");var s=Number(v.toPrecision(p));return s.toLocaleString("en-US",{maximumFractionDigits:10})}
function seg(root,cb){var bs=$$("button",root);bs.forEach(function(b){b.type="button";b.addEventListener("click",function(){bs.forEach(function(x){x.setAttribute("aria-pressed",String(x===b))});cb(b.dataset.v)})})}
function live(root,fn){$$("input,select",root).forEach(function(i){i.addEventListener("input",fn);i.addEventListener("change",fn)});fn()}

/* ---------- Thin-film thickness ---------- */
var tf=$("#tf");
if(tf){
  var mode="fwd";
  seg($("#tf-mode"),function(v){mode=v;$("#tf-a").hidden=v!=="fwd";$("#tf-b").hidden=v!=="inv";calc()});
  $("#tf-mat").addEventListener("change",function(){if(this.value)$("#tf-n").value=this.value;calc()});
  $("#tf-mat2").addEventListener("change",function(){if(this.value)$("#tf-n2").value=this.value;calc()});
  function R(n,ns,dnm,l){var r1=(1-n)/(1+n),r2=(n-ns)/(n+ns),c=Math.cos(4*Math.PI*n*dnm/l);return(r1*r1+r2*r2+2*r1*r2*c)/(1+r1*r1*r2*r2+2*r1*r2*c)}
  function calc(){
    var out=$("#tf-out");
    if(mode==="fwd"){
      var n=num($("#tf-n")),t=num($("#tf-d")),ns=num($("#tf-sub")),l1=400,l2=1000;
      if(!(n>1&&t>0&&ns>0)){out.innerHTML='<p class="calc-note">Enter a refractive index above 1 and a thickness above 0.</p>';return}
      var pts=[],peaks=[],prev=null,pp=null,W=560,H=220,i,l,r,mx=0;
      for(i=0;i<=600;i++){l=l1+(l2-l1)*i/600;r=R(n,ns,t,l);pts.push([l,r]);if(r>mx)mx=r}
      for(i=1;i<pts.length-1;i++){if(pts[i][1]>pts[i-1][1]&&pts[i][1]>=pts[i+1][1]&&Math.abs(pts[i][1]-pts[i-1][1])>1e-6)peaks.push(Math.round(pts[i][0]))}
      var top=Math.max(.1,Math.ceil(mx*10)/10);
      var poly=pts.map(function(p){return((p[0]-l1)/(l2-l1)*(W-66)+40).toFixed(1)+","+(H-24-(p[1]/top)*(H-40)).toFixed(1)}).join(" ");
      var grid="";[0,.5,1].forEach(function(k){var y=(H-24-k*(H-40)).toFixed(1);grid+='<line x1="40" x2="'+(W-10)+'" y1="'+y+'" y2="'+y+'" stroke="rgba(183,224,127,.15)"/><text x="34" y="'+(+y+4)+'" fill="#9DBB7E" font-size="11" text-anchor="end">'+Math.round(k*top*100)+'%</text>'});
      [400,500,600,700,800,900,1000].forEach(function(w){var x=((w-l1)/(l2-l1)*(W-66)+40).toFixed(1);grid+='<text x="'+x+'" y="'+(H-6)+'" fill="#9DBB7E" font-size="11" text-anchor="middle">'+w+'</text>'});
      var od=n*t;
      out.innerHTML='<div class="big"><b>'+fmt(od,5)+' nm</b><span>Optical thickness (n × d)</span></div>'+
      '<svg class="plot" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Calculated reflectance spectrum from 400 to 1000 nm">'+grid+'<polyline points="'+poly+'" fill="none" stroke="#B7E07F" stroke-width="2.5" stroke-linejoin="round"/></svg>'+
      '<div class="kv"><div><span class="k">Peaks in 400–1000 nm</span><span class="v">'+peaks.length+'</span></div><div><span class="k">Peak positions</span><span class="v">'+(peaks.length?peaks.slice(0,5).join(", ")+(peaks.length>5?"…":"")+" nm":"none")+'</span></div><div><span class="k">Max reflectance</span><span class="v">'+(mx*100).toFixed(1)+' %</span></div></div>'+
      '<p class="calc-note">Normal incidence, single transparent film on a flat substrate, dispersion and absorption ignored. Real spectra need a fitted optical model.</p>';
    }else{
      var a=num($("#tf-l1")),b=num($("#tf-l2")),n2=num($("#tf-n2")),m=num($("#tf-m"));
      if(!(a>0&&b>0&&a!==b&&n2>1&&m>=1)){out.innerHTML='<p class="calc-note">Enter two different peak wavelengths, a refractive index above 1 and at least 1 fringe.</p>';return}
      var lo=Math.min(a,b),hi=Math.max(a,b),dd=m*lo*hi/(2*n2*(hi-lo));
      out.innerHTML='<div class="big"><b>'+fmt(dd,4)+' nm</b><span>Estimated film thickness ('+fmt(dd/1000,4)+' µm)</span></div>'+
      '<div class="kv"><div><span class="k">Formula</span><span class="v">d = m·λ₁·λ₂ / 2n(λ₂−λ₁)</span></div><div><span class="k">Peak spacing</span><span class="v">'+fmt(hi-lo,4)+' nm</span></div><div><span class="k">Fringe order at λ₁ (approx.)</span><span class="v">'+fmt(2*n2*dd/hi,3)+'</span></div></div>'+
      '<p class="calc-note">Use two neighbouring maxima (or minima) in the reflectance spectrum. For films thinner than about 100 nm there are too few fringes, so a model fit is needed.</p>';
    }
  }
  live(tf,calc);
}

/* ---------- Unit converter ---------- */
var uc=$("#uc");
if(uc){
  var CAT={
    length:{u:[["m",1],["mm",1e-3],["µm",1e-6],["nm",1e-9],["Å",1e-10],["pm",1e-12],["inch",.0254],["mil (thou)",2.54e-5],["µin",2.54e-8]],def:"µm"},
    pressure:{u:[["Pa",1],["kPa",1e3],["MPa",1e6],["mbar",100],["bar",1e5],["Torr",101325/760],["mTorr",101325/760/1000],["atm",101325],["psi",6894.757],["inHg",3386.389],["mmH₂O",9.80665]],def:"Torr"},
    temp:{u:[["°C"],["°F"],["K"],["°R"]],def:"°C"},
    rough:{u:[["Ra · µm"],["Ra · nm"],["Ra · µin"],["Rq · µm"],["Rq · nm"],["Rq · µin"]],def:"Ra · µm"}
  };
  var cat="length";
  function fill(){var s=$("#uc-u");s.innerHTML=CAT[cat].u.map(function(x){return'<option'+(x[0]===CAT[cat].def?" selected":"")+'>'+x[0]+'</option>'}).join("");$("#uc-prof").closest(".field").hidden=cat!=="rough";
    var dv={length:"1",pressure:"760",temp:"23",rough:"0.8"};$("#uc-v").value=dv[cat];conv()}
  seg($("#uc-cat"),function(v){cat=v;fill()});
  function toC(v,u){return u==="°C"?v:u==="°F"?(v-32)*5/9:u==="K"?v-273.15:(v-491.67)*5/9}
  function fromC(c,u){return u==="°C"?c:u==="°F"?c*9/5+32:u==="K"?c+273.15:(c+273.15)*9/5}
  function conv(){
    var v=num($("#uc-v")),u=$("#uc-u").value,res=[];
    if(!isFinite(v)){$("#uc-list").innerHTML='<p class="calc-note">Enter a number to convert.</p>';return}
    if(cat==="temp"){var c=toC(v,u);if(c<-273.15){$("#uc-list").innerHTML='<p class="calc-note">That is below absolute zero.</p>';return}CAT.temp.u.forEach(function(x){res.push([x[0],fromC(c,x[0])])})}
    else if(cat==="rough"){var k=+$("#uc-prof").value,p=u.split(" · "),um=v*(p[1]==="nm"?1e-3:p[1]==="µin"?.0254:1),ra=p[0]==="Ra"?um:um/k,rq=ra*k;
      [["Ra",ra],["Rq",rq]].forEach(function(q){res.push([q[0]+" · µm",q[1]]);res.push([q[0]+" · nm",q[1]*1e3]);res.push([q[0]+" · µin",q[1]/.0254])});
      res.sort(function(a,b){return CAT.rough.u.findIndex(function(x){return x[0]===a[0]})-CAT.rough.u.findIndex(function(x){return x[0]===b[0]})})}
    else{var f=CAT[cat].u.filter(function(x){return x[0]===u})[0][1],base=v*f;CAT[cat].u.forEach(function(x){res.push([x[0],base/x[1]])})}
    $("#uc-big").innerHTML='<b>'+fmt(v,6)+' '+u+'</b><span>equals…</span>';
    $("#uc-list").innerHTML=res.map(function(r){return'<button type="button" data-u="'+r[0]+'" class="'+(r[0]===u?"on":"")+'" title="Convert from '+r[0]+'"><span class="u">'+r[0]+'</span><span class="v">'+fmt(r[1],6)+'</span></button>'}).join("");
  }
  $("#uc-list").addEventListener("click",function(e){var b=e.target.closest("[data-u]");if(!b)return;$("#uc-v").value=b.querySelector(".v").textContent.replace(/,/g,"");$("#uc-u").value=b.dataset.u;conv()});
  fill();live(uc,conv);
}

/* ---------- Dies per wafer & yield ---------- */
var dw=$("#dw");
if(dw){
  seg($("#dw-dia"),function(v){$("#dw-d").value=v;calc()});
  function count(R,px,py,w,h,ox,oy){var n=0,list=[],nx=Math.ceil(R/px)+2,ny=Math.ceil(R/py)+2,i,j,x,y,R2=R*R;
    for(i=-nx;i<=nx;i++)for(j=-ny;j<=ny;j++){x=i*px+ox;y=j*py+oy;
      var xa=Math.max(Math.abs(x),Math.abs(x+w)),ya=Math.max(Math.abs(y),Math.abs(y+h));if(xa*xa+ya*ya<=R2){n++;list.push([x,y])}}
    return{n:n,list:list}}
  function calc(){
    var D=num($("#dw-d")),w=num($("#dw-w")),h=num($("#dw-h")),s=num($("#dw-s"))/1000,ee=num($("#dw-e")),d0=num($("#dw-d0")),mdl=$("#dw-m").value,out=$("#dw-out");
    $$("#dw-dia button").forEach(function(b){b.setAttribute("aria-pressed",String(+b.dataset.v===D))});
    if(!(D>0&&w>0&&h>0&&s>=0&&ee>=0&&d0>=0)||ee*2>=D){out.innerHTML='<p class="calc-note">Check the inputs: all values must be positive and the edge exclusion smaller than the wafer radius.</p>';return}
    var R=D/2-ee,px=w+s,py=h+s,best=null;
    [[-w/2,-h/2],[s/2,-h/2],[-w/2,s/2],[s/2,s/2]].forEach(function(o){var c=count(R,px,py,w,h,o[0],o[1]);if(!best||c.n>best.n)best=c});
    var S=px*py,dd=2*R,est=Math.max(0,Math.PI*dd*dd/(4*S)-Math.PI*dd/Math.sqrt(2*S));
    var A=w*h/100,AD=A*d0,Y=mdl==="poisson"?Math.exp(-AD):mdl==="murphy"?(AD?Math.pow((1-Math.exp(-AD))/AD,2):1):1/(1+AD);
    var good=Math.floor(best.n*Y);
    /* drawing */
    var V=320,sc=(V-20)/D,c=V/2,svg='<svg viewBox="0 0 '+V+' '+V+'" role="img" aria-label="Wafer map with '+best.n+' complete dies"><circle cx="'+c+'" cy="'+c+'" r="'+(D/2*sc)+'" fill="#24390F" stroke="#B7E07F" stroke-opacity=".35"/><circle cx="'+c+'" cy="'+c+'" r="'+(R*sc)+'" fill="none" stroke="#B7E07F" stroke-opacity=".5" stroke-dasharray="4 4"/>';
    var bad=best.n-good,seed=7,badSet={};function rnd(){seed=(seed*16807)%2147483647;return seed/2147483647}
    for(var k=0;k<bad&&k<best.n;k++){var idx=Math.floor(rnd()*best.n),g=0;while(badSet[idx]&&g++<best.n)idx=(idx+1)%best.n;badSet[idx]=1}
    if(best.n<=9000)best.list.forEach(function(p,i){svg+='<rect x="'+(c+p[0]*sc).toFixed(2)+'" y="'+(c+p[1]*sc).toFixed(2)+'" width="'+Math.max(.4,w*sc).toFixed(2)+'" height="'+Math.max(.4,h*sc).toFixed(2)+'" fill="'+(badSet[i]?"#7BB54E":"#B7E07F")+'" fill-opacity="'+(badSet[i]?".35":"1")+'"/>'});
    svg+='<path d="M'+(c-8)+' '+(c+D/2*sc-1)+' h16 l-8 -7z" fill="#1B2E0A"/></svg>';
    out.innerHTML='<div class="wafer-vis">'+svg+'<div style="display:grid;gap:16px"><div class="big"><b>'+best.n.toLocaleString("en-US")+'</b><span>Gross dies per wafer (complete dies)</span></div><div class="big"><b style="font-size:clamp(1.8rem,3vw,2.4rem)">'+good.toLocaleString("en-US")+'</b><span>Expected good dies at '+(Y*100).toFixed(1)+' % yield</span></div></div></div>'+
    '<div class="kv"><div><span class="k">Formula estimate</span><span class="v">'+Math.floor(est).toLocaleString("en-US")+'</span></div><div><span class="k">Die area</span><span class="v">'+fmt(w*h,4)+' mm²</span></div><div><span class="k">A × D₀</span><span class="v">'+fmt(AD,3)+'</span></div><div><span class="k">Usable diameter</span><span class="v">'+fmt(dd,4)+' mm</span></div></div>'+
    '<p class="calc-note">Faded dies show where the expected defect losses would fall (illustrative placement). The count assumes a regular grid with the best of four grid offsets, and no notch or flat keep-out.</p>';
  }
  live(dw,calc);
}

/* ---------- Measurement method finder ---------- */
var mf=$("#mf");
if(mf){
  var Q=[
    {k:"goal",t:"What do you need to measure or find?",o:[["film","Film thickness","Coatings, oxides, resists and multilayer stacks"],["surface","Surface shape & roughness","Flatness, form, step height, waviness"],["hidden","Hidden defects","Voids, delamination or cracks inside a part"],["micro","Microstructure","Cross-sections, grains, interfaces, failure sites"],["wafer","Wafer & surface defects","Particles, scratches, pattern defects"],["data","Yield & test data","Why yield drops and where losses start"]]},
    {k:"sample",t:"What does your sample look like?",o:[["thin","Thin films on a substrate","Wafers, glass, optics with coatings"],["polished","Polished or reflective parts","Optics, mirrors, wafers, machined metal"],["package","Packaged or bonded parts","ICs, modules, bonded wafers, batteries"],["bulk","Bulk materials","Metals, ceramics, polymers, samples for cross-section"],["none","No physical sample","I am working with data files"]]},
    {k:"nd",t:"Must the test be non-destructive?",o:[["yes","Yes, keep the part intact","The part must stay usable"],["no","No, we can cut or prepare it","Cross-sections and sample prep are fine"]]},
    {k:"where",t:"Where will you use it?",o:[["lab","R&D or failure-analysis lab","Flexibility and detail come first"],["line","Production line","Speed, automation and repeatability matter most"]]}
  ];
  var M=[
    {n:"Spectral reflectometry",g:"film",s:["thin"],nd:1,w:["lab","line"],p:"Fast, non-contact thickness and n&k of transparent and semi-transparent films, from nanometres to around a hundred microns.",l:["thin-film-thickness-measurement.html","Read: thin-film measurement explained"]},
    {n:"Spectroscopic ellipsometry",g:"film",s:["thin"],nd:1,w:["lab"],p:"Very sensitive to ultra-thin layers and optical constants; ideal for detailed multilayer analysis in R&D.",l:["thin-film-thickness-measurement.html","Read: thin-film measurement explained"]},
    {n:"Laser interferometry",g:"surface",s:["polished","thin"],nd:1,w:["lab","line"],p:"Measures surface form and flatness of optics and wafers over a full aperture, including dynamic set-ups that tolerate vibration.",l:["precision-optics-optical-manufacturing.html","See precision optics"]},
    {n:"Optical profilometry",g:"surface",s:["polished","bulk","package","thin"],nd:1,w:["lab","line"],p:"Non-contact 3D topography: roughness, step height and texture at micro and nano scale.",l:["metrology-inspection-failure-analysis.html","See metrology & inspection"]},
    {n:"Scanning acoustic microscopy (SAM)",g:"hidden",s:["package","bulk"],nd:1,w:["lab","line"],p:"Ultrasound finds voids, delamination and cracks inside packages, bonded wafers and assemblies without opening them.",l:["metrology-inspection-failure-analysis.html","See metrology & inspection"]},
    {n:"Electron microscopy (SEM, FIB, TEM)",g:"micro",s:["bulk","package","thin"],nd:0,w:["lab"],p:"Nanometre-scale imaging and analysis of structures, interfaces and failure sites, usually after sample preparation.",l:["laser-sample-preparation-failure-analysis.html","See laser sample prep & FA"]},
    {n:"Laser sample preparation",g:"micro",s:["package","bulk"],nd:0,w:["lab"],p:"Removes large volumes quickly to reach buried targets before final polishing or FIB, saving hours per sample.",l:["laser-sample-preparation-failure-analysis.html","See laser sample prep & FA"]},
    {n:"Automated optical inspection",g:"wafer",s:["thin","polished"],nd:1,w:["line","lab"],p:"High-speed imaging that finds and classifies particles, scratches and pattern defects across whole wafers.",l:["metrology-inspection-failure-analysis.html","See metrology & inspection"]},
    {n:"Yield analytics software",g:"data",s:["none","thin","package"],nd:1,w:["line","lab"],p:"Brings test, inspection and process data together so engineers can trace yield loss to its source.",l:["semiconductor-manufacturing-advanced-packaging.html","See semiconductor manufacturing"]},
    {n:"Acoustic or optical screening, then cross-section",g:"hidden",s:["package","bulk"],nd:0,w:["lab"],p:"When a part may be cut, non-destructive screening finds the suspect area and a targeted cross-section confirms the root cause.",l:["laser-sample-preparation-failure-analysis.html","See laser sample prep & FA"]}
  ];
  var step=0,ans={},body=$("#mf-body"),lis=$$("#mf-steps li");
  function draw(){
    lis.forEach(function(li,i){li.classList.toggle("on",i===step);li.classList.toggle("done",i<step)});
    if(step<Q.length){var q=Q[step];
      body.innerHTML='<span class="eyebrow">Question '+(step+1)+' of '+Q.length+'</span><h2>'+q.t+'</h2><div class="mf-opts">'+q.o.map(function(o){return'<button class="mf-opt" type="button" data-v="'+o[0]+'"><b>'+o[1]+'</b><span>'+o[2]+'</span></button>'}).join("")+'</div>'+
      '<div class="mf-nav">'+(step?'<button class="btn btn-2" type="button" data-back>Back</button>':'<span></span>')+'</div>';
    }else{
      var sc=M.map(function(m){var v=0;if(m.g===ans.goal)v+=10;else return{m:m,v:-1};if(m.s.indexOf(ans.sample)>-1)v+=3;if(ans.nd==="yes"&&!m.nd)v-=20;if(ans.nd==="no"&&!m.nd)v+=1;if(m.w.indexOf(ans.where)>-1)v+=2;return{m:m,v:v}}).filter(function(x){return x.v>0}).sort(function(a,b){return b.v-a.v}).slice(0,3);
      body.innerHTML='<span class="eyebrow">Your result</span><h2>'+(sc.length?"Methods worth a closer look":"Let’s talk it through")+'</h2>'+
      (sc.length?'<div class="mf-res">'+sc.map(function(x,i){return'<div class="mf-r"><span class="rk">'+(i+1)+'</span><div><h3>'+x.m.n+'</h3><p>'+x.m.p+'</p><a href="'+x.m.l[0]+'">'+x.m.l[1]+' →</a></div></div>'}).join("")+'</div>':'<p>Your combination needs a closer look. A Dymek engineer can suggest the right approach.</p>')+
      '<p class="muted" style="margin:0">This is a starting point, not a final recommendation. Your material, tolerance and throughput decide the best tool.</p>'+
      '<div class="mf-nav"><button class="btn btn-2" type="button" data-restart>Start again</button><div class="btn-row" style="margin:0"><button class="btn btn-2" type="button" data-ask>Ask Dymo</button><a class="btn" href="contact.html#contact-form">Ask a Dymek engineer</a></div></div>';
    }
  }
  body.addEventListener("click",function(e){var o=e.target.closest(".mf-opt");if(o){ans[Q[step].k]=o.dataset.v;step++;draw();body.scrollIntoView({block:"nearest",behavior:"smooth"});return}
    if(e.target.closest("[data-back]")){step=Math.max(0,step-1);draw()}
    if(e.target.closest("[data-restart]")){step=0;ans={};draw()}
    if(e.target.closest("[data-ask]")&&window.DYMO){var t=function(k){var q=Q.filter(function(x){return x.k===k})[0];return q.o.filter(function(o){return o[0]===ans[k]})[0][1]};
      window.DYMO.send("I need to measure: "+t("goal")+". Sample: "+t("sample")+". Non-destructive: "+t("nd")+". Use: "+t("where")+". Which measurement method and Dymek solution would you suggest?")}
  });
  draw();
}

/* ---------- Cleanroom ISO 14644-1 class ---------- */
var cr=$("#cr");
if(cr){
  var SZ=[.1,.2,.3,.5,1,5];
  var T={1:[10,2,0,0,0,0],2:[100,24,10,4,0,0],3:[1000,237,102,35,8,0],4:[10000,2370,1020,352,83,0],5:[100000,23700,10200,3520,832,0],6:[1000000,237000,102000,35200,8320,293],7:[0,0,0,352000,83200,2930],8:[0,0,0,3520000,832000,29300],9:[0,0,0,35200000,8320000,293000]};
  var FED={3:"Class 1",4:"Class 10",5:"Class 100",6:"Class 1,000",7:"Class 10,000",8:"Class 100,000",9:"Room air (approx.)"};
  var LOC=[[2,1],[4,2],[6,3],[8,4],[10,5],[24,6],[28,7],[32,8],[36,9],[52,10],[56,11],[64,12],[68,13],[72,14],[76,15],[104,16],[108,17],[116,18],[148,19],[156,20],[192,21],[232,22],[276,23],[352,24],[436,25],[636,26],[1000,27]];
  function locs(a){for(var i=0;i<LOC.length;i++)if(a<=LOC[i][0])return LOC[i][1];return Math.ceil(27*a/1000)}
  function calc(){
    var N=+$("#cr-c").value,A=num($("#cr-a")),out=$("#cr-out");
    var row=T[N],mx=Math.log10(row[0]||row[3]||1);
    var rows=SZ.map(function(s,i){var v=row[i];return'<tr><td>≥ '+s+' µm</td><td>'+(v?v.toLocaleString("en-US"):'<span class="na">not specified</span>')+'</td><td style="width:38%">'+(v?'<div class="bar" style="width:'+Math.max(3,Math.log10(v)/Math.log10(35200000)*100).toFixed(1)+'%"></div>':"")+'</td></tr>'}).join("");
    var h='<div class="big"><b>ISO Class '+N+'</b><span>'+(FED[N]?"Old US FED-STD-209E equivalent: "+FED[N]:"No FED-STD-209E equivalent")+'</span></div>'+
      '<table class="iso-t"><thead><tr><th>Particle size</th><th>Max particles / m³</th><th><span class="sr">Relative level</span></th></tr></thead><tbody>'+rows+'</tbody></table>'+
      '<div class="kv"><div><span class="k">Sampling locations</span><span class="v">'+(A>0?locs(A)+" minimum":"–")+'</span></div><div><span class="k">Room area</span><span class="v">'+(A>0?fmt(A,5)+" m²":"enter area")+'</span></div></div>';
    var sz=+$("#cr-s").value,cnt=num($("#cr-n")),per=$("#cr-u").value;
    if(cnt>0){var c3=per==="ft3"?cnt*35.3147:cnt,cls=Math.log10(c3*Math.pow(sz/.1,2.08)),cl=Math.max(1,Math.ceil(cls*10-1e-9)/10);
      var ti=SZ.indexOf(sz),lim=(ti>-1&&T[N][ti])||Math.round(Math.pow(10,N)*Math.pow(.1/sz,2.08)),ok=c3<=lim;
      h+='<div class="kv"><div><span class="k">Your count equals</span><span class="v">ISO Class '+cl.toFixed(1)+'</span></div><div><span class="k">Against Class '+N+' at '+sz+' µm</span><span class="v" style="color:'+(ok?"#B7E07F":"#FFB4A8")+'">'+(ok?"Within limit":"Exceeds limit")+' ('+lim.toLocaleString("en-US")+' / m³)</span></div></div>';}
    h+='<p class="calc-note">Limits from ISO 14644-1:2015 Table 1, Cn = 10^N × (0.1/D)^2.08. Sampling locations from Table A.1. Classification also depends on sample volume and the operational state (as-built, at-rest, operational).</p>';
    out.innerHTML=h;
  }
  live(cr,calc);
}
})();

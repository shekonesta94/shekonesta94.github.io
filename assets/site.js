(function(){
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches;
  var root = document.documentElement;
  var $ = function(id){ return document.getElementById(id); };
  var hasIO = 'IntersectionObserver' in window;
  if (hasIO && !reduce) root.classList.add('js');

  var EN = {
    skip:'Skip to content', navAria:'Sections', nav1:'What is Nesta', nav2:'How it works', nav3:'Live example', nav4:'Solutions', ctaHead:'Try the demo',
    h1:'The work you repeat every day, <em>done on its own.</em>',
    rotA:'A WhatsApp bot that', rotB:'24/7.',
    sub:'We build self-running systems for small and mid-sized businesses: a bot that answers your customers, takes bookings and orders, and logs everything to your sheet, calendar and email.',
    m1:'Arabic & English', m2:'Answers from your data only', m3:'Demo before you pay',
    tkTitle:'Your number is ready. Send “demo” and the bot will reply.', cta1:'Send “demo” on WhatsApp', cta2:'See how it works',
    stageAria:'Illustrative example: a customer message reaches the bot and gets logged',
    liveL:'Live now', colA:'Customer messages on WhatsApp', online:'Online now', colC:'Everything gets logged on its own',
    coreIdle:'Understands the request and answers from your data', cs1:'Read', cs2:'Reply', cs3:'Log',
    oSheetH:'Sheet', oCalH:'Calendar', ok:'Confirmed',
    answeredL:'messages answered today', missedL:'missed', demoL:'Illustrative example for a sample business',
    whatH:'Any task you repeat, we turn into an automatic system.',
    whatP:'Instead of someone on your team answering the same questions and copying the same data every day, the system does it on its own. We run four counters, each handling one kind of work.',
    win:'Counter',
    v1h:'Smart WhatsApp bots', v1p:'Reply to customers 24/7 in Arabic and English, take bookings and orders, and record the data.',
    v2h:'Connected tools', v2p:'WhatsApp, Google Sheets, email and calendar, linked so data moves by itself.',
    v3h:'Self-updating reports', v3p:'Sheets and reports that fill in automatically, with nobody typing numbers by hand.',
    v4h:'Any repetitive task', v4p:'Tell us what eats your time every day, and we build a system that does it for you.',
    howH:'From the first message to a logged booking.',
    howP:'Your customer messages your business WhatsApp number as usual. The bot answers from your own data, completes the request, and logs it to your sheet instantly.',
    st1h:'Send “demo”', st1p:'The bot asks about your type of business and what you need, then suggests the right package and its price.',
    st2h:'We build your system', st2p:'You send your business data (prices, menu, hours) and we build a system and database that are yours alone.',
    st3h:'The bot runs, you follow', st3p:'Every chat, order and booking is logged in your sheet, and you can edit prices and hours there yourself.',
    ph:'Nesta · Customer service', phs:'Online now',
    d1:'demo', d2:'Welcome to Nesta! What’s your business? Restaurant, clinic, gym, real estate, or something else?', d3:'Dental clinic',
    d4:'Got it. Should the bot only answer questions, or also book appointments and send reminders?', d5:'Book and remind too',
    d6:'Then the clinic bot fits you best: it books appointments and sends a reminder before each one. Setup from 4,000 EGP, then a monthly subscription. Want an engineer to call you?',
    setupH:'Your business data', sh1:'Service', sh2:'Price', sh3:'Hours',
    sv1:'Check-up', sv1t:'Daily 4 – 9 PM', sv2:'Follow-up call', sv2t:'Within a week', sv3:'Follow-up session', sv3t:'Sat & Tue', sv4:'Address', sv4t:'90th Street, Fifth Settlement',
    setupNote:'The bot answers from this table only. Change a price here and the reply changes too.',
    k1:'chats this week', k2:'bookings logged', k3:'customers left waiting', weekH:'Bookings by day', demoNote:'Illustrative numbers for a sample clinic.',
    nH:'3 AM. The company is closed. The bot is still working.',
    nP:'A customer who messages at night doesn’t have to wait for morning. The bot replies, takes the order or booking, and logs it. You wake up to everything organised in your sheet.',
    f1n:'24 hours', f1:'No days off, no shifts', f2:'Replies in the customer’s language', f3n:'Your data only', f3:'Never makes things up',
    nightAria:'Illustrative example of one night', nc1:'Company closed', nc2:'Bot is on', nc3:'messages answered tonight', nc4:'customers left waiting for morning',
    solH:'A ready bot for your kind of business.', solP:'Every bot is set up on your own business data, with a system and files that are yours.',
    basic:'Base package', b0h:'Info & customer-service bot', b0p:'Answers every question your customers ask about your business, without bookings.',
    egp:'EGP', note:'Setup fee, then a monthly subscription.', tryNow:'Try it now',
    b1t:'Restaurants', o1:'2 shawarma', o2:'Large fries', oT:'Total', b1h:'Restaurant bot', b1p:'Takes orders from customers and logs them.',
    b2t:'Clinics', slotsH:'Tomorrow’s slots', b2h:'Clinic bot', b2p:'Books appointments and sends patients a reminder before.',
    b3t:'Gyms', mem:'New membership', memP:'3 months · starts Saturday', b3h:'Gym bot', b3p:'Registers new memberships.',
    b4t:'Real estate', l1:'Budget', l1v:'Set', l2:'Timeline', l2v:'Within a month', l3:'Lead seriousness', b4h:'Real-estate bot', b4p:'Qualifies leads and finds out who is serious.',
    whyH:'Built for you to trust.',
    w1h:'Answers from your data only', w1p:'The bot never invents information. Every reply comes from your own business data.',
    w2h:'A system of your own', w2p:'Each client has a separate system, files and database, and your data is yours.',
    w3h:'Talk to the bot before you pay', w3p:'Send “demo” and see the bot’s speed and tone for yourself, then decide.',
    w4h:'Support after launch', w4p:'An engineer owns your system from day one and stays with you after launch.',
    offB:'Launch offer', offP:'Discount on the monthly subscription until 14 June 2027. Setup fee unchanged.',
    startH:'Send “demo” and talk to the bot yourself.', startP:'The bot asks about your business, tells you the right package and its price, and you see first-hand how it would talk to your customers.',
    startBtn:'Open WhatsApp and send “demo”',
    ftAbout:'AI business automation for small and mid-sized businesses, anywhere.', ft1:'Contact', ft2:'Legal', ftWa:'WhatsApp', ftFb:'Facebook',
    terms:'Terms & Conditions', privacy:'Privacy Policy'
  };
  var AR = {};
  document.querySelectorAll('[data-i18n]').forEach(function(el){ AR[el.getAttribute('data-i18n')] = el.textContent; });
  document.querySelectorAll('[data-i18n-html]').forEach(function(el){ AR[el.getAttribute('data-i18n-html')] = el.innerHTML; });
  document.querySelectorAll('[data-i18n-aria]').forEach(function(el){ AR[el.getAttribute('data-i18n-aria')] = el.getAttribute('aria-label'); });
  var lang = 'ar';

  /* ---- word split ---- */
  function split(el){
    var i = 0, out = document.createDocumentFragment();
    [].slice.call(el.childNodes).forEach(function(n){
      if (n.nodeType === 3){
        n.textContent.split(/(\s+)/).forEach(function(t){
          if (!t) return;
          if (/^\s+$/.test(t)){ out.appendChild(document.createTextNode(t)); return; }
          var w = document.createElement('span'); w.className = 'w';
          var s = document.createElement('span'); s.style.setProperty('--i', i++); s.textContent = t;
          w.appendChild(s); out.appendChild(w);
        });
      } else {
        var w2 = document.createElement('span'); w2.className = 'w';
        var s2 = document.createElement('span'); s2.style.setProperty('--i', i++);
        s2.appendChild(n.cloneNode(true)); w2.appendChild(s2); out.appendChild(w2);
      }
    });
    el.innerHTML = ''; el.appendChild(out);
  }
  var splits = [].slice.call(document.querySelectorAll('.split'));
  splits.forEach(split);

  /* ---- number ticker ---- */
  function runTick(el){
    var to = +el.getAttribute('data-to'), fmt = el.hasAttribute('data-fmt'), t0 = null, D = 1600;
    if (reduce){ el.textContent = fmt ? to.toLocaleString('en-US') : to; return; }
    function f(t){ if (!t0) t0 = t; var p = Math.min(1,(t-t0)/D); var v = Math.round(to*(1-Math.pow(1-p,4))); el.textContent = fmt ? v.toLocaleString('en-US') : v; if (p<1) requestAnimationFrame(f); }
    requestAnimationFrame(f);
  }

  /* ---- reveal on view ---- */
  if (hasIO){
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        if (e.target.classList.contains('tick')) runTick(e.target);
        io.unobserve(e.target);
      });
    }, {rootMargin:'0px 0px -8% 0px', threshold:.12});
    document.querySelectorAll('.rv,.split,.tick').forEach(function(el){ io.observe(el); });
    setTimeout(function(){ document.querySelectorAll('.rv,.split').forEach(function(el){ if (el.getBoundingClientRect().top < innerHeight) el.classList.add('in'); }); }, 1800);
  }

  /* ---- rotating words ---- */
  var ROT = { ar:['بيرد على عملائك','بياخد الأوردرات','بيحجز المواعيد','بيسجّل في الشيت'], en:['answers customers','takes orders','books appointments','logs to your sheet'] };
  var ri = 0;
  function drawRot(){
    $('rot').innerHTML = ROT[lang].map(function(t,k){ return '<span class="'+(k===ri?'on':'')+'">'+t+'</span>'; }).join('');
  }
  function nextRot(){
    var s = $('rot').children; if (!s.length) return;
    s[ri].classList.remove('on'); s[ri].classList.add('out');
    var prev = s[ri]; setTimeout(function(){ prev.classList.remove('out'); }, 750);
    ri = (ri+1) % s.length; s[ri].classList.add('on');
  }

  /* ---- live grid on boards (animated grid pattern) ---- */
  var NS = 'http://www.w3.org/2000/svg';
  function gridFX(board){
    var svg = document.createElementNS(NS,'svg'); svg.setAttribute('class','gridfx'); svg.setAttribute('aria-hidden','true');
    var id = 'g'+Math.random().toString(36).slice(2,7), S = 44;
    svg.innerHTML = '<defs><pattern id="'+id+'" width="'+S+'" height="'+S+'" patternUnits="userSpaceOnUse"><path class="gl" d="M'+S+' 0H0V'+S+'"/></pattern></defs><rect width="100%" height="100%" fill="url(#'+id+')"/>';
    board.insertBefore(svg, board.firstChild);
    var spot = document.createElement('div'); spot.className = 'spot'; board.insertBefore(spot, svg.nextSibling);
    function place(r){
      var w = board.clientWidth, h = board.clientHeight;
      r.setAttribute('x', Math.floor(Math.random()*w/S)*S+1); r.setAttribute('y', Math.floor(Math.random()*h/S)*S+1);
    }
    for (var k=0, NSQ = innerWidth < 700 ? 7 : 18; k<NSQ; k++){
      var r = document.createElementNS(NS,'rect'); r.setAttribute('class','sq'); r.setAttribute('width',S-1); r.setAttribute('height',S-1);
      r.style.animationDelay = (Math.random()*4).toFixed(2)+'s'; r.style.animationDuration = (3+Math.random()*3).toFixed(2)+'s';
      place(r); r.addEventListener('animationiteration', function(e){ place(e.target); });
      svg.appendChild(r);
    }
    if (finePointer) board.addEventListener('pointermove', function(e){
      var b = board.getBoundingClientRect(); board.style.setProperty('--mx',(e.clientX-b.left)+'px'); board.style.setProperty('--my',(e.clientY-b.top)+'px');
    });
  }
  document.querySelectorAll('.board.fx').forEach(gridFX);

  /* ---- spotlight tiles + magnetic buttons ---- */
  if (finePointer && !reduce){
    document.querySelectorAll('.tile').forEach(function(t){
      t.addEventListener('pointermove', function(e){ var b = t.getBoundingClientRect(); t.style.setProperty('--mx',(e.clientX-b.left)+'px'); t.style.setProperty('--my',(e.clientY-b.top)+'px'); });
    });
    document.querySelectorAll('.mag').forEach(function(m){
      m.addEventListener('pointermove', function(e){ var b = m.getBoundingClientRect(); var x = (e.clientX-b.left-b.width/2)*.18, y = (e.clientY-b.top-b.height/2)*.3; m.style.transform = 'translate('+x+'px,'+y+'px)'; });
      m.addEventListener('pointerleave', function(){ m.style.transform = ''; });
    });
  }

  /* ---- marquee ---- */
  var MQ = { ar:['عيادات','مطاعم','جيم','عقارات','خدمة عملاء','حجوزات','أوردرات','تقارير'], en:['Clinics','Restaurants','Gyms','Real estate','Customer service','Bookings','Orders','Reports'] };
  function drawMarquee(){ var h = MQ[lang].map(function(t){ return '<span>'+t+'<i></i></span>'; }).join(''); $('marquee').innerHTML = h + h; }

  /* ---- bento animated list ---- */
  var AL = [
    {ar:['سؤال عن الأسعار','اتردّ عليه'], en:['Price question','Answered'], i:'i-chat', t:'10:02'},
    {ar:['حجز كشف 5:00','اتسجل في الشيت'], en:['Visit booked 5:00','Logged to sheet'], i:'i-cal', t:'10:05'},
    {ar:['أوردر بـ 215 جنيه','اتبعت للمطبخ'], en:['215 EGP order','Sent to kitchen'], i:'i-bell', t:'10:09'},
    {ar:['عميل سأل عن العنوان','اتبعتله اللوكيشن'], en:['Asked for address','Location sent'], i:'i-chat', t:'10:12'},
    {ar:['اشتراك جديد 3 شهور','اتسجل'], en:['New 3-month member','Logged'], i:'i-sheet', t:'10:16'}
  ];
  var ali = 0, alist = $('alist');
  function alEl(d){ var e = document.createElement('div'); e.className='it'; e.innerHTML = '<span class="av"><svg aria-hidden="true" class="ico"><use href="#'+d.i+'"/></svg></span><div><b>'+d[lang][0]+'</b><small>'+d[lang][1]+'</small></div><span class="ltr">'+d.t+'</span>'; return e; }
  function alLayout(){ [].slice.call(alist.children).reverse().forEach(function(el,k){ el.style.transform = 'translateY('+(k*72)+'px) scale('+(1-k*.03)+')'; el.style.opacity = k>3?0:1-k*.15; }); [].slice.call(alist.children).slice(0, Math.max(0, alist.children.length-5)).forEach(function(el){ el.remove(); }); }
  function alSeed(){ alist.innerHTML=''; for (var k=3;k>=0;k--){ alist.appendChild(alEl(AL[k])); } ali = 4; alLayout(); }
  function alAdd(){ var e = alEl(AL[ali % AL.length]); ali++; e.style.opacity = 0; e.style.transform = 'translateY(-30px) scale(.96)'; alist.appendChild(e); void e.offsetWidth; alLayout(); }

  /* ---- system stage (illustrative) ---- */
  var S = [
    { biz:{ar:'عيادة د. سارة',en:'Dr. Sara Clinic'}, file:'clinic_bookings.xlsx',
      inn:{ar:'عايزة أحجز كشف بكرة الساعة 5',en:'I’d like to book a visit tomorrow at 5'},
      out:{ar:'اتحجزلك بكرة 5:00، وهبعتلك تذكير قبلها بساعة.',en:'Booked for tomorrow at 5:00. I’ll remind you an hour before.'},
      core:{ar:'حجز كشف',en:'New booking'}, row:[{ar:'منى أحمد',en:'Mona Ahmed'},'5:00',{ar:'مؤكد',en:'Confirmed'}], prev:[{ar:'كريم سامي',en:'Karim Samy'},'3:30'],
      slot:17, note:{ar:'حجز جديد: منى أحمد بكرة 5:00',en:'New booking: Mona Ahmed, tomorrow 5:00'} },
    { biz:{ar:'مطعم الشيف',en:'Chef’s Kitchen'}, file:'orders.xlsx',
      inn:{ar:'عايز 2 شاورما وبطاطس كبيرة دليفري',en:'2 shawarma and large fries, delivery please'},
      out:{ar:'تمام! الإجمالي 215 جنيه، والأوردر هيوصلك خلال 40 دقيقة.',en:'Done! Total 215 EGP, arriving in about 40 minutes.'},
      core:{ar:'أوردر جديد',en:'New order'}, row:[{ar:'أحمد علي',en:'Ahmed Ali'},'215',{ar:'جديد',en:'New'}], prev:[{ar:'سلمى حسن',en:'Salma Hassan'},'340'],
      slot:9, note:{ar:'أوردر جديد بـ 215 جنيه اتبعت للمطبخ',en:'New 215 EGP order sent to the kitchen'} },
    { biz:{ar:'جيم باور',en:'Power Gym'}, file:'members.xlsx',
      inn:{ar:'عايز أشترك 3 شهور، السعر كام؟',en:'I want a 3-month membership, how much?'},
      out:{ar:'اشتراك 3 شهور بـ 1,500 جنيه. أسجّلك من السبت؟',en:'3 months is 1,500 EGP. Shall I sign you up from Saturday?'},
      core:{ar:'اشتراك جديد',en:'New member'}, row:[{ar:'يوسف مراد',en:'Youssef Morad'},{ar:'3 شهور',en:'3 mo'},{ar:'مؤكد',en:'Confirmed'}], prev:[{ar:'نور خالد',en:'Nour Khaled'},{ar:'شهر',en:'1 mo'}],
      slot:5, note:{ar:'مشترك جديد يبدأ السبت',en:'New member starting Saturday'} }
  ];
  var DAYS = {ar:['سبت','حد','اتنين','تلات','أربع','خميس','جمعة'], en:['Sat','Sun','Mon','Tue','Wed','Thu','Fri']};
  var BUSY = [1,3,8,11,12,15,19,20];
  var si = 0, num = 39, answered = 38, timers = [];
  function pad(n){ return ('00'+n).slice(-3); }
  function tx(v){ return typeof v === 'string' ? v : v[lang]; }
  function drawCal(fill){
    $('calDays').innerHTML = DAYS[lang].map(function(d){ return '<span>'+d+'</span>'; }).join('');
    var h=''; for (var i=0;i<21;i++){ h += '<span class="'+(i===fill?'fill':(BUSY.indexOf(i)>-1?'busy':''))+'"></span>'; }
    $('cal').innerHTML = h;
  }
  function setStatic(sc, done){
    $('bizName').textContent = tx(sc.biz); $('sheetFile').textContent = sc.file;
    $('bIn').textContent = tx(sc.inn); $('bOut').textContent = tx(sc.out);
    $('r1a').textContent = tx(sc.prev[0]); $('r1b').textContent = tx(sc.prev[1]);
    $('r2a').textContent = tx(sc.row[0]); $('r2b').textContent = tx(sc.row[1]); $('r2c').textContent = tx(sc.row[2]);
    $('noteTxt').textContent = tx(sc.note);
    $('coreNum').textContent = pad(num); $('yourNum').textContent = pad(num+1); $('answered').textContent = answered;
    drawCal(done ? sc.slot : -1);
  }
  function cls(id, c, on){ $(id).classList.toggle(c, on); }
  function later(fn, ms){ timers.push(setTimeout(fn, ms)); }
  function resetStage(){
    ['bIn','bOut','typing','newRow','note'].forEach(function(id){ cls(id,'show',false); });
    ['oSheet','oCal','oNote'].forEach(function(id){ cls(id,'hit',false); });
    ['cs1','cs2','cs3'].forEach(function(id){ cls(id,'on',false); });
    cls('l1','go',false); cls('l2','go',false); cls('core','hit',false);
    $('coreTxt').textContent = lang==='en'?EN.coreIdle:AR.coreIdle;
  }
  function play(){
    var sc = S[si];
    resetStage(); setStatic(sc, false);
    later(function(){ cls('bIn','show',true); }, 300);
    later(function(){ void $('l1').offsetWidth; cls('l1','go',true); }, 1100);
    later(function(){ num++; $('coreNum').textContent = pad(num); $('yourNum').textContent = pad(num+1); cls('core','hit',true); cls('cs1','on',true); $('coreTxt').textContent = tx(sc.core); }, 1900);
    later(function(){ cls('typing','show',true); cls('cs2','on',true); }, 2400);
    later(function(){ cls('typing','show',false); cls('bOut','show',true); answered++; $('answered').textContent = answered; }, 3600);
    later(function(){ void $('l2').offsetWidth; cls('l2','go',true); cls('cs3','on',true); }, 4000);
    later(function(){ cls('newRow','show',true); cls('oSheet','hit',true); }, 4700);
    later(function(){ drawCal(sc.slot); cls('oCal','hit',true); }, 4900);
    later(function(){ cls('note','show',true); cls('oNote','hit',true); }, 5100);
    later(function(){ si = (si+1) % S.length; play(); }, 9200);
  }
  function showFinal(){
    var sc = S[si]; setStatic(sc, true);
    ['bIn','bOut','newRow','note'].forEach(function(id){ cls(id,'show',true); });
    ['cs1','cs2','cs3'].forEach(function(id){ cls(id,'on',true); });
    $('coreTxt').textContent = tx(sc.core);
  }
  function clock(){ var d=new Date(); $('clock').textContent = ('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2); }
  clock(); setInterval(clock, 15000);

  /* ---- how steps ---- */
  var steps = [].slice.call(document.querySelectorAll('#steps .step'));
  var screens = ['sc1','sc2','sc3'].map($);
  var cur = -1, stepTimer = null, STEP_MS = 6000, pinMode = false, hMode = false, userPicked = false;
  var desk = window.matchMedia('(min-width:1061px)');
  function selectStep(i){
    if (i === cur) return; cur = i;
    steps.forEach(function(s,k){ s.classList.toggle('on', k===i); s.querySelector('button').setAttribute('aria-pressed', k===i); });
    screens.forEach(function(s,k){ s.classList.toggle('on', k===i); });
    if (i === 2) [].forEach.call(screens[2].querySelectorAll('.tick'), runTick);
  }
  function setBars(i, frac){ steps.forEach(function(s,k){ s.querySelector('.bar i').style.setProperty('--bp', k<i?1:(k===i?frac:0)); }); }
  function scrollToY(y){ if (lenis) lenis.scrollTo(y, {duration:1.2}); else scrollTo({top:y, behavior: reduce?'auto':'smooth'}); }
  steps.forEach(function(s,k){ s.querySelector('button').addEventListener('click', function(){
    if (pinMode){ var pin = $('howPin'), top = pin.getBoundingClientRect().top + scrollY, span = pin.offsetHeight - innerHeight; scrollToY(top + span * (k/3 + .04)); }
    else { userPicked = true; clearInterval(stepTimer); selectStep(k); setBars(k,1); }
  }); });
  function timed(){
    var t0 = Date.now(), i = 0; selectStep(0); clearInterval(stepTimer);
    stepTimer = setInterval(function(){ if (userPicked) return; var f = (Date.now()-t0)/STEP_MS; if (f >= 1){ i = (i+1)%3; t0 = Date.now(); f = 0; selectStep(i); } setBars(i, f); }, 60);
  }
  var wk = [9,7,11,8,12,6,5];
  $('week').innerHTML = wk.map(function(v){ return '<div><i style="height:'+(v/12*100)+'%"></i><small class="dn"></small></div>'; }).join('');
  function drawWeekLabels(){ [].forEach.call(document.querySelectorAll('#week .dn'), function(el,k){ el.textContent = DAYS[lang][k]; }); }

  /* ---- horizontal ride ---- */
  var solPin = $('solPin'), track = $('track'), hDist = 0;
  function setupModes(){
    pinMode = desk.matches && !reduce; hMode = desk.matches && !reduce;
    root.classList.toggle('pin-on', pinMode); root.classList.toggle('hpin-on', hMode);
    track.style.transform = '';
    if (hMode){ hDist = Math.max(0, track.scrollWidth - track.clientWidth + (parseFloat(getComputedStyle(track).paddingLeft) || 0)); solPin.style.height = (window.innerHeight + hDist) + 'px'; }
    else solPin.style.height = '';
    clearInterval(stepTimer);
    if (pinMode){ cur = -1; } else if (reduce){ selectStep(0); setBars(0,1); } else timed();
    onScroll();
  }

  /* ---- scroll engine ---- */
  var bands = [].slice.call(document.querySelectorAll('[data-band]'));
  function onScroll(){
    var vh = innerHeight, y = window.scrollY;
    var max = document.documentElement.scrollHeight - vh;
    $('progress').style.setProperty('--sp', max>0 ? Math.min(1, y/max) : 0);
    if (!reduce){
      bands.forEach(function(b){
        var r = b.getBoundingClientRect();
        var p = (vh * .85 - r.top) / (vh * .6); p = Math.max(0, Math.min(1, p)); p = p*p*(3-2*p);
        b.style.setProperty('--p', p.toFixed(3));
      });
    }
    if (pinMode){
      var pin = $('howPin'), r2 = pin.getBoundingClientRect(), span = pin.offsetHeight - vh;
      var f = Math.max(0, Math.min(.9999, -r2.top / span)), idx = Math.floor(f*3);
      selectStep(idx); setBars(idx, f*3 - idx);
    }
    if (hMode && hDist > 0){
      var r3 = solPin.getBoundingClientRect(), span3 = solPin.offsetHeight - vh;
      var g = Math.max(0, Math.min(1, -r3.top / span3));
      var dir = root.dir === 'rtl' ? 1 : -1;
      track.style.transform = 'translate3d('+(dir*hDist*g)+'px,0,0)';
      $('solIdx').textContent = '0' + (1 + Math.min(4, Math.round(g*4)));
    }
  }
  var lenis = null;
  if (window.Lenis && !reduce){
    lenis = new Lenis({ lerp:.09, smoothWheel:true });
    lenis.on('scroll', onScroll);
    (function raf(t){ lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
  } else {
    var ticking = false;
    addEventListener('scroll', function(){ if (!ticking){ ticking = true; requestAnimationFrame(function(){ ticking = false; onScroll(); }); } }, {passive:true});
  }
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click', function(e){ var id = a.getAttribute('href'); var t = id.length>1 && document.querySelector(id); if (!t) return; e.preventDefault(); if (lenis) lenis.scrollTo(t, {offset:-70, duration:1.4}); else t.scrollIntoView({behavior: reduce?'auto':'smooth'}); });
  });
  addEventListener('resize', setupModes);

  /* ---- night stream ---- */
  var PINGS = [
    {t:'01:12', ar:'أوردر 3 وجبات اتسجل', en:'3-meal order logged', i:'i-sheet'},
    {t:'01:47', ar:'سؤال عن المواعيد اتردّ عليه', en:'Hours question answered', i:'i-chat'},
    {t:'02:20', ar:'حجز كشف السبت 6:00', en:'Visit booked Sat 6:00', i:'i-cal'},
    {t:'02:58', ar:'عميل سأل عن الأسعار', en:'Customer asked about prices', i:'i-chat'},
    {t:'03:14', ar:'أوردر دليفري اتبعت للمطبخ', en:'Delivery order sent to kitchen', i:'i-bell'}
  ];
  var pi = 0, nCount = 37, stream = $('stream');
  function pingEl(p){ var d = document.createElement('div'); d.className='ping'; d.innerHTML = '<svg aria-hidden="true" class="ico"><use href="#'+p.i+'"/></svg><span>'+p[lang]+'</span><span class="ltr">'+p.t+'</span>'; return d; }
  function layoutPings(){ var kids = [].slice.call(stream.children).reverse(); kids.forEach(function(el,k){ el.style.transform = 'translateY('+(-k*52)+'px)'; el.style.opacity = k>3?0:(1-k*.18); }); kids.slice(5).forEach(function(el){ el.remove(); }); }
  function seedPings(){ stream.innerHTML=''; for (var k=0;k<4;k++){ stream.appendChild(pingEl(PINGS[k])); } pi = 4; layoutPings(); }
  function addPing(){ var p = PINGS[pi % PINGS.length]; pi++; var el = pingEl(p); el.style.opacity = 0; el.style.transform = 'translateY(30px)'; stream.appendChild(el); void el.offsetWidth; layoutPings(); nCount++; $('nCount').textContent = nCount; $('nTime').textContent = p.t; }

  var loops = [];
  function start(){
    if (reduce){ showFinal(); return; }
    if (loops.length) return;
    play();
    loops.push(setInterval(addPing, 2800));
    loops.push(setInterval(alAdd, 2400));
    loops.push(setInterval(nextRot, 2600));
  }
  function stop(){ timers.forEach(clearTimeout); timers=[]; loops.forEach(clearInterval); loops=[]; }
  document.addEventListener('visibilitychange', function(){ if (document.hidden) stop(); else start(); });

  /* ---- light / dark ---- */
  var modeBtn = $('mode'), osDark = window.matchMedia('(prefers-color-scheme: dark)');
  function isDark(){ var t = root.getAttribute('data-theme'); return t ? t === 'dark' : osDark.matches; }
  function modeLabel(){ var d = isDark(); modeBtn.setAttribute('aria-label', lang === 'en' ? (d ? 'Switch to light mode' : 'Switch to dark mode') : (d ? 'الوضع الفاتح' : 'الوضع الغامق')); }
  try { var tm = localStorage.getItem('nesta-theme'); if (tm === 'dark' || tm === 'light') root.setAttribute('data-theme', tm); } catch(e){}
  modeBtn.addEventListener('click', function(){
    var next = isDark() ? 'light' : 'dark';
    root.classList.add('skinning'); setTimeout(function(){ root.classList.remove('skinning'); }, 650);
    root.setAttribute('data-theme', next); modeLabel();
    try { localStorage.setItem('nesta-theme', next); } catch(e){}
  });
  if (osDark.addEventListener) osDark.addEventListener('change', modeLabel);

  /* ---- language ---- */
  var btn = $('lang');
  function apply(l){
    lang = l;
    var dict = l === 'en' ? EN : AR;
    root.lang = l; root.dir = l === 'en' ? 'ltr' : 'rtl';
    document.querySelectorAll('[data-i18n]').forEach(function(el){ var v = dict[el.getAttribute('data-i18n')]; if (v != null) el.textContent = v; });
    document.querySelectorAll('[data-i18n-html]').forEach(function(el){ var v = dict[el.getAttribute('data-i18n-html')]; if (v != null) el.innerHTML = v; });
    document.querySelectorAll('[data-i18n-aria]').forEach(function(el){ var v = dict[el.getAttribute('data-i18n-aria')]; if (v != null) el.setAttribute('aria-label', v); });
    splits.forEach(split);
    btn.textContent = l === 'en' ? 'ع' : 'EN';
    btn.setAttribute('aria-label', l === 'en' ? 'التحويل للعربي' : 'Switch to English');
    setStatic(S[si], $('oCal').classList.contains('hit') || reduce);
    drawWeekLabels(); seedPings(); drawMarquee(); alSeed(); ri = 0; drawRot();
    setupModes(); modeLabel();
    try { localStorage.setItem('nesta-lang', l); } catch(e){}
  }
  btn.addEventListener('click', function(){ apply(lang === 'ar' ? 'en' : 'ar'); });

  root.lang = 'ar'; root.dir = 'rtl';
  var saved = null; try { saved = localStorage.getItem('nesta-lang'); } catch(e){}
  setStatic(S[0], false); drawWeekLabels(); seedPings(); drawMarquee(); alSeed(); drawRot();
  if (saved === 'en') apply('en');
  setupModes(); modeLabel();
  function boot(){ (window.requestIdleCallback || function(f){ setTimeout(f, 200); })(start, {timeout:1500}); }
  if (document.readyState === 'complete') boot(); else addEventListener('load', boot);
  addEventListener('load', setupModes);
})();

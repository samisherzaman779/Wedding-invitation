'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { wedding } from './weddingConfig';
import {
  MusicIcon, Share2Icon, CalendarPlusIcon, MapPinIcon,
  MessageCircleIcon, LinkIcon, XIcon, ChevronLeftIcon, ChevronRightIcon
} from './icons';

/* ---------------- helpers ---------------- */
function prefersReducedMotion(){
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
function isCoarsePointer(){
  return typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
}
function toICSDate(d){ return d.toISOString().replace(/[-:]/g,'').split('.')[0] + 'Z'; }
function buildICS(title, start, durationHrs, location, description){
  const startDate = new Date(start);
  const endDate = new Date(startDate.getTime() + durationHrs * 3600000);
  return [
    'BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT',
    `SUMMARY:${title}`,
    `DTSTART:${toICSDate(startDate)}`,
    `DTEND:${toICSDate(endDate)}`,
    `LOCATION:${location}`,
    `DESCRIPTION:${description}`,
    'END:VEVENT','END:VCALENDAR'
  ].join('\r\n');
}
function downloadICS(filename, content){
  const blob = new Blob([content], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
function googleCalUrl(title, start, durationHrs, location, description){
  const s = new Date(start), e = new Date(s.getTime() + durationHrs * 3600000);
  const fmt = d => d.toISOString().replace(/[-:]/g,'').split('.')[0] + 'Z';
  const params = new URLSearchParams({ action:'TEMPLATE', text:title, dates:`${fmt(s)}/${fmt(e)}`, location, details:description });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
function sanitizeName(name){ return name.replace(/[^a-zA-Z\s'-]/g,'').trim(); }
const pad2 = n => String(n).padStart(2,'0');

function StarDivider(){
  return (
    <div className="star-divider" aria-hidden="true">
      <span className="arm"></span>
      <svg viewBox="0 0 24 24"><path d="M12 2 14 9 21 9 15.5 13 17.5 20 12 16 6.5 20 8.5 13 3 9 10 9Z"/></svg>
      <span className="arm right"></span>
    </div>
  );
}

const CRESCENT = 'M17 3a9 9 0 1 0 0 18c-4-1.2-7-4.8-7-9s3-7.8 7-9Z';

export default function Invitation(){
  const searchParams = useSearchParams();

  /* --- loader --- */
  const [loaderHidden, setLoaderHidden] = useState(false);

  /* --- opening card sequence --- */
  const [cardOpened, setCardOpened] = useState(false);
  const [entered, setEntered] = useState(false);
  const cardCoverRef = useRef(null);
  const cardOpenedRef = useRef(false);
  const enterTimer = useRef(null);

  /* --- music --- */
  const bgmRef = useRef(null);
  const [musicPlaying, setMusicPlaying] = useState(false);

  /* --- guest personalization --- */
  const [guestName, setGuestName] = useState(null);

  /* --- countdown --- */
  const [cd, setCd] = useState(null); // {d,h,m,s} | 'done'

  /* --- event nav --- */
  const [activeEvent, setActiveEvent] = useState(
    wedding.events.length ? 'ev-' + wedding.events[0].id : ''
  );

  /* --- scroll reveal --- */
  const [revealed, setRevealed] = useState([]);

  /* --- lightbox --- */
  const [lbOpen, setLbOpen] = useState(false);
  const [lbIndex, setLbIndex] = useState(0);
  const touchStartX = useRef(null);

  /* --- rsvp --- */
  const rsvpFormRef = useRef(null);
  const [nameError, setNameError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [rsvpThanksName, setRsvpThanksName] = useState('');

  /* --- wishes --- */
  const wishFormRef = useRef(null);
  const [wishes, setWishes] = useState([
    { name: 'Sana', text: 'May Allah bless your marriage with love and happiness.' }
  ]);

  /* --- share --- */
  const [copied, setCopied] = useState(false);
  const qrInit = useRef(false);

  /* --- computed display values --- */
  const weddingDateObj = new Date(wedding.weddingDate);
  const dateFmt = weddingDateObj.toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' });
  const closingDate = `${weddingDateObj.getDate()} · ${weddingDateObj.toLocaleDateString('en-GB',{month:'long'}).toUpperCase()} · ${weddingDateObj.getFullYear()}`;
  const groomInitial = wedding.couple.groom.charAt(0).toUpperCase();
  const brideInitial = wedding.couple.bride.charAt(0).toUpperCase();

  const revealCls = id => `reveal${revealed.includes(id) ? ' in' : ''}`;

  /* ====================== EFFECTS ====================== */

  // loader fade
  useEffect(() => {
    const t = setTimeout(() => setLoaderHidden(true), 1300);
    return () => clearTimeout(t);
  }, []);

  // lock scroll until the invitation is entered
  useEffect(() => {
    document.body.style.overflow = entered ? 'auto' : 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, [entered]);

  // guest name (?guest=Name or /invite/Name)
  useEffect(() => {
    let name = null;
    const fromQuery = searchParams.get('guest');
    if(fromQuery) name = sanitizeName(fromQuery);
    if(!name){
      const pathMatch = window.location.pathname.match(/\/invite\/([^/]+)/);
      if(pathMatch) name = sanitizeName(decodeURIComponent(pathMatch[1]));
    }
    setGuestName(name || null);
  }, [searchParams]);

  // countdown
  useEffect(() => {
    const target = new Date(wedding.weddingDate).getTime();
    let interval = null;
    function tick(){
      const diff = target - Date.now();
      if(diff <= 0){ setCd('done'); if(interval) clearInterval(interval); return; }
      setCd({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff / 3600000) % 24),
        m: Math.floor((diff / 60000) % 60),
        s: Math.floor((diff / 1000) % 60)
      });
    }
    tick();
    interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // scroll reveal
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          setRevealed(prev => prev.includes(entry.target.id) ? prev : [...prev, entry.target.id]);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .15 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // event nav active state
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if(entry.isIntersecting) setActiveEvent(entry.target.id); });
    }, { rootMargin: '-40% 0px -50% 0px' });
    document.querySelectorAll('.event-block').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // scroll progress bar
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
      document.getElementById('scrollProgress').style.width = scrolled + '%';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // particles — gold sparks in hero
  useEffect(() => {
    if(prefersReducedMotion()) return;
    const wrap = document.getElementById('petals');
    if(!wrap) return;
    for(let i = 0; i < 16; i++){
      const p = document.createElement('div');
      p.className = 'spark';
      const size = 2 + Math.random() * 2.5;
      p.style.width = size + 'px'; p.style.height = size + 'px';
      p.style.left = Math.random() * 100 + '%';
      p.style.animationDuration = (7 + Math.random() * 9) + 's';
      p.style.animationDelay = (Math.random() * 8) + 's';
      wrap.appendChild(p);
    }
  }, []);

  // custom cursor (desktop, non-touch only)
  useEffect(() => {
    const dot = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');
    if(isCoarsePointer() || prefersReducedMotion()){
      if(dot) dot.style.display = 'none';
      if(ring) ring.style.display = 'none';
      return;
    }
    document.body.classList.add('has-cursor');
    let rx = 0, ry = 0, tx = 0, ty = 0, raf;
    const onMove = e => {
      dot.style.left = e.clientX + 'px'; dot.style.top = e.clientY + 'px';
      tx = e.clientX; ty = e.clientY;
    };
    const onEnter = () => ring.classList.add('magnet');
    const onLeave = () => ring.classList.remove('magnet');
    const magnets = document.querySelectorAll('a, button, .gallery-grid img');
    magnets.forEach(el => {
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
    });
    function animRing(){
      rx += (tx - rx) * 0.18; ry += (ty - ry) * 0.18;
      ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
      raf = requestAnimationFrame(animRing);
    }
    window.addEventListener('mousemove', onMove);
    animRing();
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
      document.body.classList.remove('has-cursor');
      magnets.forEach(el => {
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
      });
    };
  }, []);

  // lightbox keyboard controls
  useEffect(() => {
    if(!lbOpen) return;
    const onKey = e => {
      if(e.key === 'Escape') setLbOpen(false);
      if(e.key === 'ArrowLeft') setLbIndex(i => (i - 1 + wedding.gallery.length) % wedding.gallery.length);
      if(e.key === 'ArrowRight') setLbIndex(i => (i + 1) % wedding.gallery.length);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [lbOpen]);

  // cleanup pending enter timer
  useEffect(() => () => clearTimeout(enterTimer.current), []);

  /* ====================== OPENING SEQUENCE ====================== */

  const enterSite = useCallback(() => {
    setEntered(true);
    const bgm = bgmRef.current;
    if(bgm) bgm.play().then(() => setMusicPlaying(true)).catch(() => {});
  }, []);

  function sparkleBurst(originEl){
    if(!originEl || prefersReducedMotion()) return;
    const rect = originEl.getBoundingClientRect();
    for(let i = 0; i < 12; i++){
      const s = document.createElement('div');
      s.className = 'opening-sparkle';
      const size = 2 + Math.random() * 3;
      s.style.width = size + 'px'; s.style.height = size + 'px';
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 60;
      s.style.left = (rect.left + rect.width / 2) + 'px';
      s.style.top = (rect.top + rect.height / 2) + 'px';
      document.body.appendChild(s);
      s.animate([
        { transform: 'translate(-50%,-50%) scale(.4)', opacity: 0 },
        { transform: `translate(${Math.cos(angle) * dist - 50}%, ${Math.sin(angle) * dist - 50}%) scale(1)`, opacity: 1, offset: .4 },
        { transform: `translate(${Math.cos(angle) * dist * 1.6 - 50}%, ${Math.sin(angle) * dist * 1.6 - 50}%) scale(.3)`, opacity: 0 }
      ], { duration: 900 + Math.random() * 400, easing: 'ease-out' }).onfinish = () => s.remove();
    }
  }

  function openCard(){
    if(cardOpenedRef.current) return;
    cardOpenedRef.current = true;
    setCardOpened(true);
    sparkleBurst(cardCoverRef.current);
    enterTimer.current = setTimeout(enterSite, prefersReducedMotion() ? 900 : 4200);
  }

  function onCardActivate(){
    if(!cardOpenedRef.current) openCard();
    else enterSite(); // a second tap skips ahead immediately
  }

  function onCardKeyDown(e){
    if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); onCardActivate(); }
  }

  /* ====================== MUSIC ====================== */

  function toggleMusic(){
    const bgm = bgmRef.current;
    if(!bgm) return;
    if(musicPlaying){ bgm.pause(); setMusicPlaying(false); }
    else { bgm.play().then(() => setMusicPlaying(true)).catch(() => {}); }
  }

  /* ====================== CALENDAR ====================== */

  function addMainCal(){
    const url = googleCalUrl(
      `${wedding.couple.groom} & ${wedding.couple.bride} — Nikah`,
      wedding.weddingDate, 4, wedding.venue.address, 'Join us to celebrate!'
    );
    window.open(url, '_blank');
  }

  function addEventCal(i){
    const ev = wedding.events[i];
    downloadICS(`${ev.name}.ics`, buildICS(ev.name, wedding.weddingDate, 4, ev.venue, ev.description));
  }

  /* ====================== LIGHTBOX ====================== */

  function openLightbox(idx){ setLbIndex(idx); setLbOpen(true); }
  const lbPrev = () => setLbIndex(i => (i - 1 + wedding.gallery.length) % wedding.gallery.length);
  const lbNext = () => setLbIndex(i => (i + 1) % wedding.gallery.length);

  function onLbTouchStart(e){ touchStartX.current = e.touches[0].clientX; }
  function onLbTouchEnd(e){
    if(touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if(dx > 50) lbPrev();
    if(dx < -50) lbNext();
    touchStartX.current = null;
  }

  /* ====================== RSVP (in-memory mock data layer) ====================== */

  async function onRsvpSubmit(e){
    e.preventDefault();
    const form = rsvpFormRef.current;
    const nameField = form.querySelector('#rName');
    setNameError(false);
    if(!nameField.value.trim()){
      setNameError(true);
      nameField.focus();
      return;
    }
    setSubmitting(true);
    const data = Object.fromEntries(new FormData(form).entries());
    await new Promise(res => setTimeout(res, 900)); // mock network delay
    setSubmitting(false);
    setRsvpThanksName(`Thank you, ${data.name.split(' ')[0]}.`);
    setRsvpSubmitted(true);
  }

  function onRsvpAnother(){
    rsvpFormRef.current.reset();
    setRsvpSubmitted(false);
  }

  /* ====================== WISHES (in-memory) ====================== */

  function onWishSubmit(e){
    e.preventDefault();
    const form = wishFormRef.current;
    const name = form.querySelector('#wishName').value.trim();
    const text = form.querySelector('#wishText').value.trim();
    if(!name || !text) return;
    setWishes(prev => [...prev, { name, text }]);
    form.reset();
  }

  /* ====================== SHARE / QR ====================== */

  function initQR(){
    if(qrInit.current || !window.QRCode) return;
    qrInit.current = true;
    new window.QRCode(document.getElementById('qrcode'), {
      text: window.location.href, width: 128, height: 128,
      colorDark: '#050705', colorLight: '#F6F1E4'
    });
  }

  async function waShare(){
    const inviteUrl = window.location.href;
    const text = `You're invited to celebrate the wedding of ${wedding.couple.groom} & ${wedding.couple.bride} ❤️\n\nView the invitation:\n${inviteUrl}`;
    if(navigator.share){
      try{ await navigator.share({ title: 'Wedding Invitation', text, url: inviteUrl }); return; }catch(err){}
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  async function copyLink(){
    try{
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }catch(err){}
  }

  const scrollToShare = () => document.getElementById('share')?.scrollIntoView({ behavior: 'smooth' });

  /* ====================== RENDER ====================== */

  return (
    <>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"
        strategy="afterInteractive"
        onLoad={initQR}
      />

      <div id="scrollProgress"></div>
      <div className="ambient" aria-hidden="true"></div>
      <div id="cursorRing" aria-hidden="true"></div>
      <div id="cursorDot" aria-hidden="true"></div>

      {/* ============ LOADER ============ */}
      <div id="loader" aria-hidden="true" className={loaderHidden ? 'hide' : ''}>
        <div className="loader-ring"></div>
        <svg className="loader-crescent" viewBox="0 0 24 24" fill="none" stroke="#F0CE7C" strokeWidth="1.2"><path d={CRESCENT}/></svg>
        <div className="loader-mark"><span>{groomInitial}</span><span>&amp;</span><span>{brideInitial}</span></div>
        <div className="loader-sub">PREPARING YOUR INVITATION</div>
      </div>

      {/* ============ OPENING ============ */}
      <div id="opening" role="dialog" aria-label="Wedding invitation opening" className={entered ? 'opened' : ''}>
        <div className="opening-inner">

          <div
            className={cardOpened ? 'card-scene opened' : 'card-scene'}
            id="cardScene"
            tabIndex={0}
            role="button"
            aria-label={cardOpened ? 'Invitation opened' : 'Open the wedding invitation'}
            onClick={onCardActivate}
            onKeyDown={onCardKeyDown}
          >
            <div className="card-inside">
              <div className="card-inside-shade" aria-hidden="true"></div>
              <svg className="opening-crescent" viewBox="0 0 24 24" fill="none" stroke="#F0CE7C" strokeWidth="1.2"><path d={CRESCENT}/></svg>
              {wedding.showBismillah && <div className="opening-bismillah">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ</div>}
              <div className="opening-together">Together with their families</div>
              <div className="opening-names">
                <span className="name groomName">{wedding.couple.groom}</span>
                <span className="amp">&amp;</span>
                <span className="name brideName">{wedding.couple.bride}</span>
              </div>
              <div className="opening-date">{dateFmt} · {wedding.city}</div>
            </div>

            <div className="card-cover" ref={cardCoverRef}>
              <div className="cover-face">
                <svg className="cover-crescent" viewBox="0 0 24 24" fill="none" stroke="#F0CE7C" strokeWidth="1.2"><path d={CRESCENT}/></svg>
                <div className="cover-monogram">{groomInitial}<span className="amp">&amp;</span>{brideInitial}</div>
                <div className="cover-sub">TOGETHER WITH THEIR FAMILIES</div>
                <div className="cover-tap">TAP TO OPEN</div>
              </div>
            </div>
          </div>

          <div className="opening-hint after-open" id="postHint">ENTERING…</div>
        </div>
      </div>

      {/* ============ FLOATING UI ============ */}
      <div className="floating-ui">
        <button
          className="fab"
          aria-label={musicPlaying ? 'Pause background music' : 'Play background music'}
          data-playing={musicPlaying ? 'true' : 'false'}
          onClick={toggleMusic}
        >
          <MusicIcon size={18}/>
        </button>
        <button className="fab" aria-label="Jump to share section" onClick={scrollToShare}>
          <Share2Icon size={18}/>
        </button>
      </div>
      <audio ref={bgmRef} loop preload="none">
        <source src={wedding.music} type="audio/mpeg"/>
      </audio>

      {/* ============ EVENT NAV ============ */}
      {wedding.events.length > 1 && (
        <nav id="eventNav" aria-label="Jump to event">
          {wedding.events.map(ev => (
            <button
              key={ev.id}
              className={activeEvent === 'ev-' + ev.id ? 'active' : ''}
              onClick={() => document.getElementById('ev-' + ev.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              {ev.name}
            </button>
          ))}
        </nav>
      )}

      <main>

        {/* ============ HERO ============ */}
        <section id="hero">
          <div id="petals" aria-hidden="true"></div>
          <div>
            {guestName && <div className="hero-guest">Dear {guestName}</div>}
            <div className="hero-together">Together with their families</div>
            <h1 className="hero-names">
              {wedding.couple.groom}<span className="amp">&amp;</span>{wedding.couple.bride}
            </h1>
            <p className="hero-msg">are delighted to invite you to celebrate their Nikah, and to share in every moment of the joy that follows — insha&apos;Allah.</p>
            <div className="hero-meta">{dateFmt}<span className="dot">·</span>{wedding.city}</div>
          </div>
          <div className="scroll-cue" aria-hidden="true"><div className="stem"></div></div>
        </section>

        {/* ============ AYAH ============ */}
        <section id="ayah" className={revealCls('ayah')}>
          <StarDivider/>
          <p className="ayah-arabic">وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوٓا۟ إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً</p>
          <p className="ayah-translation">&quot;And of His signs is that He created for you mates from among yourselves, that you may find tranquility in them, and He placed between you affection and mercy.&quot;</p>
          <p className="ayah-ref">Surah Ar-Rum 30:21</p>
        </section>

        {/* ============ COUNTDOWN ============ */}
        <section id="countdown" className={`section ${revealCls('countdown')}`}>
          <div className="container">
            <p className="eyebrow-quiet" style={{textAlign:'center'}}>Counting down to the Nikah</p>
            <StarDivider/>
            {cd === 'done' ? (
              <div className="cd-done">Today is the day — see you there ✦</div>
            ) : (
              <div className="cd-row">
                <div className="cd-unit"><div className="cd-num">{cd ? pad2(cd.d) : '--'}</div><div className="cd-lbl">Days</div></div>
                <div className="cd-unit"><div className="cd-num">{cd ? pad2(cd.h) : '--'}</div><div className="cd-lbl">Hours</div></div>
                <div className="cd-unit"><div className="cd-num">{cd ? pad2(cd.m) : '--'}</div><div className="cd-lbl">Minutes</div></div>
                <div className="cd-unit"><div className="cd-num cd-flip" key={cd ? cd.s : 'init'}>{cd ? pad2(cd.s) : '--'}</div><div className="cd-lbl">Seconds</div></div>
              </div>
            )}
            <div className="event-actions" style={{justifyContent:'center', marginTop:34}}>
              <button className="btn small" onClick={addMainCal}><CalendarPlusIcon size={14}/> Add to calendar</button>
            </div>
          </div>
        </section>

        {/* ============ STORY ============ */}
        <section id="story" className={`section ${revealCls('story')}`}>
          <div className="container">
            <p className="label" style={{textAlign:'center'}}>How We Met</p>
            <StarDivider/>
            <div style={{marginTop:40}}>
              {wedding.story.map(item => (
                <div className="story-item" key={item.year}>
                  <div className="story-year">{item.year}</div>
                  <div className="story-body">
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                    {item.location && <div className="story-loc">{item.location}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ EVENTS ============ */}
        <section id="events" className={`section dark-alt ${revealCls('events')}`}>
          <div className="container">
            <p className="label" style={{textAlign:'center'}}>The Celebrations</p>
            <StarDivider/>
            <div style={{marginTop:22}}>
              {wedding.events.map((ev, i) => (
                <div className="event-block" id={'ev-' + ev.id} key={ev.id}>
                  <div className="event-head">
                    <h3 className="event-name">{ev.name}</h3>
                    <div className="event-when">{ev.date}<br/>{ev.time}</div>
                  </div>
                  <p className="event-desc">{ev.description}</p>
                  <dl className="event-grid">
                    <div><dt>Venue</dt><dd>{ev.venue}</dd></div>
                    <div><dt>Dress code</dt><dd>{ev.dressCode}</dd></div>
                  </dl>
                  <div className="event-actions">
                    <a className="btn small" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.mapsQuery)}`} target="_blank" rel="noopener noreferrer">
                      <MapPinIcon size={14}/> View location
                    </a>
                    <button className="btn small" onClick={() => addEventCal(i)}><CalendarPlusIcon size={14}/> Add event</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ GALLERY ============ */}
        {wedding.gallery && wedding.gallery.length > 0 && (
          <section id="gallery" className={`section ${revealCls('gallery')}`}>
            <div className="container">
              <p className="label" style={{textAlign:'center'}}>A Few Moments</p>
              <StarDivider/>
              <div className="gallery-grid">
                {wedding.gallery.map((img, i) => (
                  <figure key={i} onClick={() => openLightbox(i)}>
                    <img src={img.url} alt={img.alt} loading="lazy"/>
                  </figure>
                ))}
              </div>
              <p className="gallery-note">Placeholder photography — replace with {wedding.couple.groom} &amp; {wedding.couple.bride}&apos;s own pictures in the gallery array.</p>
            </div>
          </section>
        )}

        {/* ============ VENUE ============ */}
        <section id="venue" className={`section dark-alt ${revealCls('venue')}`}>
          <div className="container">
            <p className="label" style={{textAlign:'center'}}>Main Venue</p>
            <StarDivider/>
            <div className="venue-card">
              <h3 style={{fontSize:25}}>{wedding.venue.name}</h3>
              <p style={{marginTop:9, fontSize:14, color:'var(--ivory-dim)'}}>{wedding.venue.address}</p>
              <p className="venue-note">Placeholder — update <code>wedding.venue</code> in the config with the real venue name and address.</p>
              <div className="venue-map" role="img" aria-label="Map preview placeholder">Map preview</div>
              <div className="event-actions">
                <a className="btn small" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(wedding.venue.mapsQuery)}`} target="_blank" rel="noopener noreferrer">
                  <MapPinIcon size={14}/> Get directions
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ============ DRESS CODE ============ */}
        {wedding.dressCode && wedding.dressCode.length > 0 && (
          <section id="dress" className={`section ${revealCls('dress')}`}>
            <div className="container">
              <p className="label" style={{textAlign:'center'}}>Dress Code</p>
              <StarDivider/>
              <div>
                {wedding.dressCode.map(d => (
                  <div className="dress-row" key={d.event}>
                    <span>{d.event}</span>
                    <span className="dress-code-label">{d.code}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ============ FAMILY ============ */}
        {wedding.family && (wedding.family.bride || wedding.family.groom) && (
          <section id="family" className={`section dark-alt ${revealCls('family')}`}>
            <div className="container">
              <p className="label" style={{textAlign:'center'}}>With Love From</p>
              <StarDivider/>
              <div className="two-col">
                <div className="family-col">
                  <h3>{wedding.couple.bride}&apos;s Family</h3>
                  <p>Karachi, Pakistan<br/><span style={{opacity:.6, fontStyle:'italic'}}>— add parents&apos; names in the config</span></p>
                </div>
                <div className="family-col">
                  <h3>{wedding.couple.groom}&apos;s Family</h3>
                  <p>Karachi, Pakistan<br/><span style={{opacity:.6, fontStyle:'italic'}}>— add parents&apos; names in the config</span></p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ============ RSVP ============ */}
        <section id="rsvp" className={`section ${revealCls('rsvp')}`}>
          <div className="container">
            <p className="label" style={{textAlign:'center'}}>RSVP</p>
            <StarDivider/>
            <p style={{textAlign:'center', fontSize:13.5, color:'var(--ivory-dim)', marginBottom:32}}>Kindly respond by {wedding.rsvpDeadline}</p>

            <form id="rsvpForm" ref={rsvpFormRef} noValidate onSubmit={onRsvpSubmit} style={{display: rsvpSubmitted ? 'none' : 'block'}}>
              <div className={nameError ? 'form-row error' : 'form-row'}>
                <label htmlFor="rName">Full name</label>
                <input id="rName" name="name" type="text" autoComplete="name" required/>
                <div className="form-err">Please tell us your name.</div>
              </div>

              <div className="form-row">
                <label>Will you be attending?</label>
                <div className="attend-toggle">
                  <label><input type="radio" name="attending" value="yes" defaultChecked/><span>Joyfully Attending</span></label>
                  <label><input type="radio" name="attending" value="no"/><span>Regretfully Declining</span></label>
                </div>
              </div>

              <div className="form-row">
                <label htmlFor="rGuests">Number of guests</label>
                <select id="rGuests" name="guests" defaultValue="1">
                  <option>1</option><option>2</option><option>3</option><option>4</option><option>5+</option>
                </select>
              </div>

              <div className="form-row">
                <label htmlFor="rMeal">Meal preference (optional)</label>
                <select id="rMeal" name="meal" defaultValue="">
                  <option value="">No preference</option>
                  <option>Regular</option>
                  <option>Vegetarian</option>
                  <option>Vegan</option>
                </select>
              </div>

              <div className="form-row">
                <label htmlFor="rPhone">Phone number (optional)</label>
                <input id="rPhone" name="phone" type="tel" autoComplete="tel"/>
              </div>

              <div className="form-row">
                <label htmlFor="rMsg">Message for the couple (optional)</label>
                <textarea id="rMsg" name="message" rows="3"></textarea>
              </div>

              <button className="btn primary" type="submit" disabled={submitting}>
                {submitting ? <span className="spinner"></span> : 'Send RSVP'}
              </button>
            </form>

            <div id="rsvpStatus" className={rsvpSubmitted ? 'show' : ''}>
              <h3 style={{fontSize:27}}>{rsvpThanksName}</h3>
              <p style={{marginTop:12, color:'var(--ivory-dim)'}}>We can&apos;t wait to celebrate with you.</p>
              <button className="btn small" style={{marginTop:20}} onClick={onRsvpAnother}>Submit another response</button>
            </div>
          </div>
        </section>

        {/* ============ WISHES ============ */}
        <section id="wishes" className={`section dark-alt ${revealCls('wishes')}`}>
          <div className="container">
            <p className="label" style={{textAlign:'center'}}>Wedding Wishes</p>
            <StarDivider/>
            <form id="wishForm" ref={wishFormRef} onSubmit={onWishSubmit} style={{display:'flex', gap:10, marginTop:22, flexWrap:'wrap'}}>
              <input id="wishName" type="text" placeholder="Your name" required style={{flex:'1', minWidth:120, border:'none', borderBottom:'1px solid var(--line)', background:'transparent', padding:'11px 2px', fontFamily:'inherit', fontSize:14, color:'var(--ivory)'}}/>
              <input id="wishText" type="text" placeholder="Leave a wish" required style={{flex:'2', minWidth:180, border:'none', borderBottom:'1px solid var(--line)', background:'transparent', padding:'11px 2px', fontFamily:'inherit', fontSize:14, color:'var(--ivory)'}}/>
              <button className="btn small" type="submit">Send</button>
            </form>
            <div style={{marginTop:12}}>
              {wishes.slice().reverse().map((w, i) => (
                <div className="wish-card" key={i}>
                  <p>{w.text}</p>
                  <div className="wish-name">— {w.name}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ SHARE ============ */}
        <section id="share" className={`section ${revealCls('share')}`}>
          <div className="container" style={{textAlign:'center'}}>
            <p className="label">Share the Celebration</p>
            <StarDivider/>
            <div className="share-row">
              <button className="btn" onClick={waShare}><MessageCircleIcon size={14}/> Share on WhatsApp</button>
              <button className="btn" onClick={copyLink}><LinkIcon size={14}/> {copied ? 'Copied ✓' : 'Copy link'}</button>
            </div>
            <div id="qrcode"></div>
            <p style={{fontSize:12, color:'var(--gold)', marginTop:14, letterSpacing:'.08em'}}>Scan to open the invitation</p>
          </div>
        </section>

      </main>

      {/* ============ CLOSING ============ */}
      <footer id="closing">
        <p className="eyebrow-quiet">With Love</p>
        <StarDivider/>
        <h2>{wedding.couple.groom} &amp; {wedding.couple.bride}</h2>
        <p className="msg">Thank you for being a part of our special day — and for every message, every prayer, and every mile some of you will travel to be there.</p>
        <div className="cdate">{closingDate}</div>
        <p style={{marginTop:28, fontSize:13, opacity:.6}}>Forever begins here.</p>
        <div className="dua">
          <p className="dua-arabic">بَارَكَ اللّٰهُ لَكَ وَبَارَكَ عَلَيْكَ وَجَمَعَ بَيْنَكُمَا فِي خَيْرٍ</p>
          <p className="dua-translation">&quot;May Allah bless you, and shower His blessings upon you, and unite you both in goodness.&quot;</p>
        </div>
      </footer>

      {/* ============ LIGHTBOX ============ */}
      <div
        id="lightbox"
        role="dialog"
        aria-modal="true"
        aria-label="Photo viewer"
        className={lbOpen ? 'open' : ''}
        onClick={e => { if(e.target === e.currentTarget) setLbOpen(false); }}
        onTouchStart={onLbTouchStart}
        onTouchEnd={onLbTouchEnd}
      >
        <button className="lb-close" aria-label="Close" onClick={() => setLbOpen(false)}><XIcon size={22}/></button>
        {lbOpen && (
          <img src={wedding.gallery[lbIndex].url.replace('w=800','w=1600')} alt={wedding.gallery[lbIndex].alt}/>
        )}
        <div className="lb-counter">{pad2(lbIndex + 1)} / {pad2(wedding.gallery.length)}</div>
        <div className="lb-controls">
          <button aria-label="Previous photo" onClick={lbPrev}><ChevronLeftIcon size={18}/></button>
          <button aria-label="Next photo" onClick={lbNext}><ChevronRightIcon size={18}/></button>
        </div>
      </div>
    </>
  );
}

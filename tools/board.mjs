/* Classroom-board mode, shared by every page.

   An interactive flat panel is a very large touch screen read from the back of
   a room, usually with no keyboard. Board mode enlarges the whole interface by
   scaling the root font size (every page sizes itself in rem), brightens the
   deliberately dim text, puts the small controls within reach, and offers a
   full-screen button. It is on when:
     - the address says so (?board=1, or ?board=0 to refuse it), else
     - this device chose it before (remembered locally), else
     - the screen is large (1600px or wider) and takes touch.
   Local links carry the setting along, because pages opened from file:// do
   not reliably share storage. */

export const BOARD_CSS = `
/* classroom board */
html.board{font-size:clamp(20px,1.25vw,44px)}
html.board body{font-size:1rem}
[data-fs]{display:none!important}
html.board [data-fs]{display:inline-block!important}
@media (max-width:1100px){html:not(.board) [data-board]{display:none!important}}
.board-corner{position:fixed;top:.5rem;left:.6rem;z-index:6;display:flex;gap:.2rem}
.board-corner button{border:0;background:none;cursor:pointer;padding:.6rem .5rem;min-height:2.4rem;
 font:.62rem/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#5a534a}
.board-corner button:hover,.board-corner button:focus-visible{color:#b9ae9c}
html.board .board-corner button{color:#8d8475}
`;

/* extra rules for the two 3D games, whose pages share one layout */
export const BOARD_3D_CSS = `
html.board{--dim:#958b7c;--faint:#4a443c}
/* the small controls move from the top corner, out of reach on a wall-mounted
   panel, to a column at the bottom left */
html.board #settings{top:auto;bottom:.7rem;left:.7rem;flex-direction:column;align-items:flex-start}
html.board #settings button{color:#958b7c;min-height:2.6rem;padding:.6rem .7rem;font-size:.66rem}
html.board #toast{top:1.2rem}
html.board #years,html.board #count{color:#958b7c}
html.board .quiet{color:#8d8475}
`;

export const BOARD_JS = `(function(){
var d=document,r=d.documentElement,q=/[?&]board=([01])/.exec(location.search),s=null,on;
try{s=localStorage.getItem('board')}catch(e){}
on=q?q[1]==='1':s!==null?s==='1':(Math.max(screen.width||0,window.innerWidth||0)>=1600&&navigator.maxTouchPoints>0);
function keep(){try{localStorage.setItem('board',on?'1':'0')}catch(e){}}
if(q)keep();
r.classList.toggle('board',on);
function fs(){return d.fullscreenElement||d.webkitFullscreenElement}
function paint(){
  var i,h,m,l=d.querySelectorAll('[data-board]');
  r.classList.toggle('board',on);
  for(i=0;i<l.length;i++){l[i].textContent=l[i].getAttribute('data-board')+(on?': on':': off');l[i].setAttribute('aria-pressed',on?'true':'false')}
  l=d.querySelectorAll('[data-fs]');
  for(i=0;i<l.length;i++)l[i].textContent=fs()?'Exit full screen':'Full screen';
  l=d.querySelectorAll('a[href]');
  for(i=0;i<l.length;i++){h=l[i].getAttribute('href');m=/^([a-z-]+[.]html)([?][^#]*)?(#.*)?$/.exec(h);
    if(m)l[i].setAttribute('href',m[1]+(on?'?board=1':'')+(m[3]||''))}
}
function btn(label,attr,cls){var b=d.createElement('button');b.type='button';b.setAttribute(attr,label);if(cls)b.className=cls;return b}
function ready(){
  var set=d.getElementById('settings'),slot=d.querySelector('[data-board-slot]'),card,c;
  var canFs=r.requestFullscreen||r.webkitRequestFullscreen;
  if(set){
    set.appendChild(btn('Board','data-board'));if(canFs)set.appendChild(btn('','data-fs'));
    card=d.querySelector('#intro .links')||d.querySelector('#intro .card');
    if(card)card.appendChild(btn('Classroom board','data-board','quiet'));
  }else if(slot){
    slot.appendChild(btn('Classroom board','data-board'));if(canFs)slot.appendChild(btn('','data-fs'));
  }else{
    c=d.createElement('div');c.className='board-corner';
    c.appendChild(btn('Classroom board','data-board'));if(canFs)c.appendChild(btn('','data-fs'));
    d.body.appendChild(c);
  }
  d.addEventListener('click',function(e){
    var t=e.target.closest?e.target.closest('[data-board],[data-fs]'):null,p;
    if(!t)return;
    if(t.hasAttribute('data-board')){on=!on;keep()}
    else if(fs()){(d.exitFullscreen||d.webkitExitFullscreen).call(d)}
    else{p=(r.requestFullscreen||r.webkitRequestFullscreen).call(r);if(p&&p.catch)p.catch(function(){})}
    paint();
  });
  d.addEventListener('fullscreenchange',paint);d.addEventListener('webkitfullscreenchange',paint);
  paint();
}
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',ready);else ready();
})();`;

/* Adds board mode to a finished page that was not built with it (the two
   hand-written text-only pages). */
export function withBoard(html) {
  if (!html.includes('</style>') || !html.includes('</head>')) throw new Error('withBoard: page has no </style> or </head>');
  /* in the head, so the size is right before anything is painted */
  return html.replace('</style>', () => BOARD_CSS + '</style>').replace('</head>', () => '<script>' + BOARD_JS + '</script>\n</head>');
}

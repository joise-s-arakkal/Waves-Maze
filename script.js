const START_SIZE = 5;
let size = START_SIZE;
let gridEl = document.getElementById('grid');
let gridWrap = document.getElementById('grid-wrap');
let scoreEl = document.getElementById('score');
let levelEl = document.getElementById('level');
let overlay = document.getElementById('overlay');
let msg = document.getElementById('msg');
let btnReveal = document.getElementById('btn-reveal');
let btnPeek = document.getElementById('btn-peek');
let btnReset = document.getElementById('btn-reset');
let maze, player, goal, showing=true, peekCount=1, score=0, level=1, revealTimeout;


const audioCtx = new (window.AudioContext||window.webkitAudioContext)();
function beep(freq=440,dur=0.08,type='sine'){const o=audioCtx.createOscillator();const g=audioCtx.createGain();o.type=type;o.frequency.value=freq;g.gain.value=0.02;o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+dur);}


function generateMaze(n){const cells=[];for(let y=0;y<n;y++){cells[y]=[];for(let x=0;x<n;x++){cells[y][x]={x,y,walls:{t:1,r:1,b:1,l:1},visited:false}}}const stack=[];cells[0][0].visited=true;stack.push(cells[0][0]);while(stack.length){const cur=stack[stack.length-1];const dirs=[{dx:0,dy:-1,d:'t',od:'b'},{dx:1,dy:0,d:'r',od:'l'},{dx:0,dy:1,d:'b',od:'t'},{dx:-1,dy:0,d:'l',od:'r'}];const neighbors=[];for(const{dx,dy,d,od}of dirs){const nx=cur.x+dx,ny=cur.y+dy;if(nx>=0&&ny>=0&&nx<n&&ny<n&&!cells[ny][nx].visited)neighbors.push({cell:cells[ny][nx],d,od});}if(neighbors.length){const pick=neighbors[Math.floor(Math.random()*neighbors.length)];cur.walls[pick.d]=0;pick.cell.walls[pick.od]=0;pick.cell.visited=true;stack.push(pick.cell);}else stack.pop();}return cells;}


function renderGrid(){gridEl.innerHTML='';gridEl.style.gridTemplateColumns=`repeat(${size}, var(--cell-size))`;for(let y=0;y<size;y++){for(let x=0;x<size;x++){const c=maze[y][x];const cell=document.createElement('div');cell.className='cell';cell.dataset.x=x;cell.dataset.y=y;const inner=document.createElement('div');inner.className='inner';if(c.walls.t)inner.classList.add('wall-top');if(c.walls.r)inner.classList.add('wall-right');if(c.walls.b)inner.classList.add('wall-bottom');if(c.walls.l)inner.classList.add('wall-left');cell.appendChild(inner);if(x==player.x&&y==player.y){const p=document.createElement('div');p.className='player';cell.appendChild(p);}if(x==goal.x&&y==goal.y){const g=document.createElement('div');g.className='goal';cell.appendChild(g);}gridEl.appendChild(cell);}}}


function randCell(){return{x:Math.floor(Math.random()*size),y:Math.floor(Math.random()*size)}}
function placeEntities(){player=randCell();goal=randCell();while(player.x==goal.x&&player.y==goal.y)goal=randCell();}
function newMaze(){maze=generateMaze(size);placeEntities();renderGrid();showWalls(2500);}
function showWalls(dur=2000){clearTimeout(revealTimeout);showing=true;gridEl.classList.add('show-walls');revealTimeout=setTimeout(()=>hideWalls(),dur);}
function hideWalls(){showing=false;gridEl.classList.remove('show-walls');}
function cellHasWallBetween(x,y,nx,ny){if(nx<0||ny<0||nx>=size||ny>=size)return true;const cur=maze[y][x];if(nx==x&&ny==y-1)return cur.walls.t;if(nx==x+1&&ny==y)return cur.walls.r;if(nx==x&&ny==y+1)return cur.walls.b;if(nx==x-1&&ny==y)return cur.walls.l;return true;}
function movePlayer(dx,dy){if(showing){hideWalls();}const nx=player.x+dx,ny=player.y+dy;const hit=cellHasWallBetween(player.x,player.y,nx,ny);if(hit){sparkAt(player.x,player.y,true);beep(120,0.12,'square');showLoss();return;}player.x=nx;player.y=ny;beep(600,0.06);renderGrid();if(player.x==goal.x&&player.y==goal.y)win();}
function sparkAt(x,y,isError=false){const rect=gridEl.querySelector(`.cell[data-x='${x}'][data-y='${y}']`).getBoundingClientRect();const wrapRect=gridEl.getBoundingClientRect();const ripple=document.createElement('div');ripple.className='ripple';ripple.style.left=(rect.left-wrapRect.left+rect.width/2)+'px';ripple.style.top=(rect.top-wrapRect.top+rect.height/2)+'px';ripple.style.width=ripple.style.height=Math.max(rect.width,rect.height)+'px';ripple.style.border=`2px solid ${isError?'var(--error)':'rgba(255,255,255,0.12)'}`;ripple.style.boxShadow=`0 0 18px ${isError?'rgba(255,61,90,0.6)':'rgba(138,107,255,0.12)'}`;ripple.style.animation='rippleAnim 650ms ease-out forwards';gridEl.appendChild(ripple);setTimeout(()=>ripple.remove(),800);}
function showLoss(){gridEl.classList.add('show-walls');overlay.style.display='flex';msg.innerHTML='<div class="small">You hit a wall — red waves reset the grid...</div>';setTimeout(()=>{overlay.style.display='none';gridEl.classList.remove('show-walls');newMaze();},900);}
function win(){score++;level=Math.floor(score/3)+1;scoreEl.textContent=score;levelEl.textContent=level;sparkAt(goal.x,goal.y);beep(880,0.16,'sine');overlay.style.display='flex';msg.innerHTML='<div class="small">Wave cleared! New maze forming...</div>';setTimeout(()=>{overlay.style.display='none';newMaze();},900);}


// Keyboard controls
window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(['arrowup','w'].includes(k)){e.preventDefault();movePlayer(0,-1);}else if(['arrowdown','s'].includes(k)){e.preventDefault();movePlayer(0,1);}else if(['arrowleft','a'].includes(k)){e.preventDefault();movePlayer(-1,0);}else if(['arrowright','d'].includes(k)){e.preventDefault();movePlayer(1,0);}});


// Touch (swipe) controls
let startX=0,startY=0;
gridWrap.addEventListener('touchstart',e=>{if(e.touches.length===1){startX=e.touches[0].clientX;startY=e.touches[0].clientY;}});
gridWrap.addEventListener('touchend',e=>{if(e.changedTouches.length===1){const dx=e.changedTouches[0].clientX-startX;const dy=e.changedTouches[0].clientY-startY;const absX=Math.abs(dx),absY=Math.abs(dy);if(Math.max(absX,absY)>30){if(absX>absY){if(dx>0)movePlayer(1,0);else movePlayer(-1,0);}else{if(dy>0)movePlayer(0,1);else movePlayer(0,-1);}}}});


btnReveal.addEventListener('click',()=>showWalls(2200));
btnPeek.addEventListener('click',()=>{if(peekCount>0){peekCount--;btnPeek.textContent=`Peek (${peekCount})`;showWalls(900);beep(400,0.06,'triangle');}else{overlay.style.display='flex';msg.innerHTML='<div class="small">No peeks left!</div>';setTimeout(()=>overlay.style.display='none',800);}});
btnReset.addEventListener('click',()=>newMaze());


newMaze();scoreEl.textContent=score;levelEl.textContent=level;
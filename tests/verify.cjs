const assert=require('node:assert/strict');const G=require('../engine.js');
let checks=0;function test(name,fn){fn();checks++;console.log('PASS '+name);}
function journey(style,goal,adverse=false){let s=G.fresh('测试乐队',style);let trace=[];for(let guard=0;guard<150;guard++){
 if(s.mode==='chapter'){s.mode='manage';continue;}
 if(s.mode==='manage'){
 const n=s.chapter*3+s.round;
 let choices=[0,0,0,0,0,1,1,0,0,1,1,0,goal,goal===1?1:0,2];
 if(adverse)choices=[2,1,0,2,1,2,0,2,1,0,2,0,goal,2,1];
 assert(G.choose(s,choices[n]));
 const plans=[['share','write'],['share','rest'],['record','rehearse'],['share','rest'],['share','work'],['record','rehearse'],['work','write'],['record','share'],['gear','rest'],['work','rest'],['write','record'],['share','rest'],['work','rehearse'],['record','rest'],['share','rest']];
 let plan=adverse?['work','promote']:plans[n];
 for(const a of plan){if(!G.act(s,a)){const fallback=['work','rest','share','rehearse','gig','promote','write','record','gear'].find(x=>!G.availability(s,x));assert(fallback,'available action');assert(G.act(s,fallback));}}
 assert(s.ap===0);trace.push([n,s.money,s.energy,s.fame,s.members.map(x=>x.rel)]);assert(G.next(s));
 }else if(s.mode==='setlist'){s.songs.slice(0,3).forEach(x=>G.toggleSong(s,x.id));assert(G.startGig(s));}
 else if(s.mode==='gig'){assert(G.gigChoice(s,adverse?1:0));}
 else if(s.mode==='gigResult'){assert(G.afterGig(s));}
 else if(s.mode==='epilogue'){assert(G.finish(s,true));}
 else if(s.mode==='ending')return {s,trace};
 else throw Error('unknown mode '+s.mode);
 }throw Error('did not finish');}
test('all five styles complete all five chapters',()=>{for(let style=0;style<5;style++){let {s}=journey(style,2);assert.equal(s.mode,'ending');assert.equal(s.shows.length,5);assert.equal(s.chapter,4);assert.equal(s.songs[0].title,'地下室没有日落');assert(s.log.length>40);}});
test('six endings and material conditions',()=>{let s=G.fresh();s.members.forEach(m=>m.rel=65);s.fame=70;s.tour=4;s.energy=40;s.goal='tour';assert.equal(G.ending(s).id,'tour');s.energy=0;assert.equal(G.ending(s).id,'long');s.energy=50;s.goal='label';s.autonomy=4;s.songs[0].recorded=true;s.songs.push({...s.songs[0],id:1});assert.equal(G.ending(s).id,'label');s.goal='farewell';assert.equal(G.ending(s).id,'farewell');s.goal='reunion';assert.equal(G.ending(s).id,'reunion');s.goal='long';assert.equal(G.ending(s).id,'long');s.members[0].left=s.members[1].left=true;assert.equal(G.ending(s).id,'split');});
test('tour, label, farewell, long and reunion are reachable through full journeys',()=>{for(const [goal,id] of [[0,'tour'],[1,'label'],[2,'long'],[3,'farewell'],[4,'reunion']]){const {s}=journey(1,goal);assert.equal(s.ending.id,id,JSON.stringify({goal,actual:s.ending,autonomy:s.autonomy,money:s.money}));}});
test('choices and promises persist across JSON save / restore',()=>{const original=journey(0,4).s;const restored=JSON.parse(JSON.stringify(original));assert.deepEqual(restored,original);assert(restored.promises.some(x=>x.status==='kept'));assert.equal(restored.epilogue.year,2030);});
test('promises require two actions after commitment',()=>{let s=G.fresh();G.choose(s,0);G.act(s,'share');s.round=2;s.ap=0;s.eventDone=true;G.next(s);assert.equal(s.promises[0].status,'broken');assert.equal(s.broken,1);});
test('departure gives warning then allows replacement',()=>{let s=G.fresh();s.members[0].rel=10;s.ap=0;s.eventDone=true;G.next(s);assert.equal(s.members[0].strikes,1);assert(!s.members[0].left);s.ap=0;s.eventDone=true;G.next(s);assert(s.members[0].left);s.ap=2;let old=s.members[0].name;assert(G.replace(s,0));assert.equal(s.members[0].previous,old);assert(!s.members[0].left);});
test('style transition takes two rehearsals and preserves old work',()=>{let s=G.fresh();assert(G.switchStyle(s,3));assert(G.act(s,'rehearse'));assert.equal(s.style,0);s.ap=2;s.used=[];assert(G.act(s,'rehearse'));assert.equal(s.style,3);assert.equal(s.songs[0].style,0);});
test('invalid actions, double choices and empty setlists do not advance',()=>{let s=G.fresh();s.money=0;assert(!G.act(s,'record'));assert.equal(s.ap,2);assert(G.choose(s,0));assert(!G.choose(s,1));assert(!G.next(s));s.mode='setlist';assert(!G.startGig(s));});
test('setlist order and three-song maximum',()=>{let s=G.fresh();s.songs=Array.from({length:4},(_,i)=>({...s.songs[0],id:i}));s.mode='setlist';[2,0,1,3].forEach(i=>G.toggleSong(s,i));assert.deepEqual(s.sets,[2,0,1]);G.toggleSong(s,0);G.toggleSong(s,0);assert.deepEqual(s.sets,[2,1,0]);});
test('broken relationships differ materially from supportive journey',()=>{let a=journey(1,0).s,b=journey(1,0,true).s;assert.notEqual(a.ending.id,b.ending.id);assert(b.broken>a.broken);assert.equal(b.ending.id,'split');assert.equal(journey(1,3,true).s.ending.id,'split');});
console.log('Verified '+checks+' groups of checks.');





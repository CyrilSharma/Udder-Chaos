import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const settings={seed:0,map_id:0,card_deck_size:15,timer_length:30,difficulty:1000,threads:1,rules:{hand_size:3,cow_sacrifice:5,cow_regen_rate:15,days_per_round:5,score_goal:10}};
const enc=new TextEncoder(),dec=new TextDecoder();
const instances=[];
for(const name of ['scalar','simd']){
 const {instance}=await WebAssembly.instantiate(await readFile(new URL(`../frontend/public/engine/${name}.wasm`,import.meta.url)),{udder:{now:()=>performance.now()}});const e=instance.exports;
 const call=request=>{const b=enc.encode(JSON.stringify(request)),p=e.udder_alloc(b.length);new Uint8Array(e.memory.buffer,p,b.length).set(b);const out=e.udder_call(p,b.length);e.udder_free(p,b.length);const ptr=Number(out>>32n),len=Number(out&0xffffffffn);const r=JSON.parse(dec.decode(new Uint8Array(e.memory.buffer,ptr,len)));e.udder_free(ptr,len);assert.equal(r.error,null);return r;};
 for(const n of [0,1,15,16,17,31,32,33,65])for(const bound of [0,15,254,255])for(const positive of [false,true]){const input=Uint8Array.from({length:n},(_,i)=>(i*19)% (bound+1)),p=e.udder_alloc(n);new Uint8Array(e.memory.buffer,p,n).set(input);e.udder_step(p,n,+positive,bound);assert.deepEqual([...new Uint8Array(e.memory.buffer,p,n)],[...input].map(v=>positive?Math.min(bound,v+1):Math.max(0,v-1)));e.udder_free(p,n);}
 const initial=call({type:'init',settings});const prepared=call({type:'prepare',action:{type:'play',card:2,color:0}});assert.equal(call({type:'view'}).state,initial.state);const committed=call({type:'commit'});assert.equal(committed.state,prepared.state);assert.equal(call({type:'restore',checkpoint:committed.checkpoint}).state,committed.state);instances.push({call,initial,committed});console.log(`${name}: vector chunks/tails/bounds and replica replay passed`);
}
assert.equal(instances[0].initial.state,instances[1].initial.state);assert.equal(instances[0].committed.state,instances[1].committed.state);console.log('Scalar and SIMD produce identical complete states.');

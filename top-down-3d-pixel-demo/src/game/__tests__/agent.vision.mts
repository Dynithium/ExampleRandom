/** Verify agentVision composites correctly using jsdom + node-canvas-free stubs. */
const V = "../agentVision.ts";
let drawn: any = {};
const mkCanvas = (w:number,h:number) => ({
  width:w, height:h,
  getContext:()=>({
    imageSmoothingEnabled:true,
    drawImage:(_s:any,_x:number,_y:number,dw:number,dh:number)=>{drawn.dw=dw;drawn.dh=dh;},
    fillRect:(_x:number,y:number,_w:number,h:number)=>{drawn.capY=y;drawn.capH=h;},
    fillText:(t:string)=>{(drawn.lines ||= []).push(t);},
    measureText:(t:string)=>({width:t.length*7}),
    beginPath(){},moveTo(){},lineTo(){},stroke(){},
    set fillStyle(_v:string){}, set strokeStyle(_v:string){}, set font(_v:string){},
    set textBaseline(_v:string){}, set lineWidth(_v:number){},
  }),
  toDataURL:(mime:string,q:number)=>{drawn.mime=mime;drawn.q=q;return "data:"+mime+";base64,STUB";},
});
(globalThis as any).document = { createElement: () => mkCanvas(0,0) };
(globalThis as any).requestAnimationFrame = (cb:any)=>{cb();return 1;};

const { registerGameCanvas, captureFrame, hasCanvas } = await import(V);
let fail=0; const ok=(c:boolean,m:string)=>{console.log((c?"  PASS  ":"  FAIL  ")+m); if(!c)fail++;};

ok(!hasCanvas(), "no canvas registered initially -> capture unavailable");
ok((await captureFrame())===null, "captureFrame() returns null with no canvas (falls back to text)");

registerGameCanvas(mkCanvas(1920,1080) as any);
ok(hasCanvas(), "canvas registers");

const shot = await captureFrame({caption:["OBJECTIVE: test","DIALOG X: hello"]});
ok(typeof shot === "string" && shot.startsWith("data:image/jpeg"), "returns a jpeg data url");
ok(drawn.dw===640, `downscaled longest edge to 640 (got ${drawn.dw}x${drawn.dh})`);
ok(drawn.dh===360, "preserved 16:9 aspect ratio");
ok(drawn.capH>0 && drawn.capY===360, "caption strip drawn below the frame");
ok((drawn.lines||[]).length===2, "both caption lines rendered: "+JSON.stringify(drawn.lines));
ok(drawn.q===0.72, "jpeg quality 0.72 (small payload)");

// zero-size canvas (context loss / pre-first-frame)
registerGameCanvas(mkCanvas(0,0) as any);
ok((await captureFrame())===null, "zero-size canvas -> null, not a crash");

console.log(fail===0?"\nVISION CAPTURE OK":`\n${fail} FAILURE(S)`);

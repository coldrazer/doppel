export async function exportWalkthrough(draft) {
  const steps = await Promise.all(
    draft.steps.map(async (step) => {
      if (step.image.startsWith("data:")) return step;
      const r = await fetch(step.image);
      if (!r.ok) throw new Error("Screenshot unavailable");
      const blob = await r.blob();
      const image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      return { ...step, image };
    }),
  );
  const payload = JSON.stringify({ ...draft, steps })
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Doppel practice run</title><style>*{box-sizing:border-box}body{margin:0;background:#f6f7f9;color:#20242b;font:16px system-ui,sans-serif}header{padding:22px 5%;background:#fff;border-bottom:1px solid #dfe1e6;font-weight:750;font-size:26px;letter-spacing:-1px}header span{color:#ef6337}main{max-width:1100px;margin:40px auto;padding:0 24px}h1{font-size:32px;letter-spacing:-1px}p{color:#707987;line-height:1.7}.layout{display:grid;grid-template-columns:1fr 250px;gap:24px;margin:28px 0}.screen{position:relative;align-self:start;border:1px solid #ccd1db;border-radius:12px;overflow:hidden;line-height:0}.screen img{width:100%;display:block}.target{position:absolute;border:2px solid transparent;background:transparent;border-radius:6px;cursor:pointer}.target:focus-visible,.target.hint{border-color:#ef6337;background:#ef633718}.coach{background:white;padding:22px;border:1px solid #dfe1e6;border-radius:12px}button{font:inherit;padding:10px 16px;border:1px solid #d8dce3;border-radius:6px;background:white;cursor:pointer}.progress{color:#ef6337;font-size:12px;font-weight:600}#feedback{font-size:13px;color:#b46c42}#done{padding:60px 20px;text-align:center}#done button{background:#ef6337;color:white;border:0}footer{color:#9ba1ab;font-size:12px}@media(max-width:700px){.layout{grid-template-columns:1fr}h1{font-size:27px}main{padding:0 16px;margin-top:28px}}</style><header><span>▢</span> doppel</header><main><h1 id="title"></h1><p id="goal"></p><div class="layout" id="lesson"><div class="screen" id="screen"><img id="image" alt="Practice screen"><button id="target" class="target"></button></div><aside class="coach"><span class="progress" id="progress"></span><h2 id="step"></h2><p id="instruction"></p><button id="hint">Show me a hint</button><p id="feedback" aria-live="polite"></p></aside></div><section id="done" hidden><h1>You’ve got this.</h1><p>You completed your practice run. Ready for the real thing?</p><button id="restart">Practice again</button></section><footer>Learn by doing. Powered by Doppel.</footer></main><script type="application/json" id="data">${payload}</script><script>const data=JSON.parse(document.getElementById('data').textContent);const el=id=>document.getElementById(id);let index=0;el('title').textContent=data.title;el('goal').textContent=data.goal;function draw(){const done=index===data.steps.length;el('lesson').style.display=done?'none':'';el('done').hidden=!done;if(done)return;const s=data.steps[index];el('step').textContent=s.title;el('instruction').textContent=s.instruction;el('image').src=s.image;el('image').alt=s.title;el('progress').textContent='STEP '+(index+1)+' OF '+data.steps.length;el('feedback').textContent='';el('target').className='target';el('target').setAttribute('aria-label',s.instruction);Object.assign(el('target').style,{left:s.target.x*100+'%',top:s.target.y*100+'%',width:s.target.w*100+'%',height:s.target.h*100+'%'});}function hint(){el('target').classList.add('hint');el('feedback').textContent=data.steps[index].hint;}el('target').onclick=e=>{e.stopPropagation();index++;draw();};el('screen').onclick=hint;el('hint').onclick=hint;el('restart').onclick=()=>{index=0;draw();};draw();</script></html>`;
  const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  const a = document.createElement("a");
  a.href = url;
  a.download =
    (draft.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "walkthrough") +
    ".html";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

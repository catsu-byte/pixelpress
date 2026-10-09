const input=document.querySelector('#file-input'); const dropzone=document.querySelector('#dropzone'); const editor=document.querySelector('#editor'); const preview=document.querySelector('#preview'); const canvas=document.querySelector('#canvas'); const ctx=canvas.getContext('2d');
const widthInput=document.querySelector('#width'); const heightInput=document.querySelector('#height'); const quality=document.querySelector('#quality'); const format=document.querySelector('#format'); const status=document.querySelector('#status');
let sourceImage=null; let sourceFile=null; let aspect=1; let outputBlob=null; let debounce;
const bytes=value=>value<1024?`${value} B`:value<1048576?`${(value/1024).toFixed(1)} KB`:`${(value/1048576).toFixed(2)} MB`;

async function loadFile(file){
  if(!file?.type.startsWith('image/')){status.textContent='Choose a JPG, PNG, or WebP image.';return;}
  sourceFile=file; const url=URL.createObjectURL(file); const image=new Image(); image.decoding='async';
  image.onload=()=>{sourceImage=image;aspect=image.naturalWidth/image.naturalHeight;widthInput.value=image.naturalWidth;heightInput.value=image.naturalHeight;preview.src=url;document.querySelector('#file-name').textContent=file.name;document.querySelector('#original-size').textContent=bytes(file.size);dropzone.hidden=true;editor.hidden=false;renderEstimate();};
  image.onerror=()=>{URL.revokeObjectURL(url);status.textContent='This image could not be opened.';}; image.src=url;
}

function renderBlob(){
  if(!sourceImage)return Promise.resolve(null); const w=Math.max(1,Number(widthInput.value)); const h=Math.max(1,Number(heightInput.value)); canvas.width=w;canvas.height=h;ctx.clearRect(0,0,w,h);ctx.drawImage(sourceImage,0,0,w,h);
  return new Promise(resolve=>canvas.toBlob(resolve,format.value,Number(quality.value)/100));
}

async function renderEstimate(){
  clearTimeout(debounce); debounce=setTimeout(async()=>{outputBlob=await renderBlob();document.querySelector('#output-size').textContent=outputBlob?bytes(outputBlob.size):'Unavailable';},120);
}

widthInput.addEventListener('input',()=>{heightInput.value=Math.round(Number(widthInput.value)/aspect)||1;renderEstimate();});
heightInput.addEventListener('input',()=>{widthInput.value=Math.round(Number(heightInput.value)*aspect)||1;renderEstimate();});
quality.addEventListener('input',()=>{document.querySelector('#quality-value').value=`${quality.value}%`;renderEstimate();}); format.addEventListener('change',renderEstimate);
input.addEventListener('change',()=>loadFile(input.files[0])); document.querySelector('#replace').addEventListener('click',()=>input.click());
['dragenter','dragover'].forEach(type=>dropzone.addEventListener(type,event=>{event.preventDefault();dropzone.classList.add('dragging');})); ['dragleave','drop'].forEach(type=>dropzone.addEventListener(type,event=>{event.preventDefault();dropzone.classList.remove('dragging');})); dropzone.addEventListener('drop',event=>loadFile(event.dataTransfer.files[0]));
document.querySelector('#controls').addEventListener('submit',async event=>{event.preventDefault();status.textContent='Preparing download…';outputBlob=await renderBlob();if(!outputBlob){status.textContent='Could not create the image.';return;}const extension=format.value.split('/')[1].replace('jpeg','jpg');const base=sourceFile.name.replace(/\.[^.]+$/,'');const link=document.createElement('a');link.href=URL.createObjectURL(outputBlob);link.download=`${base}-compressed.${extension}`;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);const saving=Math.max(0,Math.round((1-outputBlob.size/sourceFile.size)*100));status.textContent=saving?`Done — ${saving}% smaller.`:'Done — image downloaded.';});
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js'));

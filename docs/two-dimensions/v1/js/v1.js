const CHANNEL='keshavsoft-two-dimensions-v1';
const STORAGE_KEY='keshavsoft-two-dimensions-v1-spec';
const FILES={
  base:'./data/base.json',
  columns:'./data/columns.json',
  rows:'./data/rows.json',
  columnTemplate:'./data/column-template.json',
  rowTemplate:'./data/row-template.json',
  cellTemplate:'./data/cell-template.json'
};
const models={output:''};
let editor,activeView='base',renderWindow=null,channel,outputBuilt=false;
const $=id=>document.getElementById(id);
const pretty=value=>JSON.stringify(value,null,2)+'\n';
const status=message=>{$('status').textContent=message;};
async function load(path){const response=await fetch(path);if(!response.ok)throw Error(`Cannot load ${path}: ${response.status}`);return response.json();}
function read(name){try{return JSON.parse(models[name]);}catch(error){throw Error(`${name}.json is invalid: ${error.message}`);}}
function activate(view){
  if(view==='output'&&!outputBuilt){status('Build the table before opening Output JSON');return;}
  if(editor)models[activeView]=editor.getValue();
  activeView=view;editor.setValue(models[view]||'');editor.updateOptions({readOnly:view==='output'});
  document.querySelectorAll('[data-view]').forEach(button=>button.classList.toggle('active',button.dataset.view===view));
  $('fileName').textContent=view==='columnTemplate'?'column-template.json':view==='rowTemplate'?'row-template.json':view==='cellTemplate'?'cell-template.json':`${view}.json`;
}
function clone(value){return JSON.parse(JSON.stringify(value));}
function buildTable(){
  if(editor)models[activeView]=editor.getValue();
  const base=read('base'),columns=read('columns'),rows=read('rows');
  const columnTemplate=read('columnTemplate'),rowTemplate=read('rowTemplate'),cellTemplate=read('cellTemplate');
  if(!Array.isArray(columns)||!Array.isArray(rows))throw Error('Columns and Rows must both be JSON arrays.');
  if(!base||!Array.isArray(base.children))throw Error('Base JSON must contain a children array.');
  const thead={tagName:'thead',attributes:{id:'PR-head',class:'bg-slate-800 text-slate-100'},children:[
    {tagName:'tr',children:columns.map(column=>{
      const spec=clone(columnTemplate);
      spec.textContent=String(column.label??column.key??'');
      spec.attributes={...(spec.attributes||{}),...(column.align==='right'?{class:`${spec.attributes?.class||''} text-right`.trim()}:{}),...(column.className?{class:`${spec.attributes?.class||''} ${column.className}`.trim()}:{})};
      return spec;
    })}
  ]};
  const tbody={tagName:'tbody',attributes:{id:'PR-body',class:'divide-y divide-slate-200'},children:rows.map(row=>{
    const rowSpec=clone(rowTemplate);
    rowSpec.children=columns.map(column=>{
      const cell=clone(cellTemplate);
      cell.textContent=String(row[column.key]??'');
      if(column.align==='right')cell.attributes={...(cell.attributes||{}),class:`${cell.attributes?.class||''} text-right`.trim()};
      if(column.className)cell.attributes={...(cell.attributes||{}),class:`${cell.attributes?.class||''} ${column.className}`.trim()};
      return cell;
    });
    return rowSpec;
  })};
  const output=clone(base);output.children=[thead,tbody];
  models.output=pretty(output);outputBuilt=true;$('renderBtn').disabled=false;activate('output');status(`Built ${columns.length} columns × ${rows.length} rows.`);
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(output));}catch{}
}
function renderOutput(){
  if(!outputBuilt)throw Error('Build the table first.');
  const spec=read('output');
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(spec));}catch{}
  if(!renderWindow||renderWindow.closed){renderWindow=window.open('./render.html','two_dimensions_v1_renderer');if(!renderWindow)throw Error('Allow popups for this site.');}
  channel.postMessage({type:'RENDER_OUTPUT',spec});
  setTimeout(()=>{try{channel.postMessage({type:'RENDER_OUTPUT',spec});}catch{}},300);
  renderWindow.focus();status('Output sent to the separate renderer tab.');
}
function safe(fn){try{fn();}catch(error){status(error.message);alert(error.message);}}
async function start(){
  const monaco=await new Promise((resolve,reject)=>{require.config({paths:{vs:'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs'}});require(['vs/editor/editor.main'],()=>resolve(window.monaco),reject);});
  for(const [key,path] of Object.entries(FILES))models[key]=pretty(await load(path));
  editor=monaco.editor.create($('editor'),{value:models.base,language:'json',theme:'vs-dark',automaticLayout:true,minimap:{enabled:false},fontSize:13,tabSize:2,scrollBeyondLastLine:false});
  editor.onDidChangeModelContent(()=>{if(activeView!=='output')models[activeView]=editor.getValue();});
  document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>activate(button.dataset.view)));
  $('buildBtn').addEventListener('click',()=>safe(buildTable));
  $('renderBtn').addEventListener('click',()=>safe(renderOutput));
  channel=new BroadcastChannel(CHANNEL);
  channel.onmessage=({data})=>{
    if(data?.type==='REQUEST_RENDER'&&outputBuilt){
      try{channel.postMessage({type:'RENDER_OUTPUT',spec:read('output')});}catch{}
    }
  };
  $('fileName').textContent='base.json';status('Base, Columns, Rows and templates loaded.');
}
start().catch(error=>{status(error.message);console.error(error);});

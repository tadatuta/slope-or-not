type Author = 'human' | 'ai';
interface Item { key: string; text: string; author: Author }
interface Answer { item: Item; choice: Author }
const labels: Record<Author,string> = { human:'человек', ai:'нейронка' };
const app = document.getElementById('app')!;
const answers: Answer[] = [];
let deck: Item[] = [];
let locked = false;
function element<K extends keyof HTMLElementTagNameMap>(tag:K, className:string, text?:string):HTMLElementTagNameMap[K] {
 const node=document.createElement(tag);node.className=className;if(text!==undefined)node.textContent=text;return node;
}
function shuffle(items:Item[]):Item[] {
 const result=[...items];
 for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j]!,result[i]!];}
 return result;
}
function render(focus=false):void {
 app.replaceChildren();
 const item=deck[answers.length];
 if(!item){renderResults();return;}
 const article=element('article','quiz__text');article.tabIndex=-1;
 for(const paragraph of item.text.split(/\n\s*\n/))article.append(element('p','quiz__paragraph',paragraph));
 const controls=element('div','quiz__actions');
 for(const choice of ['human','ai'] as const){const button=element('button','quiz__button',labels[choice]);button.type='button';button.addEventListener('click',event=>{if(event.detail>1)return;answer(choice);});controls.append(button);}
 app.append(article,controls);window.scrollTo({top:0,behavior:'instant'});if(focus)article.focus({preventScroll:true});
}
function answer(choice:Author):void {
 const item=deck[answers.length];if(locked||!item)return;
 locked=true;answers.push({item,choice});render(true);setTimeout(()=>{locked=false;},300);
}
function renderResults():void {
 app.classList.add('quiz--results');
 const table=element('table','results');table.append(element('caption','results__caption','Результаты'));
 const head=document.createElement('thead');const summary=document.createElement('tr');const total=element('th','results__summary');total.colSpan=4;
 const correct=answers.filter(a=>a.choice===a.item.author).length;
 total.textContent=`Правильно — ${correct} · Неправильно — ${answers.length-correct}`;summary.append(total);head.append(summary);
 const headings=document.createElement('tr');for(const label of ['Текст','Ваш ответ','Автор','Результат']){const th=element('th','results__heading',label);th.scope='col';headings.append(th);}head.append(headings);table.append(head);
 const body=document.createElement('tbody');
 answers.forEach(({item,choice},index)=>{const row=document.createElement('tr');const text=element('td','results__cell results__cell--text');text.append(element('span','results__number',`${index+1}. `),document.createTextNode(item.text));row.append(text,element('td','results__cell',labels[choice]),element('td','results__cell',labels[item.author]),element('td',`results__cell results__cell--${choice===item.author?'right':'wrong'}`,choice===item.author?'Верно':'Ошибка'));body.append(row);});
 table.append(body);app.append(table);table.tabIndex=-1;table.focus();window.scrollTo({top:0,behavior:'instant'});
}
async function init():Promise<void>{
 try{
 const response=await fetch('./data.json');if(!response.ok)throw new Error(`Data HTTP ${response.status}`);
 const data:unknown=await response.json();
 if(!Array.isArray(data)||data.length===0||!data.every((item:Item)=>typeof item.text==='string'&&typeof item.key==='string'&&(item.author==='human'||item.author==='ai')))throw new Error('Invalid quiz data');
 deck=shuffle(data as Item[]);render();
 }catch(error){console.error('Quiz initialization failed',error);app.append(element('p','quiz__error','Не удалось загрузить тексты. Обновите страницу.'));}
}
void init();
interface QuizTool { name:string; description:string; inputSchema:object; annotations:{readOnlyHint:boolean}; execute:(input:unknown)=>unknown }
const modelContext=(document as Document & {modelContext?:{registerTool:(tool:QuizTool,options:{signal:AbortSignal})=>void|Promise<void>}}).modelContext;
if(modelContext){
 const lifecycle=new AbortController();window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
 const register=(tool:QuizTool):void=>{try{void Promise.resolve(modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(error=>console.error('Quiz tool registration failed',error));}catch(error){console.error('Quiz tool registration failed',error);}};
 register({name:'read_quiz',description:'Read the current text without revealing its author, or the final results.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>{const item=deck[answers.length];return item?{text:item.text}:{finished:deck.length>0,answers:answers.map(a=>({text:a.item.text,choice:labels[a.choice],author:labels[a.item.author],correct:a.choice===a.item.author}))};}});
 register({name:'answer_quiz',description:'Submit human or ai for the currently displayed text and advance to the next text.',inputSchema:{type:'object',properties:{choice:{type:'string',enum:['human','ai']}},required:['choice'],additionalProperties:false},annotations:{readOnlyHint:false},execute:(input)=>{if(typeof input!=='object'||input===null||!('choice' in input)||(input.choice!=='human'&&input.choice!=='ai'))throw new Error('choice must be human or ai');if(locked||!deck[answers.length])throw new Error('Quiz is not ready for an answer');answer(input.choice);return {recorded:true,finished:answers.length===deck.length};}});
}

import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
const registry=JSON.parse(await fs.readFile('releases.json','utf8'));
const reports=[];
for(const version of ['0.1.3','0.2.0']){
 const release=registry.releases[version];
 const target=path.resolve('apps',version);
 const installed=JSON.parse(await fs.readFile(path.join(target,'node_modules/@apds/core/package.json'),'utf8'));
 assert.equal(installed.version,version);
 const remote=await (await fetch(new URL('apds-release.json',release.storybookUrl))).json();
 const npm=await (await fetch('https://registry.npmjs.org/@apds%2fcore/'+version)).json();
 assert.equal(remote.version,version);assert.equal(remote.package,'@apds/core');assert.equal(remote.integrity,npm.dist.integrity);
 const client=new Client({name:'external-linux-apds-consumer',version:'1'});
 try{
  await client.connect(new StreamableHTTPClientTransport(new URL(release.mcpUrl)));
  const list=await client.callTool({name:'docs-list',arguments:{withStoryIds:true}},undefined,{timeout:120000});
  assert.ok(!list.isError,JSON.stringify(list));
  const index=list.content.filter(block=>block.type==='text').map(block=>block.text).join('\n');
  const id=index.match(/(?:^|\n)- Button \(([^)]+)\)/)?.[1];
  assert.ok(id,'Button must be discovered through docs-list');
  const result=await client.callTool({name:'docs-show',arguments:{id}},undefined,{timeout:120000});
  assert.ok(!result.isError,JSON.stringify(result));
  const text=result.content.filter(block=>block.type==='text').map(block=>block.text).join('\n');
  assert.ok(text.includes('APDS '+version));
  const code=text.split('## Examples')[1]?.match(/```tsx\n([\s\S]*?)```/)?.[1];
  assert.ok(code?.includes('export function SaveButton'),'Executable public example must be provided');
  assert.ok(!/from ['"](?:@ap-design\/ui|apds-workspace)['"]/.test(code));
  await fs.writeFile(path.join(target,'src/McpSaveButton.tsx'),code);
  await fs.writeFile(path.join(target,'src/mcp-main.tsx'),`import {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {SaveButton} from './McpSaveButton';
import './app.css';
function App(){const [attempts,setAttempts]=useState(0);return <main data-theme="light" data-platform="desktop" data-attempts={attempts}><SaveButton save={async()=>{setAttempts(value=>value+1);await new Promise(resolve=>setTimeout(resolve,650));if(attempts===0)throw Error('trial failure');}}/></main>;}
createRoot(document.getElementById('root')!).render(<App/>);`);
  await fs.writeFile(path.join(target,'mcp.html'),'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/src/mcp-main.tsx"></script></body></html>');
  await fs.mkdir('artifacts/'+version,{recursive:true});
  await fs.writeFile('artifacts/'+version+'/remote-button.json',JSON.stringify(result,null,2));
  reports.push({version,storybook:release.storybookUrl,mcp:release.mcpUrl,integrity:remote.integrity,buttonId:id,status:'passed'});
 }finally{await client.close();}
}
const wrong=await (await fetch(new URL('apds-release.json',registry.releases['0.2.0'].storybookUrl))).json();
assert.notEqual(wrong.version,'0.1.3');
await fs.writeFile('artifacts/remote-results.json',JSON.stringify({reports,mismatchedVersionDetected:true},null,2));
console.log(JSON.stringify(reports,null,2));

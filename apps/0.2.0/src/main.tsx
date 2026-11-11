import {useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Button, Table, TableHeader, TableHead, TableBody, TableRow, TableCell, TableCaption} from '@apds/core';
import {ListPageTemplate, SharingPermissionsDialog, type SharingPermissions} from '@apds/core/patterns';
import './app.css';

// Test-only async functions: no network request or real access-control update.
const wait = () => new Promise(resolve => setTimeout(resolve, 650));
function SaveExample() {
  const busy = useRef(false);
  const attempts = useRef(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [count, setCount] = useState(0);
  async function save() {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setMessage('저장 중입니다.');
    const attempt = ++attempts.current;
    setCount(attempt);
    try {
      await wait();
      if (attempt === 1) throw new Error('test-only first failure');
      setMessage('저장 완료');
    } catch {
      setMessage('저장하지 못했습니다. 다시 시도하세요.');
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }
  return <section aria-label="저장"><h2>변경 사항 저장</h2>
    <Button loading={saving} onClick={save} data-testid="save-button" data-attempts={count}>저장하기</Button>
    <p role="status" data-testid="save-status">{message}</p>
  </section>;
}
function Teams() {
  const [query, setQuery] = useState('');
  const rows = ['디자인','개발','운영'].filter(name => name.includes(query)).map(name => ({id:name,cells:{name}}));
  return <section aria-label="팀 검색 목록"><ListPageTemplate pageTitle="팀 목록" tableLabel="팀 목록"
    columns={[{key:'name',label:'팀 이름'}]} rows={rows} totalCount={rows.length}
    search={{label:'팀 검색',placeholder:'팀 이름 검색',value:query,onChange:setQuery}} />
  </section>;
}
function DatasetCounts() {
  const rows = [{id:'faq',name:'고객 질문',questions:120,completed:90},{id:'product',name:'제품 안내',questions:64,completed:64}];
  return <section aria-label="데이터셋 비교"><h2>데이터셋 진행 현황</h2>
    <Table aria-label="데이터셋별 질문 수와 완료 수" tabIndex={0}><TableCaption>데이터셋별 진행 현황</TableCaption>
      <TableHeader><TableRow><TableHead scope="col">데이터셋</TableHead><TableHead scope="col">질문 수</TableHead><TableHead scope="col">완료 수</TableHead></TableRow></TableHeader>
      <TableBody>{rows.map(row => <TableRow key={row.id}><TableCell>{row.name}</TableCell><TableCell>{row.questions}</TableCell><TableCell>{row.completed}</TableCell></TableRow>)}</TableBody>
    </Table>
  </section>;
}
function Sharing() {
  const [open,setOpen] = useState(false);
  const [value,setValue] = useState<SharingPermissions>({scope:'private',groupIds:[]});
  const [notice,setNotice] = useState('');
  const attempts = useRef(0);
  async function save(next: SharingPermissions) {
    const attempt = ++attempts.current;
    await wait();
    if (attempt === 1) throw new Error('test-only first failure');
    setValue(next);
    setNotice('공유 권한을 저장했습니다.');
  }
  return <section aria-label="문서 공유"><h2>문서 공유</h2>
    <SharingPermissionsDialog open={open} onOpenChange={setOpen} value={value}
      groups={[{id:'design',label:'디자인 그룹'},{id:'engineering',label:'개발 그룹'}]}
      onSave={save} trigger={<Button>공유 권한 변경</Button>} />
    <p data-testid="saved-sharing">{value.scope === 'private' ? '나만 보기' : value.scope === 'public' ? '전체 공개' : `특정 그룹: ${value.groupIds.join(', ')}`}</p>
    <p role="status">{notice}</p>
  </section>;
}
function App() {
  return <main data-theme="light" data-platform="desktop"><h1>팀과 데이터셋</h1><SaveExample/><Teams/><DatasetCounts/><Sharing/></main>;
}
createRoot(document.getElementById('root')!).render(<App/>);

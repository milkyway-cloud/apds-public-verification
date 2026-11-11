import {useEffect, useId, useRef, useState, type ReactElement} from 'react';
import {
  Alert, AlertTitle, AlertDescription, Button,
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  RadioGroup, RadioGroupItem, Label, Badge, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuItem,
} from '@apds/core';
import {XIcon, ChevronDownIcon} from 'lucide-react';

export interface SharingPermissions {
  scope: 'private' | 'public' | 'groups';
  groupIds: string[];
}
export interface SharingGroup {id: string; label: string}
export interface SharingPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 현재 저장된 공개 범위입니다. 취소하면 이 값을 유지합니다. */
  value: SharingPermissions;
  groups: readonly SharingGroup[];
  /** 서버 저장이 끝나면 resolve, 실패하면 reject합니다. */
  onSave: (value: SharingPermissions) => Promise<void>;
  trigger?: ReactElement;
  title?: string;
  description?: string;
}

/** 공유 권한과 공개 범위를 고르고 특정 그룹을 여러 개 지정하는 모달입니다. */
export function SharingPermissionsDialog({
  open, onOpenChange, value, groups, onSave, trigger,
  title = '공유 권한 변경', description = '이 항목을 볼 수 있는 대상을 선택하세요.',
}: SharingPermissionsDialogProps) {
  const id = useId();
  const [draft, setDraft] = useState<SharingPermissions>(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const savingRef = useRef(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const groupMenuRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {if (open) {setDraft(value); setError('');}}, [open, value]);
  useEffect(() => {if (error) errorRef.current?.focus();}, [error]);
  const labelFor = (groupId: string) => groups.find(group => group.id === groupId)?.label ?? groupId;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (savingRef.current) return;
    if (draft.scope === 'groups' && draft.groupIds.length === 0) {
      setError('공유할 그룹을 하나 이상 선택하세요.');
      return;
    }
    if (draft.scope === 'groups' && draft.groupIds.some(groupId => !groups.some(group => group.id === groupId))) {
      setError('선택한 그룹을 사용할 수 없습니다. 그룹 목록을 확인하세요.');
      return;
    }
    savingRef.current = true;
    setSaving(true);
    setError('');
    try {
      await onSave({scope: draft.scope, groupIds: draft.scope === 'groups' ? [...draft.groupIds] : []});
      onOpenChange(false);
    } catch {
      setError('공유 권한을 저장하지 못했습니다. 다시 시도하세요.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return <Dialog open={open} onOpenChange={nextOpen => {if (!savingRef.current) onOpenChange(nextOpen);}}>
    {trigger && <DialogTrigger render={trigger}/>}
    <DialogContent showCloseButton={false} style={{
      width: 'min(572px, calc(100vw - 32px))', maxWidth: 'none',
      maxHeight: 'calc(100dvh - 32px)', overflowY: 'auto',
    }}>
      <form onSubmit={submit} noValidate style={{display: 'grid', gap: 'var(--ap-platform-value-spacing-md)'}}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div>
          <RadioGroup aria-label="공개 범위" disabled={saving} value={draft.scope}
            onValueChange={scope => {setDraft(previous => ({...previous, scope: scope as SharingPermissions['scope']})); setError('');}}
            style={{border: '1px solid var(--ap-theme-line-normal-neutral)', borderRadius: 'var(--ap-platform-value-rounded-sm)', padding: 'var(--ap-platform-value-spacing-sm) var(--ap-platform-value-spacing-md)', gap: 'var(--ap-platform-value-spacing-md)'}}>
            {([['private', '나만 보기'], ['public', '전체 공개'], ['groups', '특정 그룹에게만 공개']] as const).map(([scope, label]) =>
              <div key={scope} style={{display: 'grid', gap: 'var(--ap-platform-value-spacing-xs)', minWidth: 0}}>
                <div style={{display: 'flex', alignItems: 'center', gap: 'var(--ap-platform-value-spacing-xs)'}}>
                  <RadioGroupItem id={`${id}-${scope}`} value={scope}/>
                  <Label htmlFor={`${id}-${scope}`}>{label}</Label>
                </div>
                {scope === 'groups' && draft.scope === 'groups' && <div>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="outline" size="md">그룹 선택</Button>}
                      ref={groupMenuRef} disabled={saving} aria-label="공유할 그룹" 
                      aria-invalid={!!error || undefined} aria-describedby={error ? `${id}-error` : undefined}
                      style={{width: '100%', justifyContent: 'space-between'}}>
                      그룹 선택<ChevronDownIcon aria-hidden="true"/>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {groups.length === 0 && <DropdownMenuItem disabled>선택할 그룹이 없습니다.</DropdownMenuItem>}
                      {groups.map(group => <DropdownMenuCheckboxItem key={group.id}
                        checked={draft.groupIds.includes(group.id)} disabled={saving} closeOnClick={false}
                        onCheckedChange={checked => {
                          setDraft(previous => ({...previous, groupIds: checked
                            ? [...new Set([...previous.groupIds, group.id])]
                            : previous.groupIds.filter(id => id !== group.id)}));
                          setError('');
                        }}>{group.label}</DropdownMenuCheckboxItem>)}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {draft.groupIds.length > 0 && <div role="list" aria-label="선택한 공유 그룹" style={{
                    display: 'flex', flexWrap: 'wrap', marginTop: 'var(--ap-platform-value-spacing-xs)',
                    gap: 'var(--ap-platform-value-spacing-xxs)',
                  }}>
                    {draft.groupIds.map(groupId => <Badge key={groupId} role="listitem" variant="neutral" tone="soft" shape="rounded" size="md">
                      {labelFor(groupId)}
                      <Button variant="ghost" size="icon-xs" disabled={saving} aria-label={`${labelFor(groupId)} 선택 해제`}
                        onClick={() => {
                          setDraft(previous => ({...previous, groupIds: previous.groupIds.filter(id => id !== groupId)}));
                          setError('');
                          groupMenuRef.current?.focus();
                        }}><XIcon aria-hidden="true"/></Button>
                    </Badge>)}
                  </div>}

                </div>}
              </div>)}
          </RadioGroup>
          {error && <Alert variant="destructive" ref={errorRef} tabIndex={-1} id={`${id}-error`} style={{marginTop: 'var(--ap-platform-value-spacing-sm)'}}>
            <AlertTitle>공유 권한을 확인하세요</AlertTitle><AlertDescription>{error}</AlertDescription>
          </Alert>}
        </div>
        <DialogFooter>
          <Button size="lg" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>취소</Button>
          <Button size="lg" type="submit" loading={saving} disabled={saving}>{saving ? '저장 중' : '확인'}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}


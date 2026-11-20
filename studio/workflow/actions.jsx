// مسار الموافقة في غرفة التحرير: كاتب ← محرّر ← رئيس تحرير.
// الكاتب يرسل إلى التحرير ولا ينشر. المحرّر يعيد المادّة أو يرفعها. رئيس التحرير وحده ينشر.

import { useEffect, useState } from 'react';
import { useClient, useCurrentUser, useDocumentOperation } from 'sanity';
import { STATUS, STATUS_LIST } from './status.js';

const API = { apiVersion: '2025-02-19' };
const roleCache = new Map();

// يحدّد دور المستخدم الحاليّ: مدير المشروع في Sanity يُعامَل رئيسَ تحرير،
// والباقون بحسب حقل "الدور في التحرير" في وثيقة الكاتب المرتبطة ببريدهم.
export function useStaffRole() {
  const user = useCurrentUser();
  const client = useClient(API);
  const email = (user?.email || '').toLowerCase();
  const isAdmin = (user?.roles || []).some((r) => r.name === 'administrator');
  const [role, setRole] = useState(() => (isAdmin ? 'editorInChief' : roleCache.get(email) || null));

  useEffect(() => {
    if (isAdmin) return setRole('editorInChief');
    if (!email) return;
    if (roleCache.has(email)) return setRole(roleCache.get(email));
    let alive = true;
    client
      .fetch(`*[_type == "writer" && lower(staffEmail) == $email][0].staffRole`, { email })
      .then((r) => {
        const value = r || 'writer';
        roleCache.set(email, value);
        if (alive) setRole(value);
      })
      .catch(() => alive && setRole('writer'));
    return () => {
      alive = false;
    };
  }, [email, isAdmin, client]);

  return { role, name: user?.name || user?.email || '' };
}

const statusOf = (props) => (props.draft || props.published)?.workflow || STATUS.draft;
const entry = (status, by) => ({ _key: Math.random().toString(36).slice(2, 10), _type: 'object', status, by, at: new Date().toISOString() });

function useMove(props) {
  const { patch } = useDocumentOperation(props.id, props.type);
  const { name } = useStaffRole();
  return (status, extra = {}) => {
    patch.execute([{ set: { workflow: status, ...extra } }, { setIfMissing: { history: [] } }, { insert: { after: 'history[-1]', items: [entry(status, name)] } }]);
  };
}

// 1) الكاتب: إرسال إلى التحرير
function SubmitAction(props) {
  const move = useMove(props);
  const status = statusOf(props);
  if (![STATUS.draft, STATUS.returned].includes(status) || !props.draft) return null;
  return {
    label: 'إرسال إلى التحرير',
    tone: 'primary',
    onHandle: () => {
      move(STATUS.submitted);
      props.onComplete();
    },
  };
}

// 2) المحرّر: رفع إلى رئيس التحرير
function ForwardAction(props) {
  const move = useMove(props);
  const { role } = useStaffRole();
  const status = statusOf(props);
  if (!['editor', 'editorInChief'].includes(role) || ![STATUS.submitted, STATUS.incoming].includes(status)) return null;
  return {
    label: 'انتهى التحرير: رفع إلى رئيس التحرير',
    tone: 'primary',
    onHandle: () => {
      move(STATUS.edited);
      props.onComplete();
    },
  };
}

// المحرّر أو رئيس التحرير: إعادة إلى الكاتب مع ملاحظة
function ReturnAction(props) {
  const move = useMove(props);
  const { role } = useStaffRole();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const status = statusOf(props);
  if (!['editor', 'editorInChief'].includes(role) || ![STATUS.submitted, STATUS.edited].includes(status)) return null;
  return {
    label: 'إعادة إلى الكاتب',
    tone: 'caution',
    onHandle: () => {
      setNote((props.draft || props.published)?.editorNote || '');
      setOpen(true);
    },
    dialog: open && {
      type: 'dialog',
      header: 'ملاحظات للكاتب',
      onClose: () => setOpen(false),
      content: (
        <div dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 4 }}>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={6} style={{ width: '100%', fontSize: 15, padding: 8, fontFamily: 'inherit' }} placeholder="ما الذي يجب تعديله؟" />
          <button
            type="button"
            onClick={() => {
              move(STATUS.returned, { editorNote: note });
              setOpen(false);
              props.onComplete();
            }}
            style={{ padding: '10px 16px', fontSize: 15, cursor: 'pointer' }}
          >
            إعادة المادّة
          </button>
        </div>
      ),
    },
  };
}

// 3) رئيس التحرير: النشر (يحلّ محلّ زرّ النشر الأصليّ)
function makePublish(Original) {
  function GatedPublish(props) {
    const original = Original(props);
    const { role, name } = useStaffRole();
    const { patch, publish } = useDocumentOperation(props.id, props.type);
    const [publishing, setPublishing] = useState(false);
    const status = statusOf(props);

    useEffect(() => {
      if (publishing && !props.draft) setPublishing(false);
    }, [publishing, props.draft]);

    if (role !== 'editorInChief') return null;
    if (props.type !== 'article') return original;
    const ready = status === STATUS.edited || status === STATUS.submitted;
    return {
      ...original,
      label: publishing ? 'جارٍ النشر…' : 'نشر',
      title: ready ? undefined : 'المادّة لم تمرّ بالتحرير بعد',
      disabled: publish.disabled || publishing,
      onHandle: () => {
        setPublishing(true);
        const doc = props.draft || props.published || {};
        patch.execute([
          { set: { workflow: STATUS.published } },
          { setIfMissing: { publishedAt: doc.publishedAt || new Date().toISOString(), history: [] } },
          { insert: { after: 'history[-1]', items: [entry(STATUS.published, name)] } },
        ]);
        publish.execute();
        props.onComplete();
      },
    };
  }
  GatedPublish.action = 'publish';
  return GatedPublish;
}

// الحذف وإلغاء النشر لرئيس التحرير وحده
function onlyChief(Original) {
  function Gated(props) {
    const original = Original(props);
    const { role } = useStaffRole();
    if (role === 'editorInChief') return original;
    // المحرّر يستطيع حذف خبر وارد من المصادر لم يُعتمد
    if (Original.action === 'delete' && role === 'editor' && props.type === 'article' && statusOf(props) === STATUS.incoming && !props.published) return original;
    return null;
  }
  Gated.action = Original.action;
  return Gated;
}

export function resolveActions(prev, context) {
  const gated = prev.map((A) => {
    if (A.action === 'publish') return makePublish(A);
    if (A.action === 'unpublish' || A.action === 'delete') return onlyChief(A);
    return A;
  });
  if (context.schemaType !== 'article') return gated;
  return [SubmitAction, ForwardAction, ReturnAction, ...gated];
}

// شارة المرحلة أعلى المادّة
function StatusBadge(props) {
  if (props.type !== 'article') return null;
  const status = statusOf(props);
  const color = { incoming: 'default', draft: 'default', submitted: 'warning', returned: 'danger', edited: 'primary', published: 'success' }[status];
  return { label: STATUS_LIST.find((s) => s.value === status)?.title || status, color };
}

export function resolveBadges(prev, context) {
  return context.schemaType === 'article' ? [StatusBadge, ...prev] : prev;
}

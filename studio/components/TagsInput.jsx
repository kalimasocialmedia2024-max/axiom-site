// حقل الوسوم: يعمل على الهاتف واللابتوب.
// يكتب المحرّر وسماً أو أكثر (يفصل بينها بفاصلة) ثم يضغط "أضف" أو Enter،
// ويمكنه اختيار وسم من الوسوم الأكثر استعمالاً بنقرة واحدة.
import { useEffect, useMemo, useState } from 'react';
import { set, unset, useClient } from 'sanity';

const wrap = { direction: 'rtl', display: 'flex', flexDirection: 'column', gap: 10 };
const row = { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' };
const chip = {
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999,
  background: '#C8102E', color: '#fff', fontSize: 15, fontWeight: 600, lineHeight: 1.4,
};
const x = { background: 'none', border: 0, color: '#fff', fontSize: 18, lineHeight: 1, cursor: 'pointer', padding: '0 2px' };
const input = {
  flex: '1 1 200px', minWidth: 0, padding: '10px 12px', fontSize: 16, borderRadius: 6,
  border: '1px solid rgba(128,128,128,.45)', background: 'transparent', color: 'inherit', direction: 'rtl',
};
const addBtn = { padding: '10px 18px', fontSize: 15, fontWeight: 700, borderRadius: 6, border: 0, background: '#1F1F23', color: '#fff', cursor: 'pointer' };
const sugg = {
  padding: '5px 10px', borderRadius: 999, fontSize: 14, cursor: 'pointer', background: 'transparent',
  border: '1px dashed rgba(128,128,128,.6)', color: 'inherit',
};

const split = (s) => s.split(/[،,؛;\n]+/).map((t) => t.trim().replace(/\s+/g, ' ')).filter(Boolean);

export function TagsInput(props) {
  const { value, onChange, readOnly } = props;
  const tags = Array.isArray(value) ? value : [];
  const [text, setText] = useState('');
  const [popular, setPopular] = useState([]);
  const client = useClient({ apiVersion: '2024-01-01' });

  useEffect(() => {
    let alive = true;
    client
      .fetch('*[_type == "article" && defined(tags)] | order(_updatedAt desc)[0...400].tags')
      .then((lists) => {
        if (!alive) return;
        const count = {};
        (lists || []).flat().forEach((t) => { if (t) count[t] = (count[t] || 0) + 1; });
        setPopular(Object.entries(count).sort((a, b) => b[1] - a[1]).map(([t]) => t).slice(0, 40));
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [client]);

  const save = (next) => onChange(next.length ? set(next) : unset());

  const add = (raw) => {
    const fresh = split(raw).filter((t) => !tags.includes(t));
    if (fresh.length) save([...tags, ...fresh]);
    setText('');
  };

  const remove = (t) => save(tags.filter((x) => x !== t));

  const matches = useMemo(() => {
    const q = text.trim();
    const pool = popular.filter((t) => !tags.includes(t));
    return (q ? pool.filter((t) => t.includes(q)) : pool).slice(0, q ? 10 : 12);
  }, [text, popular, tags]);

  return (
    <div style={wrap}>
      {tags.length > 0 && (
        <div style={row}>
          {tags.map((t) => (
            <span key={t} style={chip}>
              {t}
              {!readOnly && <button type="button" style={x} aria-label={`حذف ${t}`} onClick={() => remove(t)}>×</button>}
            </span>
          ))}
        </div>
      )}
      {!readOnly && (
        <>
          <div style={row}>
            <input
              style={input}
              value={text}
              placeholder="اكتب وسماً، أو عدّة وسوم بينها فاصلة"
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); add(text); } }}
            />
            <button type="button" style={addBtn} onClick={() => add(text)}>أضف</button>
          </div>
          {matches.length > 0 && (
            <div style={row}>
              <span style={{ fontSize: 13, opacity: 0.7 }}>{text.trim() ? 'وسوم مشابهة:' : 'الأكثر استعمالاً:'}</span>
              {matches.map((t) => (
                <button key={t} type="button" style={sugg} onClick={() => add(t)}>{t}</button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

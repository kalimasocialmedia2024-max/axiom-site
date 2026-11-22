// أدوات صغيرة للمحرّر في الخبر الوارد: فتح الخبر الأصلي، ومعاينة صورة المصدر.
import { useFormValue } from 'sanity';

const box = { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', direction: 'rtl' };

export function OpenSource() {
  const url = useFormValue(['sourceUrl']);
  const source = useFormValue(['source']);
  if (!url) return null;
  return (
    <div style={box}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 6, background: '#C8102E', color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}
      >
        افتح الخبر الأصلي ↗
      </a>
      {source && <span style={{ opacity: 0.75, fontSize: 14 }}>{source}</span>}
    </div>
  );
}

export function FeedImagePreview(props) {
  const url = props.value;
  const hasMain = useFormValue(['mainImage', 'asset']);
  if (!url) return null;
  return (
    <div style={{ ...box, alignItems: 'flex-start' }}>
      <img src={url} alt="" style={{ width: 240, maxWidth: '100%', aspectRatio: '16 / 9', objectFit: 'cover', borderRadius: 6, background: '#222' }} referrerPolicy="no-referrer" />
      <div style={{ flex: '1 1 200px', fontSize: 14, lineHeight: 1.8 }}>
        {hasMain
          ? 'أُضيفت صورة رئيسية، فلن تُستعمل صورة المصدر هذه.'
          : 'هذه الصورة تُستعمل تلقائياً على الموقع ما لم تُرفع صورة رئيسية. لا حاجة إلى رفع صورة إلا لتغييرها.'}
      </div>
    </div>
  );
}

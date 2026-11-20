// يجعل حقول الكتابة تتّبع اتّجاه النصّ (العربية من اليمين)، دون قلب واجهة الاستوديو نفسها.
const css = `
  input[type="text"], input[type="url"], input[type="email"], textarea, [data-slate-editor="true"] {
    unicode-bidi: plaintext;
    text-align: start;
  }
  [data-slate-editor="true"] { direction: rtl; text-align: right; }
`;

export function RtlLayout(props) {
  return (
    <>
      <style>{css}</style>
      {props.renderDefault(props)}
    </>
  );
}

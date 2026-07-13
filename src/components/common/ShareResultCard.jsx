import { useRef, useState } from 'react';
import { Share2, Loader2 } from 'lucide-react';

// Renders a branded result card off-screen and rasterizes it to a PNG the
// user can share (Web Share API on mobile) or download - free organic
// marketing every time someone posts their result.
//
// The rasterized card uses plain inline hex colors, not Tailwind classes:
// html2canvas can't parse the oklch()/lab() color functions Tailwind v4
// emits, so styling it with utility classes would render broken/black.
const ShareResultCard = ({ match, competitionName, label1, label2 }) => {
  const cardRef = useRef(null);
  const [generating, setGenerating] = useState(false);

  const name1 = label1 || match?.player1?.name || 'Igrač 1';
  const name2 = label2 || match?.player2?.name || 'Igrač 2';
  // For team-mode league matches, player1/player2 are the team/company name -
  // show who actually played underneath, from the lineup picked for this match.
  const lineup1 = match?.lineup1?.map(p => p.name).join(', ');
  const lineup2 = match?.lineup2?.map(p => p.name).join(', ');
  const score1 = match?.player1Score ?? 0;
  const score2 = match?.player2Score ?? 0;
  const p1Won = score1 > score2;

  const handleShare = async () => {
    if (!cardRef.current) return;
    setGenerating(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(cardRef.current, { backgroundColor: null, scale: 2 });
      canvas.toBlob(async (blob) => {
        if (!blob) { setGenerating(false); return; }
        const file = new File([blob], `tenis-rezultat-${Date.now()}.png`, { type: 'image/png' });

        if (navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: 'Tenis rezultat', text: `${name1} vs ${name2}` });
          } catch {
            // user closed the share sheet - not an error
          }
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `tenis-rezultat-${name1}-vs-${name2}.png`.replace(/\s+/g, '-');
          a.click();
          URL.revokeObjectURL(url);
        }
        setGenerating(false);
      }, 'image/png');
    } catch (err) {
      console.error(err);
      alert('Greška pri generisanju slike za dijeljenje.');
      setGenerating(false);
    }
  };

  return (
    <div>
      <div style={{ position: 'fixed', left: '-9999px', top: 0, pointerEvents: 'none' }} aria-hidden="true">
        <div
          ref={cardRef}
          style={{
            width: 600,
            padding: 56,
            background: 'linear-gradient(135deg, #070b14 0%, #0a0f1d 100%)',
            fontFamily: 'Arial, Helvetica, sans-serif',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#84cc16', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0b1220', fontWeight: 900, fontSize: 22, fontStyle: 'italic' }}>T</div>
            <div style={{ color: '#ffffff', fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>TENIS<span style={{ color: '#84cc16' }}>.BA</span></div>
          </div>

          {competitionName && (
            <div style={{ color: '#84cc16', fontSize: 12, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>
              {competitionName}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: lineup1 ? 4 : 24 }}>
            <div style={{ color: p1Won ? '#a3e635' : '#ffffff', fontSize: 26, fontWeight: 900, fontStyle: 'italic', maxWidth: 340, textTransform: 'uppercase' }}>{name1}</div>
            <div style={{ color: p1Won ? '#a3e635' : '#94a3b8', fontSize: 48, fontWeight: 900 }}>{score1}</div>
          </div>
          {lineup1 && (
            <div style={{ color: '#64748b', fontSize: 13, fontWeight: 700, marginBottom: 24 }}>{lineup1}</div>
          )}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '8px 0 24px' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: lineup2 ? 4 : 0 }}>
            <div style={{ color: !p1Won ? '#a3e635' : '#ffffff', fontSize: 26, fontWeight: 900, fontStyle: 'italic', maxWidth: 340, textTransform: 'uppercase' }}>{name2}</div>
            <div style={{ color: !p1Won ? '#a3e635' : '#94a3b8', fontSize: 48, fontWeight: 900 }}>{score2}</div>
          </div>
          {lineup2 && (
            <div style={{ color: '#64748b', fontSize: 13, fontWeight: 700 }}>{lineup2}</div>
          )}

          {match?.sets?.length > 0 && (
            <div style={{ marginTop: 32, display: 'flex', gap: 8 }}>
              {match.sets.map((s, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '8px 14px', color: '#cbd5e1', fontSize: 14, fontWeight: 700 }}>
                  {s.p1}:{s.p2}
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 40, color: '#475569', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
            tenis.ba
          </div>
        </div>
      </div>

      <button
        onClick={handleShare}
        disabled={generating}
        className="flex items-center justify-center gap-2 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-black font-black uppercase italic tracking-widest text-xs px-5 py-3 rounded-xl transition-all"
      >
        {generating ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
        {generating ? 'Generišem...' : 'Podijeli Rezultat'}
      </button>
    </div>
  );
};

export default ShareResultCard;

import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { packCutUrl, theme } from '../engine/themes';

export interface PackTearHandle {
  /** programmatic tear (used by auto mode) */
  tear: () => void;
}

interface Props {
  themeId: string;
  onTorn: () => void;
}

/** where the foil crimp sits, as % of pack height */
const TEAR_Y = 12.5;
const TEETH = 16;
const AMP = 0.8;

function tearEdgePoints(): { x: number; y: number }[] {
  return Array.from({ length: TEETH + 1 }, (_, i) => ({
    x: (i / TEETH) * 100,
    y: TEAR_Y + (i % 2 === 0 ? -AMP : AMP),
  }));
}

/**
 * PTCG-style pack opening: swipe across the top and the foil slits open
 * along the crimp; the strip shears off and the body drops away.
 * Both layers are the same die-cut pack image, split by interlocking
 * jagged clip-paths, so the tear happens on the pack itself.
 */
const PackTear = forwardRef<PackTearHandle, Props>(function PackTear({ themeId, onTorn }, ref) {
  const t = theme(themeId);
  const [torn, setTorn] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const startX = useRef(0);
  const progress = useMotionValue(0); // 0..1 across the tear line

  const { stripClip, bodyClip } = useMemo(() => {
    const pts = tearEdgePoints();
    const ltr = pts.map((p) => `${p.x}% ${p.y}%`);
    const rtl = [...pts].reverse().map((p) => `${p.x}% ${p.y}%`);
    return {
      stripClip: `polygon(0% 0%, 100% 0%, ${rtl.join(', ')})`,
      bodyClip: `polygon(${ltr.join(', ')}, 100% 100%, 0% 100%)`,
    };
  }, []);

  const img = packCutUrl(themeId);

  // the slit trail + spark follow the finger along the crimp
  const slitWidth = useTransform(progress, [0, 1], ['0%', '100%']);
  const sparkLeft = useTransform(progress, [0, 1], ['0%', '100%']);
  const slitOpacity = useTransform(progress, [0, 0.04, 1], [0, 1, 1]);
  // the strip lifts slightly as the slice advances
  const stripLift = useTransform(progress, [0, 1], [0, -6]);
  const stripTilt = useTransform(progress, [0, 1], [0, -2.5]);

  function doTear() {
    if (torn) return;
    setTorn(true);
    animate(progress, 1, { duration: 0.15 });
    if (navigator.vibrate) navigator.vibrate([12, 30, 18]);
    setTimeout(onTorn, 640);
  }

  useImperativeHandle(ref, () => ({
    tear: () => {
      animate(progress, 0.96, { duration: 0.5, ease: 'easeIn', onComplete: doTear });
    },
  }));

  function onDown(e: React.PointerEvent) {
    if (torn) return;
    dragging.current = true;
    startX.current = e.clientX - progress.get() * (wrapRef.current?.clientWidth ?? 1);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // synthetic pointer events have no active pointer to capture
    }
  }
  function onMove(e: React.PointerEvent) {
    if (!dragging.current || torn) return;
    const w = wrapRef.current?.clientWidth ?? 1;
    const p = Math.min(1, Math.max(0, (e.clientX - startX.current) / w));
    progress.set(p);
    if (p >= 0.92) {
      dragging.current = false;
      doTear();
    }
  }
  function onUp() {
    if (!dragging.current || torn) return;
    dragging.current = false;
    if (progress.get() >= 0.75) doTear();
    else animate(progress, 0, { type: 'spring', stiffness: 300, damping: 26 });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
      <div
        ref={wrapRef}
        style={{ position: 'relative', width: 'min(66vw, 260px)', aspectRatio: '720/1040', touchAction: 'none' }}
      >
        {/* torn-off foil strip */}
        <motion.img
          src={img}
          alt=""
          draggable={false}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            clipPath: stripClip,
            y: torn ? undefined : stripLift,
            rotate: torn ? undefined : stripTilt,
            transformOrigin: '10% 100%',
            filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.45))',
            zIndex: 3,
          }}
          animate={
            torn
              ? { y: -150, x: 110, rotate: -24, opacity: 0, transition: { duration: 0.55, ease: [0.3, 0.6, 0.4, 1] } }
              : {}
          }
        />
        {/* pack body */}
        <motion.img
          src={img}
          alt=""
          draggable={false}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            clipPath: bodyClip,
            filter: `drop-shadow(0 26px 34px rgba(0,0,0,0.55)) drop-shadow(0 0 34px ${t.accent}26)`,
            zIndex: 2,
          }}
          animate={
            torn
              ? { y: 54, scale: 0.94, opacity: 0, transition: { delay: 0.18, duration: 0.42 } }
              : { y: [0, -5, 0], transition: { repeat: Infinity, duration: 2.6, ease: 'easeInOut' } }
          }
        />
        {/* slit trail along the crimp */}
        {!torn && (
          <>
            <motion.div
              style={{
                position: 'absolute', top: `${TEAR_Y}%`, left: '4%', height: 2.5,
                width: slitWidth, maxWidth: '92%',
                opacity: slitOpacity,
                transform: 'translateY(-50%)',
                background: `linear-gradient(90deg, transparent, #fff)`,
                boxShadow: `0 0 12px ${t.accent}, 0 0 26px ${t.accent}`,
                zIndex: 4,
                pointerEvents: 'none',
              }}
            />
            <motion.div
              style={{
                position: 'absolute', top: `${TEAR_Y}%`, left: sparkLeft, width: 14, height: 14,
                opacity: slitOpacity,
                transform: 'translate(-50%, -50%)',
                borderRadius: 99,
                background: '#fff',
                boxShadow: `0 0 10px #fff, 0 0 26px ${t.accent}, 0 0 44px ${t.accent}`,
                zIndex: 5,
                pointerEvents: 'none',
              }}
            />
          </>
        )}
        {/* flash at the moment of the tear */}
        {torn && (
          <motion.div
            initial={{ opacity: 0.9, scaleX: 1 }}
            animate={{ opacity: 0, scaleX: 1.25 }}
            transition={{ duration: 0.4 }}
            style={{
              position: 'absolute', top: `${TEAR_Y}%`, left: '-4%', right: '-4%', height: 4,
              transform: 'translateY(-50%)',
              background: '#fff',
              boxShadow: `0 0 24px #fff, 0 0 60px ${t.accent}`,
              zIndex: 6,
              pointerEvents: 'none',
            }}
          />
        )}
        {/* drag capture zone across the crimp */}
        {!torn && (
          <div
            style={{ position: 'absolute', top: '-4%', left: '-10%', right: '-10%', height: '34%', zIndex: 7, cursor: 'grab', touchAction: 'none' }}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          />
        )}
      </div>
      {!torn && (
        <motion.div
          className="tear-hint"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          Swipe across the foil to tear →
        </motion.div>
      )}
    </div>
  );
});

export default PackTear;

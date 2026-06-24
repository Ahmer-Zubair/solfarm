import React from 'react'

type Props = {
  onClose: () => void
}

export default function FarmhouseShowcase({ onClose }: Props) {
  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        <div style={styles.header}>
          <div>
            <div style={styles.eyebrow}>reference build</div>
            <div style={styles.title}>Founder Farmhouse Concept</div>
          </div>
          <button onClick={onClose} style={styles.close}>undo preview</button>
        </div>

        <div style={styles.stage}>
          <svg viewBox="0 0 960 620" style={styles.art} role="img" aria-label="Founder farmhouse reference concept">
            <defs>
              <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#8fd5ef" />
                <stop offset="62%" stopColor="#bcebf5" />
                <stop offset="100%" stopColor="#6eb85a" />
              </linearGradient>
              <linearGradient id="grassTop" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#8ee05b" />
                <stop offset="58%" stopColor="#57b83c" />
                <stop offset="100%" stopColor="#3f8f2c" />
              </linearGradient>
              <linearGradient id="grassSide" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#3c8a30" />
                <stop offset="100%" stopColor="#20601f" />
              </linearGradient>
              <linearGradient id="roofLeft" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#ff735d" />
                <stop offset="100%" stopColor="#bd342e" />
              </linearGradient>
              <linearGradient id="roofRight" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#c84538" />
                <stop offset="100%" stopColor="#7e2424" />
              </linearGradient>
              <filter id="softShadow" x="-30%" y="-30%" width="160%" height="180%">
                <feGaussianBlur stdDeviation="9" />
              </filter>
            </defs>

            <rect width="960" height="620" fill="url(#sky)" />
            <ellipse cx="480" cy="120" rx="230" ry="68" fill="#fff0b8" opacity="0.26" />

            <g transform="translate(0 16)">
              <polygon points="480,84 854,276 480,468 106,276" fill="url(#grassTop)" />
              <polygon points="106,276 480,468 480,520 106,328" fill="url(#grassSide)" />
              <polygon points="854,276 480,468 480,520 854,328" fill="#2d7227" />
              <polygon points="480,84 854,276 480,468 106,276" fill="none" stroke="#d6f3a1" strokeWidth="4" opacity="0.55" />

              <path d="M478 95 L520 116 L302 372 L260 350 Z" fill="#d7ad68" />
              <path d="M204 282 L246 260 L760 324 L718 346 Z" fill="#d7ad68" />
              <path d="M478 95 L498 105 L280 362 L260 350 Z" fill="#f1cf84" opacity="0.75" />
              <path d="M204 282 L224 271 L738 334 L718 346 Z" fill="#f1cf84" opacity="0.65" />

              <g opacity="0.95">
                <polygon points="170,340 282,284 380,334 268,390" fill="#c9914d" />
                <path d="M196 340 L292 292 M222 354 L318 306 M250 368 L346 320" stroke="#875b32" strokeWidth="4" opacity="0.44" />
                <path d="M178 336 L270 384 M204 322 L296 370 M230 309 L322 356" stroke="#f3d783" strokeWidth="3" opacity="0.42" />
              </g>

              <g opacity="0.95">
                <polygon points="656,326 762,272 846,314 740,368" fill="#d5a65c" />
                <path d="M680 326 L768 282 M704 338 L792 294 M728 350 L816 306" stroke="#8d6435" strokeWidth="4" opacity="0.45" />
                <circle cx="716" cy="326" r="7" fill="#8ee05b" />
                <circle cx="756" cy="306" r="7" fill="#8ee05b" />
                <circle cx="792" cy="324" r="7" fill="#8ee05b" />
              </g>

              <g>
                <ellipse cx="744" cy="190" rx="72" ry="34" fill="#2f8dcd" opacity="0.36" filter="url(#softShadow)" />
                <ellipse cx="744" cy="184" rx="66" ry="30" fill="#58b9eb" />
                <ellipse cx="728" cy="176" rx="34" ry="10" fill="#b8efff" opacity="0.56" />
                <path d="M684 185 C718 210 768 208 804 184" fill="none" stroke="#2b8ac3" strokeWidth="5" opacity="0.55" />
              </g>

              <g fill="#e7bd76" stroke="#895d34" strokeWidth="3">
                <path d="M236 206 L330 158 M346 150 L440 102 M520 104 L620 156 M636 164 L732 212" />
                <path d="M178 358 L270 406 M692 406 L786 358" />
                <circle cx="236" cy="206" r="7" />
                <circle cx="330" cy="158" r="7" />
                <circle cx="440" cy="102" r="7" />
                <circle cx="520" cy="104" r="7" />
                <circle cx="620" cy="156" r="7" />
                <circle cx="732" cy="212" r="7" />
              </g>

              <g>
                <ellipse cx="480" cy="382" rx="190" ry="54" fill="#1f241d" opacity="0.28" filter="url(#softShadow)" />
                <polygon points="330,300 480,220 630,300 480,382" fill="#ecbf72" />
                <polygon points="330,300 480,382 480,456 330,374" fill="#ecd9af" />
                <polygon points="630,300 480,382 480,456 630,374" fill="#c9a878" />

                <polygon points="274,282 480,162 686,282 480,392" fill="url(#roofLeft)" />
                <polygon points="480,162 686,282 480,392 480,250" fill="url(#roofRight)" opacity="0.95" />
                <path d="M286 280 L480 168 L674 280" fill="none" stroke="#ffd48a" strokeWidth="8" strokeLinecap="round" opacity="0.85" />
                <path d="M480 166 L480 390" stroke="#792626" strokeWidth="7" opacity="0.62" />

                <polygon points="406,240 480,198 554,240 480,282" fill="#ffd05f" />
                <polygon points="406,240 480,282 480,320 406,278" fill="#e0c186" />
                <polygon points="554,240 480,282 480,320 554,278" fill="#b99d6f" />
                <polygon points="390,232 480,180 570,232 480,284" fill="#f05a48" />
                <path d="M400 233 L480 186 L560 233" fill="none" stroke="#ffd48a" strokeWidth="5" strokeLinecap="round" />

                <polygon points="386,376 480,426 574,376 574,406 480,460 386,406" fill="#b87a45" />
                <polygon points="446,374 480,356 514,374 514,438 480,456 446,438" fill="#87502c" />
                <circle cx="503" cy="402" r="4" fill="#f2c75a" />

                <polygon points="354,326 392,306 430,326 430,358 392,380 354,358" fill="#8bd9ff" stroke="#f7f3d7" strokeWidth="7" />
                <polygon points="530,326 568,306 606,326 606,358 568,380 530,358" fill="#8bd9ff" stroke="#f7f3d7" strokeWidth="7" />
                <path d="M392 309 L392 376 M356 326 L428 326 M568 309 L568 376 M532 326 L604 326" stroke="#3a8eb4" strokeWidth="3" opacity="0.65" />

                <polygon points="596,176 626,192 626,252 596,236" fill="#8a4c2a" />
                <polygon points="626,192 650,180 650,240 626,252" fill="#65371f" />
                <polygon points="596,176 626,160 650,180 626,192" fill="#b66b35" />
              </g>

              <g>
                <ellipse cx="246" cy="198" rx="48" ry="22" fill="#1f241d" opacity="0.19" />
                <path d="M246 126 L206 204 L286 204 Z" fill="#1c751d" />
                <path d="M246 94 L214 158 L278 158 Z" fill="#2d9b2d" />
                <path d="M246 66 L224 116 L268 116 Z" fill="#63c84f" />
                <rect x="240" y="194" width="12" height="38" fill="#7f5a32" />

                <ellipse cx="778" cy="260" rx="48" ry="22" fill="#1f241d" opacity="0.19" />
                <path d="M778 188 L738 266 L818 266 Z" fill="#196a1b" />
                <path d="M778 156 L746 220 L810 220 Z" fill="#2b8f29" />
                <path d="M778 130 L756 180 L800 180 Z" fill="#5cc84f" />
                <rect x="772" y="256" width="12" height="38" fill="#7f5a32" />

                <ellipse cx="192" cy="304" rx="42" ry="19" fill="#1f241d" opacity="0.18" />
                <circle cx="192" cy="242" r="42" fill="#49ad38" />
                <circle cx="166" cy="260" r="30" fill="#2f8f2e" />
                <circle cx="220" cy="260" r="30" fill="#75cf52" />
                <rect x="186" y="292" width="12" height="34" fill="#87502c" />
              </g>

              <g>
                <path d="M380 390 C410 406 446 406 480 390 C514 406 550 406 580 390" fill="none" stroke="#ff8b8b" strokeWidth="10" strokeLinecap="round" />
                <path d="M394 406 C424 420 452 420 480 406 C508 420 538 420 566 406" fill="none" stroke="#f0c040" strokeWidth="8" strokeLinecap="round" />
                <circle cx="328" cy="346" r="7" fill="#ff7a7a" />
                <circle cx="340" cy="352" r="6" fill="#f0c040" />
                <circle cx="622" cy="348" r="7" fill="#ff7a7a" />
                <circle cx="636" cy="354" r="6" fill="#f0c040" />
              </g>

              <g>
                <rect x="318" y="360" width="10" height="50" fill="#413426" />
                <circle cx="323" cy="350" r="13" fill="#fff0a8" opacity="0.85" />
                <rect x="632" y="360" width="10" height="50" fill="#413426" />
                <circle cx="637" cy="350" r="13" fill="#fff0a8" opacity="0.85" />
              </g>

              <g>
                <polygon points="392,482 480,526 568,482 480,438" fill="#10141b" opacity="0.82" />
                <text x="480" y="490" textAnchor="middle" fill="#f0c040" fontFamily="monospace" fontSize="18" fontWeight="700" letterSpacing="2">
                  SOLFARM ESTATE
                </text>
              </g>
            </g>
          </svg>
        </div>

        <div style={styles.notes}>
          <div>
            <b>Why this is better:</b> the house now has a true isometric read, a stronger silhouette, softer shadows, staged landscaping, and enough detail to guide the real sprite work.
          </div>
          <div>This is still only a reference preview. Closing it removes it and does not touch your farm save.</div>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    background: 'rgba(5,8,12,0.84)',
  },
  panel: {
    width: 960,
    maxWidth: 'calc(100vw - 28px)',
    maxHeight: 'calc(100vh - 28px)',
    overflow: 'auto',
    borderRadius: 8,
    border: '1px solid rgba(240,192,64,0.32)',
    background: '#0d0f14',
    boxShadow: '0 24px 90px rgba(0,0,0,0.58)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    padding: 16,
    borderBottom: '1px solid rgba(255,255,255,0.07)',
  },
  eyebrow: {
    color: '#f0c040',
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 6,
    color: '#f4f0e5',
    fontSize: 22,
    fontFamily: 'var(--font-mono)',
    fontWeight: 800,
  },
  close: {
    alignSelf: 'flex-start',
    height: 30,
    padding: '0 12px',
    borderRadius: 4,
    border: '1px solid rgba(240,192,64,0.36)',
    background: 'rgba(240,192,64,0.09)',
    color: '#f0c040',
    fontSize: 10,
    fontFamily: 'var(--font-mono)',
    cursor: 'pointer',
  },
  stage: {
    background: '#78c8e4',
    overflow: 'hidden',
  },
  art: {
    display: 'block',
    width: '100%',
    height: 'auto',
    maxHeight: 'min(70vh, 620px)',
  },
  notes: {
    display: 'grid',
    gridTemplateColumns: '1fr 0.55fr',
    gap: 12,
    padding: 14,
    color: '#8892a4',
    fontSize: 11,
    lineHeight: 1.55,
    fontFamily: 'var(--font-mono)',
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
}


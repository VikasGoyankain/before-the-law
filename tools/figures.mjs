/* The three figures — iterated against rendered output, not guessed. */
export const cut = (id, w, h, slots) =>
  `<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}">
     <rect width="${w}" height="${h}" fill="#fff"/>${slots}
   </mask>`;

/* Arm reaches out to a carried bundle: the gap between arm and coat is real
   negative space, so the pose survives a flat silhouette with no mask. */
export const manArrival = `
<g>
  <path d="M41 39 C41 25 46 20 54 20 C62 20 67 25 67 39 Z"/>
  <ellipse cx="54" cy="39.5" rx="21.5" ry="3.4"/>
  <ellipse cx="54" cy="47" rx="8.6" ry="9.4"/>
  <path d="M49 53 h10 v10 h-10 z"/>
  <path d="M38 71 C38 64 44 60 54 60 C64 60 70 64 70 71 L67 110 L74 150 L34 150 L41 110 Z"/>
  <path d="M39 71 L32 112 L41 114 L46 73 Z"/>
  <path d="M63 69 L82 108 L73 113 L57 75 Z"/>
  <path d="M43 146 L41 183 L51 183 L52 146 Z"/>
  <path d="M57 146 L58 183 L68 183 L66 146 Z"/>
  <ellipse cx="45" cy="184.5" rx="8.4" ry="3.6"/>
  <ellipse cx="64" cy="184.5" rx="8.4" ry="3.6"/>
  <path d="M78 118 q12 -1 15 8 q3 9 -6 12 q-11 3 -15 -6 q-3 -9 6 -14 z"/>
  <path d="M75 116 l9 -2 l-2 7 z"/>
</g>`;

/* Seated in profile, knees up, one arm out to the knee. */
export const manWaiting = `
<g>
  <path d="M42 107 C42 94 46 90 53 90 C60 90 64 94 64 107 Z"/>
  <ellipse cx="53" cy="107" rx="19.5" ry="3.2"/>
  <ellipse cx="53" cy="114.5" rx="8.4" ry="9"/>
  <path d="M49 120 h8 v9 h-8 z"/>
  <path d="M37 178 C34 152 38 132 48 127 C59 125 63 133 62 141 L61 180 Z"/>
  <ellipse cx="46" cy="180" rx="17" ry="8"/>
  <path d="M40 176 L78 142 L89 154 L51 188 Z"/>
  <path d="M78 144 L90 152 L89 187 L77 187 Z"/>
  <path d="M52 131 L85 147 L81 157 L48 141 Z"/>
  <ellipse cx="83" cy="187.5" rx="10.5" ry="4"/>
  <path d="M18 168 q12 -2 16 7 q3 9 -6 12 q-11 3 -15 -6 q-3 -8 5 -13 z"/>
</g>`;

export const manAged = `
<g>
  <path d="M46 106 C46 96 50 92 56 92 C62 92 66 96 66 106 Z"/>
  <ellipse cx="56" cy="106.5" rx="16" ry="2.8"/>
  <ellipse cx="56" cy="113" rx="7" ry="7.6"/>
  <path d="M52 118 h8 v7 h-8 z"/>
  <path d="M42 135 C42 126 47 122 56 122 C65 122 70 127 69 136 L67 165 L44 165 Z"/>
  <path d="M44 162 L70 162 L72 180 L42 180 Z"/>
  <ellipse cx="48" cy="181" rx="8" ry="3.2"/>
  <ellipse cx="66" cy="181" rx="8" ry="3.2"/>
</g>`;

/* No arms — a monolithic greatcoat is more immovable than any pose.
   The beard is cut as two narrow slots that start below the fur collar,
   so it reads as a long wedge rather than a badge. */
export const doorkeeper = `
${cut('dk', 120, 200, `
  <path d="M49.4 47 L52.6 47 L59 87 L56 87.6 Z" fill="#000"/>
  <path d="M70.6 47 L67.4 47 L61 87 L64 87.6 Z" fill="#000"/>`)}
<g mask="url(#dk)">
  <path d="M47 27 C47 12 52 7 60 7 C68 7 73 12 73 27 Z"/>
  <ellipse cx="60" cy="27" rx="15.5" ry="3.6"/>
  <ellipse cx="60" cy="36" rx="10.6" ry="11.4"/>
  <path d="M51 42 C51 60 55 88 60 88 C65 88 69 60 69 42 C66 48 54 48 51 42 Z"/>
  <path d="M28 57 q3 -9 12 -12 q9 -3 20 -3 q11 0 20 3 q9 3 12 12
           q-5 8 -13 10 q-9 2 -19 2 q-10 0 -19 -2 q-8 -2 -13 -10 z"/>
  <path d="M30 64 C30 58 42 52 60 52 C78 52 90 58 90 64 L97 181 L23 181 Z"/>
  <ellipse cx="40" cy="182" rx="12" ry="4.4"/>
  <ellipse cx="80" cy="182" rx="12" ry="4.4"/>
</g>`;

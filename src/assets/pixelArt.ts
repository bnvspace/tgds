import type { ZoneType } from '@/types'

function toDataUri(markup: string): string {
  const minified = markup
    .replace(/\r?\n/g, '')
    .replace(/>\s+</g, '><')
    .trim()

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(minified)}`
}

function icon16(body: string): string {
  return toDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">
      ${body}
    </svg>
  `)
}

function icon32(body: string): string {
  return toDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">
      ${body}
    </svg>
  `)
}

function backdrop(body: string): string {
  return toDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice" shape-rendering="crispEdges">
      ${body}
    </svg>
  `)
}

function panorama(body: string): string {
  return toDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" shape-rendering="crispEdges">
      ${body}
    </svg>
  `)
}

export const symbolIconById = {
  dagger: icon16(`
    <rect x="7" y="1" width="2" height="1" fill="#fff2d4"/>
    <rect x="6" y="2" width="4" height="1" fill="#fff2d4"/>
    <rect x="6" y="3" width="4" height="2" fill="#d7dbe2"/>
    <rect x="7" y="5" width="2" height="4" fill="#bcc2cb"/>
    <rect x="5" y="9" width="6" height="1" fill="#c8a96e"/>
    <rect x="6" y="10" width="4" height="1" fill="#5b351a"/>
    <rect x="7" y="11" width="2" height="3" fill="#8f562f"/>
    <rect x="6" y="14" width="4" height="1" fill="#c8a96e"/>
    <rect x="7" y="15" width="2" height="1" fill="#3d2b1f"/>
  `),
  shield: icon16(`
    <rect x="4" y="2" width="8" height="1" fill="#e8d9aa"/>
    <rect x="3" y="3" width="10" height="2" fill="#c8a96e"/>
    <rect x="3" y="5" width="10" height="6" fill="#4caf6e"/>
    <rect x="4" y="11" width="8" height="2" fill="#377d4a"/>
    <rect x="5" y="13" width="6" height="1" fill="#28553b"/>
    <rect x="6" y="14" width="4" height="1" fill="#1d3a29"/>
    <rect x="7" y="4" width="2" height="8" fill="#e8d9aa"/>
    <rect x="6" y="6" width="4" height="2" fill="#dce6d5"/>
  `),
  coin: icon16(`
    <rect x="4" y="2" width="8" height="1" fill="#fff0aa"/>
    <rect x="3" y="3" width="10" height="2" fill="#f0d090"/>
    <rect x="2" y="5" width="12" height="6" fill="#c8a96e"/>
    <rect x="3" y="11" width="10" height="2" fill="#a87b32"/>
    <rect x="4" y="13" width="8" height="1" fill="#7d5b1f"/>
    <rect x="5" y="5" width="2" height="6" fill="#f8e9b3"/>
    <rect x="8" y="4" width="2" height="7" fill="#fff3c8"/>
    <rect x="10" y="6" width="1" height="4" fill="#865f1e"/>
  `),
  energizer: icon16(`
    <rect x="5" y="1" width="6" height="2" fill="#6fb7ff"/>
    <rect x="4" y="3" width="8" height="2" fill="#3a7bd5"/>
    <rect x="7" y="5" width="3" height="2" fill="#cfdfff"/>
    <rect x="5" y="7" width="4" height="2" fill="#8fe8ff"/>
    <rect x="8" y="9" width="3" height="2" fill="#dff6ff"/>
    <rect x="6" y="11" width="4" height="2" fill="#5fd0ff"/>
    <rect x="5" y="13" width="4" height="2" fill="#2f6fc8"/>
    <rect x="9" y="4" width="2" height="2" fill="#c7a3ff"/>
    <rect x="10" y="6" width="2" height="2" fill="#a36cff"/>
  `),
  bomb: icon16(`
    <rect x="7" y="1" width="2" height="2" fill="#c8a96e"/>
    <rect x="8" y="0" width="2" height="1" fill="#f0d090"/>
    <rect x="9" y="1" width="2" height="1" fill="#e87830"/>
    <rect x="5" y="3" width="6" height="1" fill="#21242c"/>
    <rect x="4" y="4" width="8" height="1" fill="#2a2f39"/>
    <rect x="3" y="5" width="10" height="5" fill="#0f1318"/>
    <rect x="4" y="10" width="8" height="2" fill="#1b2028"/>
    <rect x="5" y="12" width="6" height="2" fill="#262c36"/>
    <rect x="6" y="14" width="4" height="1" fill="#3a414c"/>
    <rect x="10" y="0" width="1" height="1" fill="#fff2d4"/>
    <rect x="11" y="1" width="1" height="1" fill="#fff2d4"/>
  `),
  diamond: icon16(`
    <rect x="5" y="2" width="6" height="2" fill="#7fd8ff"/>
    <rect x="4" y="4" width="8" height="2" fill="#56b8f5"/>
    <rect x="3" y="6" width="10" height="2" fill="#318bcc"/>
    <rect x="4" y="8" width="8" height="2" fill="#62d8ff"/>
    <rect x="5" y="10" width="6" height="2" fill="#a9f4ff"/>
    <rect x="6" y="12" width="4" height="2" fill="#4e93ff"/>
    <rect x="7" y="14" width="2" height="1" fill="#2f5bc8"/>
    <rect x="7" y="4" width="2" height="8" fill="#dffcff"/>
  `),
  poison_vial: icon16(`
    <rect x="6" y="1" width="4" height="2" fill="#c8a96e"/>
    <rect x="5" y="3" width="6" height="1" fill="#744c28"/>
    <rect x="4" y="4" width="8" height="2" fill="#d4e5d1"/>
    <rect x="4" y="6" width="8" height="5" fill="#7a46c8"/>
    <rect x="5" y="7" width="6" height="4" fill="#4caf6e"/>
    <rect x="5" y="11" width="6" height="2" fill="#286d39"/>
    <rect x="6" y="13" width="4" height="2" fill="#18341f"/>
    <rect x="7" y="8" width="2" height="2" fill="#a4f3b7"/>
  `),
  magic_scroll: icon16(`
    <rect x="4" y="2" width="8" height="2" fill="#f5e2b8"/>
    <rect x="3" y="4" width="10" height="7" fill="#e4c98f"/>
    <rect x="4" y="11" width="8" height="2" fill="#d8b574"/>
    <rect x="2" y="4" width="2" height="2" fill="#c8a96e"/>
    <rect x="12" y="4" width="2" height="2" fill="#c8a96e"/>
    <rect x="3" y="11" width="2" height="2" fill="#b0884f"/>
    <rect x="11" y="11" width="2" height="2" fill="#b0884f"/>
    <rect x="6" y="5" width="4" height="1" fill="#7f52cf"/>
    <rect x="5" y="7" width="6" height="1" fill="#9b72cf"/>
    <rect x="6" y="9" width="4" height="1" fill="#7f52cf"/>
  `),
  health_potion: icon16(`
    <rect x="6" y="1" width="4" height="2" fill="#c8a96e"/>
    <rect x="5" y="3" width="6" height="1" fill="#815225"/>
    <rect x="4" y="4" width="8" height="2" fill="#dae6e8"/>
    <rect x="4" y="6" width="8" height="4" fill="#f06b67"/>
    <rect x="5" y="10" width="6" height="3" fill="#d74545"/>
    <rect x="6" y="13" width="4" height="2" fill="#8e1f31"/>
    <rect x="6" y="6" width="2" height="2" fill="#ffd5d5"/>
    <rect x="8" y="8" width="2" height="2" fill="#ff9f9f"/>
  `),
} as const

export const enemyPortraitById = {
  bog_slime: icon32(`
    <rect x="7" y="18" width="18" height="8" fill="#27411f"/>
    <rect x="5" y="20" width="22" height="6" fill="#325829"/>
    <rect x="7" y="12" width="18" height="8" fill="#4caf6e"/>
    <rect x="9" y="10" width="14" height="4" fill="#62d47e"/>
    <rect x="11" y="9" width="10" height="2" fill="#8ef0a3"/>
    <rect x="12" y="14" width="3" height="3" fill="#0a0a0f"/>
    <rect x="17" y="14" width="3" height="3" fill="#0a0a0f"/>
    <rect x="13" y="15" width="1" height="1" fill="#f0d090"/>
    <rect x="18" y="15" width="1" height="1" fill="#f0d090"/>
    <rect x="10" y="22" width="2" height="2" fill="#89ff95"/>
    <rect x="20" y="22" width="3" height="2" fill="#89ff95"/>
    <rect x="8" y="25" width="3" height="2" fill="#1f3219"/>
    <rect x="21" y="25" width="4" height="2" fill="#1f3219"/>
  `),
  swamp_witch: icon32(`
    <rect x="9" y="6" width="14" height="4" fill="#35213b"/>
    <rect x="7" y="10" width="18" height="8" fill="#1c222f"/>
    <rect x="8" y="18" width="16" height="8" fill="#2e3c4c"/>
    <rect x="11" y="12" width="10" height="8" fill="#d8b89b"/>
    <rect x="12" y="13" width="2" height="2" fill="#0a0a0f"/>
    <rect x="18" y="13" width="2" height="2" fill="#0a0a0f"/>
    <rect x="14" y="17" width="4" height="1" fill="#9b4f4f"/>
    <rect x="5" y="10" width="3" height="14" fill="#5a3d28"/>
    <rect x="4" y="8" width="2" height="4" fill="#c8a96e"/>
    <rect x="6" y="6" width="2" height="2" fill="#8ef0a3"/>
    <rect x="10" y="7" width="12" height="2" fill="#7a46c8"/>
    <rect x="9" y="20" width="14" height="6" fill="#27411f"/>
  `),
  vine_horror: icon32(`
    <rect x="9" y="6" width="14" height="4" fill="#27411f"/>
    <rect x="6" y="10" width="20" height="10" fill="#325829"/>
    <rect x="8" y="20" width="16" height="6" fill="#1f3219"/>
    <rect x="10" y="12" width="12" height="4" fill="#7d1a1a"/>
    <rect x="12" y="13" width="2" height="2" fill="#f5e2b8"/>
    <rect x="18" y="13" width="2" height="2" fill="#f5e2b8"/>
    <rect x="4" y="8" width="4" height="4" fill="#3b6d2f"/>
    <rect x="24" y="8" width="4" height="4" fill="#3b6d2f"/>
    <rect x="3" y="15" width="5" height="3" fill="#4caf6e"/>
    <rect x="24" y="15" width="5" height="3" fill="#4caf6e"/>
    <rect x="7" y="5" width="3" height="4" fill="#62d47e"/>
    <rect x="22" y="5" width="3" height="4" fill="#62d47e"/>
  `),
  hammer_goblin: icon32(`
    <rect x="8" y="10" width="16" height="8" fill="#4caf6e"/>
    <rect x="10" y="18" width="12" height="8" fill="#325829"/>
    <rect x="9" y="9" width="4" height="3" fill="#7ad15d"/>
    <rect x="19" y="9" width="4" height="3" fill="#7ad15d"/>
    <rect x="12" y="14" width="2" height="2" fill="#0a0a0f"/>
    <rect x="18" y="14" width="2" height="2" fill="#0a0a0f"/>
    <rect x="14" y="18" width="4" height="2" fill="#f5e2b8"/>
    <rect x="23" y="8" width="3" height="10" fill="#5a3d28"/>
    <rect x="24" y="5" width="6" height="5" fill="#7a7d86"/>
    <rect x="10" y="24" width="12" height="3" fill="#8f562f"/>
  `),
  sewer_rat_king: icon32(`
    <rect x="8" y="12" width="16" height="8" fill="#6c7078"/>
    <rect x="10" y="10" width="5" height="4" fill="#7b7f88"/>
    <rect x="17" y="10" width="5" height="4" fill="#7b7f88"/>
    <rect x="11" y="15" width="2" height="2" fill="#0a0a0f"/>
    <rect x="19" y="15" width="2" height="2" fill="#0a0a0f"/>
    <rect x="14" y="18" width="4" height="2" fill="#c78f8f"/>
    <rect x="11" y="7" width="10" height="2" fill="#c8a96e"/>
    <rect x="12" y="5" width="2" height="2" fill="#f0d090"/>
    <rect x="15" y="4" width="2" height="3" fill="#f0d090"/>
    <rect x="18" y="5" width="2" height="2" fill="#f0d090"/>
    <rect x="5" y="18" width="4" height="2" fill="#5b5f66"/>
    <rect x="23" y="18" width="4" height="2" fill="#5b5f66"/>
  `),
  iron_golem: icon32(`
    <rect x="9" y="6" width="14" height="6" fill="#6d727c"/>
    <rect x="7" y="12" width="18" height="12" fill="#7f8792"/>
    <rect x="11" y="14" width="10" height="8" fill="#50565f"/>
    <rect x="14" y="15" width="4" height="4" fill="#60b8e8"/>
    <rect x="15" y="16" width="2" height="2" fill="#dff8ff"/>
    <rect x="11" y="8" width="2" height="2" fill="#0a0a0f"/>
    <rect x="19" y="8" width="2" height="2" fill="#0a0a0f"/>
    <rect x="4" y="13" width="3" height="10" fill="#5a606a"/>
    <rect x="25" y="13" width="3" height="10" fill="#5a606a"/>
    <rect x="11" y="24" width="4" height="4" fill="#6d727c"/>
    <rect x="17" y="24" width="4" height="4" fill="#6d727c"/>
  `),
  shadow_knight: icon32(`
    <rect x="10" y="5" width="12" height="4" fill="#1f2230"/>
    <rect x="8" y="9" width="16" height="8" fill="#2a2f39"/>
    <rect x="10" y="17" width="12" height="10" fill="#171a24"/>
    <rect x="12" y="12" width="2" height="2" fill="#e05252"/>
    <rect x="18" y="12" width="2" height="2" fill="#e05252"/>
    <rect x="14" y="16" width="4" height="1" fill="#bcc2cb"/>
    <rect x="23" y="9" width="2" height="14" fill="#d7dbe2"/>
    <rect x="24" y="7" width="2" height="2" fill="#fff2d4"/>
    <rect x="9" y="24" width="14" height="3" fill="#3d2b1f"/>
  `),
  lich: icon32(`
    <rect x="9" y="5" width="14" height="6" fill="#37233f"/>
    <rect x="7" y="11" width="18" height="14" fill="#1b2030"/>
    <rect x="11" y="11" width="10" height="10" fill="#dad7d1"/>
    <rect x="12" y="14" width="2" height="2" fill="#0a0a0f"/>
    <rect x="18" y="14" width="2" height="2" fill="#0a0a0f"/>
    <rect x="14" y="18" width="4" height="1" fill="#6d727c"/>
    <rect x="10" y="7" width="3" height="3" fill="#9b72cf"/>
    <rect x="19" y="7" width="3" height="3" fill="#9b72cf"/>
    <rect x="12" y="22" width="8" height="3" fill="#37233f"/>
  `),
  dark_overlord: icon32(`
    <rect x="10" y="3" width="12" height="3" fill="#c8a96e"/>
    <rect x="11" y="1" width="2" height="2" fill="#f0d090"/>
    <rect x="15" y="0" width="2" height="3" fill="#f0d090"/>
    <rect x="19" y="1" width="2" height="2" fill="#f0d090"/>
    <rect x="8" y="6" width="16" height="8" fill="#211522"/>
    <rect x="9" y="14" width="14" height="13" fill="#141018"/>
    <rect x="12" y="10" width="2" height="2" fill="#e05252"/>
    <rect x="18" y="10" width="2" height="2" fill="#e05252"/>
    <rect x="13" y="16" width="6" height="5" fill="#5a1222"/>
    <rect x="14" y="17" width="4" height="3" fill="#8e1f31"/>
    <rect x="6" y="18" width="3" height="8" fill="#1d1d29"/>
    <rect x="24" y="18" width="3" height="8" fill="#1d1d29"/>
    <rect x="11" y="27" width="10" height="2" fill="#3d2b1f"/>
  `),
} as const

export const zoneBackdropByZone: Record<ZoneType, string> = {
  swamp: backdrop(`
    <rect width="160" height="90" fill="#06080a"/>
    <rect y="0" width="160" height="24" fill="#0b1216"/>
    <rect y="24" width="160" height="16" fill="#0d1718"/>
    <rect y="40" width="160" height="18" fill="#101f1a"/>
    <rect y="58" width="160" height="32" fill="#08100d"/>
    <circle cx="120" cy="16" r="12" fill="#9fb29f"/>
    <circle cx="120" cy="16" r="7" fill="#d7e0cf"/>
    <ellipse cx="118" cy="17" rx="18" ry="10" fill="#b6c7b7" opacity="0.15"/>
    <path d="M0 50 L12 40 L24 50 L40 36 L56 48 L74 32 L92 46 L110 34 L128 48 L144 38 L160 48 V60 H0 Z" fill="#13211d"/>
    <path d="M0 58 L16 48 L32 60 L48 44 L66 58 L82 46 L100 60 L118 46 L136 58 L148 50 L160 58 V68 H0 Z" fill="#1b3128"/>
    <path d="M0 68 L18 66 L34 70 L56 67 L80 72 L106 68 L130 72 L160 69 V90 H0 Z" fill="#09100d"/>
    <rect x="14" y="24" width="4" height="38" fill="#1a110d"/>
    <polygon points="16,22 12,34 18,30 20,40 24,32 22,24" fill="#261711"/>
    <rect x="46" y="28" width="5" height="32" fill="#1b120d"/>
    <polygon points="48,24 42,36 50,32 54,42 58,34 54,26" fill="#291912"/>
    <rect x="104" y="26" width="4" height="34" fill="#1a110d"/>
    <polygon points="106,22 100,34 108,30 112,40 116,31 111,24" fill="#261711"/>
    <ellipse cx="52" cy="60" rx="28" ry="5" fill="#8da893" opacity="0.18"/>
    <ellipse cx="112" cy="62" rx="32" ry="6" fill="#a1b6a1" opacity="0.16"/>
    <rect x="0" y="67" width="160" height="2" fill="#305243"/>
    <path d="M0 70 L26 68 L46 72 L66 69 L90 73 L116 68 L142 72 L160 70 V78 H0 Z" fill="#153127"/>
    <path d="M0 78 L20 80 L42 76 L64 82 L92 77 L118 83 L146 78 L160 80 V90 H0 Z" fill="#0a110e"/>
    <rect x="18" y="72" width="5" height="10" fill="#3b6d2f"/>
    <rect x="26" y="74" width="3" height="8" fill="#4caf6e"/>
    <rect x="72" y="73" width="4" height="9" fill="#3b6d2f"/>
    <rect x="118" y="72" width="5" height="10" fill="#4caf6e"/>
    <rect x="132" y="75" width="3" height="7" fill="#325829"/>
  `),
  sewer: backdrop(`
    <rect width="160" height="90" fill="#07090c"/>
    <rect y="0" width="160" height="18" fill="#0e1318"/>
    <rect y="18" width="160" height="18" fill="#131920"/>
    <rect y="36" width="160" height="18" fill="#121821"/>
    <rect y="54" width="160" height="36" fill="#0a1016"/>
    <path d="M14 58 V34 Q80 -2 146 34 V58 Z" fill="#222b34"/>
    <path d="M26 58 V38 Q80 10 134 38 V58 Z" fill="#0a0d11"/>
    <path d="M18 58 V36 Q80 4 142 36" fill="none" stroke="#44515d" stroke-width="3"/>
    <path d="M22 58 V40 Q80 14 138 40" fill="none" stroke="#313b46" stroke-width="2"/>
    <rect x="20" y="18" width="6" height="40" fill="#29333e"/>
    <rect x="134" y="18" width="6" height="40" fill="#29333e"/>
    <rect x="52" y="14" width="6" height="44" fill="#202932"/>
    <rect x="102" y="14" width="6" height="44" fill="#202932"/>
    <circle cx="34" cy="38" r="5" fill="#d5c28c"/>
    <circle cx="34" cy="38" r="9" fill="#d5c28c" opacity="0.16"/>
    <circle cx="126" cy="38" r="5" fill="#d5c28c"/>
    <circle cx="126" cy="38" r="9" fill="#d5c28c" opacity="0.16"/>
    <rect x="30" y="24" width="8" height="14" fill="#4b575f"/>
    <rect x="122" y="24" width="8" height="14" fill="#4b575f"/>
    <rect x="66" y="24" width="28" height="10" fill="#1a2027"/>
    <rect x="72" y="18" width="16" height="6" fill="#2f3742"/>
    <rect x="0" y="60" width="160" height="8" fill="#192f34"/>
    <rect x="0" y="68" width="160" height="8" fill="#1e4650"/>
    <rect x="0" y="70" width="160" height="2" fill="#7ad8ff"/>
    <ellipse cx="80" cy="71" rx="42" ry="6" fill="#9cecff" opacity="0.12"/>
    <rect x="18" y="60" width="24" height="6" fill="#2d353c"/>
    <rect x="118" y="60" width="24" height="6" fill="#2d353c"/>
    <rect x="8" y="56" width="6" height="14" fill="#335c44"/>
    <rect x="146" y="56" width="6" height="14" fill="#335c44"/>
    <rect x="0" y="76" width="160" height="14" fill="#081015"/>
  `),
  citadel: backdrop(`
    <rect width="160" height="90" fill="#07060b"/>
    <rect y="0" width="160" height="20" fill="#120f1e"/>
    <rect y="20" width="160" height="18" fill="#100d18"/>
    <rect y="38" width="160" height="18" fill="#0d0b14"/>
    <rect y="56" width="160" height="34" fill="#07070c"/>
    <path d="M62 16 Q80 -4 98 16 V42 H62 Z" fill="#511326"/>
    <path d="M68 18 Q80 6 92 18 V38 H68 Z" fill="#92253b"/>
    <rect x="76" y="16" width="8" height="22" fill="#d36c5c"/>
    <rect x="68" y="24" width="24" height="8" fill="#7a1830"/>
    <rect x="18" y="18" width="12" height="44" fill="#171927"/>
    <rect x="30" y="18" width="6" height="44" fill="#222536"/>
    <rect x="124" y="18" width="12" height="44" fill="#171927"/>
    <rect x="118" y="18" width="6" height="44" fill="#222536"/>
    <rect x="42" y="24" width="10" height="38" fill="#141624"/>
    <rect x="108" y="24" width="10" height="38" fill="#141624"/>
    <rect x="46" y="18" width="4" height="6" fill="#25293a"/>
    <rect x="110" y="18" width="4" height="6" fill="#25293a"/>
    <rect x="72" y="42" width="16" height="6" fill="#1f1c24"/>
    <rect x="70" y="48" width="20" height="8" fill="#111117"/>
    <rect x="74" y="50" width="12" height="4" fill="#2b2730"/>
    <rect x="78" y="44" width="4" height="4" fill="#c8a96e"/>
    <rect x="0" y="62" width="160" height="2" fill="#3d2b1f"/>
    <rect x="0" y="64" width="160" height="26" fill="#07070b"/>
    <path d="M66 64 L94 64 L102 90 L58 90 Z" fill="#4e1224"/>
    <path d="M72 64 L88 64 L94 90 L66 90 Z" fill="#8e1f31"/>
    <rect x="24" y="30" width="6" height="18" fill="#5c1b2a"/>
    <rect x="130" y="30" width="6" height="18" fill="#5c1b2a"/>
    <circle cx="32" cy="54" r="3" fill="#f0d090"/>
    <circle cx="128" cy="54" r="3" fill="#f0d090"/>
    <circle cx="32" cy="54" r="7" fill="#f0d090" opacity="0.12"/>
    <circle cx="128" cy="54" r="7" fill="#f0d090" opacity="0.12"/>
  `),
  arena: backdrop(`
    <rect width="160" height="90" fill="#07060b"/>
    <rect y="0" width="160" height="20" fill="#2d0c0c"/>
    <rect y="20" width="160" height="18" fill="#1f0a0a"/>
    <rect y="38" width="160" height="18" fill="#140808"/>
    <rect y="56" width="160" height="34" fill="#0b0505"/>
    <path d="M62 16 Q80 -4 98 16 V42 H62 Z" fill="#8e1f31"/>
    <path d="M68 18 Q80 6 92 18 V38 H68 Z" fill="#c82626"/>
    <rect x="76" y="16" width="8" height="22" fill="#ff4444"/>
    <rect x="0" y="62" width="160" height="2" fill="#5c1b2a"/>
    <rect x="0" y="64" width="160" height="26" fill="#0a0a0f"/>
    <circle cx="32" cy="54" r="3" fill="#ff4444"/>
    <circle cx="128" cy="54" r="3" fill="#ff4444"/>
    <circle cx="32" cy="54" r="9" fill="#ff4444" opacity="0.3"/>
    <circle cx="128" cy="54" r="9" fill="#ff4444" opacity="0.3"/>
  `),
}

export const startScreenBackdrop = panorama(`
  <rect width="320" height="180" fill="#07060b"/>
  <rect y="0" width="320" height="50" fill="#110f1d"/>
  <rect y="50" width="320" height="40" fill="#0c1016"/>
  <rect y="90" width="320" height="90" fill="#08090d"/>
  <circle cx="244" cy="38" r="26" fill="#f0d090"/>
  <circle cx="244" cy="38" r="18" fill="#fff4c8"/>
  <ellipse cx="244" cy="42" rx="42" ry="20" fill="#f0d090" opacity="0.10"/>
  <path d="M0 88 L36 66 L62 80 L98 56 L126 76 L160 50 L192 74 L228 56 L262 80 L294 64 L320 76 V110 H0 Z" fill="#121620"/>
  <path d="M0 102 L28 88 L60 104 L94 80 L126 100 L164 76 L198 100 L236 84 L270 104 L300 90 L320 98 V124 H0 Z" fill="#1b1f2d"/>
  <rect x="126" y="44" width="68" height="62" fill="#141624"/>
  <path d="M118 52 L160 18 L202 52 V60 H118 Z" fill="#24273a"/>
  <rect x="144" y="56" width="32" height="38" fill="#0a0b12"/>
  <rect x="150" y="60" width="20" height="24" fill="#4e1224"/>
  <rect x="154" y="64" width="12" height="16" fill="#8e1f31"/>
  <rect x="158" y="68" width="4" height="8" fill="#f0d090"/>
  <rect x="92" y="72" width="22" height="34" fill="#181924"/>
  <rect x="206" y="72" width="22" height="34" fill="#181924"/>
  <rect x="98" y="78" width="10" height="18" fill="#2a2a3e"/>
  <rect x="212" y="78" width="10" height="18" fill="#2a2a3e"/>
  <rect x="40" y="92" width="54" height="44" fill="#151722"/>
  <rect x="46" y="98" width="42" height="30" fill="#0c0d14"/>
  <rect x="50" y="102" width="10" height="22" fill="#c8a96e"/>
  <rect x="64" y="102" width="10" height="22" fill="#9b72cf"/>
  <rect x="78" y="102" width="10" height="22" fill="#e05252"/>
  <rect x="42" y="136" width="50" height="6" fill="#3d2b1f"/>
  <rect x="228" y="100" width="18" height="42" fill="#1a1b26"/>
  <rect x="250" y="94" width="12" height="48" fill="#151722"/>
  <circle cx="236" cy="98" r="6" fill="#e87830"/>
  <circle cx="236" cy="98" r="12" fill="#e87830" opacity="0.12"/>
  <circle cx="256" cy="92" r="5" fill="#60b8e8"/>
  <circle cx="256" cy="92" r="10" fill="#60b8e8" opacity="0.12"/>
  <path d="M0 128 L28 122 L56 132 L90 124 L128 136 L164 126 L206 138 L250 126 L294 136 L320 132 V180 H0 Z" fill="#0b0b10"/>
  <path d="M0 142 L34 146 L70 136 L112 148 L160 138 L206 150 L258 140 L300 150 L320 148 V180 H0 Z" fill="#141117"/>
  <rect x="0" y="126" width="320" height="3" fill="#3d2b1f"/>
`)

export const shopBackdrop = panorama(`
  <rect width="320" height="180" fill="#09080d"/>
  <rect y="0" width="320" height="32" fill="#121018"/>
  <rect y="32" width="320" height="48" fill="#17131b"/>
  <rect y="80" width="320" height="40" fill="#120f15"/>
  <rect y="120" width="320" height="60" fill="#09080d"/>
  <rect x="24" y="26" width="272" height="100" fill="#16131a"/>
  <rect x="36" y="38" width="248" height="8" fill="#3d2b1f"/>
  <rect x="36" y="68" width="248" height="8" fill="#3d2b1f"/>
  <rect x="36" y="98" width="248" height="8" fill="#3d2b1f"/>
  <rect x="44" y="46" width="10" height="22" fill="#8e1f31"/>
  <rect x="58" y="50" width="8" height="18" fill="#4caf6e"/>
  <rect x="70" y="48" width="10" height="20" fill="#9b72cf"/>
  <rect x="88" y="44" width="12" height="24" fill="#c8a96e"/>
  <rect x="108" y="48" width="8" height="20" fill="#60b8e8"/>
  <rect x="222" y="46" width="10" height="22" fill="#e05252"/>
  <rect x="236" y="50" width="8" height="18" fill="#4caf6e"/>
  <rect x="248" y="48" width="10" height="20" fill="#9b72cf"/>
  <rect x="264" y="44" width="12" height="24" fill="#c8a96e"/>
  <rect x="78" y="76" width="18" height="22" fill="#5a3d28"/>
  <rect x="102" y="80" width="14" height="18" fill="#7a7d86"/>
  <rect x="122" y="76" width="18" height="22" fill="#c8a96e"/>
  <rect x="180" y="76" width="18" height="22" fill="#5a3d28"/>
  <rect x="204" y="80" width="14" height="18" fill="#7a7d86"/>
  <rect x="224" y="76" width="18" height="22" fill="#c8a96e"/>
  <circle cx="78" cy="36" r="8" fill="#f0d090"/>
  <circle cx="78" cy="36" r="18" fill="#f0d090" opacity="0.10"/>
  <circle cx="242" cy="36" r="8" fill="#f0d090"/>
  <circle cx="242" cy="36" r="18" fill="#f0d090" opacity="0.10"/>
  <rect x="132" y="86" width="56" height="52" fill="#12131b"/>
  <rect x="142" y="94" width="36" height="30" fill="#1c2030"/>
  <rect x="150" y="104" width="20" height="16" fill="#2e3c4c"/>
  <rect x="118" y="116" width="84" height="10" fill="#5a3d28"/>
  <rect x="120" y="126" width="80" height="8" fill="#3d2b1f"/>
  <rect x="148" y="72" width="24" height="20" fill="#35213b"/>
  <rect x="152" y="64" width="16" height="8" fill="#7a46c8"/>
  <rect x="154" y="92" width="10" height="6" fill="#d8b89b"/>
  <rect x="154" y="98" width="4" height="4" fill="#0a0a0f"/>
  <rect x="160" y="98" width="4" height="4" fill="#0a0a0f"/>
  <rect x="0" y="132" width="320" height="4" fill="#3d2b1f"/>
  <path d="M0 136 L30 132 L62 138 L94 132 L126 140 L164 134 L198 142 L232 134 L270 142 L320 136 V180 H0 Z" fill="#0a0a0f"/>
  <path d="M0 150 L28 154 L60 146 L96 156 L138 148 L184 160 L230 150 L278 160 L320 156 V180 H0 Z" fill="#161017"/>
`)

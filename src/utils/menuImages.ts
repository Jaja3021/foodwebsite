/**
 * Auto-suggests a photo from the existing /images/menu library by matching
 * keywords in a product's name — so Admin ▸ Menu picks a sensible photo the
 * moment you type a name, instead of defaulting every new item to the same
 * placeholder. Users can still upload their own or type a different URL.
 */
const KEYWORD_IMAGE: Array<{ keywords: string[]; file: string }> = [
  { keywords: ['tapsilog', 'tapa'], file: 'tapa.jpg' },
  { keywords: ['longsilog', 'longganisa', 'longanisa'], file: 'longanisa.jpg' },
  { keywords: ['hotsilog', 'hotdog', 'hot dog'], file: 'hotdog.jpg' },
  { keywords: ['tocilog', 'tocino'], file: 'tocino.jpg' },
  { keywords: ['spamsilog', 'spam'], file: 'spam.jpg' },
  { keywords: ['cornsilog', 'corned beef', 'cornbeef', 'corn beef'], file: 'cornbeef.jpg' },
  { keywords: ['bangsilog', 'bangus', 'daing'], file: 'bangus.jpg' },
  { keywords: ['tinapasilog', 'tinapa'], file: 'tinapa.jpg' },
  { keywords: ['dilis'], file: 'dilis.jpg' },
  { keywords: ['pusit', 'squid'], file: 'pusit.jpg' },
  { keywords: ['danggit'], file: 'danggit.jpg' },
  { keywords: ['tuyo'], file: 'tuyo.jpg' },
  { keywords: ['rice'], file: 'rice.jpg' },
  { keywords: ['egg'], file: 'egg.jpg' },
  { keywords: ['coffee', 'barako'], file: 'coffee.jpg' },
  { keywords: ['tea', 'soda', 'soft drink', 'water', 'juice', 'gulaman', 'shake', 'drink'], file: 'drink.jpg' },
  { keywords: ['flan', 'halo-halo', 'halo halo', 'turon', 'ube', 'leche', 'dessert', 'sweet'], file: 'dessert.jpg' },
  { keywords: ['bundle', 'combo', 'promo', 'barkada'], file: 'promo.jpg' },
]

const DEFAULT_IMAGE = 'side.jpg'

export function suggestMenuImage(name: string): string {
  const normalised = name.trim().toLowerCase()
  if (!normalised) return `/images/menu/${DEFAULT_IMAGE}`
  const match = KEYWORD_IMAGE.find(({ keywords }) => keywords.some((k) => normalised.includes(k)))
  return `/images/menu/${match?.file ?? DEFAULT_IMAGE}`
}

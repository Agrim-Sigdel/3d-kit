/**
 * Kiln & Clay — site copy and data for the demo site.
 *
 * A small wheel-thrown pottery studio. This is the demo that shows the kit
 * driving a completely different kind of site than the library's own home
 * page: warm, hand-made, editorial. Copy is written the way a real two-person
 * workshop would write it — plain, specific, a little dry. No buzzwords, no
 * "elevate your space," no exclamation marks doing the work of a sentence.
 *
 * Pure data module: no React, no three.js.
 */

/** A piece in the current collection. Each card shows live 3D key art. */
export interface Piece {
  id: string
  name: string
  /** One honest line about the piece. */
  note: string
  /** Longer description — how it's made, what it's for. */
  body: string
  clay: string
  glaze: string
  price: string
  /** 'available' | 'made to order' | 'sold out' */
  status: string
  /** Which live 3D art the card uses (resolved in the page). */
  art: 'cardflip' | 'morph' | 'popup' | 'portal' | 'explode' | 'spline'
}

export const PIECES: Piece[] = [
  {
    id: 'tide-bowl',
    name: 'Tide Bowl',
    note: 'The one we keep on the table at home.',
    body: "A deep serving bowl thrown on the wheel and trimmed when it's leather-hard. Wide enough for a salad for four, heavy enough that it doesn't slide. The glaze pools a little darker where the wall meets the foot.",
    clay: 'Stoneware',
    glaze: 'Oxblood over cream',
    price: '$68',
    status: 'available',
    art: 'morph',
  },
  {
    id: 'morning-mug',
    name: 'Morning Mug',
    note: 'Holds a proper amount of coffee. Finally.',
    body: 'A 14oz mug with a pulled handle that actually fits three fingers. We make these in small runs because pulling handles is the slow part and we refuse to cast them. No two handles are the same.',
    clay: 'Stoneware',
    glaze: 'Sand matte',
    price: '$34',
    status: 'made to order',
    art: 'cardflip',
  },
  {
    id: 'fold-vase',
    name: 'Fold Vase',
    note: 'Looks empty on purpose. Looks better with one stem.',
    body: 'A tall bottle vase with a folded, faceted shoulder cut while the clay is still soft. Narrow neck so a single branch stands up straight instead of flopping. Fires to a quiet, chalky finish.',
    clay: 'Porcelain blend',
    glaze: 'Bare clay, waxed foot',
    price: '$92',
    status: 'available',
    art: 'popup',
  },
  {
    id: 'ring-plate',
    name: 'Ring Plate',
    note: 'For keys, rings, the small things you lose.',
    body: 'A little catch-all dish, pressed rather than thrown, with a thumb-pushed rim. We started making these from the trimmings off bigger pots and they sold faster than anything else, so now they have their own slot in the kiln.',
    clay: 'Reclaimed stoneware',
    glaze: 'Wine speckle',
    price: '$22',
    status: 'available',
    art: 'portal',
  },
  {
    id: 'stack-set',
    name: 'Stacking Set',
    note: 'Four bowls that nest. Stops the cupboard war.',
    body: 'A graduated set of four bowls thrown to nest inside each other within a millimetre or two — which, on the wheel, is harder than it sounds and took us most of a winter to get right. Sold as a set only.',
    clay: 'Stoneware',
    glaze: 'Cream, tan rims',
    price: '$140',
    status: 'made to order',
    art: 'explode',
  },
  {
    id: 'long-pour',
    name: 'Long Pour Jug',
    note: 'Pours without dribbling down the side. We checked.',
    body: 'A water jug with a sharp, pulled spout and a high handle. We threw eleven of these before the spout stopped dripping, then kept the shape. Good for water, oil, or holding wooden spoons by the stove.',
    clay: 'Stoneware',
    glaze: 'Oxblood, wax-resist line',
    price: '$78',
    status: 'sold out',
    art: 'spline',
  },
]

/** The making process — a numbered timeline, not marketing pillars. */
export interface Step {
  no: string
  title: string
  body: string
}

export const PROCESS: Step[] = [
  {
    no: '01',
    title: 'We mix our own clay',
    body: 'Stoneware and a porcelain blend, wedged by hand in the morning before the studio warms up. Reclaim from the week goes back into the bucket — almost nothing gets thrown out.',
  },
  {
    no: '02',
    title: 'Thrown on two old wheels',
    body: 'One kick wheel, one electric from 1978 that we refuse to replace. Everything you see was centred, opened and pulled up by hand. Trimming happens the next day, when the pot is leather-hard.',
  },
  {
    no: '03',
    title: 'Glazed in small batches',
    body: 'We mix glaze in five-litre buckets and write the recipe on the lid in marker. Colours shift batch to batch, which is the point. If you want an exact match, order the set together.',
  },
  {
    no: '04',
    title: 'One firing a week',
    body: 'A gas kiln out back, fired to cone 10 on Fridays. Reduction firing is why the oxblood goes deep red and the cream breaks warm. We unload Sunday morning with coffee. Some pieces crack. Those go in the garden.',
  },
]

/** Studio facts — a plain stats strip, real numbers a small workshop would know. */
export interface Stat {
  value: string
  label: string
}

export const STATS: Stat[] = [
  { value: '2', label: 'people' },
  { value: '1', label: 'firing a week' },
  { value: '~40', label: 'pots a month' },
  { value: '9 yrs', label: 'at this bench' },
]

/** Customer notes — short, specific, the kind you'd actually pin to the wall. */
export interface Note {
  body: string
  who: string
  where: string
}

export const NOTES: Note[] = [
  {
    body: "The mug chipped after a year of daily use and they replaced it without me even asking for a discount. The handle is the only one my partner won't fight me for.",
    who: 'Dana R.',
    where: 'repeat buyer',
  },
  {
    body: 'Bought the stacking set as a wedding gift and ended up ordering a second one for myself. They take up no room and we use them every single day.',
    who: 'Marcus L.',
    where: 'kept one for himself',
  },
  {
    body: 'I asked a lot of annoying questions about whether the glaze was food-safe and they answered all of them properly instead of just saying yes. It is, for the record.',
    who: 'Priya N.',
    where: 'first order',
  },
  {
    body: "The jug arrived wrapped in newspaper from their town. I don't know why that mattered to me but it did.",
    who: 'Tom B.',
    where: 'three orders in',
  },
]

/** A small note for the visit / contact section. */
export const VISIT = {
  line1: 'The studio is in the back of an old dairy off Mill Lane.',
  line2: 'Open Saturdays, 10 to 4, or by appointment. Knock loudly — the wheel is noisy.',
  email: 'hello@kilnandclay.studio',
  phone: '01-555-0142',
}

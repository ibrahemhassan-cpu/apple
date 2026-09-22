/* سلّم المراحل — الخطة كاملة في LEVELS.md

   ده المكان الوحيد اللي بيعرف الترتيب. إضافة مرحلة = سطر جديد هنا وبس:
   الخريطة بتتبني منه، والفتح بالترتيب بيتحسب منه، واللعبة بتاخد منه اللي تعمله.

   kind     'grow'   = مرحلة زراعة (الشجرة/النبتة)
            'market' = عربية السوق: تملا السلة من الصناديق حسب الطلب
   fruit    (زراعة) id الفاكهة من fruits/registry.js
   care     (زراعة) اللي هيعمله بنفسه: dig = عدد الدوسات (مفيش = الأرض بتتفتح لوحدها)، water، sun،
            pests: 'ladybug' (دود على الشجرة والدعسوقة بتاكله) أو 'spray' (خنافس على البطاطس ورش مية بصابون)
   order    زراعة: السلة عايزة كام (لو أقل من اللي على الشجرة، الباقي نجمة زيادة)
            سوق:   { apple: 5, potato: 2 } — كام من كل نوع، والصناديق بتبقى بالأنواع دي بالظبط
   learn    مفتاح الجملة اللي بتقول الجديد في المرحلة دي */
export const LEVELS = [
  { id: 'apple-1', kind: 'grow', fruit: 'apple', care: {}, order: 5, learn: 'learnPick' },
  { id: 'apple-2', kind: 'grow', fruit: 'apple', care: { dig: 4 }, order: 8, learn: 'learnDig' },
  { id: 'market-1', kind: 'market', order: { apple: 4 }, learn: 'learnMarket' },
  { id: 'apple-3', kind: 'grow', fruit: 'apple', care: { dig: 4, water: true }, order: 10, learn: 'learnWater' },
  { id: 'mango-1', kind: 'grow', fruit: 'mango', care: { dig: 4, water: true }, order: 6, learn: 'learnPole' },
  { id: 'market-2', kind: 'market', order: { apple: 3, mango: 4 }, learn: 'learnMarket2' },
  { id: 'potato-1', kind: 'grow', fruit: 'potato', care: { dig: 4, water: true }, order: 6, learn: 'learnUnder' },
  { id: 'apple-4', kind: 'grow', fruit: 'apple', care: { dig: 4, water: true, pests: 'ladybug' }, order: 8, learn: 'learnBugs' },
  { id: 'mango-2', kind: 'grow', fruit: 'mango', care: { dig: 6, water: true, sun: true }, order: 10, learn: 'learnSun' },
  { id: 'potato-2', kind: 'grow', fruit: 'potato', care: { dig: 6, water: true, sun: true, pests: 'spray' }, order: 10, learn: 'learnSpray' },
  { id: 'market-3', kind: 'market', order: { apple: 5, potato: 2, mango: 3 }, learn: 'learnMarket3' },
];

/* the three stars of each kind of level, in order (pests are part of the play, not a star: the plant waits for help) */
export const STARS = {
  grow: ['order', 'careful', 'friend'],
  market: ['order', 'right', 'friend'],
};

export const levelAt = i => LEVELS[i];
export const levelIndex = id => LEVELS.findIndex(l => l.id === id);
/* the fruit a level shows on the map: its own, or the first one it asks the market for */
export const levelFruits = level => (level.kind === 'market' ? Object.keys(level.order) : [level.fruit]);

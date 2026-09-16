# البستان (The Orchard)

تجربة ويب تفاعلية بالعربي والإنجليزي: الفاكهة تتفتح، تاخد بذرتها وتزرعها، تكبر، تطلع السلم وتقطف.
كل فاكهة بتعلّم إزاي بتتزرع وشكل نباتها إيه. معمولة بـ **React** للشاشات و **GSAP + SVG + Canvas** للحركة.

## التشغيل

```bash
npm install
npm run dev      # http://localhost:5179
```

## البناء والنشر

```bash
npm run build    # الناتج في dist/
npm run preview  # تجربة نسخة البناء
```

**Vercel:** ارفع المشروع على GitHub وافتحه في [Vercel](https://vercel.com/new) — بيتعرف على Vite لوحده
(Build: `npm run build`، Output: `dist`).

## هيكل المشروع

```
src/
  main.jsx, App.jsx          الدخول والتنقل بين الشاشات
  app.css                    الألوان والخطوط وشكل شاشة البستان
  i18n/strings.js            كل الكلام بالعربي والإنجليزي
  settings/                  اللغة والمستوى والصوت (بتتحفظ)
  fruits/registry.js         سجل الفواكه
  fruits/art.jsx             رسومات الفواكه وبذورها
  screens/                   البستان + كارت البذرة
  games/apple/               لعبة التفاح: scene.html + scene.css + engine.js
vanilla/                     النسخة القديمة من غير React (بتشتغل بفتح index.html)
FRUITS.md                    الدليل الكامل وخطوات إضافة فاكهة
```

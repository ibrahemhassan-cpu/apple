# البستان (The Orchard)

تجربة ويب تفاعلية بالعربي والإنجليزي: الفاكهة تتفتح، تاخد بذرتها وتزرعها، تكبر، تطلع السلم وتقطف.
كل فاكهة بتعلّم إزاي بتتزرع وشكل نباتها إيه. معمولة بـ **React** للشاشات و **GSAP + SVG + Canvas** للحركة، والشجر والنبات نفسه **3D بـ three.js** على شكل النوع الحقيقي.

## التشغيل

```bash
npm install
npm run dev      # http://localhost:5179   (أو ‎/?play=mango تفتح اللعبة على طول)
```

## على الموبايل كأبلكيشن (من غير نت)

اللعبة **PWA**: أول ما تتفتح مرة من اللينك، كل ملفاتها بتتحفظ على الموبايل وبعد كده تشتغل من غير نت خالص.

- **أندرويد (Chrome):** افتح اللينك ← زرار **"نزّل اللعبة"** فوق في البستان (أو من قايمة Chrome ← *Install app*).
- **آيفون (Safari):** افتح اللينك ← زرار المشاركة ← **Add to Home Screen**.

لازم تكون مرفوعة على **https** (Vercel بيعمل كده لوحده). الأيقونات بتتعمل من `public/icon.svg` بالأمر `npx pwa-assets-generator`.
لو عايز ملف APK أو تنزلها على Google Play: ارفعها الأول، وبعدين حط اللينك في [PWABuilder](https://www.pwabuilder.com) وهو يطلّع الملف.

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
  games/plant/               المحرك المشترك: engine.js + scene.html + scene.css + flora3d.js (النبات 3D)
  games/<fruit>/spec.js      مواصفات كل فاكهة ونباتها الحقيقي
vanilla/                     النسخة القديمة من غير React (بتشتغل بفتح index.html)
FRUITS.md                    الدليل الكامل وخطوات إضافة فاكهة
```

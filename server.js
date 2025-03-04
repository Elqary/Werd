const express = require('express');
const app = express();
const port = 8000;

// استيراد الكود الخاص بك من index.js
const startBot = require('./index');

// تعريف مسار أساسي للتحقق من أن الخادم يعمل
app.get('/', (req, res) => {
  res.send('الخادم يعمل بنجاح!');
});

// بدء تشغيل الخادم
app.listen(port, () => {
  console.log(`الخادم يعمل على http://localhost:${port}`);
  
  // بدء تشغيل البوت الخاص بك
  startBot();
});

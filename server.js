const express = require('express');
const initializeBot = require('./index');

const app = express();
const port = 8000;

// تعريف مسار أساسي للتحقق من أن الخادم يعمل
app.get('/', (req, res) => {
  res.send('الخادم يعمل بنجاح!');
});

// بدء تشغيل الخادم
app.listen(port, () => {
  console.log(`الخادم يعمل على http://localhost:${port}`);
  
  // بدء تشغيل البوت الخاص بك
  initializeBot().catch(err => {
    console.error('حدث خطأ أثناء تشغيل البوت:', err);
  });
});

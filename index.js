const { makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const axios = require('axios');

// قائمة الأرقام التي سيتم إرسال الرسائل إليها
const recipients = [
  '120363292588388460@g.us', // استبدل بالأرقام المطلوبة
  '201015817243@s.whatsapp.net'
];

// رقم المستخدم الذي سيتم إرسال الاختبار له
const testRecipient = '201015817243@s.whatsapp.net'; // ضع رقم المستخدم أو القروب هنا

// أسماء الصلوات باللغة العربية
const salahNamesArabic = {
  Fajr: "الفجر",
  Dhuhr: "الظهر",
  Asr: "العصر",
  Maghrib: "المغرب",
  Isha: "العشاء"
};

// إعدادات القرآن
const totalPages = 604;
const delayBetweenRequests = 3000; // تأخير 3 ثوانٍ بين كل طلب لتجنب الخطأ 429

// إدارة حالة المصادقة
const { state, saveCreds } = await useMultiFileAuthState('./auth_info');

// إنشاء اتصال مع واتساب
const sock = makeWASocket({
  auth: state,
  printQRInTerminal: true,
  logger: pino({ level: 'silent' }),
});

// حفظ حالة المصادقة عند التحديث
sock.ev.on('creds.update', saveCreds);

// دالة لإرسال رسالة نصية إلى جميع المستلمين
const sendMessageToAll = async (message) => {
  for (const recipient of recipients) {
    try {
      await sock.sendMessage(recipient, { text: message });
      console.log(`تم إرسال الرسالة إلى ${recipient}: ${message.substring(0, 50)}...`);
    } catch (error) {
      console.error(`خطأ أثناء إرسال الرسالة إلى ${recipient}:`, error);
    }
  }
};

// دالة لإرسال رسالة نصية
const sendMessage = async (recipient, message) => {
  try {
    await sock.sendMessage(recipient, { text: message });
    console.log(`تم إرسال الرسالة إلى ${recipient}: ${message.substring(0, 50)}...`);
  } catch (error) {
    console.error(`خطأ أثناء إرسال الرسالة إلى ${recipient}:`, error);
  }
};

// جلب أوقات الصلاة من API
const getPrayerTimes = async (latitude, longitude) => {
  const url = `https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=2`;
  try {
    const response = await axios.get(url);
    return response.data.data.timings;
  } catch (error) {
    console.error("خطأ أثناء جلب أوقات الصلاة:", error.message);
    return null;
  }
};

// دالة لجلب صفحات القرآن مع تأخير بين الطلبات
async function getQuranPages(startPage, count = 18) {
  const pages = [];
  for (let i = 0; i < count; i++) {
    const page = (startPage + i) > totalPages ? 1 : startPage + i;
    const apiUrl = `https://api.alquran.cloud/v1/page/${page}/ar.alafasy`;
    
    try {
      const response = await axios.get(apiUrl);
      const ayahs = response.data.data.ayahs;
      const pageText = ayahs.map(ayah => ayah.text).join('\n');
      pages.push({ pageNumber: page, text: pageText });

      // تأخير لتجنب الخطأ 429
      await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
    } catch (error) {
      console.error(`خطأ أثناء جلب صفحة ${page}:`, error.message);
    }
  }
  return pages;
}

// دالة للحصول على رقم الصفحة الحالية
const getNextPageNumber = () => {
  try {
    return parseInt(fs.readFileSync('currentPage.txt', 'utf-8'), 10) || 1;
  } catch (err) {
    return 1; // إذا لم يكن الملف موجودًا
  }
};

// دالة لتحديث رقم الصفحة الحالية
const saveCurrentPage = (page) => {
  try {
    fs.writeFileSync('currentPage.txt', page.toString());
  } catch (err) {
    console.error('خطأ أثناء حفظ الصفحة الحالية:', err);
  }
};

// إرسال الورد القرآني عند كل صلاة
const sendPrayerQuranVerses = async (latitude, longitude) => {
  const timings = await getPrayerTimes(latitude, longitude);
  if (!timings) return;

  const currentHour = new Date().getHours();
  const currentMinutes = new Date().getMinutes();
  const currentTime = `${currentHour}:${currentMinutes.toString().padStart(2, '0')}`;

  for (const [salah, time] of Object.entries(timings)) {
    const salahNameArabic = salahNamesArabic[salah];
    if (salahNameArabic && time.startsWith(currentTime)) {
      const startPage = getNextPageNumber();
      const pages = await getQuranPages(startPage, 18); // جلب 18 صفحة
      
      if (pages.length > 0) {
        let message = `🌿 *\`ورد (${salahNameArabic})\`* 🌿\n\n`;
        pages.forEach(page => {
          message += `*صفحة ${page.pageNumber}:*\n${page.text}\n\n`;
        });

        await sendMessageToAll(message);
        
        // تحديث الصفحة الحالية
        const nextPage = pages[pages.length - 1].pageNumber + 1;
        saveCurrentPage(nextPage > totalPages ? 1 : nextPage);
      }
    }
  }
};

// إرسال ورد عشوائي عند بدء تشغيل البوت
const sendRandomTestQuranVerses = async () => {
  const randomStartPage = Math.floor(Math.random() * (totalPages - 10)) + 1;
  const pages = await getQuranPages(randomStartPage, 10); // جلب 10 صفحات

  if (pages.length > 0) {
    let message = `🌿 *\`ورد عشوائي للاختبار\`* 🌿\n\n`;
    pages.forEach(page => {
      message += `*صفحة ${page.pageNumber}:*\n${page.text}\n\n`;
    });

    await sendMessage(testRecipient, message);
  }
};

// جدولة إرسال ورد الصلاة
const schedulePrayerQuranVerses = () => {
  const latitude = 30.0444; // خط عرض القاهرة
  const longitude = 31.2357; // خط طول القاهرة

  setInterval(async () => {
    await sendPrayerQuranVerses(latitude, longitude);
  }, 60 * 1000); // التحقق كل دقيقة
};

// بدء الجدولة وإرسال الورد العشوائي عند التشغيل
const startBot = async () => {
  await sendRandomTestQuranVerses();
  schedulePrayerQuranVerses();
};

// تصدير الدالة لاستخدامها في server.js
module.exports = startBot;

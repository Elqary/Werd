# استخدام صورة Node.js كأساس
FROM node:18-alpine

# تعيين مجلد العمل داخل الحاوية
WORKDIR /app

# نسخ ملفات المشروع إلى الحاوية
COPY package.json yarn.lock* ./
COPY . .

# تثبيت التبعيات
#RUN npm install

# تعيين الأمر الافتراضي لتشغيل البوت
CMD ["node", "index.js"]

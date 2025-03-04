# استخدام صورة Node.js كأساس
FROM node:16

# إنشاء مجلد التطبيق
WORKDIR /app

# نسخ ملف package.json و package-lock.json
COPY package*.json ./

# تثبيت التبعيات
RUN npm install

# نسخ بقية ملفات التطبيق
COPY . .

# تثبيت PM2 بشكل عام
RUN npm install -g pm2

# تعيين الأمر الافتراضي لتشغيل التطبيق باستخدام PM2
CMD ["pm2-runtime", "start", "index.js"]

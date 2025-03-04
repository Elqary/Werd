# استخدام صورة Node.js كأساس
FROM node:18

# تعيين مجلد العمل داخل الحاوية
WORKDIR /app

# نسخ ملف package.json و package-lock.json
COPY package*.json ./

# تثبيت الاعتماديات
RUN npm install

# نسخ بقية الملفات
COPY . .

# تعيين المنفذ الذي سيعمل عليه التطبيق
EXPOSE 8000

# تشغيل التطبيق
CMD ["node", "server.js"]

FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY bot/package*.json ./
COPY bot/prisma ./prisma/

RUN npm install
RUN npx prisma generate

COPY bot/ ./

RUN npm run build

CMD ["node", "dist/index.js"]

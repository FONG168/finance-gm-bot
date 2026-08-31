FROM node:20-alpine

WORKDIR /app

# Install openssl for prisma
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies and generate prisma client
RUN npm install
RUN npx prisma generate

# Copy source files
COPY . .

# Build typescript
RUN npm run build

# Start bot
CMD ["node", "dist/index.js"]

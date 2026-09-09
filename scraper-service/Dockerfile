FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y \
    chromium libnss3 libatk1.0-0 libatk-bridge2.0-0 libx11-xcb1 \
    libxcomposite1 libxrandr2 libgbm1 libasound2 libpangocairo-1.0-0 \
    fonts-liberation --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src

EXPOSE 4000
CMD ["node", "src/index.js"]

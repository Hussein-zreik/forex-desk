# Forex Desk frontend — Vite dev server (so client-side routing + HMR just work)
FROM node:20-slim

WORKDIR /app

# Install deps first for better layer caching.
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

# Bind to 0.0.0.0 so the dev server is reachable from the host browser.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

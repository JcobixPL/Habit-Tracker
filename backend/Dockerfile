FROM node:20-bookworm-slim

WORKDIR /app

# Prisma potrzebuje libssl -> instalujemy openssl + certy
RUN apt-get update -y \
  && apt-get install -y openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 4000
CMD ["npm", "run", "dev"]

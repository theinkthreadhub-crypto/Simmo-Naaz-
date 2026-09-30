FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 10000

ENV PORT=10000
ENV NODE_ENV=production

CMD ["npm", "start"]

FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 5001

ENV PORT=5001
ENV NODE_ENV=production

CMD ["npm", "start"]

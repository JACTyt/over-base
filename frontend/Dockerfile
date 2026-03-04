FROM node:20-alpine

WORKDIR /app

COPY . .

EXPOSE 4200

RUN npm install

CMD ["npm", "start", "--", "--host", "0.0.0.0", "--allowed-hosts=all"]
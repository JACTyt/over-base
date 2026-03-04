FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./

RUN npm install -g @angular/cli
RUN npm install
RUN npm ci

COPY . .

EXPOSE 4200
CMD ["npm", "start", "--", "--host", "0.0.0.0", "--allowed-hosts=all"]
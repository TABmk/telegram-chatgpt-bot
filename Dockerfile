FROM node:18-alpine

RUN mkdir -p /app
WORKDIR /app

COPY package.json /app

RUN yarn -D

COPY . /app

RUN yarn build

CMD [ "yarn", "start" ]
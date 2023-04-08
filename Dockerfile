FROM node:18.15.0-slim

ARG BUILD

ENV BUILD=${BUILD}

COPY . /HuePlex

WORKDIR /HuePlex/frontend

RUN apt update && \
    npm install && \
    npm run build

WORKDIR /HuePlex

RUN npm install

ENTRYPOINT ["npm", "start"]

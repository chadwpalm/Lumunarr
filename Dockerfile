FROM node:18.15.0-slim

ARG BUILD

ENV BUILD=${BUILD}

COPY . /HuePlex

WORKDIR /HuePlex/frontend

RUN npm ci && npm run build

WORKDIR /HuePlex

RUN npm ci

ENTRYPOINT ["npm", "start"]

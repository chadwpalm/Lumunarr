FROM node:18.15.0-slim

ARG BUILD

ENV BUILD=${BUILD}

COPY . /Lumunarr

WORKDIR /Lumunarr/frontend

RUN npm ci && npm run build

WORKDIR /Lumunarr

RUN npm ci

ENTRYPOINT ["npm", "start"]

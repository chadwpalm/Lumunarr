FROM node:18.2.0-alpine

ARG VERSION

ENV VERSION=${VERSION}

COPY . /HuePlex

WORKDIR /HuePlex/frontend

RUN npm install && \
    npm run build

WORKDIR /HuePlex

RUN npm install

ENTRYPOINT ["npm", "start"]

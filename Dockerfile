FROM node:18.15.0-slim

ARG VERSION

ENV VERSION=${VERSION}

COPY . /HuePlex

WORKDIR /HuePlex/frontend

RUN apt update && \
    apt install python3 make gcc g++ -y && \
    npm install && \
    npm run build

WORKDIR /HuePlex

RUN npm install

ENTRYPOINT ["npm", "start"]

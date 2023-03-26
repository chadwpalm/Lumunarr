from node:18.15.0

ENV VERSION=0.1.0

COPY . /HuePlex

WORKDIR /HuePlex/frontend

RUN npm install && \
    npm run build

WORKDIR /HuePlex

RUN npm install

ENTRYPOINT ["npm", "start"]

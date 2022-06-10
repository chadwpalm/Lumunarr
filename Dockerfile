from node:14.18.1

COPY . /HuePlex

WORKDIR /HuePlex

ENTRYPOINT ["npm", "start"]

FROM node:12.15.0

RUN mkdir -p /app
WORKDIR /app

COPY ./bin ./bin
COPY ./public ./public
COPY ./views ./views
COPY ./routes ./routes
COPY ./app.js ./app.js
COPY ./package.json ./package.json

RUN npm install

CMD ["node", "./bin/www"]

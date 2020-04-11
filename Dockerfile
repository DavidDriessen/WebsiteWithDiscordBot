FROM node:12.14 AS web-interface
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

FROM node:12.14 AS server
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY src ./src
COPY tsconfig.json ./
COPY tslint.json ./
RUN mv ./config/database.json.example ./config/database.json
RUN mv ./config/discord.json.example ./config/discord.json
RUN npm run build-server
RUN rm ./config/*

FROM node:12.14
RUN mkdir -p /app
WORKDIR /app
COPY --from=server /app/package*.json ./

#RUN npm install
# If you are building your code for production
RUN npm ci --only=production

COPY util/migrate.js ./util/migrate.js
COPY util/migrations ./util/migrations

COPY --from=server /app/build ./

RUN mkdir ./public
COPY --from=web-interface /app/client/dist ./public

EXPOSE 3000
ENV NODE_ENV production

ENTRYPOINT ["node"]
CMD ["./start.js"]

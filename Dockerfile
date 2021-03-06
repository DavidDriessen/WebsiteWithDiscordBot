FROM node:14.15 AS web-interface
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
RUN npx browserslist@latest --update-db
COPY client/ ./
RUN npm run build

FROM node:14.15 AS server
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY src ./src
COPY tsconfig.json ./
COPY tslint.json ./
RUN mv ./src/config/database.json.example ./src/config/database.json
RUN mv ./src/config/discord.json.example ./src/config/discord.json
RUN npm run build-server
COPY src/database/migrate.js ./build/database/migrate.js
COPY src/database/migrations ./build/database/migrations
RUN rm ./build/config/*

FROM node:14.15
RUN mkdir -p /app
WORKDIR /app
COPY --from=server /app/package*.json ./

#RUN npm install
# If you are building your code for production
RUN npm ci --only=production

COPY --from=server /app/build ./

RUN mkdir ./public
COPY --from=web-interface /app/client/dist ./public
RUN mkdir ./public/images

EXPOSE 3000
ENV NODE_ENV production

CMD ["npm run start"]

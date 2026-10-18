# Single-stage: deps completas (rss-parser/cheerio usados em runtime pelas functions)
# + server Express que serve o dist e as functions.
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build \
 && npm install --no-audit --no-fund express@^4.19.2 pg@^8.11.3 \
 && mkdir -p node_modules/@neondatabase/serverless \
 && cp server/shim-neon-pg.mjs node_modules/@neondatabase/serverless/index.mjs \
 && echo '{"name":"@neondatabase/serverless","version":"0.9.0-shim","type":"module","main":"index.mjs","exports":{"import":"./index.mjs","require":"./index.mjs"}}' > node_modules/@neondatabase/serverless/package.json
ENV PORT=8300
EXPOSE 8300
CMD ["node", "server/index.js"]

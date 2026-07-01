FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN apk add --no-cache python3 make g++ && npm install --omit=dev
COPY . .
EXPOSE 4000
CMD ["npm","start"]

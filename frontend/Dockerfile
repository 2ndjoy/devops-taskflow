FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

ARG VITE_API_URL
ARG VITE_AUTH_URL

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_AUTH_URL=$VITE_AUTH_URL

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
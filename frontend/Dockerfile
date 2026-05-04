FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY public ./public
COPY src ./src
# Cadena vacía: el bundle usa rutas relativas /api/… y nginx (nginx.docker.conf) proxea al backend.
ENV REACT_APP_API_URL=
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.docker.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

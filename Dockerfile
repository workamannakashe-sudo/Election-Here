# Build stage
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN echo "VITE_GEMINI_API_KEY=AIzaSyDk3-Ds2L1jFySzoadlI06393nir-B6pNc" > .env
RUN npm run build


# Run stage
FROM node:20-slim
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
# Cloud Run sets the PORT environment variable
ENV PORT 8080
EXPOSE 8080
CMD serve -s dist -l $PORT

# Build stage
FROM node:18-alpine as build-stage

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:stable-alpine

# Copy built assets from build-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

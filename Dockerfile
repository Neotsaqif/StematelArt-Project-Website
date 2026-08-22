# Multi-stage build for Laravel + Vite frontend

# Stage 1: Build frontend assets
FROM node:20-alpine AS frontend-builder

WORKDIR /build

COPY Backend/package*.json ./

RUN npm install

COPY Backend ./

RUN npm run build

# Stage 2: Build PHP backend
FROM php:8.2-fpm-alpine AS backend-builder

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    git \
    curl \
    bash \
    zip \
    unzip

# Install PHP extensions
RUN apk add --no-cache \
    $PHPIZE_DEPS \
    sqlite-dev \
    && docker-php-ext-install pdo pdo_sqlite \
    && apk del $PHPIZE_DEPS

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copy composer files
COPY Backend/composer.json ./

RUN composer install --no-dev --no-interaction --prefer-dist --no-scripts

# Stage 3: Final runtime image
FROM php:8.2-fpm-alpine

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    sqlite-libs \
    bash

# Install PHP extensions
RUN apk add --no-cache \
    $PHPIZE_DEPS \
    sqlite-dev \
    && docker-php-ext-install pdo pdo_sqlite \
    && apk del $PHPIZE_DEPS

# PHP config
RUN echo "memory_limit = 256M" > /usr/local/etc/php/conf.d/docker-php-memlimit.ini

# Copy composer dependencies first
COPY --from=backend-builder /app/vendor ./vendor

# Copy application code
COPY Backend .

# Copy built frontend assets
COPY --from=frontend-builder /build/public ./public

# Create necessary directories
RUN mkdir -p storage/logs database && \
    chmod -R 755 storage bootstrap/cache

# Generate APP_KEY and run migrations
RUN if [ ! -f .env ]; then cp .env.example .env && \
    php artisan key:generate --no-interaction; fi && \
    php artisan migrate --force || true

EXPOSE 9000

CMD ["php-fpm"]

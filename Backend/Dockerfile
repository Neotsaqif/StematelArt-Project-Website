# Stage 1: Build dependencies
FROM php:8.2-fpm-alpine AS builder

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
COPY composer.json ./
COPY composer.lock* ./

# Install PHP dependencies
RUN composer install --no-dev --no-interaction --prefer-dist

# Stage 2: Runtime
FROM php:8.2-fpm-alpine

WORKDIR /app

# Install system dependencies for runtime
RUN apk add --no-cache \
    sqlite-libs \
    bash

# Install PHP extensions
RUN apk add --no-cache \
    $PHPIZE_DEPS \
    sqlite-dev \
    && docker-php-ext-install pdo pdo_sqlite \
    && apk del $PHPIZE_DEPS

# Copy PHP configuration
RUN echo "memory_limit = 256M" > /usr/local/etc/php/conf.d/docker-php-memlimit.ini

# Copy application code
COPY . .

# Copy composer dependencies from builder
COPY --from=builder /app/vendor ./vendor

# Create necessary directories
RUN mkdir -p storage/logs database && \
    chmod -R 755 storage bootstrap/cache

# Generate APP_KEY if .env doesn't exist
RUN if [ ! -f .env ]; then cp .env.example .env && \
    php artisan key:generate --no-interaction; fi

# Run migrations
RUN php artisan migrate --force

# Expose port (Laravel Octane would use 8000, but standard FPM uses this for nginx)
EXPOSE 9000

CMD ["php-fpm"]

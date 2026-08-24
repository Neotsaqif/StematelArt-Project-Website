FROM php:8.3-fpm-alpine

RUN apk add --no-cache \
        postgresql-dev \
        oniguruma-dev \
        libxml2-dev \
        libzip-dev \
        icu-dev \
        unzip \
    && docker-php-ext-install -j"$(nproc)" pdo_pgsql mbstring xml bcmath intl zip

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY composer.json composer.lock ./
RUN composer install --no-dev --prefer-dist --no-interaction --no-progress --optimize-autoloader

COPY . .
RUN mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

USER www-data
EXPOSE 9000
CMD ["php-fpm"]

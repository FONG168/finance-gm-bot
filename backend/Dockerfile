FROM php:8.2-cli

# Install dependencies and extensions for MySQL and PostgreSQL
RUN apt-get update && apt-get install -y \
    libpq-dev \
    libzip-dev \
    unzip \
    git \
    && docker-php-ext-install pdo pdo_mysql pdo_pgsql zip

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copy application files
COPY . /app

# Install composer packages
RUN composer install --no-dev --optimize-autoloader

# Expose port
EXPOSE 8080

# Start Laravel server after running migrations and seeding categories
CMD php artisan migrate --force && php artisan db:seed --class=CategorySeeder --force && php artisan serve --host=0.0.0.0 --port=${PORT:-8080}




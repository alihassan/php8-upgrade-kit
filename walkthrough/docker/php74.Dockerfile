FROM php:7.4-fpm-alpine
RUN docker-php-ext-install pdo_mysql
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
# Production-style error settings, like a typical host in 2017.
RUN { \
      echo 'error_reporting = E_ALL & ~E_DEPRECATED & ~E_STRICT'; \
      echo 'display_errors = On'; \
      echo 'log_errors = On'; \
    } >/usr/local/etc/php/conf.d/app.ini \
 && echo 'clear_env = no' >> /usr/local/etc/php-fpm.d/www.conf
WORKDIR /var/www/app

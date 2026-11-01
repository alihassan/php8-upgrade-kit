FROM php:8.3-fpm-alpine
RUN docker-php-ext-install pdo_mysql opcache
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
# Production settings: report everything, show nothing, log to the container output.
RUN { \
      echo 'error_reporting = E_ALL'; \
      echo 'display_errors = Off'; \
      echo 'log_errors = On'; \
      echo 'error_log = /proc/self/fd/2'; \
      echo 'opcache.enable = 1'; \
    } > /usr/local/etc/php/conf.d/app.ini \
 && echo 'clear_env = no' >> /usr/local/etc/php-fpm.d/www.conf
WORKDIR /var/www/app

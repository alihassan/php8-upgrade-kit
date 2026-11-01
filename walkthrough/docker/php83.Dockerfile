FROM php:8.3-fpm-alpine
RUN docker-php-ext-install pdo_mysql
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
RUN { \
      echo 'error_reporting = E_ALL & ~E_DEPRECATED'; \
      echo 'display_errors = On'; \
      echo 'log_errors = On'; \
      echo 'opcache.enable = 1'; \
    } > /usr/local/etc/php/conf.d/app.ini \
 && echo 'clear_env = no' >> /usr/local/etc/php-fpm.d/www.conf
WORKDIR /var/www/app

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY Backend/public /var/www/html/public

EXPOSE 80

#!/usr/bin/env bash

# Source: https://gist.github.com/asmerkin/df919a6a79b081512366

# ---------------------------------------
#          Virtual Machine Setup
# ---------------------------------------

# Updating packages
apt-get update

# ---------------------------------------
#          Apache Setup
# ---------------------------------------

# Installing Packages
apt-get install -y apache2

# linking Vagrant directory to Apache 2.4 public directory
rm -rf /var/www
ln -fs /vagrant /var/www

# Add ServerName to httpd.conf
echo "ServerName localhost" > /etc/apache2/httpd.conf
# Setup hosts file
VHOST=$(cat <<EOF
<VirtualHost *:80>
  DocumentRoot "/var/www/public"
  ServerName localhost
  <Directory "/var/www/public">
    AllowOverride All
  </Directory>
</VirtualHost>
EOF
)
echo "${VHOST}" > /etc/apache2/sites-enabled/000-default.conf

# Loading needed modules to make apache work
a2enmod actions rewrite

# change apache user to vagrant
sed -i 's/www-data/vagrant/g' /etc/apache2/envvars
chown -R vagrant:vagrant /var/lock/apache2/
service apache2 reload

# ---------------------------------------
#          PHP Setup
# ---------------------------------------

# Installing packages
apt-get install -y php5 php5-cli curl php5-curl php5-mcrypt

# Enabling php modules
php5enmod mcrypt

# ---------------------------------------
#          MySQL Setup
# ---------------------------------------

# Setting MySQL root user password root/root
debconf-set-selections <<< 'mysql-server mysql-server/root_password password root'
debconf-set-selections <<< 'mysql-server mysql-server/root_password_again password root'

# Installing packages
apt-get install -y mysql-server mysql-client php5-mysql




# ---------------------------------------
#       Tools Setup
# ---------------------------------------

# Customize bash
echo "
# Color me!
export PS1='\e[1;32m\n\u@\h: \e[0;33m\w\n\e[m→ '" >> /home/vagrant/.profile

# Install git, nodejs, npm
apt-get install -y git


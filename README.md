# UI-prototyping
ISB-CGC UI prototyping

This project uses Google App Engine, Python 2.7, Django 1.7.1, and MySQL 5.6

This app is set up to run and deploy on various Google Cloud Projects.

# Installation Instructions For Local Development

The system uses [Vagrant](https://www.vagrantup.com/) to setup a consistent, platform independent development environment. To setup your development environment to run locally, you will need to install the following:

 * [Vagrant](https://www.vagrantup.com/downloads.html)
 * [Oracle VirtualBox](https://www.virtualbox.org/wiki/Downloads)<br>*If you are on Windows 8 or above, you will need to make sure you have version 5.0.9 or above to support the network interface. This may involve downloading a [test build](https://www.virtualbox.org/wiki/Testbuilds)*
 * [PyCharm Pro](https://www.jetbrains.com/pycharm/) (Recommended)

From there simply perform these steps.

 1. Copy the `sample.env` file to a file named `.env` in the root directory
 2. Fill out the `.env` file with the proper values
   * For most development environments, `MYSQL_ROOT_PASSWORD` and `DATABASE_PASSWORD` can be the same, and `DATABASE_USER` can be `root`
   * `GCLOUD_PROJECT_ID` is available after creating a project in the [Google Cloud Dashboard](https://console.developers.google.com/)
   * `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` can also be obtained in the Google Cloud Dashboard by going to API & Auth > Credentials > Add New > OAuth 2.0 Client > Web Application
   * Be sure when developing locally that you have 127.0.0.1 in the list of allowed domains for the OAuth 2.0 key

## Configuring PyCharm

PyCharm Pro can be used to run your server through Vagrant and the Google App Engine.

### Setup

 1. Go to your PyCharm Settings (On Mac, Go to Preferences; `CMD+,`)
 2. Select **Project: ISB-CGC-Webapp > Project Interpreter**
 3. Click the icon next to the Project Interpreter drop down at the top of the main area
 4. Click Add Remote
 5. Select Vagrant (if it asks to start the machine, say yes)
 6. Set the Python interpreter path to `/home/vagrant/www/shell/python-su.sh` and click Ok
 7. Select **Languages & Frameworks > Google App Engine**
 8. Change the SDK directory to `/home/vagrant/google_appengine/`
 9. Click Ok to save
 10. Go to **Run > Edit Configurations**
 11. If there is not an App Engine server Configuration, add one
 12. Set the host to `0.0.0.0`
 13. Set Additional Options to `--skip_sdk_update_check --use_mtime_file_watcher=True --admin_host 0.0.0.0 /home/vagrant/www`
   * Optionally set PyCharm to run a browser at url `http://127.0.0.1:8080/`
 14. Set the Python Interpreter to the Vagrant Machine (if it is not set to that already)
 15. Set the working directory to `\home\vagrant\www`
 16. Click ok to save
 17. Update app.yaml at root from "runtime:custom" to 'runtime: python27' this is due to a google bug identified by CGC

You will also need to set the *shell/python-su.sh* file to be executable. You can do this in the vagrant machines command line with the command `chmod +x /home/vagrant/www/shell/python-su.sh`

### Running

To run your server in PyCharm:

 1. Make sure your Vagrant machine is running by going to **Tools > Vagrant > Up**
 2. Click on the Run or Debug icons in the toolbar
 3. Click Run or Debug button on the configuration dialog
 4. Click Continue Anyway to run the machine

Your server will start and the PyCharm console should show all the logs and output from the system. If you are running in debug, you can also use breakpoints to stop the execution and examine variables and code as it runs.

## Adding Python Dependencies

To add Python Libraries or Dependencies, you should add them to the requirements.txt file and they will automatically be pulled down when a new developer starts the system.

To update your existing python dependencies because of a change or to pull down additional libraries you need, SSH into the virtual machine and run `pip install`. Through PyCharm, you can take the following steps.

 1. Click **Tools > Start SSH session...**
 2. Select the Vagrant VM Connection you set up
 3. Type `cd www; pip install -r requirements.txt --upgrade -t lib/`

Or from the command line, you can do this by doing the following

 1. Open a terminal in the project directory
 2. Type `vagrant ssh` to login to the virtual machine
 3. Change directory to the `www` directory (`/home/vagrant/www/` is the full path)
 4. Run `pip install -r requirements.txt --upgrade -t lib/`


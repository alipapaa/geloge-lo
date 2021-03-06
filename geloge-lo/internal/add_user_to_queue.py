import os
import sys
sys.path.append(os.path.dirname( os.path.realpath( __file__ )) + '/../lib')

from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.api.labs.taskqueue import Task
import cgi
import pprint
from google.appengine.ext import db
from gelodata.user import User
import sys

def application ( environ, start_response ):
    start_response('200 OK', [('Content-Type', 'text/plain')])
    form = cgi.FieldStorage(fp=environ['wsgi.input'], 
                            environ=environ)

    users = db.GqlQuery('SELECT * FROM User')
    for user in users:
        task = Task(payload=None, countdown =60, method = 'GET', url = '/get_timeline?account=' + user.screen_name)
        task.add()
        print user.screen_name
    return "OK"


def main ():
  run_wsgi_app(application)

if __name__ == '__main__':
  main()

import os
import sys
sys.path.append(os.path.dirname( os.path.realpath( __file__ )) + '/lib')
from google.appengine.ext.webapp.util import run_wsgi_app

import Cookie
from cgi import parse_qs
from gelosession import getGeloSession
import gelotter.oauth

def application ( environ, start_response ):
    session = None
    return_to = None
    cookie = Cookie.SimpleCookie()
    
    if environ.has_key('HTTP_COOKIE'):
        cookie.load(environ["HTTP_COOKIE"])

    if cookie.has_key('sid'):
        session = getGeloSession(cookie['sid'].value)

    param = parse_qs(environ['QUERY_STRING'])

    if not param.has_key('oauth_token'):
        start_response('400 Bad Request', [('Content-Type',  'text/plain')])
        return 'oauth_token not found'

    acc_token = gelotter.oauth.authorize(param['oauth_token'][0])
    if(acc_token):
        token_key = acc_token.put()
        session.token_key.delete()
        session.token_key = token_key
        return_to = session.return_to
        session.return_to = ''
        session.put()

    if return_to:
        start_response('302 Found', [('Content-Type',  'text/plain'), 
                                     ('Location', return_to)])
        return "OK"
    else:
        start_response('200 OK', [('Content-Type',  'text/plain')])
        return "OK"

def main ():
  run_wsgi_app(application)


if __name__ == '__main__':
  main()


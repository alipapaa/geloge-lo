from google.appengine.ext.webapp.util import run_wsgi_app
from gelotter.statuses import user_timeline
from google.appengine.ext import db
from gelodata.user import User
from gelodata.tweet import Tweet

import cgi
import pprint

def get_highest_tid(account):
    ret = None
    last_tweet = None

    user = User.get_user(account)
    tweets = db.GqlQuery('SELECT * FROM Tweet WHERE uid = ' + str(user.uid) + ' ORDER BY tid DESC')
    if tweets.count() >  0:
        last_tweet = tweets[0]

    if last_tweet:
        ret = str(last_tweet.tid)
    return ret
    
def get_tweets(account):
    since_id = get_highest_tid(account)
    return user_timeline(account, since_id)

def update_user(user, user_info):
    user.uid = user_info['id']
    user.name = user_info['name']
    user.screen_name = user_info['screen_name']
    user.put()

def add_tweet(tweet_info):
    lat = 0.0
    lng = 0.0
    if tweet_info['coordinates']:
        lat = float(tweet_info['coordinates']['coordinates'][0])
        lng = float(tweet_info['coordinates']['coordinates'][1])
        
    new_tweet = Tweet()
    new_tweet.uid = tweet_info['user']['id']
    new_tweet.tid = tweet_info['id']
    new_tweet.text = tweet_info['text']
    new_tweet.lat = lat
    new_tweet.lng = lng
    new_tweet.put()
    
    
def application ( environ, start_response ):
    start_response('200 OK', [('Content-Type', 'text/plain')])
    form = cgi.FieldStorage(fp=environ['wsgi.input'], 
                            environ=environ)

    if not form.has_key('account'):
        return "please input account"
    account = form['account'].value

    tweets = get_tweets(account)
    
    if not tweets:
        return "tweet not found"

    # debug
    pprint.pprint(tweets)

    # get user object
    user = User.get_user(account)
    if not user:
        user = User()

    update_user(user, tweets[0]['user'])

    for tweet in tweets:
        add_tweet(tweet)

    return "success"


def main ():
  run_wsgi_app(application)

if __name__ == '__main__':
  main()
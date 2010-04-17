import gelotter.common
from django.utils import simplejson as json

def user_timeline(uid, since_id = None):
    # TODO json to constant
    param = {'id' : uid}
    if since_id:
        param['since_id'] = since_id

    body = gelotter.common.apicall('/statuses/user_timeline', 'json' , param)
    data = None
    if body:
        data = json.loads(body)
    return data

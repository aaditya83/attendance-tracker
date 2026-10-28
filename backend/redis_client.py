import redis 
import json

rc=redis.Redis(host='localhost', port=6379, decode_responses=True)

def get_data(key):
    v=rc.get(key)
    if v:
        return json.loads(v)
    else:
        return None

def set_data(key, value):
    rc.set(key, json.dumps(value),ex=60)

def invalidate_cache(user_id: str,subjec_id: str):
    rc.delete(f"analytics:{user_id}:{subjec_id}")
    rc.delete(f"analytics:{user_id}:all")
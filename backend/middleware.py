from functools import wraps
from flask import session, jsonify, request

def role_required(roles):
    if isinstance(roles, str):
        roles = [roles]
        
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not session.get('user_id'):
                return jsonify({"error": "Authentication required."}), 401
                
            user_role = session.get('role', '').lower()
            lower_roles = [r.lower() for r in roles]
            if user_role not in lower_roles and user_role != 'admin':
                return jsonify({"error": "Access denied. Insufficient permissions."}), 403
                
            return f(*args, **kwargs)
        return decorated_function
    return decorator

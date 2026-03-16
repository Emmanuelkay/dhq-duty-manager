from flask import Blueprint, request, jsonify, session
from models import User

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    service_number = data.get('service_number')
    password = data.get('password')
    
    if not service_number or not password:
        return jsonify({"error": "Service Number and Password are required."}), 400
        
    user = User.query.filter_by(service_number=service_number).first()
    if user and user.check_password(password):
        requires_password_change = False
        if user.service_number != 'admin' and password == 'Changeme!':
            requires_password_change = True
            
        session['user_id'] = user.id
        session['role'] = user.role
        session['requires_password_change'] = requires_password_change
        
        user_data = user.to_dict()
        user_data['requires_password_change'] = requires_password_change
        
        return jsonify({"message": "Login successful", "user": user_data}), 200
        
    return jsonify({"error": "Invalid service number or password."}), 401

@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    session.pop('role', None)
    return jsonify({"message": "Logged out successfully"}), 200

@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Not authenticated."}), 401
        
    user = User.query.get(user_id)
    if user:
        user_data = user.to_dict()
        user_data['requires_password_change'] = session.get('requires_password_change', False)
        return jsonify({"user": user_data}), 200
        
    return jsonify({"error": "User not found."}), 404

@auth_bp.route('/change-password', methods=['POST'])
def change_password():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Not authenticated."}), 401
        
    data = request.get_json()
    new_password = data.get('new_password')
    
    if not new_password:
        return jsonify({"error": "New password is required."}), 400
        
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found."}), 404
        
    user.set_password(new_password)
    from models import db
    db.session.commit()
    
    session['requires_password_change'] = False
    
    return jsonify({"message": "Password changed successfully"}), 200

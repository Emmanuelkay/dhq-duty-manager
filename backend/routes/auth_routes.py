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
        session['user_id'] = user.id
        session['role'] = user.role
        return jsonify({"message": "Login successful", "user": user.to_dict()}), 200
        
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
        return jsonify({"user": user.to_dict()}), 200
        
    return jsonify({"error": "User not found."}), 404

from flask import Blueprint, request, jsonify, session
from models import db, User

personnel_bp = Blueprint('personnel_bp', __name__)

def is_admin():
    return session.get('role') == 'Admin'

@personnel_bp.route('/', methods=['GET'])
def get_all_personnel():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users]), 200

@personnel_bp.route('/', methods=['POST'])
def add_personnel():
    if not is_admin():
        return jsonify({"error": "Unauthorized"}), 403
        
    data = request.get_json()
    service_number = data.get('service_number')
    password = data.get('password')
    rank = data.get('rank')
    name = data.get('name')
    role = data.get('role', 'User')
    
    if not all([service_number, password, rank, name]):
        return jsonify({"error": "Missing required fields"}), 400
        
    if User.query.filter_by(service_number=service_number).first():
        return jsonify({"error": "Service Number already exists"}), 400
        
    new_user = User(service_number=service_number, rank=rank, name=name, role=role)
    new_user.set_password(password)
    
    db.session.add(new_user)
    db.session.commit()
    return jsonify(new_user.to_dict()), 201

@personnel_bp.route('/<int:user_id>', methods=['PUT'])
def edit_personnel(user_id):
    if not is_admin():
        return jsonify({"error": "Unauthorized"}), 403
        
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    data = request.get_json()
    if 'service_number' in data:
        user.service_number = data['service_number']
    if 'rank' in data:
        user.rank = data['rank']
    if 'name' in data:
        user.name = data['name']
    if 'role' in data:
        user.role = data['role']
    if 'password' in data and data['password']:
        user.set_password(data['password'])
        
    db.session.commit()
    return jsonify(user.to_dict()), 200

@personnel_bp.route('/<int:user_id>', methods=['DELETE'])
def delete_personnel(user_id):
    if not is_admin():
        return jsonify({"error": "Unauthorized"}), 403
        
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    # Prevent self-deletion if needed, but not strictly required
    if user.id == session.get('user_id'):
        return jsonify({"error": "Cannot delete your own account"}), 400
        
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted successfully"}), 200
